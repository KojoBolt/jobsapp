import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const quickTopics: string[] = [
  "Why is my application still queued?",
  "How do I start deploying jobs?",
  "I ran out of credits — what now?",
  "What does 'pending review' mean?",
  "How do I update my job preferences?",
  "Will the cover letters sound like me?",
  "How long does approval take?",
];

interface Action {
  action: "navigate";
  to: string;
  message: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: Action | null;
}

const ChatWidget = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showHoverCard, setShowHoverCard] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { dark } = useRamp();

  const accent = dark ? CHART.accentDark : CHART.accent;

  const displayName =
    profile?.display_name ||
    profile?.full_name?.split(" ")[0] ||
    "there";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = (): void => {
    setIsOpen((prev) => !prev);
    setShowHoverCard(false);

    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi ${displayName}! 👋 I'm your JobApp assistant. How can I help you today?`,
        },
      ]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/chat-support`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userContext: {
              name: profile?.full_name || "",
              plan: profile?.plan || "free",
              credits: profile?.credits_remaining || 0,
              hasResume: true,
              hasIdentityVault: true,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get response");

      // Add assistant message with action if present
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          action: data.action || null,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again or email support@jobapp.com.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: Action) => {
    navigate(action.to);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    /* z-40, not z-50: the mobile sidebar drawer is a z-50 Sheet and this
       widget renders after it in DashboardLayout, so at z-50 the launcher
       floated on top of the open navigation. Modals sit at z-[1900] and
       correctly cover this. */
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      {!isOpen && (
        <div
          className="relative flex items-end"
          onMouseEnter={() => setShowHoverCard(true)}
          onMouseLeave={() => setShowHoverCard(false)}
        >
          {/* Hover-only, so it's hidden on touch where it can never appear. */}
          <div
            className={`pointer-events-none absolute bottom-1 right-[68px] hidden w-[220px]
                        transition-all duration-200 sm:block ${
                          showHoverCard
                            ? "translate-x-0 opacity-100"
                            : "translate-x-2 opacity-0"
                        }`}
          >
            <div
              className={`rounded-2xl border ${T.hairline} bg-white px-4 py-3 shadow-lg
                          dark:bg-[#1A1A19]`}
            >
              <h3 className={`text-[13px] font-bold ${T.ink}`}>Need help?</h3>
              <p className={`mt-0.5 text-[11.5px] ${T.muted}`}>
                Chat with our AI assistant.
              </p>
            </div>
          </div>

          {/* 56px, down from 80px — the old launcher covered a large corner of
              the page, including the application feed's pagination. */}
          <button
            type="button"
            onClick={toggleChat}
            aria-label="Open support chat"
            className="grid h-14 w-14 place-items-center rounded-full text-white shadow-lg
                       transition-transform duration-200 hover:scale-105
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ backgroundColor: accent }}
          >
            <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
          </button>
        </div>
      )}

      {isOpen && (
        /* Width is viewport-relative first: at a fixed 360px the panel ran off
           the left edge of a 360px phone. Height is capped against the viewport
           so a short window can't push the header off the top of the screen. */
        <div
          className={`flex w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden
                      rounded-2xl border ${T.hairline} bg-white shadow-2xl
                      max-h-[min(600px,calc(100vh-7rem))] sm:max-w-[420px]
                      dark:bg-[#1A1A19]`}
        >
          {/* Header */}
          <div className={`relative shrink-0 border-b ${T.hairline} px-5 py-4`}>
            <button
              type="button"
              onClick={toggleChat}
              aria-label="Close support chat"
              className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg
                          ${T.ink2} transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: `${accent}1A`, color: accent }}
              >
                <MessageCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className={`truncate text-[14px] font-bold ${T.ink}`}>
                  Hello {displayName}
                </h2>
                <p className={`text-[11.5px] ${T.muted}`}>
                  {profile?.plan && `Plan: ${profile.plan}`}
                  {profile?.credits_remaining !== undefined &&
                    ` · ${profile.credits_remaining} credits`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick topics */}
          {messages.length <= 1 && (
            <div className={`shrink-0 border-b ${T.hairline} px-5 py-3.5`}>
              <p
                className={`mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}
              >
                Quick topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickTopics.slice(0, showAllTopics ? quickTopics.length : 3).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => sendMessage(item)}
                    className={`rounded-full border ${T.hairline} px-2.5 py-1 text-[11.5px]
                                font-medium ${T.ink2} transition-colors hover:bg-[#F4F4F2]
                                dark:hover:bg-white/5`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {quickTopics.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllTopics(!showAllTopics)}
                  className="mt-2.5 text-[11.5px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: accent }}
                >
                  {showAllTopics ? "View less" : "View more"}
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="min-h-[180px] flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-[#111110] text-white dark:bg-white dark:text-[#111110]"
                      : `rounded-bl-sm bg-[#F4F4F2] ${T.ink2} dark:bg-white/[0.06]`
                  }`}
                >
                  {msg.content}
                </div>

                {/* Action button if present */}
                {msg.action && (
                  <button
                    onClick={() => handleAction(msg.action!)}
                    className="mt-1.5 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px]
                               font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    {msg.action.message}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#F4F4F2] px-3.5 py-2.5 dark:bg-white/[0.06]">
                  <Loader2 className={`h-3.5 w-3.5 animate-spin ${T.muted}`} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`shrink-0 border-t ${T.hairline} px-4 py-3`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                disabled={loading}
                aria-label="Message"
                className={`min-w-0 flex-1 rounded-lg border ${T.hairline} bg-[#FAFAF8] px-3 py-2
                            text-[12.5px] ${T.ink} outline-none placeholder:text-[#9A9995]
                            focus:border-[#C9C8C2] disabled:opacity-50
                            dark:bg-white/[0.03] dark:focus:border-white/25`}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white
                           transition-opacity hover:opacity-90 disabled:cursor-not-allowed
                           disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;