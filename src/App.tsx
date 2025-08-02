import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Accounts from "./pages/Accounts";
import AccountDashboard from "./pages/AccountDashboard";
import SavingTracker from "./pages/SavingTracker";
import DebtTracker from "./pages/DebtTracker";
import MonthlyDashboard from "./pages/MonthlyDashboard";
import AnnualDashboard from "./pages/AnnualDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="account-dashboard" element={<AccountDashboard />} />
            <Route path="saving-tracker" element={<SavingTracker />} />
            <Route path="debt-tracker" element={<DebtTracker />} />
            <Route path="monthly-dashboard" element={<MonthlyDashboard />} />
            <Route path="annual-dashboard" element={<AnnualDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;