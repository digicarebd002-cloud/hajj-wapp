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
import ProductDetail from "./pages/ProductDetail";
import Packages from "./pages/Packages";
import Community from "./pages/Community";
import DiscussionDetail from "./pages/DiscussionDetail";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import Sponsorship from "./pages/Sponsorship";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import Install from "./pages/Install";
import Messages from "./pages/Messages";
import MyOrders from "./pages/MyOrders";
import MyBookings from "./pages/MyBookings";
import Membership from "./pages/Membership";
import Wishlist from "./pages/Wishlist";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";
import HelpCenter from "./pages/HelpCenter";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCommunity from "./pages/admin/AdminCommunity";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPageManagement from "./pages/admin/AdminPageManagement";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminSalesReports from "./pages/admin/AdminSalesReports";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminSupportTickets from "./pages/admin/AdminSupportTickets";
import AdminInventory from "./pages/admin/AdminInventory";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import { ScrollToTopOnRouteChange } from "./components/ScrollToTop";
import SubscriptionGate from "./components/SubscriptionGate";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTopOnRouteChange />
              <Routes>
                {/* Admin routes - no main Layout */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="packages" element={<AdminPackages />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="community" element={<AdminCommunity />} />
                  <Route path="contacts" element={<AdminContacts />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="pages" element={<AdminPageManagement />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="sales-reports" element={<AdminSalesReports />} />
                  <Route path="refunds" element={<AdminRefunds />} />
                  <Route path="shipping" element={<AdminShipping />} />
                  <Route path="transactions" element={<AdminTransactions />} />
                  <Route path="marketing" element={<AdminMarketing />} />
                  <Route path="support" element={<AdminSupportTickets />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Public routes with Layout */}
                <Route path="/*" element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/wallet" element={<SubscriptionGate><Wallet /></SubscriptionGate>} />
                      <Route path="/store" element={<Store />} />
                      <Route path="/store/:id" element={<ProductDetail />} />
                      <Route path="/packages" element={<Packages />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/community/:id" element={<DiscussionDetail />} />
                      <Route path="/account" element={<SubscriptionGate><Account /></SubscriptionGate>} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/sponsorship" element={<Sponsorship />} />
                      
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/install" element={<Install />} />
                      <Route path="/messages" element={<SubscriptionGate><Messages /></SubscriptionGate>} />
                      <Route path="/orders" element={<SubscriptionGate><MyOrders /></SubscriptionGate>} />
                      <Route path="/bookings" element={<SubscriptionGate><MyBookings /></SubscriptionGate>} />
                      <Route path="/membership" element={<SubscriptionGate><Membership /></SubscriptionGate>} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/help-center" element={<HelpCenter />} />
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogArticle />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SiteSettingsProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
