import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SupplierDashboard from "./pages/supplier/Dashboard";
import SupplierSettings from "./pages/supplier/Settings";
import SupplierRates from "./pages/supplier/Rates";
import SupplierJobs from "./pages/supplier/Jobs";
import SupplierJobDetail from "./pages/supplier/JobDetail";
import RequestService from "./pages/RequestService";
import RequestServicePricing from "./pages/RequestServicePricing";
import JobConfirmation from "./pages/JobConfirmation";
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerRequestService from "./pages/customer/RequestService";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/request-service"} component={RequestService} />
      <Route path={"/request-service/pricing"} component={RequestServicePricing} />
      <Route path={"/job-confirmation/:id"} component={JobConfirmation} />
      <Route path={"/customer/dashboard"} component={CustomerDashboard} />
      <Route path={"/customer/request-service"} component={CustomerRequestService} />
      <Route path={"/supplier/dashboard"} component={SupplierDashboard} />
      <Route path={"/supplier/settings"} component={SupplierSettings} />
      <Route path={"/supplier/rates"} component={SupplierRates} />
      <Route path={"/supplier/jobs"} component={SupplierJobs} />
      <Route path={"/supplier/jobs/:id"} component={SupplierJobDetail} />
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
