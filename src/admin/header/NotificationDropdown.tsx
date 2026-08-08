import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell, BellOff, FileText, UserPlus, CheckCircle2, AlertTriangle,
  MessageSquare, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown } from "../ui/Dropdown";
import { DropdownItem } from "../ui/DropdownItem";
import { supabase } from "@/integrations/supabase/client";
import { T } from "@/admin/ui/system";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

/** Neutral tiles — the title carries the meaning, the glyph is a hint. */
const typeIcons: Record<string, React.ElementType> = {
  new_application: FileText,
  new_user: UserPlus,
  campaign_complete: CheckCircle2,
  campaign_failed: AlertTriangle,
  support_message: MessageSquare,
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("[Notifications] query failed:", error);
        return;
      }
      setNotifications(data || []);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        // dropdown-toggle exempts this from Dropdown's outside-click handler.
        className={`dropdown-toggle relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                    transition-colors hover:bg-[#F4F4F2] hover:text-[#111110]
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

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        // Below sm the panel is wider than the space to the left of the bell,
        // so anchoring it to the trigger pushes it off-screen. It breaks out to
        // fixed positioning and spans the viewport with a gutter instead.
        className={`fixed left-3 right-3 top-[58px] mt-0 flex max-h-[72vh] w-auto flex-col
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
                onClick={markAllRead}
                className={`rounded-md px-2 py-1 text-[11.5px] font-medium ${T.ink2}
                            transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                {/* Shortened below sm so it can't push the close button out. */}
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Read all</span>
              </button>
            )}
            <button
              onClick={closeDropdown}
              aria-label="Close"
              className={`grid h-6 w-6 place-items-center rounded-md ${T.muted}
                          transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* List */}
        <ul className={`custom-scrollbar flex-1 divide-y overflow-y-auto ${T.divide}`}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-48 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </li>
            ))
          ) : notifications.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#F4F4F2] text-[#9A9995] dark:bg-white/5">
                <BellOff size={18} />
              </span>
              <p className={`text-[13px] font-semibold ${T.ink}`}>No notifications yet</p>
              <p className={`mt-1 text-[11.5px] ${T.muted}`}>
                New applications and events appear here
              </p>
            </li>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <li key={n.id}>
                  <DropdownItem
                    onItemClick={() => {
                      markRead(n.id);
                      closeDropdown();
                    }}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${T.hover} ${
                      !n.is_read ? "bg-[#2a78d6]/[0.04] dark:bg-[#3987e5]/[0.07]" : ""
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F4F4F2] text-[#6B6A66] dark:bg-white/5 dark:text-[#C3C2B7]">
                      <Icon size={14} />
                    </span>

                    <span className="block min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
                          />
                        )}
                      </span>
                      <span className={`mt-0.5 block line-clamp-2 text-[11.5px] leading-relaxed ${T.ink2}`}>
                        {n.message}
                      </span>
                      <span className={`mt-1 block text-[10.5px] ${T.muted}`}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer */}
        <div className={`border-t ${T.hairline} p-2`}>
          <Link
            to="/admin/notifications"
            onClick={closeDropdown}
            className={`block rounded-lg px-3 py-2 text-center text-[12px] font-semibold ${T.ink}
                        transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            View all notifications
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
