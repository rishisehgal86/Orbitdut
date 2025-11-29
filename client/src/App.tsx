import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import CustomerSignup from "./pages/auth/CustomerSignup";
import SupplierSignup from "./pages/auth/SupplierSignup";
import SupplierDashboard from "./pages/supplier/Dashboard";
import SupplierSettings from "./pages/supplier/Settings";
import CurrentRates from "./pages/supplier/CurrentRates";
import RateManagement from "./pages/supplier/RateManagement";
import SupplierJobs from "./pages/supplier/Jobs";
import SupplierJobDetail from "./pages/supplier/JobDetail";
import SupplierCoverage from "./pages/supplier/Coverage";
import RequestService from "./pages/RequestService";
// RequestServicePricing import removed - rebuilding
import JobConfirmation from "./pages/JobConfirmation";
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerRequestService from "./pages/customer/RequestService";
import CustomerJobs from "./pages/customer/Jobs";
import CustomerJobDetail from "./pages/customer/JobDetail";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/auth/customer-signup" component={CustomerSignup} />
      <Route path="/auth/supplier-signup" component={SupplierSignup} />
      {/* Legacy routes for backward compatibility */}
      <Route path="/signup" component={CustomerSignup} />
      <Route path="/supplier/signup" component={SupplierSignup} />
      <Route path={"/request-service"} component={RequestService} />
      <Route path={"/404"} component={NotFound} />
      {/* <Route path={"/request-service/pricing"} component={RequestServicePricing} /> */}
      <Route path={"/job-confirmation/:id"} component={JobConfirmation} />
      <Route path={"/customer/dashboard"} component={CustomerDashboard} />
      <Route path={"/customer/request-service"} component={CustomerRequestService} />
      <Route path={"/customer/jobs"} component={CustomerJobs} />
      <Route path={"/customer/jobs/:id"} component={CustomerJobDetail} />
      <Route path={"/supplier/dashboard"} component={SupplierDashboard} />
      <Route path={"/supplier/settings"} component={SupplierSettings} />
      <Route path={"/supplier/rates/current"} component={CurrentRates} />
      <Route path={"/supplier/rates/manage"} component={RateManagement} />
      <Route path={"/supplier/rates"} component={CurrentRates} />
      <Route path={"/supplier/jobs"} component={SupplierJobs} />
      <Route path={"/supplier/jobs/:id"} component={SupplierJobDetail} />
      <Route path={"/supplier/coverage"} component={SupplierCoverage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
