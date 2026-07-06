import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { useState, useEffect, useMemo } from "react";
import { 
  FaPaperPlane, 
  FaEnvelopeOpenText, 
  FaUsers,
  FaSearch,
  FaCheckSquare,
  FaRegSquare
} from "react-icons/fa";
import { toast } from "sonner";
import { userRequest } from "../../requestMethods";
import PageHeader from "../../components/admin/PageHeader";

const EMAIL_TEMPLATES = {
  custom: {
    subject: "",
    content: "",
  },
  new_product: {
    subject: "🔥 [BookBee] Giới thiệu sản phẩm sách mới cực hot!",
    content: `Xin chào,\n\nBookBee vừa cập nhật một loạt tựa sách mới nhất trên kệ. Bạn hãy nhanh tay vào website để khám phá nhé!\n\nChúng tôi đang có rất nhiều thể loại hấp dẫn đang chờ đón bạn.\n\nTrân trọng,\nĐội ngũ BookBee`,
  },
  flash_sale: {
    subject: "⚡ [BookBee] Cơ hội cuối: Flash Sale giảm đến 50%",
    content: `Chào bạn,\n\nChương trình Flash Sale lớn nhất tháng của BookBee đã chính thức bắt đầu!\n\nHàng ngàn cuốn sách đang được giảm giá cực sốc lên tới 50%. Cơ hội chỉ diễn ra trong vòng 24 giờ. Đừng bỏ lỡ cơ hội sở hữu cuốn sách yêu thích của mình với giá rẻ nhất nhé!\n\nTham gia ngay tại website BookBee!\n\nTrân trọng,\nĐội ngũ BookBee`,
  }
};

