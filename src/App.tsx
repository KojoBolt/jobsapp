import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Referrals from "./pages/Referrals";
import RefinementEngine from "./pages/RefinementEngine";
import Profile from "./pages/Profile";
import IdentityVault from "./pages/IdentityVault";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import CareerAccelerators from "./pages/CareerAccelerators";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import InviteFriend from "./pages/InviteFriend";
import RewardsCenter from "./pages/RewardsCenter";
import AuthPage from "./pages/AuthPage";
import JobTracker from "./pages/JobTracker";
import DeployMission from "./pages/DeployMission";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/identity-vault" element={<IdentityVault />} />
            <Route path="/job-tracker" element={<JobTracker />} />
            <Route path="/job-tracker/deploy" element={<DeployMission />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/refinement" element={<RefinementEngine />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/accelerators" element={<CareerAccelerators />} />
            <Route path="/purchase-success" element={<PurchaseSuccess />} />
            <Route path="/invite" element={<InviteFriend />} />
            <Route path="/rewards" element={<RewardsCenter />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
