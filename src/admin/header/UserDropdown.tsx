import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Activity, Shield, User } from "lucide-react";
import { DropdownItem } from "../ui/DropdownItem";
import { Dropdown } from "../ui/Dropdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { T, Avatar } from "@/admin/ui/system";

interface AdminProfile {
  full_name: string | null;
  email: string | null;
  role: string | null;
}

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { pushToast } = useToast();
  const [profile, setProfile] = useState<AdminProfile>({
    full_name: null,
    email: null,
    role: null,
  });

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // maybeSingle, not single: a missing profile row is a normal state here
      // and shouldn't throw.
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[UserDropdown] profile query failed:", error);
        return;
      }
      if (data) setProfile(data);
      else setProfile((p) => ({ ...p, email: user.email ?? null }));
    };

    fetchAdminProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsOpen(false);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        pushToast({
          title: "Error",
          message: "Failed to sign out. Please try again.",
          variant: "error",
        });
        setIsSigningOut(false);
        return;
      }

      pushToast({
        title: "Signed out",
        message: "You have been signed out successfully.",
        variant: "success",
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      console.error("Unexpected sign out error:", err);
      pushToast({
        title: "Error",
        message: "An unexpected error occurred. Please refresh and try again.",
        variant: "error",
      });
      setIsSigningOut(false);
    }
  };

  const fullName = profile.full_name || "Admin";
  const displayName = profile.full_name
    ? profile.full_name.split(" ")[0]
    : profile.email?.split("@")[0] || "Admin";
  const isAdmin = profile.role === "admin";

  return (
    <div className="relative">
      {/* Trigger sits on the header's 32px control rhythm. */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        // dropdown-toggle exempts this from Dropdown's outside-click handler.
        // Without it, mousedown closes the panel and the click reopens it.
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
        {/* Identity */}
        <div className={`flex items-center gap-2.5 border-b ${T.hairline} px-4 py-3.5`}>
          <Avatar name={fullName} size={36} />
          <div className="min-w-0">
            <p className={`truncate text-[13px] font-semibold ${T.ink}`}>{fullName}</p>
            <p className={`truncate text-[11px] ${T.muted}`}>{profile.email || ""}</p>
            {profile.role && (
              <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase
                                tracking-[0.06em] ${isAdmin ? "text-[#B32F2F] dark:text-[#EF7A7A]" : T.muted}`}>
                {isAdmin ? <Shield size={9} /> : <User size={9} />}
                {profile.role}
              </span>
            )}
          </div>
        </div>

        {/* Links — only routes that exist. /admin/profile and /admin/settings
            were listed here but have no route, so they rendered a blank shell. */}
        <ul className={`border-b ${T.hairline} p-1.5`}>
          <li>
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              tag="a"
              to="/admin/activity"
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px]
                          font-medium ${T.ink2} transition-colors hover:bg-[#F4F4F2]
                          hover:text-[#111110] dark:hover:bg-white/5 dark:hover:text-white`}
            >
              <Activity size={14} />
              My activity
            </DropdownItem>
          </li>
        </ul>

        {/* Sign out */}
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
