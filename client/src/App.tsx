import { Switch, Route } from "wouter";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import Checkout from "@/pages/checkout";
import OrderSuccess from "@/pages/order-success";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/contexts/CartContext";
import { CartSheet } from "@/components/cart/CartSheet";
import InstallPrompt from "@/components/InstallPrompt";

// Main application component for Aashish Jewellers

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 pt-20">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/order-success" component={OrderSuccess} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <CartSheet />
        <InstallPrompt />
      </div>
    </CartProvider>
  );
}

export default App;