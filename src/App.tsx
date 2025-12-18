import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminProvider } from "@/hooks/useAdmin";
import Index from "./pages/Index";
import Cameras from "./pages/Cameras";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import ApiDebug from "./pages/ApiDebug";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminCameras from "./pages/admin/AdminCameras";
import AdminWidget from "./pages/admin/AdminWidget";
import AdminSlopesLifts from "./pages/admin/AdminSlopesLifts";
import AdminAutopost from "./pages/admin/AdminAutopost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kamery" element={<Cameras />} />
            <Route path="/cenik" element={<Pricing />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/debug" element={<ApiDebug />} />
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="cenik" element={<AdminPricing />} />
              <Route path="kamery" element={<AdminCameras />} />
              <Route path="widget" element={<AdminWidget />} />
              <Route path="sjezdovky" element={<AdminSlopesLifts />} />
              <Route path="autopost" element={<AdminAutopost />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
