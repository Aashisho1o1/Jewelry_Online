import { Switch, Route } from "wouter";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import Home from "@/pages/home";

import About from "@/pages/about";

import NotFound from "@/pages/not-found";

function App() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Home} />
    
            <Route path="/about" component={About} />
            
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;