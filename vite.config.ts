import { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { ChatServiceError, generateChatReply } from "./lib/chat-service.js";
import { loadCatalogProductsWithPricing } from "./lib/catalog.js";
import { getPublicStoreRates } from "./lib/store-rates.js";
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from "./lib/order-pricing.js";
import {
  getActiveFlashSale,
  upsertFlashSale,
  deactivateFlashSale,
  getDbProducts,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
  getOrderStats,
  getMetalRates,
  upsertMetalRate,
  getInventory,
  updateProductStock,
  getAbandonedCarts,
  markCartRecovered,
  saveAbandonedCart,
  getOrderById,
  updateOrderStatus,
} from "./lib/db-store.js";
import { query, queryMany } from "./lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new ChatServiceError(400, "Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function localApiPlugin(apiKey?: string, model?: string): Plugin {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

        if (pathname === "/api/products") {
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }

          try {
            sendJson(res, 200, await loadCatalogProductsWithPricing());
          } catch (error) {
            console.error("Local products API error:", error);
            sendJson(res, 500, { error: "Failed to load products" });
          }

          return;
        }

        if (pathname === "/api/rates") {
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }

          try {
            sendJson(res, 200, await getPublicStoreRates());
          } catch (error) {
            console.error("Local rates API error:", error);
            sendJson(res, 500, { error: "Failed to load current store rates." });
          }

          return;
        }

        if (pathname === "/api/orders/create") {
          if (req.method !== "POST") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }

          try {
            const body = await readJsonBody(req);
            const pricing = await normalizeAndPriceOrderItems(body?.items);
            assertSubmittedTotal(body?.total, pricing.total);

            sendJson(res, 200, {
              success: true,
              orderId: `LOCAL-${Date.now()}`,
              total: pricing.total,
              message: "Local development order created successfully.",
            });
          } catch (error) {
            if (error instanceof OrderValidationError) {
              sendJson(res, 400, {
                error: error.message,
                ...(error.details ? { details: error.details } : {}),
              });
              return;
            }

            console.error("Local order API error:", error);
            sendJson(res, 500, { error: "Internal server error" });
          }

          return;
        }

        // ── Admin: Orders stats (used for login validation) ──────────────────
        if (pathname === "/api/orders/stats" && req.method === "GET") {
          try {
            const stats = await getOrderStats();
            sendJson(res, 200, { stats });
          } catch {
            sendJson(res, 200, { stats: {} });
          }
          return;
        }

        // ── Admin: Order lookup ───────────────────────────────────────────────
        if (pathname === "/api/orders/lookup" && req.method === "GET") {
          const id = new URL(req.url ?? "/", "http://localhost").searchParams.get("id");
          if (!id) { sendJson(res, 400, { error: "id required" }); return; }
          try {
            const order = await getOrderById(id);
            if (!order) { sendJson(res, 404, { error: "Order not found" }); return; }
            sendJson(res, 200, { order: { id: order.id, status: order.status, total: order.total, payment_method: order.payment_method, items: order.items, created_at: order.created_at } });
          } catch { sendJson(res, 500, { error: "Failed to load order" }); }
          return;
        }

        // ── Admin: Order status update ────────────────────────────────────────
        if (pathname === "/api/orders/update-status" && req.method === "POST") {
          try {
            const body = await readJsonBody(req);
            const order = await updateOrderStatus(body.orderId, body.status);
            sendJson(res, 200, { success: true, order, whatsappSent: false });
          } catch { sendJson(res, 500, { error: "Failed to update status" }); }
          return;
        }

        // ── Admin: Order list ─────────────────────────────────────────────────
        if (pathname === "/api/orders/list" && req.method === "GET") {
          try {
            const limitParam = new URL(req.url ?? "/", "http://localhost").searchParams.get("limit");
            const limit = Math.min(parseInt(limitParam ?? "200", 10), 500);
            const orders = await queryMany(
              `SELECT id, items, customer, total, payment_method, status, notes, created_at FROM orders ORDER BY created_at DESC LIMIT $1`,
              [limit]
            );
            sendJson(res, 200, { orders: orders ?? [] });
          } catch { sendJson(res, 200, { orders: [] }); }
          return;
        }

        // ── Admin: Daily revenue chart ────────────────────────────────────────
        if (pathname === "/api/orders/daily-revenue" && req.method === "GET") {
          try {
            const days = await queryMany(`
              SELECT DATE(created_at)::text AS day, COUNT(*)::int AS orders, COALESCE(SUM(total),0)::numeric AS revenue
              FROM orders
              WHERE created_at >= NOW() - INTERVAL '30 days' AND status NOT IN ('cancelled','refunded','failed')
              GROUP BY day ORDER BY day
            `);
            sendJson(res, 200, { days: days ?? [] });
          } catch { sendJson(res, 200, { days: [] }); }
          return;
        }

        // ── Admin: Top products ───────────────────────────────────────────────
        if (pathname === "/api/orders/top-products" && req.method === "GET") {
          try {
            const products = await queryMany(`
              SELECT item->>'id' AS product_id, item->>'name' AS name,
                SUM((item->>'price')::numeric*(item->>'quantity')::int) AS revenue,
                SUM((item->>'quantity')::int) AS units
              FROM orders, jsonb_array_elements(items) AS item
              WHERE status NOT IN ('cancelled','refunded','failed')
              GROUP BY product_id, name ORDER BY revenue DESC LIMIT 5
            `);
            sendJson(res, 200, { products: products ?? [] });
          } catch { sendJson(res, 200, { products: [] }); }
          return;
        }

        // ── Admin: Order add-note ─────────────────────────────────────────────
        if (pathname === "/api/orders/add-note" && req.method === "POST") {
          try {
            const body = await readJsonBody(req);
            if (!body.orderId) { sendJson(res, 400, { error: "orderId required" }); return; }
            await query("UPDATE orders SET notes = $1 WHERE id = $2", [body.note || null, body.orderId]);
            sendJson(res, 200, { success: true });
          } catch { sendJson(res, 500, { error: "Failed to save note" }); }
          return;
        }

        // ── Admin: Order history ──────────────────────────────────────────────
        if (pathname === "/api/orders/history" && req.method === "GET") {
          const phone = new URL(req.url ?? "/", "http://localhost").searchParams.get("phone");
          if (!phone) { sendJson(res, 400, { error: "phone required" }); return; }
          try {
            const orders = await queryMany(
              `SELECT id, total, status, payment_method, items, created_at FROM orders WHERE customer->>'phone' = $1 ORDER BY created_at DESC LIMIT 20`,
              [phone.trim()]
            );
            sendJson(res, 200, { orders });
          } catch { sendJson(res, 200, { orders: [] }); }
          return;
        }

        // ── Admin: Metal rates ────────────────────────────────────────────────
        if (pathname === "/api/metal-rates") {
          if (req.method === "GET") {
            try {
              const rates = await getMetalRates();
              sendJson(res, 200, { rates });
            } catch { sendJson(res, 200, { rates: [] }); }
            return;
          }
          if (req.method === "POST") {
            try {
              const body = await readJsonBody(req);
              const rate = await upsertMetalRate(body);
              sendJson(res, 200, { success: true, rate });
            } catch { sendJson(res, 500, { error: "Failed to update rate" }); }
            return;
          }
        }

        // ── Admin: Inventory ──────────────────────────────────────────────────
        if (pathname === "/api/inventory") {
          if (req.method === "GET") {
            try {
              const inventory = await getInventory();
              sendJson(res, 200, { inventory });
            } catch { sendJson(res, 200, { inventory: [] }); }
            return;
          }
          if (req.method === "POST") {
            try {
              const body = await readJsonBody(req);
              await updateProductStock(body.productId, body.quantity);
              sendJson(res, 200, { success: true });
            } catch { sendJson(res, 500, { error: "Failed to update stock" }); }
            return;
          }
        }

        // ── Admin: Promos ─────────────────────────────────────────────────────
        if (pathname === "/api/promos/list" && req.method === "GET") {
          try {
            const promos = await queryMany("SELECT * FROM promos ORDER BY created_at DESC");
            sendJson(res, 200, { promos });
          } catch { sendJson(res, 200, { promos: [] }); }
          return;
        }
        if (pathname === "/api/promos/create" && req.method === "POST") {
          try {
            const b = await readJsonBody(req);
            const promo = await queryMany(
              `INSERT INTO promos (code,description,discount_type,discount_value,min_order_amount,max_uses,expires_at,active)
               VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
              [b.code, b.description||null, b.discountType, b.discountValue, b.minOrderAmount||0, b.maxUses||null, b.expiresAt||null, b.active!==false]
            );
            sendJson(res, 200, { success: true, promo });
          } catch (e: any) { sendJson(res, 500, { error: e.message }); }
          return;
        }
        if (pathname === "/api/promos/delete" && req.method === "DELETE") {
          try {
            const b = await readJsonBody(req);
            if (!b.id) { sendJson(res, 400, { error: "id required" }); return; }
            await query("DELETE FROM promos WHERE id = $1", [b.id]);
            sendJson(res, 200, { success: true });
          } catch (e: any) { sendJson(res, 500, { error: e.message }); }
          return;
        }
        if (pathname === "/api/promos/toggle" && req.method === "POST") {
          try {
            const b = await readJsonBody(req);
            if (b.id == null) { sendJson(res, 400, { error: "id required" }); return; }
            const promo = await query("UPDATE promos SET active = $1 WHERE id = $2 RETURNING *", [!!b.active, b.id]);
            sendJson(res, 200, { success: true, promo });
          } catch (e: any) { sendJson(res, 500, { error: e.message }); }
          return;
        }
        if (pathname === "/api/promos/validate" && req.method === "POST") {
          try {
            const { code, orderTotal } = await readJsonBody(req);
            const { getPromo } = await import("./lib/db-store.js");
            const promo = await getPromo(code);
            if (!promo || !promo.active) { sendJson(res, 200, { valid: false, error: "Invalid promo code" }); return; }
            if (promo.expires_at && new Date(promo.expires_at) < new Date()) { sendJson(res, 200, { valid: false, error: "Promo code expired" }); return; }
            if (promo.max_uses && promo.used_count >= promo.max_uses) { sendJson(res, 200, { valid: false, error: "Promo code fully used" }); return; }
            if (promo.min_order_amount && orderTotal < promo.min_order_amount) { sendJson(res, 200, { valid: false, error: `Minimum order NPR ${promo.min_order_amount}` }); return; }
            let discount = 0;
            if (promo.discount_type === "percent") discount = Math.round(orderTotal * promo.discount_value / 100);
            else discount = promo.discount_value;
            sendJson(res, 200, { valid: true, discount, discountType: promo.discount_type, discountValue: promo.discount_value, code: promo.code });
          } catch { sendJson(res, 500, { error: "Failed to validate promo" }); }
          return;
        }

        // ── Admin: Abandoned carts ────────────────────────────────────────────
        if (pathname === "/api/carts/list" && req.method === "GET") {
          try {
            const carts = await getAbandonedCarts();
            sendJson(res, 200, { carts });
          } catch { sendJson(res, 200, { carts: [] }); }
          return;
        }
        if (pathname === "/api/carts/save" && req.method === "POST") {
          try {
            const body = await readJsonBody(req);
            await saveAbandonedCart(body);
            sendJson(res, 200, { success: true });
          } catch { sendJson(res, 200, { success: false }); }
          return;
        }
        if (pathname === "/api/carts/mark-recovered" && req.method === "POST") {
          try {
            const { id } = await readJsonBody(req);
            await markCartRecovered(id);
            sendJson(res, 200, { success: true });
          } catch { sendJson(res, 500, { error: "Failed" }); }
          return;
        }

        // ── Admin: Products CMS ───────────────────────────────────────────────
        if (pathname === "/api/products/admin-list" && req.method === "GET") {
          try {
            const products = await getDbProducts();
            sendJson(res, 200, { products });
          } catch { sendJson(res, 200, { products: [] }); }
          return;
        }
        if (pathname === "/api/products/create" && req.method === "POST") {
          try {
            const body = await readJsonBody(req);
            if (!body.id || !body.name || !body.category || !body.material || !body.price) {
              sendJson(res, 400, { error: "id, name, category, material, price are required" });
              return;
            }
            const product = await createDbProduct(body);
            sendJson(res, 200, { success: true, product });
          } catch (e: any) {
            console.error("Local products/create error:", e.message);
            sendJson(res, 500, { error: e.message });
          }
          return;
        }
        if (pathname === "/api/products/update" && req.method === "PUT") {
          try {
            const body = await readJsonBody(req);
            const { id, ...fields } = body;
            if (!id) { sendJson(res, 400, { error: "id required" }); return; }
            const product = await updateDbProduct(id, fields);
            sendJson(res, 200, { success: true, product });
          } catch (e: any) { sendJson(res, 500, { error: e.message }); }
          return;
        }
        if (pathname === "/api/products/delete" && req.method === "DELETE") {
          try {
            const body = await readJsonBody(req);
            await deleteDbProduct(body.id);
            sendJson(res, 200, { success: true });
          } catch (e: any) { sendJson(res, 500, { error: e.message }); }
          return;
        }

        if (pathname === "/api/flash-sale") {
          if (req.method === "GET") {
            try {
              const sale = await getActiveFlashSale();
              sendJson(res, 200, { sale: sale || null });
            } catch {
              sendJson(res, 200, { sale: null });
            }
            return;
          }

          if (req.method === "POST") {
            try {
              const body = await readJsonBody(req);
              const pct = parseFloat(body?.discount_percent);
              if (!body?.title?.trim()) {
                sendJson(res, 400, { error: "title is required" });
                return;
              }
              if (isNaN(pct) || pct <= 0 || pct >= 100) {
                sendJson(res, 400, { error: "discount_percent must be between 1 and 99" });
                return;
              }
              if (!body?.ends_at || isNaN(Date.parse(body.ends_at))) {
                sendJson(res, 400, { error: "ends_at must be a valid date/time" });
                return;
              }
              if (new Date(body.ends_at) <= new Date()) {
                sendJson(res, 400, { error: "ends_at must be in the future" });
                return;
              }
              const sale = await upsertFlashSale({
                title: body.title.trim(),
                subtitle: body.subtitle?.trim() || null,
                discount_percent: pct,
                ends_at: body.ends_at,
              });
              sendJson(res, 200, { success: true, sale });
            } catch (error) {
              console.error("Local flash-sale POST error:", error);
              sendJson(res, 500, { error: "Failed to launch flash sale" });
            }
            return;
          }

          if (req.method === "DELETE") {
            try {
              await deactivateFlashSale();
              sendJson(res, 200, { success: true });
            } catch (error) {
              console.error("Local flash-sale DELETE error:", error);
              sendJson(res, 500, { error: "Failed to end flash sale" });
            }
            return;
          }

          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        if (pathname !== "/api/chat") {
          next();
          return;
        }

        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const reply = await generateChatReply(body?.messages, {
            apiKey,
            model,
          });
          sendJson(res, 200, { reply });
        } catch (error) {
          const status = error instanceof ChatServiceError ? error.status : 500;
          const message =
            error instanceof ChatServiceError
              ? error.message
              : "Something went wrong. Please try again or contact us on WhatsApp.";

          if (!(error instanceof ChatServiceError)) {
            console.error("Local chat API error:", error);
          }

          sendJson(res, status, { error: message });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), localApiPlugin(env.GEMINI_API_KEY, env.GEMINI_MODEL)],
    root: "client",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
      },
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['wouter'],
            'vendor-icons': ['lucide-react', 'react-icons'],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 3000,
    },
  };
});
