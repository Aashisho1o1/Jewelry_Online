import { Switch, Route } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import RatesPage from "@/pages/rates";
import ShopByPage from "@/pages/shop-by";
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
import ChatWidget from "@/components/chat/ChatWidget";
import InstallPrompt from "@/components/InstallPrompt";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <HelmetProvider>
      <FlashSaleProvider>
      <CartProvider>
        <EngagementProvider>
          <ChatProvider>
            <div className="min-h-screen flex flex-col">
              <Nav />
              <main className="flex-1 pt-16 md:pt-[72px]">
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/about" component={About} />
                  <Route path="/rates" component={RatesPage} />
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
              <Footer />
              <CartSheet />
              <ChatWidget />
              <Toaster />
              <InstallPrompt />
            </div>
          </ChatProvider>
        </EngagementProvider>
      </CartProvider>
      </FlashSaleProvider>
    </HelmetProvider>
  );
}

export default App;
