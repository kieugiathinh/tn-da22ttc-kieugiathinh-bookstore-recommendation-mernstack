import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="relative h-64">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
            alt="About GTBooks"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <h1 className="text-4xl font-extrabold text-white p-8">
              Về GTBooks
            </h1>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-6 text-gray-700 leading-relaxed">
          <p className="text-lg font-medium text-primary-hover">
            "Sách là giấc mơ bạn cầm trên tay."
          </p>
          <p>
            Được thành lập vào năm 2024, <strong>GTBooks</strong> không chỉ là
            một nhà sách trực tuyến, mà là một cộng đồng dành cho những người
            yêu tri thức. Chúng tôi tin rằng mỗi cuốn sách đều mang trong mình
            một sứ mệnh riêng - thay đổi tư duy và nuôi dưỡng tâm hồn.
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-4">
            Sứ mệnh của chúng tôi
          </h3>
          <p>
            Mang đến cho độc giả Việt Nam những đầu sách chất lượng nhất với
            trải nghiệm mua sắm công nghệ số tiện lợi, nhanh chóng và tận tâm.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

