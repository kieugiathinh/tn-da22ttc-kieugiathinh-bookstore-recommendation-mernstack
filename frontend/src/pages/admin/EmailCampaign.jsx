import { useState, useEffect } from "react";
import { 
  FaPaperPlane, 
  FaEnvelopeOpenText, 
  FaUsers,
  FaCheckCircle 
} from "react-icons/fa";
import { toast } from "react-toastify";
import { userRequest } from "../../requestMethods";

const EmailCampaign = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    target: "all",
    specificEmails: []
  });

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await userRequest.get("/newsletter/subscribers");
        setSubscribers(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách người đăng ký");
      } finally {
        setFetching(false);
      }
    };
    fetchSubscribers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailSelection = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, specificEmails: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.target === "specific" && formData.specificEmails.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 email để gửi");
      return;
    }

    // Wrap the content inside basic HTML so it looks good if it's plain text
    const finalContent = formData.content.replace(/\\n/g, "<br>");

    try {
      setLoading(true);
      const res = await userRequest.post("/newsletter/send-campaign", {
        ...formData,
        content: finalContent
      });
      toast.success(res.data.message);
      setFormData({ ...formData, subject: "", content: "", specificEmails: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaEnvelopeOpenText className="text-orange-500" />
            Email Marketing
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gửi thông báo, khuyến mãi hoặc bản tin đến khách hàng của bạn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Form Soạn Thảo */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Soạn thảo Chiến dịch</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiêu đề Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Ví dụ: 🔥 [BookBee] Khuyến Mãi Khủng Cuối Tuần!"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nội dung Email (Hỗ trợ text cơ bản) <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={10}
                placeholder="Nhập nội dung email..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-y"
                required
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all shadow-sm
                  ${loading 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-orange-600 hover:bg-orange-700 hover:shadow"
                  }`}
              >
                <FaPaperPlane size={14} />
                {loading ? "Đang gửi..." : "Gửi Email"}
              </button>
            </div>
          </form>
        </div>

        {/* Cột phải: Target & Danh sách Subscriber */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Đối tượng nhận</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="target"
                  value="all"
                  checked={formData.target === "all"}
                  onChange={handleChange}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800">Tất cả người đăng ký</span>
                  <span className="text-xs text-slate-500">Gửi đến toàn bộ danh sách khách hàng</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="target"
                  value="specific"
                  checked={formData.target === "specific"}
                  onChange={handleChange}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800">Chọn tùy chỉnh</span>
                  <span className="text-xs text-slate-500">Gửi đến các email cụ thể</span>
                </div>
              </label>

              {formData.target === "specific" && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Chọn các email (Giữ Ctrl/Cmd để chọn nhiều)
                  </label>
                  <select
                    multiple
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    size={6}
                    onChange={handleEmailSelection}
                  >
                    {subscribers.map((sub) => (
                      <option key={sub._id} value={sub.email}>
                        {sub.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-sm border border-slate-700 overflow-hidden text-white">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Tổng Subcribers</p>
                <h3 className="text-3xl font-bold flex items-center gap-2">
                  <FaUsers className="text-orange-500 opacity-80" />
                  {fetching ? "..." : subscribers.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center border border-slate-600">
                <FaCheckCircle className="text-emerald-400" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCampaign;
