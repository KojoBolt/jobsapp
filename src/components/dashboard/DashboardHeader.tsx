import React from "react";
import { Link } from "react-router-dom";
import { PanelLeft, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { T } from "@/admin/ui/system";
import { ThemeToggleButton } from "@/admin/common/ThemeToggleButton";
import Notification from "@/components/notification/Notificationbell";
import DashboardUserDropdown from "@/components/dashboard/DashboardUserDropdown";
import Logo from "@/assets/images/job-logo.png";

/**
 * Client header, built to the same spec as AdminHeader: sticky translucent bar,
 * a bordered 32px sidebar toggle, the brand shown only below lg (where the rail
 * is off-canvas), and a right-hand control cluster.
 *
 * Toggling still runs through the shadcn sidebar context the layout already
 * provides, so the drawer behaves exactly as before.
 */
const DashboardHeader: React.FC<{ title: string }> = ({ title }) => {
  const { isMobile, openMobile, toggleSidebar } = useSidebar();
  const showClose = isMobile && openMobile;

  return (
    <header
      className={`sticky top-0 z-[1000] w-full border-b ${T.hairline}
                  bg-white/85 backdrop-blur dark:bg-[#1A1A19]/85`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                      transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
        >
          {showClose ? <X size={15} /> : <PanelLeft size={15} />}
        </button>

        {/* Brand — the rail is off-canvas below lg, so identity lives here. */}
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#111110] dark:bg-white">
            <img src={Logo} alt="" className="h-5 w-5 object-contain" />
          </span>
          <span className="min-w-0">
            <span className={`block truncate text-[13px] font-bold leading-tight ${T.ink}`}>
              JobApp
            </span>
            <span className={`block truncate text-[10.5px] leading-tight ${T.muted}`}>
              Client Console
            </span>
          </span>
        </Link>

        {/* Page title sits where the admin puts its global search. */}
        <h1 className={`hidden min-w-0 flex-1 truncate text-[13px] font-semibold lg:block ${T.ink}`}>
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <Notification />
          <ThemeToggleButton />
          <DashboardUserDropdown />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
