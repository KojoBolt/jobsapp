import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Rocket, PartyPopper, FileCheck2, Check, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationFeed } from "@/hooks/useNotificationFeed";
import { T } from "@/admin/ui/system";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * The feed carries free-text messages rather than a type column, so the glyph is
 * inferred from the wording. Neutral tiles, as in the admin dropdown — the
 * message carries the meaning and the icon is only a hint.
 */
function iconFor(message: string) {
  if (message.includes("ready for review")) return FileCheck2;
  if (message.includes("launched") || message.includes("live")) return Rocket;
  if (message.includes("All done") || message.includes("ready in your dashboard")) return PartyPopper;
  return Bell;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const hookResult = useNotificationFeed(user?.id);
  const notifications = hookResult?.notifications || [];
  const unreadCount = hookResult?.unreadCount || 0;
  const markAsRead = hookResult?.markAsRead || (() => {});
  const markAllAsRead = hookResult?.markAllAsRead || (() => {});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside the panel.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Escape closes, matching the header's other dropdowns.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* 32px bordered shell, so it sits on the same control rhythm as the
          theme toggle and user dropdown beside it. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline}
                    ${T.ink2} transition-colors hover:bg-[#F4F4F2] hover:text-[#111110]
                    dark:hover:bg-white/5 dark:hover:text-white`}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#D03B3B]
                       ring-2 ring-white dark:ring-[#1A1A19]"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            // Below sm the panel is wider than the space left of the bell, so
            // anchoring to the trigger would push it off-screen. It breaks out
            // to fixed positioning with a gutter instead.
            className={`fixed left-3 right-3 top-[58px] z-[1100] flex max-h-[72vh] w-auto flex-col
                        overflow-hidden rounded-2xl border ${T.hairline} bg-white shadow-xl
                        dark:bg-[#1A1A19]
                        sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2
                        sm:max-h-[460px] sm:w-[360px]`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between gap-2 border-b ${T.hairline} px-4 py-3`}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={`truncate text-[13px] font-bold ${T.ink}`}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="shrink-0 rounded-md bg-[#D03B3B]/10 px-1.5 py-0.5 text-[10.5px] font-bold text-[#B32F2F] dark:bg-[#D03B3B]/15 dark:text-[#EF7A7A]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px]
                                font-medium ${T.ink2} transition-colors hover:bg-[#F4F4F2]
                                dark:hover:bg-white/5`}
                  >
                    <Check size={12} />
                    {/* Shortened below sm so it can't push the close button out. */}
                    <span className="hidden sm:inline">Mark all read</span>
                    <span className="sm:hidden">Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className={`grid h-6 w-6 place-items-center rounded-md ${T.muted}
                              transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* List */}
            <ul className={`flex-1 divide-y overflow-y-auto ${T.divide}`}>
              {notifications.length === 0 ? (
                <li className="px-6 py-12 text-center">
                  <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#F4F4F2] text-[#9A9995] dark:bg-white/5">
                    <BellOff size={18} />
                  </span>
                  <p className={`text-[13px] font-semibold ${T.ink}`}>No notifications yet</p>
                  <p className={`mt-1 text-[11.5px] ${T.muted}`}>
                    Campaign updates and reviewed applications appear here
                  </p>
                </li>
              ) : (
                notifications.map((n) => {
                  const Icon = iconFor(n.message);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.read && markAsRead(n.id)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${T.hover} ${
                          !n.read ? "bg-[#2a78d6]/[0.04] dark:bg-[#3987e5]/[0.07]" : ""
                        }`}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F4F4F2] text-[#6B6A66] dark:bg-white/5 dark:text-[#C3C2B7]">
                          <Icon size={14} />
                        </span>

                        <span className="block min-w-0 flex-1">
                          <span className={`block text-[12.5px] leading-snug ${T.ink}`}>
                            {n.message}
                          </span>
                          <span className={`mt-1 block text-[11px] ${T.muted}`}>
                            {timeAgo(n.created_at)}
                          </span>
                        </span>

                        {!n.read && (
                          <span
                            aria-label="Unread"
                            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
                          />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
