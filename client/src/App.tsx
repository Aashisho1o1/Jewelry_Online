import { useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import RatesPage from "@/pages/rates";
import ShopByPage from "@/pages/shop-by";
import CollectionPage from "@/pages/collection";
import ProductDetails from "@/pages/product-details";
import WishlistPage from "@/pages/wishlist";
import CareGuidePage from "@/pages/care-guide";
import SizeGuidePage from "@/pages/size-guide";
import Checkout from "@/pages/checkout";
import OrderSuccess from "@/pages/order-success";
import OrderTrack from "@/pages/order-track";
import AdminDashboard from "@/pages/admin-dashboard";
import MyOrders from "@/pages/my-orders";
import PrivacyPolicy from "@/pages/privacy-policy";
import ReturnsPage from "@/pages/returns";
import TermsPage from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/contexts/CartContext";
import { ChatProvider } from "@/contexts/ChatContext";
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
          <ChatProvider>
            <div className={cn("min-h-screen flex flex-col", showTabBar && "pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0")}>
              {!isCheckout && <StoreRateStrip variant="topbar" />}
              {isCheckout ? <CheckoutHeader /> : <Nav onOpenCategories={() => setCategoriesOpen(true)} />}
              <main className="flex-1">
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
              </main>
              {!isCheckout && <Footer />}
              <CartSheet />
              {/* The AI ChatWidget is unmounted until GEMINI_API_KEY is configured; WhatsApp covers help meanwhile. */}
              {/* Customer help button; hidden where it would cover checkout or admin controls. */}
              {!isCheckout && !location.startsWith("/admin") && <WhatsAppFab compact={isProduct} />}
              {showTabBar && <MobileTabBar categoriesOpen={categoriesOpen} onOpenCategories={() => setCategoriesOpen(true)} />}
              <CategorySheet open={categoriesOpen} onOpenChange={setCategoriesOpen} />
              <Toaster />
            </div>
          </ChatProvider>
        </EngagementProvider>
      </CartProvider>
    </FlashSaleProvider>
  );
}

export default App;
