import { useState, useRef, useEffect, useCallback } from "react";
import { userRequest, publicRequest } from "../../requestMethods";
import { useAuth } from "../../context/AuthContext";
import { FaTimes, FaPaperPlane, FaTrash, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";

// ── Tin nhắn chào mừng mặc định ───────────────────────────────────────────────
const WELCOME_MESSAGE = {
  sender: "bot",
  text: "Xin chào! 👋 Mình là **Sứ Giả Ong Mật** – trợ lý tư vấn của **BookBee**.\n\nBạn có thể chọn các gợi ý bên dưới hoặc hỏi bất cứ cuốn sách nào bạn quan tâm nhé!",
};

// ── Quick Replies (Gợi ý câu hỏi) ──────────────────────────────────────────────
const QUICK_REPLIES = [
  "🔥 Top sách bán chạy nhất",
  "🆕 Sách mới ra mắt",
  "💰 Tư vấn sách dưới 100k",
  "🧠 Gợi ý sách phát triển bản thân & tư duy",
];

// ── Sinh sessionId cho khách vãng lai (lưu localStorage) ──────────────────────
const getGuestSessionId = () => {
  const KEY = "bookbee_chat_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "guest_" + crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
};

// ── Format markdown đơn giản ──────────────────────────────────────────────────
const formatMessage = (text) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
};

// ── Format tiền tệ ───────────────────────────────────────────────────────────
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
};

