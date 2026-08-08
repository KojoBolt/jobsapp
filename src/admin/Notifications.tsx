import React, { useState, useEffect, useMemo } from "react";
import {
  Bell, BellOff, FileText, UserPlus, CheckCircle2, AlertTriangle,
  MessageSquare, Trash2, CheckCheck,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import {
  T, Panel, TabBar, GhostButton, EmptyState, ConfirmDialog, Pagination, CHART,
} from "@/admin/ui/system";

const PAGE_SIZE = 10;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user_id?: string;
}

/**
 * Per-type presentation. `fallback` is load-bearing: an unrecognised type used
 * to return undefined here and the row crashed on the first property access.
 */
type TypeConfig = { icon: React.ElementType; tone: string; label: string };

const TYPE_CONFIG: Record<string, TypeConfig> = {
  new_application:   { icon: FileText,      tone: CHART.axis,     label: "Application" },
  new_user:          { icon: UserPlus,      tone: CHART.good,     label: "New user" },
  campaign_complete: { icon: CheckCircle2,  tone: CHART.good,     label: "Campaign" },
  campaign_failed:   { icon: AlertTriangle, tone: CHART.critical, label: "Campaign" },
  support_message:   { icon: MessageSquare, tone: CHART.warning,  label: "Support" },
  info:              { icon: Bell,          tone: CHART.axis,     label: "Info" },
};

const FALLBACK: TypeConfig = { icon: Bell, tone: CHART.axis, label: "Notification" };
const configFor = (type: string): TypeConfig => TYPE_CONFIG[type] ?? FALLBACK;

export const Notifications = (): JSX.Element => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    fetchNotifications();

    // Distinct topic from the header dropdown's channel — two channels sharing
    // one name fight over the same subscription.
    const channel = supabase
      .channel("admin_notifications_page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[Notifications] query failed:", error);
        setLoadError(error.message || "Failed to load notifications");
        return;
      }

      setNotifications((data as Notification[]) || []);
    } catch (err: any) {
      console.error("[Notifications] unexpected error:", err);
      setLoadError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      pushToast({ variant: "error", title: "Error", message: error.message });
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      pushToast({ variant: "error", title: "Error", message: error.message });
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id)); // optimistic

    const { error } = await supabase.from("admin_notifications").delete().eq("id", id);

    if (error) {
      setNotifications(previous); // put it back — the delete didn't happen
      pushToast({ variant: "error", title: "Error", message: error.message });
    }
  };

  const clearAllRead = async () => {
    const readIds = notifications.filter((n) => n.is_read).map((n) => n.id);
    if (readIds.length === 0) return;

    setClearing(true);
    try {
      const { error } = await supabase.from("admin_notifications").delete().in("id", readIds);

      if (error) {
        pushToast({ variant: "error", title: "Error", message: error.message });
        return;
      }

      setNotifications((prev) => prev.filter((n) => !n.is_read));
      pushToast({
        variant: "success",
        title: "Cleared",
        message: `${readIds.length} notification${readIds.length === 1 ? "" : "s"} removed.`,
      });
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter],
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = visible.slice(start, start + PAGE_SIZE);

  // Deleting or clearing can shrink the list out from under the current page —
  // and marking one read empties a page on the Unread tab. Pull back in range.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Notifications</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading
              ? "Loading…"
              : `${notifications.length} recent · ${unreadCount} unread`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <GhostButton onClick={markAllRead}>
              <CheckCheck size={13} /> Mark all read
            </GhostButton>
          )}
          {readCount > 0 && (
            <GhostButton onClick={() => setConfirmClear(true)}>
              <Trash2 size={13} /> Clear read ({readCount})
            </GhostButton>
          )}
        </div>
      </div>

      <TabBar
        tabs={[
          // `as const` so TabBar's generic infers the union, not `string`.
          { key: "all" as const, label: "All", count: notifications.length },
          { key: "unread" as const, label: "Unread", count: unreadCount },
        ]}
        active={filter}
        // Wrapped, not passed directly: a setState dispatcher also accepts an
        // updater function, which defeats TabBar's generic inference.
        onChange={(k) => { setFilter(k); setPage(1); }}
      />

      {/* ── List ────────────────────────────────────────────────────────── */}
      <Panel className="overflow-hidden">
        {loading ? (
          <div className={`divide-y ${T.divide}`}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 px-5 py-4">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-64 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load notifications" hint={loadError} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={filter === "unread" ? "Nothing unread" : "No notifications yet"}
            hint={
              filter === "unread"
                ? "You're all caught up."
                : "New applications and campaign events appear here."
            }
          />
        ) : (
          <ul className={`divide-y ${T.divide}`}>
            {paged.map((n) => {
              const cfg = configFor(n.type);
              const Icon = cfg.icon;

              return (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`group flex gap-3 px-5 py-3.5 transition-colors ${T.hover} ${
                    !n.is_read ? "cursor-pointer bg-[#2a78d6]/[0.03] dark:bg-[#3987e5]/[0.06]" : ""
                  }`}
                >
                  <span className="relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F4F4F2] text-[#6B6A66] dark:bg-white/5 dark:text-[#C3C2B7]">
                    <Icon size={15} />
                    <span
                      aria-hidden
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-[#1A1A19]"
                      style={{ backgroundColor: cfg.tone }}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[13px] font-semibold ${T.ink}`}>{n.title}</p>
                        <p className={`mt-0.5 text-[12px] leading-relaxed ${T.ink2}`}>{n.message}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!n.is_read && (
                          <span
                            aria-label="Unread"
                            className="h-1.5 w-1.5 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
                          />
                        )}
                        <button
                          aria-label="Delete notification"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className={`grid h-6 w-6 place-items-center rounded-md ${T.muted}
                                      opacity-0 transition-all hover:bg-[#D03B3B]/10 hover:text-[#D03B3B]
                                      focus:opacity-100 group-hover:opacity-100`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                        {cfg.label}
                      </span>
                      <span className={T.muted}>·</span>
                      <span
                        className={`text-[10.5px] ${T.muted}`}
                        title={format(new Date(n.created_at), "d MMM yyyy, HH:mm")}
                      >
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !loadError && visible.length > 0 && (
          <div className={`border-t ${T.hairline} px-5 py-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`hidden text-[12px] sm:block ${T.muted}`}>
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, visible.length)} of{" "}
                {visible.length}
              </p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={confirmClear}
        busy={clearing}
        destructive
        title="Clear read notifications?"
        confirmLabel={`Delete ${readCount}`}
        body={
          <>
            This permanently deletes <strong>{readCount}</strong> read notification
            {readCount === 1 ? "" : "s"}. Unread ones are kept. This cannot be undone.
          </>
        }
        onConfirm={clearAllRead}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
};

export default Notifications;
