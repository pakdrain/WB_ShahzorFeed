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
import RoleManagement from "@/pages/role-management";
import PurchaseForm from "@/pages/purchase-form";
import SalesForm from "@/pages/sales-form";
import Reports from "@/pages/reports";
import ImageUpload from "@/pages/image-upload";
import NotFound from "@/pages/not-found";
import SalesReturnForm from "@/pages/sales-return";
import SaleNode from "@/pages/sale-node";
import PurchaseReturn from "@/pages/purchase-return";
import FreightEntry from "./pages/freight-entry";
import FreightVoucher from "./pages/freight-voucher";
import GetData from "./pages/get-data";

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <Sidebar />
      <div className="lg:ml-64">
        <Switch>
          <Route path="/" component={CameraMonitor} />
          <Route path="/settings" component={CameraSettings} />
          <Route path="/weighbridge-settings" component={WeighbridgeSettings} />
          <Route path="/role-management" component={RoleManagement} />
          <Route path="/purchase-form" component={PurchaseForm} />
          <Route path="/voucher-entry" component={FreightEntry} />
          <Route path="/voucher-view" component={FreightVoucher} />
          <Route path="/get-data" component={GetData} />
          <Route path="/sales-form" component={SalesForm} />
          <Route path="/sales-return" component={SalesReturnForm} />
          <Route path="/purchase-return" component={PurchaseReturn} />
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
