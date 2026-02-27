import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Wallet from "./pages/Wallet";
import Store from "./pages/Store";
import Packages from "./pages/Packages";
import Community from "./pages/Community";
import DiscussionDetail from "./pages/DiscussionDetail";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import Sponsorship from "./pages/Sponsorship";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/store" element={<Store />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/:id" element={<DiscussionDetail />} />
                <Route path="/account" element={<Account />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/sponsorship" element={<Sponsorship />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
