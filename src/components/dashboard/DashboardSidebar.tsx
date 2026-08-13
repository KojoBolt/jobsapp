import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Trophy, Sparkles, ShoppingBag, Gift,
  IdCard, FileText, LifeBuoy, Settings, CheckCircle2, ChevronsUpDown,
} from "lucide-react";
import LegalModal from "@/components/legal/LegalModal";
import TermsOfService from "@/components/legal/TermsOfService";
import PrivacyPolicy from "@/components/legal/PrivacyPolicy";
import CurrentStrategy from "@/components/dashboard/CurrentStrategy";
import MonthlyUsageBar from "@/components/tracker/MonthlyUsageBar";
import Logo from "@/assets/images/job-logo.png";

/* Matches AdminSidebar's rail so the two consoles line up exactly. */
export const SIDEBAR_W = 248;

type NavItem = { name: string; icon: React.ElementType; path: string };
type NavSection = { label: string; items: NavItem[] };

/* Same items and URLs as before, grouped into the admin's MAIN / OTHER / ACCOUNT rhythm. */
const SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { name: "Campaign Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { name: "Identity Vault",     icon: ShieldCheck,     path: "/identity-vault" },
      { name: "Refinement Engine",  icon: Sparkles,        path: "/refinement" },
      { name: "Report",             icon: IdCard,          path: "/report" },
    ],
  },
  {
    label: "Other",
    items: [
      { name: "Career Accelerators", icon: ShoppingBag, path: "/accelerators" },
      { name: "Rewards Center",      icon: Trophy,      path: "/rewards" },
      { name: "Invite a Friend",     icon: Gift,        path: "/invite" },
      { name: "Resume Manager",      icon: FileText,    path: "/profile" },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Support",  icon: LifeBuoy, path: "/support" },
      { name: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "ME";

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-2 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9A9995]">
    {children}
  </p>
);

/* Quiet row used by the legal links and the footer actions, so buttons and
   links in the rail share one shape with the nav items. */
const QuietRow: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean }> = ({
  children, onClick, disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium
               text-[#6B6A66] transition-colors hover:bg-[#F7F7F5] hover:text-[#111110]
               disabled:opacity-50 dark:text-[#C3C2B7] dark:hover:bg-white/5 dark:hover:text-white"
  >
    {children}
  </button>
);

interface DashboardSidebarProps {
  profile: any;
  vaultData: any;
  isVaultComplete: boolean;
  isSubscribed: boolean;
  monthlyLimit: number;
  planName: string;
  onNavigate?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  profile,
  vaultData,
  isVaultComplete,
  isSubscribed,
  monthlyLimit,
  planName,
  onNavigate,
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1A1A19]">
      {/* ── Brand card ──────────────────────────────────────────────────── */}
      <div className="p-3">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl border border-[#EAEAE7] p-2.5
                     transition-colors hover:bg-[#F4F4F2] dark:border-white/10 dark:hover:bg-white/5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#111110] dark:bg-white">
            <img src={Logo} alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-tight text-[#111110] dark:text-white">
              JobApp
            </span>
            <span className="block truncate text-[10.5px] leading-tight text-[#9A9995]">
              Client Console
            </span>
          </span>
          <ChevronsUpDown size={13} className="shrink-0 text-[#9A9995]" />
        </Link>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-2">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            <SectionLabel>{section.label}</SectionLabel>

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <li key={item.path} className="relative">
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#111110] dark:bg-white"
                      />
                    )}
                    <Link
                      to={item.path}
                      onClick={onNavigate}
                      id={item.path === "/identity-vault" ? "sidebar-identity-vault" : undefined}
                      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors
                        ${
                          active
                            ? "bg-[#F4F4F2] font-semibold text-[#111110] dark:bg-white/[0.07] dark:text-white"
                            : "font-medium text-[#6B6A66] hover:bg-[#F7F7F5] hover:text-[#111110] dark:text-[#C3C2B7] dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.9} className="shrink-0" />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.path === "/identity-vault" && isVaultComplete && (
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* ── Usage + strategy ──────────────────────────────────────────── */}
        {isSubscribed && (
          <div className="mt-1">
            <SectionLabel>Usage</SectionLabel>
            <MonthlyUsageBar
              used={profile?.monthly_usage_count || 0}
              limit={monthlyLimit}
              planName={planName}
            />
          </div>
        )}

        <div className="mt-1" id="sidebar-strategy">
          <SectionLabel>Strategy</SectionLabel>
          <CurrentStrategy vaultData={vaultData} />
        </div>

        {/* ── Legal ─────────────────────────────────────────────────────── */}
        <div className="mt-1">
          <SectionLabel>Legal</SectionLabel>
          <ul className="space-y-0.5">
            <li>
              <LegalModal
                title="Terms of Service"
                trigger={
                  <QuietRow>
                    <FileText size={16} strokeWidth={1.9} className="shrink-0" />
                    <span className="flex-1 truncate text-left">Terms of Service</span>
                  </QuietRow>
                }
              >
                <TermsOfService />
              </LegalModal>
            </li>
            <li>
              <LegalModal
                title="Privacy Policy"
                trigger={
                  <QuietRow>
                    <FileText size={16} strokeWidth={1.9} className="shrink-0" />
                    <span className="flex-1 truncate text-left">Privacy Policy</span>
                  </QuietRow>
                }
              >
                <PrivacyPolicy />
              </LegalModal>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Footer actions ──────────────────────────────────────────────────
          Sign out lives in the header's user dropdown, matching the admin. */}
      <div className="space-y-0.5 border-t border-[#EAEAE7] px-3 py-2 dark:border-white/10">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium
                     text-[#6B6A66] transition-colors hover:bg-[#F7F7F5] hover:text-[#111110]
                     dark:text-[#C3C2B7] dark:hover:bg-white/5 dark:hover:text-white"
        >
          <span className="flex-1 truncate">Back to Site</span>
        </Link>
      </div>

      {/* ── User card ───────────────────────────────────────────────────── */}
      <div className="p-3 pt-0">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#EAEAE7] p-2.5 dark:border-white/10">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F4F2] text-[11px] font-bold text-[#6B6A66] dark:bg-white/10 dark:text-[#C3C2B7]">
            {initials(profile?.full_name || "")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold leading-tight text-[#111110] dark:text-white">
              {profile?.full_name || "My account"}
            </span>
            <span className="block truncate text-[10.5px] leading-tight text-[#9A9995]">
              {profile?.email || ""}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
