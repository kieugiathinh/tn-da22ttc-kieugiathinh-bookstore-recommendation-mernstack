import React from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-4 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Cột Thông tin */}
        <div className="bg-slate-900 text-white p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold mb-6">
            Liên hệ với chúng tôi
          </h2>
          <p className="text-gray-400 mb-8">
            Bạn có câu hỏi hoặc cần hỗ trợ? Đừng ngần ngại để lại lời nhắn cho
            GTBooks nhé!
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary p-3 rounded-full">
                <FaMapMarkerAlt className="text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Địa chỉ</h4>
                <p className="text-sm text-gray-300">
                  Long Hòa, Châu Thành, Vĩnh Long
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary p-3 rounded-full">
                <FaPhoneAlt className="text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Hotline</h4>
                <p className="text-sm text-gray-300">0339 601 263</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary p-3 rounded-full">
                <FaEnvelope className="text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Email</h4>
                <p className="text-sm text-gray-300">bookstore@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột Form */}
        <div className="p-10">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Họ tên
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Tên của bạn"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Lời nhắn
              </label>
              <textarea
                rows="4"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Nội dung cần hỗ trợ..."
              ></textarea>
            </div>
            <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-all shadow-lg">
              Gửi tin nhắn
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;

