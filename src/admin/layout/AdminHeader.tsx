import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Download, PanelLeft, X, Zap } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useAdminActions } from "../context/AdminActionsContext";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "../header/NotificationDropdown";
import UserDropdown from "../header/UserDropdown";
import { T } from "@/admin/ui/system";
import { DateRangeMenu } from "@/admin/ui/DateRangeMenu";

const AdminHeader = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { onExport } = useAdminActions();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () =>
    window.innerWidth >= 1024 ? toggleSidebar() : toggleMobileSidebar();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[1000] w-full border-b ${T.hairline}
                  bg-white/85 backdrop-blur dark:bg-[#1A1A19]/85`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
        {/* Sidebar toggle */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Toggle sidebar"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                      transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
        >
          {isMobileOpen ? <X size={15} /> : <PanelLeft size={15} />}
        </button>

        {/* Brand — the sidebar is off-canvas below lg, so identity lives here. */}
        <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#111110] text-white dark:bg-white dark:text-[#111110]">
            <Zap size={15} strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            <span className={`block truncate text-[13px] font-bold leading-tight ${T.ink}`}>
              JobApp
            </span>
            <span className={`block truncate text-[10.5px] leading-tight ${T.muted}`}>
              Admin Console
            </span>
          </span>
        </Link>

        {/* Search — desktop only; each page carries its own search on mobile. */}
        <div className="relative hidden min-w-0 flex-1 lg:block lg:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9995]"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className={`w-full rounded-lg border ${T.hairline} bg-white py-1.5 pl-8 pr-12 text-[12.5px]
                        ${T.ink} placeholder:text-[#9A9995] focus:outline-none
                        focus:ring-2 focus:ring-[#2a78d6]/30 dark:bg-[#1A1A19]`}
          />
          <kbd
            className={`pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded
                        border ${T.hairline} px-1.5 py-0.5 text-[10px] ${T.muted} sm:block`}
          >
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:inline-flex">
            <DateRangeMenu />
          </span>

          <NotificationDropdown />
          <ThemeToggleButton />

          {/* Only rendered when the current page published an export handler. */}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#111110] px-3 py-1.5
                         text-[12px] font-semibold text-white transition-opacity hover:opacity-90
                         dark:bg-white dark:text-[#111110]"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
