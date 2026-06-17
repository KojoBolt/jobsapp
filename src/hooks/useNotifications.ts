import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Toasts notifications as they ARRIVE (live), and does NOT mark them read —
// the notification bell (useNotificationFeed) owns read/unread state.
// This replaces the old "query all unread on load + mark all read" version,
// which was zeroing out the bell's unread badge.
export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-toasts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "campaign_notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { message: string };
          toast.success(n.message, {
            duration: 8000,
            action: {
              label: "View",
              onClick: () => (window.location.href = "/dashboard/applications"),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Kept for backward compatibility with any callers reading unreadCount.
  return { unreadCount: 0 };
}