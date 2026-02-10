import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gift,
  Settings,
  Zap,
  LogOut,
  Sparkles,
  LifeBuoy,
  FileText,
  ShoppingBag,
  Trophy,
  Crown,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import SupportPanel from "@/components/dashboard/SupportPanel";
import CrispChat from "@/components/dashboard/CrispChat";
import LegalModal from "@/components/legal/LegalModal";
import TermsOfService from "@/components/legal/TermsOfService";
import PrivacyPolicy from "@/components/legal/PrivacyPolicy";
import CurrentStrategy from "@/components/dashboard/CurrentStrategy";
import MonthlyUsageBar from "@/components/tracker/MonthlyUsageBar";
import { useAuth } from "@/hooks/useAuth";

const mainNavItems = [
  { title: "Campaign Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Identity Vault", url: "/identity-vault", icon: ShieldCheck },
  { title: "Rewards Center", url: "/rewards", icon: Trophy },
  { title: "Refinement Engine", url: "/refinement", icon: Sparkles },
  { title: "Career Accelerators", url: "/accelerators", icon: ShoppingBag },
  { title: "Referrals", url: "/referrals", icon: Users },
  { title: "Invite a Friend", url: "/invite", icon: Gift },
  { title: "Resume Manager", url: "/profile", icon: FileText },
  { title: "Support", url: "/support", icon: LifeBuoy },
  { title: "Settings", url: "/settings", icon: Settings },
];

const trackerNavItem = { title: "Job Trackr", url: "/job-tracker", icon: Crown };

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { profile } = useAuth();

  const isSubscribed = profile?.subscription_tier === "plan_1" || profile?.subscription_tier === "plan_2";
  const isPlan2 = profile?.subscription_tier === "plan_2";
  const monthlyLimit = isPlan2 ? 50 : 10;
  const planName = isPlan2 ? "Pro Hunter" : "Tracker";

  const getPageTitle = () => {
    if (location.pathname === "/dashboard") return "Campaign Dashboard";
    if (location.pathname === "/identity-vault") return "Identity Vault";
    if (location.pathname === "/job-tracker") return "Job Trackr — Command Center";
    if (location.pathname === "/accelerators") return "Career Accelerators";
    if (location.pathname === "/referrals") return "Referral Network";
    if (location.pathname === "/invite") return "Invite a Friend";
    if (location.pathname === "/rewards") return "Rewards Center";
    if (location.pathname === "/profile") return "Resume Manager";
    if (location.pathname === "/support") return "Support Hub";
    if (location.pathname === "/settings") return "Settings";
    return "Campaign Dashboard";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border/50">
          <div className="flex h-16 items-center gap-2 border-b border-border/50 px-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">JobApp</span>
            </Link>
          </div>

          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground ${
                            item.url === "/identity-vault" ? "hover:shadow-[0_0_12px_hsl(270_60%_55%/0.3)]" : ""
                          }`}
                          activeClassName={
                            item.url === "/identity-vault"
                              ? "bg-[hsl(270_60%_55%/0.12)] text-[hsl(270_60%_70%)] shadow-[0_0_12px_hsl(270_60%_55%/0.25)]"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Job Trackr — Command Center (special bottom section) */}
            <SidebarGroup className="mt-2">
              <SidebarGroupContent>
                <Separator className="mb-3 bg-border/30" />
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={trackerNavItem.url}
                        end
                        className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/20 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-[0_0_14px_hsl(213_94%_55%/0.2)]"
                        activeClassName="border-primary/40 bg-primary/10 text-primary shadow-[0_0_14px_hsl(213_94%_55%/0.25)]"
                      >
                        <Terminal className="h-4 w-4" />
                        <span>{trackerNavItem.title}</span>
                        <span className="ml-auto text-[9px] uppercase tracking-widest text-muted-foreground/60">Command Center</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Monthly Usage (Subscribed users) */}
            {isSubscribed && (
              <SidebarGroup className="mt-4">
                <SidebarGroupContent>
                  <MonthlyUsageBar
                    used={profile?.monthly_usage_count || 0}
                    limit={monthlyLimit}
                    planName={planName}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Current Strategy */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Strategy
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <CurrentStrategy />
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Legal Links */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Legal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <LegalModal
                      title="Terms of Service"
                      trigger={
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Terms of Service</span>
                        </button>
                      }
                    >
                      <TermsOfService />
                    </LegalModal>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <LegalModal
                      title="Privacy Policy"
                      trigger={
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Privacy Policy</span>
                        </button>
                      }
                    >
                      <PrivacyPolicy />
                    </LegalModal>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto pt-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Back to Site</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="flex h-16 items-center border-b border-border/50 px-6">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-sm font-medium text-foreground">{getPageTitle()}</h2>
          </header>
          <div className="p-6">{children}</div>
        </main>

        {/* Floating Support Button */}
        <SupportPanel />
        {/* Crisp Live Chat Widget */}
        <CrispChat />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
