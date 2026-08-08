import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, Files, Radio, Send, Users2,
  Bell, Activity, ChevronsUpDown, Zap, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "../context/SidebarContext";

/* Shared with AdminLayout so the content offset can never drift from the rail. */
export const SIDEBAR_W = 248;
export const SIDEBAR_W_COLLAPSED = 84;

type NavItem = {
  name: string;
  icon: React.ElementType;
  path: string;
  badge?: "pending" | "unread";
};

type NavSection = { label: string; items: NavItem[] };

/* Grouped exactly like the reference: MAIN / OTHER / ACCOUNT. */
const SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard",        icon: LayoutDashboard, path: "/admin/dashboard" },
      { name: "Review Queue",     icon: ClipboardCheck,  path: "/admin/review-queue", badge: "pending" },
      { name: "All Applications", icon: Files,           path: "/admin/applications" },
      { name: "Campaign Monitor", icon: Radio,           path: "/admin/campaigns" },
    ],
  },
  {
    label: "Other",
    items: [
      { name: "Submission Queue", icon: Send,   path: "/admin/submission-queue" },
      { name: "User Management",  icon: Users2, path: "/admin/users" },
      { name: "Notifications",    icon: Bell,   path: "/admin/notifications", badge: "unread" },
    ],
  },
  {
    label: "Account",
    items: [{ name: "My Activity", icon: Activity, path: "/admin/activity" }],
  },
];

const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "AD";

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const location = useLocation();

  const open = isExpanded || isHovered || isMobileOpen;

  const [counts, setCounts] = useState({ pending: 0, unread: 0 });
  const [me, setMe] = useState({ full_name: "Admin", email: "" });

  const isActive = useCallback(
    (path: string) =>
      location.pathname === path ||
      // /admin and /admin/dashboard are the same screen
      (path === "/admin/dashboard" && location.pathname === "/admin"),
    [location.pathname],
  );

  useEffect(() => {
    const load = async () => {
      const { count: pending } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["queued", "pending_review"]);

      const { count: unread } = await supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);

      setCounts({ pending: pending || 0, unread: unread || 0 });

      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", auth.user.id)
          .maybeSingle();
        if (profile) {
          setMe({
            full_name: profile.full_name || "Admin",
            email: profile.email || auth.user.email || "",
          });
        }
      }
    };

    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const badgeValue = (b?: NavItem["badge"]) =>
    b === "pending" ? counts.pending : b === "unread" ? counts.unread : 0;

  // Escape closes the mobile drawer, alongside the X and the backdrop.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && toggleMobileSidebar();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileOpen, toggleMobileSidebar]);

  return (
    <>
      {/* Backdrop — the drawer had no way to dismiss by tapping outside. */}
      {isMobileOpen && (
        <div
          onClick={toggleMobileSidebar}
          aria-hidden
          className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: open ? SIDEBAR_W : SIDEBAR_W_COLLAPSED }}
      // z-[1100] puts the drawer above the sticky header (z-[1000]). At z-50 the
      // header painted over the top of it, hiding the first nav item.
      className={`fixed left-0 top-0 z-[1100] flex h-screen flex-col border-r border-[#EAEAE7]
                  bg-white transition-all duration-300 ease-in-out
                  dark:border-white/10 dark:bg-[#1A1A19]
                  ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:z-50 lg:translate-x-0`}
    >
      {/* ── Drawer header (mobile only) ──────────────────────────────────
          The brand lives in the page header below lg, so this row exists to
          give the drawer a visible way out. */}
      <div className="flex items-center justify-between px-3 pt-3 lg:hidden">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9A9995]">
          Menu
        </span>
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Close menu"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#EAEAE7]
                     text-[#6B6A66] transition-colors hover:bg-[#F4F4F2]
                     dark:border-white/10 dark:text-[#C3C2B7] dark:hover:bg-white/5"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Brand card ─────────────────────────────────────────────────────
          Desktop only. Below lg the header carries the brand, so showing it
          here too would double it up whenever the drawer is open. */}
      <div className="hidden p-3 lg:block">
        <Link
          to="/admin/dashboard"
          className={`flex items-center gap-2.5 rounded-xl border border-[#EAEAE7] p-2.5
                      transition-colors hover:bg-[#F4F4F2]
                      dark:border-white/10 dark:hover:bg-white/5
                      ${open ? "" : "justify-center"}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#111110] text-white dark:bg-white dark:text-[#111110]">
            <Zap size={15} strokeWidth={2.5} />
          </span>
          {open && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold leading-tight text-[#111110] dark:text-white">
                  JobApp
                </span>
                <span className="block truncate text-[10.5px] leading-tight text-[#9A9995]">
                  Admin Console
                </span>
              </span>
              <ChevronsUpDown size={13} className="shrink-0 text-[#9A9995]" />
            </>
          )}
        </Link>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-2">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            <p
              className={`px-2 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9A9995]
                          ${open ? "" : "text-center"}`}
            >
              {open ? section.label : "•"}
            </p>

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const count = badgeValue(item.badge);
                const Icon = item.icon;

                return (
                  <li key={item.path} className="relative">
                    {/* Left indicator bar on the active row */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#111110] dark:bg-white"
                      />
                    )}
                    <Link
                      to={item.path}
                      title={open ? undefined : item.name}
                      // Navigating on mobile should dismiss the drawer, or it
                      // stays open on top of the page you just opened.
                      onClick={() => isMobileOpen && toggleMobileSidebar()}
                      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors
                        ${open ? "" : "justify-center"}
                        ${
                          active
                            ? "bg-[#F4F4F2] font-semibold text-[#111110] dark:bg-white/[0.07] dark:text-white"
                            : "font-medium text-[#6B6A66] hover:bg-[#F7F7F5] hover:text-[#111110] dark:text-[#C3C2B7] dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.9} className="shrink-0" />
                      {open && <span className="flex-1 truncate">{item.name}</span>}
                      {open && count > 0 && (
                        <span className="grid h-[17px] min-w-[17px] shrink-0 place-items-center rounded-full bg-[#D03B3B] px-1 text-[10px] font-bold text-white">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                      {!open && count > 0 && (
                        <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#D03B3B]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User card ────────────────────────────────────────────────────── */}
      <div className="p-3">
        <div
          className={`flex items-center gap-2.5 rounded-xl border border-[#EAEAE7] p-2.5
                      dark:border-white/10 ${open ? "" : "justify-center"}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F4F2] text-[11px] font-bold text-[#6B6A66] dark:bg-white/10 dark:text-[#C3C2B7]">
            {initials(me.full_name)}
          </span>
          {open && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold leading-tight text-[#111110] dark:text-white">
                {me.full_name}
              </span>
              <span className="block truncate text-[10.5px] leading-tight text-[#9A9995]">
                {me.email}
              </span>
            </span>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
