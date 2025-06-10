import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import Login from "@/pages/login";
import CameraMonitor from "@/pages/camera-monitor";
import CameraSettings from "@/pages/camera-settings";
import WeighbridgeSettings from "@/pages/weighbridge-settings";
import PurchaseForm from "@/pages/purchase-form";
import SalesForm from "@/pages/sales-form";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <CameraMonitor />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <CameraSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/weighbridge-settings">
        <ProtectedRoute>
          <WeighbridgeSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/purchase-form">
        <ProtectedRoute>
          <PurchaseForm />
        </ProtectedRoute>
      </Route>
      <Route path="/sales-form">
        <ProtectedRoute>
          <SalesForm />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen bg-monitoring-dark">
            <Switch>
              <Route path="/login">
                <div>
                  <Toaster />
                  <Login />
                </div>
              </Route>
              <Route>
                <ProtectedRoute>
                  <Sidebar />
                  <div className="lg:ml-64">
                    <Toaster />
                    <Router />
                  </div>
                </ProtectedRoute>
              </Route>
            </Switch>
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
