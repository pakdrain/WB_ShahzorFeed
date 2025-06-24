import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/protected-route";
import Sidebar from "@/components/sidebar";
import Login from "@/pages/login";
import CameraMonitor from "@/pages/camera-monitor";
import CameraSettings from "@/pages/camera-settings";
import WeighbridgeSettings from "@/pages/weighbridge-settings";
import PurchaseForm from "@/pages/purchase-form";
import SalesForm from "@/pages/sales-form";
import Reports from "@/pages/reports";
import ImageUpload from "@/pages/image-upload";
import NotFound from "@/pages/not-found";
import SaleReturn from "@/pages/sale-return";
import SaleNode from "@/pages/sale-node";

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <Sidebar />
      <div className="lg:ml-64">
        <Switch>
          <Route path="/" component={CameraMonitor} />
          <Route path="/settings" component={CameraSettings} />
          <Route path="/weighbridge-settings" component={WeighbridgeSettings} />
          <Route path="/purchase-form" component={PurchaseForm} />
          <Route path="/sales-form" component={SalesForm} />
          <Route path="/sale-return" component={SaleReturn} />
          <Route path="/sale-node" component={SaleNode} />
          <Route path="/reports" component={Reports} />
          <Route path="/image-upload" component={ImageUpload} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen bg-monitoring-dark">
            <Toaster />
            <Router />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
