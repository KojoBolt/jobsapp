import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Download, PanelLeft, X, Zap, Users2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "../context/SidebarContext";
import { useAdminActions } from "../context/AdminActionsContext";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "../header/NotificationDropdown";
import UserDropdown from "../header/UserDropdown";
import { Dropdown } from "@/admin/ui/Dropdown";
import { T, Avatar } from "@/admin/ui/system";
import { DateRangeMenu } from "@/admin/ui/DateRangeMenu";

type UserHit = { id: string; full_name: string | null; email: string | null };
type AppHit = { id: string; company_name: string | null; job_title: string | null };

/**
 * PostgREST parses `or=(...)` as a comma/parenthesis-delimited expression, so
 * those characters in a raw search term would corrupt the filter rather than
 * being matched literally. Strip them, and the % _ wildcards too.
 */
const sanitize = (s: string) => s.replace(/[,()%_*\\]/g, " ").trim();

const AdminHeader = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { onExport } = useAdminActions();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserHit[]>([]);
  const [apps, setApps] = useState<AppHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () =>
    window.innerWidth >= 1024 ? toggleSidebar() : toggleMobileSidebar();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const term = sanitize(query);
    if (term.length < 2) {
      setUsers([]);
      setApps([]);
      setOpen(false);
      return;
    }

    setOpen(true);
    setSearching(true);

    const t = setTimeout(async () => {
      const [u, a] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
          .limit(4),
        supabase
          .from("applications")
          .select("id, company_name, job_title")
          .or(`company_name.ilike.%${term}%,job_title.ilike.%${term}%`)
          .limit(5),
      ]);

      if (u.error) console.error("[AdminSearch] profiles:", u.error);
      if (a.error) console.error("[AdminSearch] applications:", a.error);

      setUsers((u.data as UserHit[]) || []);
      setApps((a.data as AppHit[]) || []);
      setSearching(false);
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  /** Hand the term to the destination page via ?q= so it lands pre-filtered. */
  const go = (path: string, term = query) => {
    navigate(`${path}?q=${encodeURIComponent(term.trim())}`);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const hasHits = users.length > 0 || apps.length > 0;

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
          {/* dropdown-toggle so clicking the field doesn't dismiss the results. */}
          <div className="dropdown-toggle relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9995]"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => sanitize(query).length >= 2 && setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && sanitize(query).length >= 2) go("/admin/applications");
              }}
              placeholder="Search users, companies, roles…"
              className={`w-full rounded-lg border ${T.hairline} bg-white py-1.5 pl-8 pr-12 text-[12.5px]
                          ${T.ink} placeholder:text-[#9A9995] focus:outline-none
                          focus:ring-2 focus:ring-[#2a78d6]/30 dark:bg-[#1A1A19]`}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className={`absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center
                            rounded ${T.muted} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                <X size={12} />
              </button>
            ) : (
              <kbd
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded
                            border ${T.hairline} px-1.5 py-0.5 text-[10px] ${T.muted}`}
              >
                ⌘K
              </kbd>
            )}
          </div>

          <Dropdown
            isOpen={open}
            onClose={() => setOpen(false)}
            className={`absolute left-0 right-auto mt-2 max-h-[70vh] w-[360px] overflow-y-auto
                        rounded-2xl border ${T.hairline} bg-white p-1.5 shadow-xl dark:bg-[#1A1A19]`}
          >
            {searching && !hasHits ? (
              <p className={`px-3 py-4 text-[12px] ${T.muted}`}>Searching…</p>
            ) : !hasHits ? (
              <p className={`px-3 py-4 text-[12px] ${T.muted}`}>
                No matches for “{query.trim()}”.
              </p>
            ) : (
              <>
                {users.length > 0 && (
                  <>
                    <p className={`px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                      Users
                    </p>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => go("/admin/users", u.full_name || u.email || "")}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left
                                    transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                      >
                        <Avatar name={u.full_name || "?"} size={28} />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[12.5px] font-semibold ${T.ink}`}>
                            {u.full_name || "No name"}
                          </span>
                          <span className={`block truncate text-[11px] ${T.muted}`}>{u.email}</span>
                        </span>
                        <Users2 size={13} className={T.muted} />
                      </button>
                    ))}
                  </>
                )}

                {apps.length > 0 && (
                  <>
                    <p className={`px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                      Applications
                    </p>
                    {apps.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => go("/admin/applications", a.company_name || "")}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left
                                    transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F4F4F2] text-[9.5px] font-bold text-[#6B6A66] dark:bg-white/10 dark:text-[#C3C2B7]">
                          {(a.company_name || "?").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[12.5px] font-semibold ${T.ink}`}>
                            {a.company_name}
                          </span>
                          <span className={`block truncate text-[11px] ${T.muted}`}>{a.job_title}</span>
                        </span>
                        <FileText size={13} className={T.muted} />
                      </button>
                    ))}
                  </>
                )}

                <button
                  onClick={() => go("/admin/applications")}
                  className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border-t
                              ${T.hairline} px-2.5 py-2.5 text-[12px] font-semibold ${T.ink}
                              transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                >
                  See all applications matching “{query.trim()}”
                </button>
              </>
            )}
          </Dropdown>
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
