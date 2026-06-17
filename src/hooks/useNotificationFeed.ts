import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignNotification {
  id: string;
  user_id: string;
  campaign_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

// Persistent notification feed for the bell dropdown.
// (Separate from the admin toast hook in useNotifications.ts — this one
//  keeps the list + unread count and never auto-marks-read on load.)
export function useNotificationFeed(userId: string | undefined) {
  const [notifications, setNotifications] = useState<CampaignNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("campaign_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();

    const channel = supabase
      .channel(`notif-feed-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "campaign_notifications", filter: `user_id=eq.${userId}` },
        (payload) =>
          setNotifications((prev) =>
            prev.some((n) => n.id === (payload.new as CampaignNotification).id)
              ? prev
              : [payload.new as CampaignNotification, ...prev]
          )
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("campaign_notifications").update({ read: true }).eq("id", id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("campaign_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: load };
}