import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/admin/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
import JobTracker from "./pages/JobTracker";
import DeployMission from "./pages/DeployMission";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";

import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import EmailConfirmation from "./components/Auth/EmailConfirmation";

//  ADMIN
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboardPage from "./admin/dashboard/AdminDashboardPage";
import ReviewQueuePage from "./admin/pages/ReviewQueuePage";
import AllApplicationsPage from "./admin/pages/AllApplicationsPage";
import MyActivityPage from "./admin/pages/MyActivityPage";
import { SidebarProvider } from "./admin/context/SidebarContext";
import { ToastProvider } from "@/admin/toast/ToastContext";
import ToastViewport from "@/admin/toast/ToastViewport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<Signup />} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            {/* AUTHENTICATED USER ROUTES */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/identity-vault"
              element={
                <ProtectedRoute>
                  <IdentityVault />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-tracker"
              element={
                <ProtectedRoute>
                  <JobTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-tracker/deploy"
              element={
                <ProtectedRoute>
                  <DeployMission />
                </ProtectedRoute>
              }
            />
            <Route
              path="/referrals"
              element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/refinement"
              element={
                <ProtectedRoute>
                  <RefinementEngine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accelerators"
              element={
                <ProtectedRoute>
                  <CareerAccelerators />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-success"
              element={
                <ProtectedRoute>
                  <PurchaseSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invite"
              element={
                <ProtectedRoute>
                  <InviteFriend />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <RewardsCenter />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES - PROTECTED */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <ToastProvider>
                    <ThemeProvider>
                      <SidebarProvider>
                        <AdminLayout />
                        <ToastViewport />
                      </SidebarProvider>
                    </ThemeProvider>
                  </ToastProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              <Route path="applications" element={<AllApplicationsPage />} />
              <Route path="activity" element={<MyActivityPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;