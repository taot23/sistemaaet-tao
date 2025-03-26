import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import VehiclesPage from "@/pages/vehicles-page";
import RequestLicensePage from "@/pages/request-license-page";
import TrackLicensePage from "@/pages/track-license-page";
import CompletedLicensesPage from "@/pages/completed-licenses-page";
import AdminDashboardPage from "@/pages/admin/admin-dashboard-page";
import AdminLicensesPage from "@/pages/admin/admin-licenses-page";
import AdminUsersPage from "@/pages/admin/admin-users-page";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas de usuário */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/vehicles" component={VehiclesPage} />
      <ProtectedRoute path="/request-license" component={RequestLicensePage} />
      <ProtectedRoute path="/track-license" component={TrackLicensePage} />
      <ProtectedRoute path="/completed-licenses" component={CompletedLicensesPage} />
      
      {/* Rotas administrativas */}
      <ProtectedRoute path="/admin" component={AdminDashboardPage} adminOnly={true} />
      <ProtectedRoute path="/admin/licenses" component={AdminLicensesPage} adminOnly={true} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} adminOnly={true} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
