import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import CameraMonitor from "@/pages/camera-monitor";
import CameraSettings from "@/pages/camera-settings";
import WeighbridgeSettings from "@/pages/weighbridge-settings";
import PurchaseForm from "@/pages/purchase-form";
import PurchaseOnline from "@/pages/purchase-online";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CameraMonitor} />
      <Route path="/purchase-form" component={PurchaseForm} />
      <Route path="/purchase-online" component={PurchaseOnline} />
      <Route path="/settings" component={CameraSettings} />
      <Route path="/weighbridge-settings" component={WeighbridgeSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-monitoring-dark">
          <Sidebar />
          <div className="lg:ml-64">
            <Toaster />
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
