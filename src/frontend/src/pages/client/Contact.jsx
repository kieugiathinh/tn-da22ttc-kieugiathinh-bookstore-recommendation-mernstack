import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaPaperPlane } from "react-icons/fa";
import { useSelector } from "react-redux";
import { publicRequest } from "../../requestMethods";
import Swal from "sweetalert2";

const Contact = () => {
  const currentUser = useSelector((state) => state.user.currentUser);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  // Điền tự động nếu user đã đăng nhập
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return Swal.fire("Lỗi", "Vui lòng điền Họ tên, Email và Nội dung", "error");
    }

    try {
      setLoading(true);
      await publicRequest.post("/contacts", formData);
      Swal.fire({
        title: "Gửi thành công!",
        text: "Chúng tôi đã nhận được yêu cầu và sẽ phản hồi sớm nhất.",
        icon: "success",
        confirmButtonColor: "#f97316"
      });
      // Reset form (giữ lại name, email, phone nếu đã đăng nhập)
      setFormData({
        name: currentUser ? currentUser.name : "",
        email: currentUser ? currentUser.email : "",
        phone: currentUser ? currentUser.phone : "",
        topic: "",
        message: ""
      });
    } catch (error) {
      Swal.fire("Lỗi", error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Liên hệ BookBee
          </h1>
          <p className="mt-2 text-slate-500 text-sm max-w-lg mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ. Hãy để lại lời nhắn cho BookBee!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-0 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Cột Thông tin & Map */}
          <div className="p-6 md:p-8 bg-orange-500 text-white relative flex flex-col">
            {/* Background effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

            {/* Google Map */}
            <div className="relative z-10 rounded-xl overflow-hidden shadow-md h-64 w-full mb-8 border border-orange-400">
              <iframe
                title="BookBee Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15694.020309995837!2d105.959275!3d10.222384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310a830064f26019%3A0x60c2394c8e7e1ef0!2sLong%20H%C3%B2a%2C%20Ch%C3%A2u%20Th%C3%A0nh%2C%20V%C3%AEnh%20Long%2C%20Vietnam!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              ></iframe>
            </div>

            {/* Thông tin liên hệ nhỏ gọn */}
            <div className="relative z-10 flex-1 flex flex-col justify-center">
              <h2 className="text-xl font-bold mb-5 text-white">Thông tin liên hệ</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                    <FaMapMarkerAlt className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Địa chỉ cửa hàng</h4>
                    <p className="text-orange-100 text-xs mt-0.5">
                      Long Hòa, Châu Thành, Vĩnh Long
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                    <FaPhoneAlt className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Hotline hỗ trợ</h4>
                    <p className="text-orange-100 text-xs mt-0.5">0339 601 263</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                    <FaEnvelope className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Email</h4>
                    <p className="text-orange-100 text-xs mt-0.5">bookstore@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                    <FaClock className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Giờ làm việc</h4>
                    <p className="text-orange-100 text-xs mt-0.5">Thứ 2 - CN: 8:00 - 22:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Form */}
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-1">Gửi tin nhắn</h3>
              <p className="text-slate-500 text-sm">
                Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.
              </p>
            </div>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 hover:border-orange-400 focus:border-orange-500 px-4 py-2.5 rounded-lg outline-none transition-colors shadow-sm focus:ring-1 focus:ring-orange-500 bg-white text-sm"
                  placeholder="Nhập tên của bạn"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 hover:border-orange-400 focus:border-orange-500 px-4 py-2.5 rounded-lg outline-none transition-colors shadow-sm focus:ring-1 focus:ring-orange-500 bg-white text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 hover:border-orange-400 focus:border-orange-500 px-4 py-2.5 rounded-lg outline-none transition-colors shadow-sm focus:ring-1 focus:ring-orange-500 bg-white text-sm"
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Chủ đề
                </label>
                <select 
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full border border-gray-300 hover:border-orange-400 focus:border-orange-500 px-4 py-2.5 rounded-lg outline-none transition-colors shadow-sm focus:ring-1 focus:ring-orange-500 bg-white text-sm cursor-pointer"
                >
                  <option value="">Chọn vấn đề...</option>
                  <option value="order">Đơn hàng</option>
                  <option value="product">Sản phẩm</option>
                  <option value="payment">Thanh toán</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border border-gray-300 hover:border-orange-400 focus:border-orange-500 px-4 py-2.5 rounded-lg outline-none transition-colors shadow-sm focus:ring-1 focus:ring-orange-500 bg-white text-sm resize-none"
                  placeholder="Mô tả nội dung bạn cần hỗ trợ..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-2 flex justify-center items-center gap-2 group text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Đang gửi..." : "Gửi tin nhắn"}</span>
                {!loading && <FaPaperPlane className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Contact;