const ChatWidget = () => {
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Chọn request instance: user đã login dùng userRequest (có cookie), guest dùng publicRequest
  const apiRequest = currentUser ? userRequest : publicRequest;

  // ── Tải lịch sử chat khi mở widget lần đầu ─────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;

    try {
      const params = {};
      if (!currentUser) {
        params.sessionId = getGuestSessionId();
      }

      const res = await apiRequest.get("/chatbot/history", { params });
      const history = res.data.messages || [];

      if (history.length > 0) {
        // Có lịch sử → hiển thị (thêm welcome message ở đầu)
        setMessages([WELCOME_MESSAGE, ...history]);
      }
    } catch (error) {
      console.error("Load chat history error:", error);
    } finally {
      setHistoryLoaded(true);
    }
  }, [currentUser, historyLoaded, apiRequest]);

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus vào input + load history khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setShowPulse(false);
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Reset history loaded khi user login/logout (thay đổi context)
  useEffect(() => {
    setHistoryLoaded(false);
    setMessages([WELCOME_MESSAGE]);
  }, [currentUser?._id]);

  // ── Gửi tin nhắn ───────────────────────────────────────────────────────────
  const handleSend = async (textToSend = inputValue) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const payload = { message: trimmed };

      // Gửi sessionId cho khách vãng lai
      if (!currentUser) {
        payload.sessionId = getGuestSessionId();
      }

      const res = await apiRequest.post("/chatbot/ask", payload);
      
      // Bot message có kèm mảng books
      const botMsg = { 
        sender: "bot", 
        text: res.data.reply,
        books: res.data.books || [] // Dữ liệu sách trả về từ backend
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorText =
        error.response?.data?.message ||
        "Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé! 🙏";
      setMessages((prev) => [...prev, { sender: "bot", text: errorText }]);
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

  // ── Xóa lịch sử hiển thị (reset về welcome) ───────────────────────────────
  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <>
      {/* ═══ FLOATING ACTION BUTTON (FAB) ═══ */}
      <button
        id="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500"
        aria-label="Mở chatbot tư vấn"
      >
        {isOpen ? (
          <FaTimes className="text-white text-xl" />
        ) : (
          <>
            {/* Chatbot Avatar Logo */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
              <img src="/logochatbot.png" alt="Chatbot" className="w-full h-full object-cover" />
            </div>
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-400"></span>
              </span>
            )}
          </>
        )}
      </button>

      {/* ═══ CHAT WINDOW ═══ */}
      <div
        className={`fixed bottom-24 right-6 z-[9998] w-[370px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right flex flex-col ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{
          maxHeight: "min(650px, calc(100vh - 120px))",
        }}
      >
        <div
          className="flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white"
          style={{ height: "min(650px, calc(100vh - 120px))" }}
        >
          {/* ── HEADER ── */}
          <div
            className="flex items-center gap-3 px-5 py-4 text-white shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm z-10"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden border-2 border-white/30 shadow-sm">
                <img src="/logochatbot.png" alt="Bot" className="w-full h-full object-cover bg-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm leading-tight">Sứ Giả Ong Mật</h3>
              <p className="text-[11px] text-white/90 font-medium">
                {currentUser ? `👤 ${currentUser.fullname}` : "Khách vãng lai"} • AI 24/7
              </p>
            </div>
            <button
              onClick={handleClearChat}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Xóa cuộc trò chuyện"
            >
              <FaTrash className="text-xs" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* ── MESSAGES ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} w-full`}>
                  {msg.sender === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs mr-2 mt-1 shrink-0 overflow-hidden shadow-sm border border-slate-200">
                      <img src="/logochatbot.png" alt="Bot" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={`max-w-[85%] flex flex-col gap-3 px-4 py-3 text-[13px] leading-relaxed rounded-2xl shadow-sm overflow-hidden ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-slate-200 rounded-bl-sm"
                  }`}>
                    {(() => {
                      if (msg.sender === "user" || !msg.books || msg.books.length === 0) {
                        return <div className="text-justify" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />;
                      }

                      // Split msg.text by [BOOKID: ...]
                      const regex = /\[BOOKID:\s*([a-zA-Z0-9_]+)\]/g;
                      const parts = [];
                      let lastIndex = 0;
                      let match;

                      while ((match = regex.exec(msg.text)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push({ type: 'text', content: msg.text.substring(lastIndex, match.index) });
                        }
                        const bookId = match[1];
                        const book = msg.books.find(b => b._id === bookId);
                        if (book) {
                          parts.push({ type: 'book', book });
                        }
                        lastIndex = regex.lastIndex;
                      }
                      
                      if (lastIndex < msg.text.length) {
                        parts.push({ type: 'text', content: msg.text.substring(lastIndex) });
                      }

                      // Fallback: Nếu AI quên chèn [BOOKID], render Carousel cũ
                      const hasBookTokens = parts.some(p => p.type === 'book');
                      if (!hasBookTokens) {
                        return (
                          <>
                            <div className="text-justify" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent w-full">
                              {msg.books.map((book) => (
                                <div key={book._id} className="w-[140px] shrink-0 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
                                  <div className="h-[120px] w-full flex items-center justify-center bg-white overflow-hidden p-2">
                                    <img src={book.img} alt={book.title} className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-400" />
                                  </div>
                                  <div className="p-2.5 flex flex-col flex-1 border-t border-slate-100">
                                    <h4 className="text-[11px] font-bold text-slate-700 line-clamp-2 leading-tight mb-2 group-hover:text-orange-600 transition-colors h-[32px]" title={book.title}>
                                      {book.title}
                                    </h4>
                                    <div className="mt-auto">
                                      {book.discountedPrice > 0 ? (
                                        <div className="flex items-end gap-1 flex-wrap">
                                          <span className="text-orange-600 font-extrabold text-[13px]">{formatPrice(book.discountedPrice)}</span>
                                          <span className="text-slate-400 line-through text-[9px] mb-[1.5px]">{formatPrice(book.originalPrice)}</span>
                                        </div>
                                      ) : (
                                        <span className="text-orange-600 font-extrabold text-[13px]">{formatPrice(book.originalPrice)}</span>
                                      )}
                                      <Link 
                                        to={`/product/${book._id}`} 
                                        onClick={() => {
                                          if (currentUser) {
                                            userRequest.post("/interactions", {
                                              productId: book._id,
                                              interactionType: "search_click",
                                              source: "chatbot"
                                            }).catch(() => {});
                                          }
                                        }}
                                        className="mt-2 w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-md active:scale-95 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                                      >
                                        Xem ngay <FaChevronRight className="text-[8px]" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      }

                      // NẾU CÓ [BOOKID]: Render xen kẽ Text và Book Card
                      return (
                        <div className="flex flex-col gap-1 w-full">
                          {parts.map((part, idx) => {
                            if (part.type === 'text') {
                              return <div key={`txt-${idx}`} className="text-justify" dangerouslySetInnerHTML={{ __html: formatMessage(part.content) }} />;
                            } else {
                              const book = part.book;
                              return (
                                <div key={`bk-${idx}`} className="my-2 w-full max-w-[200px] shrink-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 group self-center sm:self-start">
                                  <div className="h-[160px] w-full flex items-center justify-center bg-white overflow-hidden p-3">
                                    <img src={book.img} alt={book.title} className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-400" />
                                  </div>
                                  <div className="p-3 flex flex-col flex-1 border-t border-slate-100">
                                    <h4 className="text-[12px] font-bold text-slate-700 line-clamp-2 leading-tight mb-2 group-hover:text-orange-600 transition-colors h-[34px]" title={book.title}>
                                      {book.title}
                                    </h4>
                                    <div className="mt-auto">
                                      {book.discountedPrice > 0 ? (
                                        <div className="flex items-end gap-1 flex-wrap">
                                          <span className="text-orange-600 font-extrabold text-[14px]">{formatPrice(book.discountedPrice)}</span>
                                          <span className="text-slate-400 line-through text-[10px] mb-[1.5px]">{formatPrice(book.originalPrice)}</span>
                                        </div>
                                      ) : (
                                        <span className="text-orange-600 font-extrabold text-[14px]">{formatPrice(book.originalPrice)}</span>
                                      )}
                                      <Link 
                                        to={`/product/${book._id}`} 
                                        onClick={() => {
                                          if (currentUser) {
                                            userRequest.post("/interactions", {
                                              productId: book._id,
                                              interactionType: "search_click",
                                              source: "chatbot"
                                            }).catch(() => {});
                                          }
                                        }}
                                        className="mt-3 w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-md active:scale-95 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                                      >
                                        Xem ngay <FaChevronRight className="text-[10px]" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs mr-2 mt-1 shrink-0 overflow-hidden shadow-sm border border-slate-200">
                  <img src="/logochatbot.png" alt="Bot" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-xs text-slate-400 ml-1 font-medium">Bee đang tìm sách...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── QUICK REPLIES BAR ── */}
          {showQuickReplies && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 relative">
              <button 
                onClick={() => setShowQuickReplies(false)} 
                className="absolute top-1.5 right-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-1 z-10"
                title="Đóng gợi ý"
              >
                <FaTimes size={12} />
              </button>
              <div className="flex flex-wrap gap-2 pr-6 justify-start">
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(reply)}
                    className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 text-[12px] font-medium rounded-full hover:bg-orange-50 transition-colors shadow-sm"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── INPUT BAR ── */}
          <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tên sách, thể loại..."
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-60 placeholder:text-slate-400 font-medium shadow-inner"
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 shrink-0 shadow-sm ${
                  !inputValue.trim() || isLoading
                    ? "bg-slate-200 opacity-60 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
              Powered by BookBee AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
