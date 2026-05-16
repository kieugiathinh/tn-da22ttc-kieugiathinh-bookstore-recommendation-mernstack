import { useState, useRef, useEffect } from "react";
import { publicRequest } from "../../requestMethods";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import { IoChatbubblesSharp } from "react-icons/io5";

// ── Tin nhắn chào mừng mặc định ───────────────────────────────────────────────
const WELCOME_MESSAGE = {
  sender: "bot",
  text: "Xin chào! 👋 Mình là trợ lý tư vấn của **GTBOOKS**.\n\nBạn muốn tìm sách gì hôm nay? Mình có thể giúp bạn:\n📚 Gợi ý sách theo thể loại\n🔍 Tìm sách theo tên / tác giả\n💰 Tư vấn sách theo ngân sách",
};

// ── Format markdown đơn giản ──────────────────────────────────────────────────
const formatMessage = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus vào input khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setShowPulse(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    // Thêm tin nhắn user
    const userMsg = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await publicRequest.post("/chatbot/ask", {
        message: trimmed,
      });
      const botMsg = {
        sender: "bot",
        text: res.data.reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorText =
        error.response?.data?.message ||
        "Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé! 🙏";
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: errorText },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ═══ FLOATING ACTION BUTTON (FAB) ═══ */}
      <button
        id="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, #c0392b 100%)",
        }}
        aria-label="Mở chatbot tư vấn"
      >
        {isOpen ? (
          <FaTimes className="text-white text-xl" />
        ) : (
          <>
            <IoChatbubblesSharp className="text-white text-2xl" />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-400"></span>
              </span>
            )}
          </>
        )}
      </button>

      {/* ═══ CHAT WINDOW ═══ */}
      <div
        className={`fixed bottom-24 right-6 z-[9998] w-[370px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{
          maxHeight: "min(550px, calc(100vh - 140px))",
        }}
      >
        <div
          className="flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          style={{ height: "min(550px, calc(100vh - 140px))" }}
        >
          {/* ── HEADER ── */}
          <div
            className="flex items-center gap-3 px-5 py-4 text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #c0392b 100%)",
            }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                📚
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm leading-tight">GTBOOKS Assistant</h3>
              <p className="text-[11px] text-white/80">Tư vấn sách 24/7 • Powered by AI</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* ── MESSAGES ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                    📚
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(msg.text),
                  }}
                />
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                  📚
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-xs text-gray-400 ml-1">GTBOOKS đang gõ...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT BAR ── */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về sách bạn quan tâm..."
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60 placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md active:scale-95 shrink-0"
                style={{
                  background: !inputValue.trim() || isLoading
                    ? "#ccc"
                    : "linear-gradient(135deg, var(--color-primary) 0%, #c0392b 100%)",
                }}
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by GTBOOKS AI • Gemini
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
