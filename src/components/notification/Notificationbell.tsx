import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationFeed } from "@/hooks/useNotificationFeed";
import { CheckCircle2, Rocket, PartyPopper, Check } from "lucide-react";
import { FaFileCircleCheck } from "react-icons/fa6";
import CheckImg from "@/assets/images/check.png";




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

function iconFor(message: string) {
  if (message.includes("ready for review")) return <img src={CheckImg} alt="check" className="h-4 w-4" />;
  if (message.includes("launched") || message.includes("live")) return <Rocket className="h-4 w-4 text-primary" />;
  if (message.includes("All done") || message.includes("ready in your dashboard")) return <PartyPopper className="h-4 w-4 text-amber-400" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border/50 bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`flex w-full gap-3 border-b border-border/20 px-4 py-3 text-left transition-colors hover:bg-muted/30 ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    {iconFor(n.message)}
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;