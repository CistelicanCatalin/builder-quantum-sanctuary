import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";
import Sites from "./pages/Sites";
import Settings from "./pages/Settings";
import Updates from "./pages/Updates";
import Monitor from "./pages/Monitor";
import Backups from "./pages/Backups";
import Security from "./pages/Security";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/sites" element={
              <ProtectedRoute>
                <Sites />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/updates" element={
              <ProtectedRoute>
                <Updates />
              </ProtectedRoute>
            } />
            <Route path="/monitor" element={
              <ProtectedRoute>
                <Monitor />
              </ProtectedRoute>
            } />
            <Route path="/backups" element={
              <ProtectedRoute>
                <Backups />
              </ProtectedRoute>
            } />
            <Route path="/backups/:siteId" element={
              <ProtectedRoute>
                <Backups />
              </ProtectedRoute>
            } />
            <Route path="/security" element={
              <ProtectedRoute>
                <Security />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
