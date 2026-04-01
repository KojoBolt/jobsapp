import { useState } from "react";
import { MessageCircle, X, Paperclip } from "lucide-react";

const quickTopics: string[] = [
  "domain",
  "DNS",
  "email",
  "SSL",
  "Namecheap account",
  "apps",
  "hosting",
  "hosting technical",
  "cPanel/WHM",
  "billing",
  "abuse",
  "EasyWP",
  "SiteLock",
];

const ChatWidget = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showHoverCard, setShowHoverCard] = useState<boolean>(false);

  const toggleChat = (): void => {
    setIsOpen((prev) => !prev);
    setShowHoverCard(false);
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
                Chat with our support team.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleChat}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-orange-300 to-orange-500 shadow-xl transition-transform duration-200 hover:scale-105"
          >
            <MessageCircle className="h-9 w-9 text-white" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-[430px]">
          <div className="relative bg-[#f46b2f] px-6 py-5 text-white">
            <button
              type="button"
              onClick={toggleChat}
              className="absolute right-4 top-4 text-white hover:opacity-80"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-200">
                <MessageCircle className="h-6 w-6 text-orange-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">Hello David Dadzie,</h2>
                <p className="mt-5 text-lg font-semibold">
                  Welcome to our live chat!
                </p>
                <p className="text-lg font-semibold">
                  Start chatting with us - we will be happy to help.
                </p>

                <button type="button" className="mt-2 font-semibold underline">
                  My details
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#f3f3f3] px-5 py-5">
            <div className="flex flex-wrap gap-3">
              {quickTopics.map((item: string) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full bg-[#e7e7e7] px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#dddddd]"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="my-6 border-t border-gray-300" />

            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="What can we help you with?"
                className="w-full bg-transparent text-[18px] text-gray-700 outline-none placeholder:text-gray-500"
              />
              <button
                type="button"
                className="text-gray-700 hover:text-black"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;