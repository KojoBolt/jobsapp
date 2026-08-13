import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
// import SupportPanel from "@/components/dashboard/SupportPanel";
// import CrispChat from "@/components/dashboard/CrispChat";
import DashboardSidebar, { SIDEBAR_W } from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import ChatWidget from "@/components/chatbot/ChatWidget";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const [hasInterview, setHasInterview] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSubscribed = profile?.subscription_tier === "plan_1" || profile?.subscription_tier === "plan_2";
  const isPlan2 = profile?.subscription_tier === "plan_2";
  const monthlyLimit = isPlan2 ? 50 : 10;
  const planName = isPlan2 ? "Pro Hunter" : "Tracker";

  // Check if vault is complete
  const vaultData = profile?.identity_vault_data;
  const isVaultComplete = !!(
    vaultData?.personalInfo?.name?.trim() &&
    vaultData?.personalInfo?.email?.trim() &&
    vaultData?.personalInfo?.linkedinUrl?.trim() &&
    vaultData?.targeting?.industries && vaultData.targeting.industries.length > 0 &&
    vaultData?.targeting?.targetRoles && vaultData.targeting.targetRoles.length > 0 &&
    vaultData?.targeting?.toneOfVoice
  );

  // Check for active interviews
  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["pending_review", "approved"])
      .limit(1)
      .then(({ data }) => setHasInterview(!!(data && data.length > 0)));
  }, [user]);

  // Onboarding tour trigger
  useEffect(() => {
    if (!user) return;
    const tourCompleted = localStorage.getItem("onboarding_tour_completed");
    if (tourCompleted) return;
    supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setShowTour(true);
        }
      });
  }, [user]);

  const getPageTitle = () => {
    if (location.pathname === "/dashboard") return "Campaign Dashboard";
    if (location.pathname === "/identity-vault") return "Identity Vault";
    if (location.pathname === "/refinement") return "Refinement Engine";
    if (location.pathname === "/job-tracker") return "Job Trackr — Command Center";
    if (location.pathname === "/accelerators") return "Career Accelerators";
    // if (location.pathname === "/referrals") return "Referral Network";
    if (location.pathname === "/report") return "Report";
    if (location.pathname === "/invite") return "Invite a Friend";
    if (location.pathname === "/rewards") return "Rewards Center";
    if (location.pathname === "/profile") return "Resume Manager";
    if (location.pathname === "/support") return "Support Hub";
    if (location.pathname === "/settings") return "Settings";
    return "Campaign Dashboard";
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    // ThemeProvider lives at the app root in App.tsx, not here — a page that
    // renders this layout sits above it in the tree, so a provider nested here
    // is out of scope for that page's own useTheme/useRamp calls.
    <>
      {/* 248px matches AdminSidebar's SIDEBAR_W so both consoles share one rail width. */}
      <SidebarProvider style={{ "--sidebar-width": `${SIDEBAR_W}px` } as React.CSSProperties}>
        <div className="flex min-h-screen w-full">
          <Sidebar className="border-r border-[#EAEAE7] dark:border-white/10 [&>div]:bg-white dark:[&>div]:bg-[#1A1A19]">
            <DashboardSidebar
              profile={profile}
              vaultData={vaultData}
              isVaultComplete={isVaultComplete}
              isSubscribed={isSubscribed}
              monthlyLimit={monthlyLimit}
              planName={planName}
            />
          </Sidebar>
  
          <main className="flex-1 overflow-auto bg-[#F4F4F2] dark:bg-[#0D0D0D]">
            <DashboardHeader title={getPageTitle()} />
            {/* pb-24 keeps the last row of any page clear of the floating chat
                launcher, which previously sat on top of things like the
                application feed's pagination with no way to scroll past it. */}
            <div className="p-4 pb-24 sm:p-5 sm:pb-24">{children}</div>
          </main>
  
          {/* Onboarding Tour */}
          {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
  
          {/* Floating Support Button */}
          {/* <SupportPanel /> */}
          {/* Crisp Live Chat Widget */}
            <ChatWidget />
        </div>
      </SidebarProvider>
    </>
  );
};

export default DashboardLayout;
