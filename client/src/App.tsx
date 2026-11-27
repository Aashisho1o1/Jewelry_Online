import { lazy, Suspense, useState, type ComponentType } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import { CartProvider } from "@/contexts/CartContext";
import { EngagementProvider } from "@/contexts/EngagementContext";
import { FlashSaleProvider } from "@/contexts/FlashSaleContext";
import { CartSheet } from "@/components/cart/CartSheet";
import { Toaster } from "@/components/ui/toaster";
import StoreRateStrip from "@/components/StoreRateStrip";
import MobileTabBar from "@/components/MobileTabBar";
import CategorySheet from "@/components/CategorySheet";
import WhatsAppFab from "@/components/WhatsAppFab";
import CheckoutHeader from "@/components/CheckoutHeader";
import { cn } from "@/lib/utils";

// Pages load when opened, so customers don't download the admin dashboard or checkout up front.
// After a new deploy the old page files are gone, so a failed load reloads the site once.
function page(load: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() => load().then(
    module => { sessionStorage.removeItem("page-reload"); return module; },
    error => {
      if (sessionStorage.getItem("page-reload")) throw error;
      sessionStorage.setItem("page-reload", "1");
      window.location.reload();
      return new Promise<never>(() => {});
    },
  ));
}

const About = page(() => import("@/pages/about"));
const RatesPage = page(() => import("@/pages/rates"));
const ShopByPage = page(() => import("@/pages/shop-by"));
const CollectionPage = page(() => import("@/pages/collection"));
const ProductDetails = page(() => import("@/pages/product-details"));
const WishlistPage = page(() => import("@/pages/wishlist"));
const CareGuidePage = page(() => import("@/pages/care-guide"));
const SizeGuidePage = page(() => import("@/pages/size-guide"));
const Checkout = page(() => import("@/pages/checkout"));
const OrderSuccess = page(() => import("@/pages/order-success"));
const OrderTrack = page(() => import("@/pages/order-track"));
const AdminDashboard = page(() => import("@/pages/admin-dashboard"));
const MyOrders = page(() => import("@/pages/my-orders"));
const PrivacyPolicy = page(() => import("@/pages/privacy-policy"));
const ReturnsPage = page(() => import("@/pages/returns"));
const TermsPage = page(() => import("@/pages/terms"));
const NotFound = page(() => import("@/pages/not-found"));

function App() {
  const [location] = useLocation();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const isCheckout = location.startsWith("/checkout");
  const isProduct = location.startsWith("/products/");
  // Product pages and checkout get their own sticky action bars on phones.
  const showTabBar = !isProduct && !isCheckout && !location.startsWith("/admin-dashboard");

  return (
    <FlashSaleProvider>
      <CartProvider>
        <EngagementProvider>
            <div className={cn("min-h-screen flex flex-col", showTabBar && "pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0")}>
              {!isCheckout && <StoreRateStrip variant="topbar" />}
              {isCheckout ? <CheckoutHeader /> : <Nav onOpenCategories={() => setCategoriesOpen(true)} />}
              <main className="flex-1">
                <Suspense fallback={<div className="min-h-[60vh]" />}>
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/about" component={About} />
                  <Route path="/rates" component={RatesPage} />
                  <Route path="/collections" component={CollectionPage} />
                  <Route path="/collections/:category" component={CollectionPage} />
                  {/* Category pages moved to /collections; keep old links working. */}
                  <Route path="/shop-by/category/:id">
                    {(params: { id: string }) => <Redirect replace to={params.id === "all" ? "/collections" : `/collections/${params.id}`} />}
                  </Route>
                  <Route path="/shop-by" component={ShopByPage} />
                  <Route path="/shop-by/:facet/:value" component={ShopByPage} />
                  <Route path="/products/:productId" component={ProductDetails} />
                  <Route path="/wishlist" component={WishlistPage} />
                  <Route path="/care-guide" component={CareGuidePage} />
                  <Route path="/size-guide" component={SizeGuidePage} />
                  <Route path="/checkout" component={Checkout} />
                  <Route path="/order-success" component={OrderSuccess} />
                  <Route path="/orders/:id" component={OrderTrack} />
                  <Route path="/my-orders" component={MyOrders} />
                  <Route path="/privacy-policy" component={PrivacyPolicy} />
                  <Route path="/returns" component={ReturnsPage} />
                  <Route path="/terms" component={TermsPage} />
                  <Route path="/admin-dashboard" component={AdminDashboard} />
                  <Route component={NotFound} />
                </Switch>
                </Suspense>
              </main>
              {!isCheckout && <Footer />}
              <CartSheet />
              {/* Customer help button; hidden where it would cover checkout or admin controls. */}
              {!isCheckout && !location.startsWith("/admin") && <WhatsAppFab compact={isProduct} />}
              {showTabBar && <MobileTabBar categoriesOpen={categoriesOpen} onOpenCategories={() => setCategoriesOpen(true)} />}
              <CategorySheet open={categoriesOpen} onOpenChange={setCategoriesOpen} />
              <Toaster />
            </div>
        </EngagementProvider>
      </CartProvider>
    </FlashSaleProvider>
  );
}

export default App;
