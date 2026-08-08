import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, Files, Radio, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "../context/SidebarContext";
import { T } from "@/admin/ui/system";

/**
 * Mobile-only bottom navigation. The sidebar is off-canvas below lg, so the
 * four highest-traffic destinations live here and "More" opens the drawer for
 * everything else.
 */
const ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { name: "Review Queue", icon: ClipboardCheck, path: "/admin/review-queue", badge: true },
  { name: "All Applications", icon: Files, path: "/admin/applications" },
  { name: "Campaign Monitor", icon: Radio, path: "/admin/campaigns" },
];

export const AdminBottomNav = () => {
  const location = useLocation();
  const { toggleMobileSidebar } = useSidebar();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["queued", "pending_review"]);
      setPending(count || 0);
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/admin/dashboard" && location.pathname === "/admin");

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-[900] border-t ${T.hairline}
                  bg-white/95 backdrop-blur dark:bg-[#1A1A19]/95 lg:hidden`}
      // Keeps the bar clear of the iOS home indicator.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex flex-col items-center gap-1 px-1 pb-2 pt-2.5"
              >
                <span
                  className={`relative grid h-8 w-full max-w-[56px] place-items-center rounded-xl
                              transition-colors ${
                                active
                                  ? "bg-[#2a78d6]/[0.10] text-[#2a78d6] dark:bg-[#3987e5]/15 dark:text-[#3987e5]"
                                  : T.muted
                              }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  {item.badge && pending > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-[15px] min-w-[15px] place-items-center
                                     rounded-full bg-[#D03B3B] px-1 text-[9px] font-bold text-white">
                      {pending > 99 ? "99+" : pending}
                    </span>
                  )}
                </span>
                <span
                  className={`w-full truncate text-center text-[10px] leading-tight ${
                    active ? `font-semibold ${T.ink}` : T.muted
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="More sections"
            className="flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5"
          >
            <span className={`grid h-8 w-full max-w-[56px] place-items-center rounded-xl ${T.muted}`}>
              <MoreHorizontal size={18} strokeWidth={1.8} />
            </span>
            <span className={`text-[10px] leading-tight ${T.muted}`}>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default AdminBottomNav;
