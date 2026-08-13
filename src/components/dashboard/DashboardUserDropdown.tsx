import { useState } from "react";
import { ChevronDown, LogOut, Settings, FileText, ShieldCheck } from "lucide-react";
import { Dropdown } from "@/admin/ui/Dropdown";
import { DropdownItem } from "@/admin/ui/DropdownItem";
import { T, Avatar } from "@/admin/ui/system";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

/**
 * Client twin of the admin header's UserDropdown — same trigger geometry, panel
 * and row styling. It differs only in its plumbing: sign-out goes through the
 * app's own `useAuth`, and the links point at client routes.
 */
export default function DashboardUserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { profile, user, signOut } = useAuth();

  const email = profile?.email || user?.email || "";
  const fullName = profile?.full_name || email.split("@")[0] || "My account";
  const displayName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : email.split("@")[0] || "Account";
  const plan = profile?.subscription_tier === "plan_2"
    ? "Pro Hunter"
    : profile?.subscription_tier === "plan_1"
    ? "Tracker"
    : null;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsOpen(false);
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (err) {
      console.error("Sign out failed:", err);
      toast({
        title: "Sign out failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSigningOut(false);
    }
  };

  const linkClass = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px]
                     font-medium ${T.ink2} transition-colors hover:bg-[#F4F4F2]
                     hover:text-[#111110] dark:hover:bg-white/5 dark:hover:text-white`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        // dropdown-toggle exempts this from Dropdown's outside-click handler,
        // otherwise mousedown closes the panel and the click reopens it.
        className={`dropdown-toggle flex h-8 items-center gap-1.5 rounded-lg border ${T.hairline} pl-1 pr-1.5
                    transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
      >
        <Avatar name={fullName} size={24} />
        <span className={`hidden max-w-[90px] truncate text-[12px] font-medium sm:block ${T.ink}`}>
          {displayName}
        </span>
        <ChevronDown
          size={12}
          className={`${T.muted} transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className={`absolute right-0 mt-2 flex w-[248px] flex-col rounded-2xl border ${T.hairline}
                    bg-white p-0 shadow-xl dark:bg-[#1A1A19]`}
      >
        <div className={`flex items-center gap-2.5 border-b ${T.hairline} px-4 py-3.5`}>
          <Avatar name={fullName} size={36} />
          <div className="min-w-0">
            <p className={`truncate text-[13px] font-semibold ${T.ink}`}>{fullName}</p>
            <p className={`truncate text-[11px] ${T.muted}`}>{email}</p>
            {plan && (
              <span className={`mt-1 inline-block text-[10px] font-semibold uppercase tracking-[0.06em] ${T.muted}`}>
                {plan}
              </span>
            )}
          </div>
        </div>

        <ul className={`border-b ${T.hairline} p-1.5`}>
          <li>
            <DropdownItem onItemClick={() => setIsOpen(false)} tag="a" to="/identity-vault" className={linkClass}>
              <ShieldCheck size={14} />
              Identity Vault
            </DropdownItem>
          </li>
          <li>
            <DropdownItem onItemClick={() => setIsOpen(false)} tag="a" to="/profile" className={linkClass}>
              <FileText size={14} />
              Resume Manager
            </DropdownItem>
          </li>
          <li>
            <DropdownItem onItemClick={() => setIsOpen(false)} tag="a" to="/settings" className={linkClass}>
              <Settings size={14} />
              Settings
            </DropdownItem>
          </li>
        </ul>

        <div className="p-1.5">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px]
                        font-medium ${T.ink2} transition-colors hover:bg-[#D03B3B]/10
                        hover:text-[#B32F2F] disabled:opacity-50 dark:hover:text-[#EF7A7A]`}
          >
            <LogOut size={14} />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
