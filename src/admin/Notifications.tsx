import { useState, useEffect } from "react";
import { Bell, AlertCircle, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user_id?: string;
  data?: Record<string, any>;
}

interface NotificationTypeConfig {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const notificationTypeConfig: Record<string, NotificationTypeConfig> = {
  new_application: {
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  new_user: {
    icon: <Bell className="h-5 w-5" />,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  campaign_complete: {
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  campaign_failed: {
    icon: <XCircle className="h-5 w-5" />,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
  support_message: {
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  info: {
    icon: <Bell className="h-5 w-5" />,
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
  },
};

export const Notifications = (): JSX.Element => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
    const subscription = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_notifications",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data as Notification[]);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from("admin_notifications")
        .delete()
        .eq("id", id);

      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAllRead = async () => {
    try {
      const readIds = notifications
        .filter((n) => n.is_read)
        .map((n) => n.id);

      if (readIds.length === 0) return;

      await supabase
        .from("admin_notifications")
        .delete()
        .in("id", readIds);

      setNotifications((prev) => prev.filter((notif) => !notif.is_read));
    } catch (err) {
      console.error("Error clearing read notifications:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const config = notificationTypeConfig[notifications[0]?.type || "info"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.filter((n) => n.is_read).length > 0 && (
          <button
            onClick={clearAllRead}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "text-primary border-b-2 border-primary -mb-1"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "text-primary border-b-2 border-primary -mb-1"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading notifications...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const typeConfig = notificationTypeConfig[notification.type];
            const isExpanded = expanded === notification.id;

            return (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all ${typeConfig.borderColor} ${
                  !notification.is_read ? "bg-white shadow-sm" : typeConfig.bgColor
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  setExpanded(isExpanded ? null : notification.id);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 ${typeConfig.textColor}`}>
                    {typeConfig.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${typeConfig.textColor}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Data */}
                    {isExpanded && notification.data && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                        <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
