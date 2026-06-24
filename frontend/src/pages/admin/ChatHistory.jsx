import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import { FaEye, FaTimes, FaRobot, FaUser, FaHistory } from "react-icons/fa";
import moment from "moment";
import { toast } from "sonner";
import PageHeader from "../../components/admin/PageHeader";
const ChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await userRequest.get("/analytics/chat-history");
      setSessions(res.data.sessions);
    } catch (error) {
      toast.error("Lỗi lấy lịch sử chat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Lịch sử Chatbot"
        subtitle="Xem lại các đoạn hội thoại của khách hàng với AI"
      />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold">Khách hàng</th>
                <th className="px-6 py-4 font-bold">Tin nhắn cuối</th>
                <th className="px-6 py-4 font-bold">Số tin</th>
                <th className="px-6 py-4 font-bold">Trạng thái</th>
                <th className="px-6 py-4 font-bold">Thời gian</th>
                <th className="px-6 py-4 font-bold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center">Đang tải dữ liệu...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Không có dữ liệu</td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{session.user}</div>
                      {session.email && <div className="text-xs text-gray-500">{session.email}</div>}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      {session.lastMessage || "Chưa có tin nhắn"}
                    </td>
                    <td className="px-6 py-4 font-medium">{session.messagesCount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        session.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {session.status === "active" ? "ĐANG CHAT" : "ĐÃ KẾT THÚC"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {moment(session.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="inline-flex items-center justify-center rounded-lg bg-orange-50 p-2 text-orange-600 hover:bg-orange-100"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết chat */}
      {selectedSession && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Chi tiết phiên chat</h3>
                <p className="text-sm text-gray-500">Khách hàng: {selectedSession.user}</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              {selectedSession.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.sender === "user" ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    {msg.sender === "user" ? <FaUser size={12} /> : <FaRobot size={14} />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.sender === "user" 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-sm" 
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <span className={`block mt-1 text-[10px] ${msg.sender === "user" ? "text-orange-100" : "text-gray-400"}`}>
                      {moment(msg.timestamp).format("HH:mm DD/MM")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