const EmailCampaign = () => {
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    target: "subscribers",
    specificEmails: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, usersRes] = await Promise.all([
          userRequest.get("/newsletter/subscribers"),
          userRequest.get("/users")
        ]);
        setSubscribersCount(subRes.data.length);
        setAllUsers(usersRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'subject' || e.target.name === 'content') {
      setSelectedTemplate("custom");
    }
  };

  const handleTemplateChange = (e) => {
    const tpl = e.target.value;
    setSelectedTemplate(tpl);
    setFormData({
      ...formData,
      subject: EMAIL_TEMPLATES[tpl].subject,
      content: EMAIL_TEMPLATES[tpl].content
    });
  };

  const handleTargetChange = (e) => {
    setFormData({ ...formData, target: e.target.value });
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers;
    return allUsers.filter(u => 
      (u.fullname && u.fullname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allUsers, searchQuery]);

  const handleToggleUser = (email) => {
    if (!email) return;
    setFormData(prev => {
      const isSelected = prev.specificEmails.includes(email);
      let newEmails;
      if (isSelected) {
        newEmails = prev.specificEmails.filter(e => e !== email);
      } else {
        newEmails = [...prev.specificEmails, email];
      }
      return { ...prev, specificEmails: newEmails };
    });
  };

  const handleSelectAll = () => {
    const emails = filteredUsers.map(u => u.email).filter(e => e);
    setFormData(prev => ({ 
      ...prev, 
      specificEmails: Array.from(new Set([...prev.specificEmails, ...emails])) 
    }));
  };

  const handleDeselectAll = () => {
    const emailsToRemove = filteredUsers.map(u => u.email).filter(e => e);
    setFormData(prev => ({
      ...prev,
      specificEmails: prev.specificEmails.filter(e => !emailsToRemove.includes(e))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.target === "specific" && formData.specificEmails.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 email để gửi");
      return;
    }

    // Replace newlines with <br> for HTML rendering in email
    const finalContent = formData.content.replace(/\n/g, "<br>");

    try {
      setLoading(true);
      const res = await userRequest.post("/newsletter/send-campaign", {
        ...formData,
        content: finalContent
      });
      toast.success(res.data.message);
      setFormData({ ...formData, subject: "", content: "", specificEmails: [] });
      setSelectedTemplate("custom");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi email");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Chiến Dịch Email Marketing" 
        subtitle="Gửi thông báo, khuyến mãi đến khách hàng" 
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 max-w-[1400px]">
        
        {/* CỘT TRÁI: FORM SOẠN EMAIL (Chiếm 7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-orange-50 to-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <FaEnvelopeOpenText size={14} />
            </div>
            <h2 className="text-base font-bold text-gray-800 tracking-wide">Soạn Nội Dung Email</h2>
          </div>

          <form id="emailForm" onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 flex flex-col">
            {/* Chọn Template */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Mẫu Email (Templates)</label>
              <select 
                value={selectedTemplate} 
                onChange={handleTemplateChange}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all cursor-pointer"
              >
                <option value="custom">-- Tự viết nội dung --</option>
                <option value="new_product">Giới thiệu sản phẩm mới</option>
                <option value="flash_sale">Thông báo Flash Sale</option>
              </select>
            </div>

            {/* Tiêu đề */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Chủ đề Email <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange} 
                required 
                placeholder="Nhập tiêu đề email..."
                className="w-full px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all placeholder:font-normal"
              />
            </div>

            {/* Nội dung */}
            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nội dung <span className="text-red-500">*</span></label>
              <textarea 
                name="content" 
                value={formData.content} 
                onChange={handleChange} 
                required 
                rows={10}
                placeholder="Nhập nội dung email tại đây..."
                className="w-full flex-1 min-h-[250px] px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all leading-relaxed"
              ></textarea>
              <p className="mt-2 text-[11px] font-semibold text-gray-400">
                Lưu ý: Mẫu thiết kế nền và Logo BookBee sẽ được tự động thêm vào khi gửi.
              </p>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: CHỌN ĐỐI TƯỢNG (Chiếm 5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-orange-50 to-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <FaUsers size={14} />
            </div>
            <h2 className="text-base font-bold text-gray-800 tracking-wide">Người Nhận</h2>
          </div>

          <div className="p-6 flex-1 flex flex-col space-y-5">
            {/* Chọn Đối Tượng */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Tùy Chọn Gửi</label>
              <div className="space-y-3">
                <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.target === "subscribers" ? "border-primary bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="target" value="subscribers" checked={formData.target === "subscribers"} onChange={handleTargetChange} className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-gray-800">Người đăng ký nhận tin</span>
                    <span className="block text-xs font-medium text-gray-500">Gửi đến {subscribersCount} email đã đăng ký</span>
                  </div>
                </label>

                <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.target === "all_users" ? "border-primary bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="target" value="all_users" checked={formData.target === "all_users"} onChange={handleTargetChange} className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-gray-800">Tất cả Khách hàng</span>
                    <span className="block text-xs font-medium text-gray-500">Gửi đến toàn bộ {allUsers.length} tài khoản</span>
                  </div>
                </label>

                <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.target === "specific" ? "border-primary bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="target" value="specific" checked={formData.target === "specific"} onChange={handleTargetChange} className="w-4 h-4 text-primary focus:ring-primary border-gray-300" />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-gray-800">Tùy chỉnh (Chọn thủ công)</span>
                    <span className="block text-xs font-medium text-gray-500">Lựa chọn từng User cụ thể</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Khung Specific Emails */}
            {formData.target === "specific" && (
              <div className="flex-1 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200 bg-white">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input 
                      type="text" 
                      placeholder="Tìm User / Email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 px-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Đã chọn: <span className="text-primary">{formData.specificEmails.length}</span></span>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleSelectAll} className="text-[11px] font-bold text-primary hover:text-orange-600 transition-colors">
                        Chọn hết
                      </button>
                      <span className="text-gray-300">|</span>
                      <button type="button" onClick={handleDeselectAll} className="text-[11px] font-bold text-gray-500 hover:text-red-500 transition-colors">
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                </div>

                {/* List Checkboxes */}
                <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1 custom-scrollbar bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 font-medium">Không tìm thấy người dùng</div>
                  ) : (
                    filteredUsers.map((user) => {
                      if (!user.email) return null;
                      const isSelected = formData.specificEmails.includes(user.email);
                      return (
                        <div 
                          key={user._id} 
                          onClick={() => handleToggleUser(user.email)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-orange-50/50 border-orange-100' : 'hover:bg-gray-50 border-transparent'}`}
                        >
                          <div className="flex flex-col min-w-0 pr-3">
                            <span className="text-sm font-bold text-gray-800 truncate">{user.fullname || "Unknown"}</span>
                            <span className="text-[11px] text-gray-500 truncate">{user.email}</span>
                          </div>
                          <div className="shrink-0 text-primary">
                            {isSelected ? <FaCheckSquare size={16} /> : <FaRegSquare size={16} className="text-gray-300" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Nút Submit */}
            <div className="pt-2 mt-auto">
              <button 
                type="submit" 
                form="emailForm"
                disabled={loading || (formData.target === "specific" && formData.specificEmails.length === 0)}
                className="w-full py-3.5 rounded-xl text-sm font-black tracking-widest text-white bg-primary hover:bg-primary/90 shadow-[0_4px_12px_rgba(249,115,22,0.3)] disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    ĐANG GỬI CHIẾN DỊCH...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={14} /> TIẾN HÀNH GỬI EMAIL
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCampaign;
