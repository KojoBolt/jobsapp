import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <div
          className="relative flex items-end"
          onMouseEnter={() => setShowHoverCard(true)}
          onMouseLeave={() => setShowHoverCard(false)}
        >
          <div
            className={`pointer-events-none absolute right-[96px] bottom-2 w-[240px] transition-all duration-300 ${
              showHoverCard
                ? "translate-x-0 opacity-100"
                : "translate-x-3 opacity-0"
            }`}
          >
            <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-lg">
              <h3 className="text-[16px] font-semibold text-gray-900">
                Need help?
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Chat with our AI assistant.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleChat}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#0077b6] to-[#023e8a] shadow-xl transition-transform duration-200 hover:scale-105"
          >
            <MessageCircle className="h-9 w-9 text-white" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-[430px] flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="relative bg-[#023e8a] px-6 py-5 text-white shrink-0">
            <button
              type="button"
              onClick={toggleChat}
              className="absolute right-4 top-4 text-white hover:opacity-80"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#caf0f8]">
                <MessageCircle className="h-6 w-6 text-[#00b4d8]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Hello {displayName},</h2>
                <p className="mt-1 text-sm font-semibold">
                  Welcome to JobApp support!
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {profile?.plan && `Plan: ${profile.plan}`}
                  {profile?.credits_remaining !== undefined &&
                    ` · ${profile.credits_remaining} credits`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick topics */}
          {messages.length <= 1 && (
            <div className="bg-[#f3f3f3] px-5 py-4 shrink-0 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                Quick topics
              </p>
              <div className="flex flex-wrap gap-2">
                {quickTopics.slice(0, showAllTopics ? quickTopics.length : 3).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => sendMessage(item)}
                    className="rounded-full bg-[#e7e7e7] px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-orange-100 hover:text-orange-700"
                  >
                    {item}
                  </button>
                ))}
              </div>
              {quickTopics.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllTopics(!showAllTopics)}
                  className="mt-3 text-xs font-semibold text-[#023e8a] hover:text-[#0077b6] transition-colors"
                >
                  {showAllTopics ? "View Less" : "View More"}
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[200px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#023e8a] text-white rounded-br-sm"
                      : "bg-[#f3f3f3] text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Action button if present */}
                {msg.action && (
                  <button
                    onClick={() => handleAction(msg.action!)}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-[#023e8a] text-white text-xs font-semibold rounded-full hover:bg-orange-600 transition-colors"
                  >
                    {msg.action.message}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f3f3] rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-[#f3f3f3] px-5 py-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="text-[#00b4d8] hover:text-[#90e0ef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;