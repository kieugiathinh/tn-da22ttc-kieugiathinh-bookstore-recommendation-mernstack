import React from "react";
import {
  FaArrowRight,
  FaBookOpen,
  FaBrain,
  FaHandshake,
  FaLightbulb,
  FaBoxOpen,
  FaSearch,
  FaShieldAlt,
  FaMagic,
  FaTruck,
  FaCheckCircle,
  FaHeart,
} from "react-icons/fa";

const coreValues = [
  {
    icon: FaBookOpen,
    title: "Lan tỏa tri thức",
    description:
      "Đưa những cuốn sách giá trị đến gần hơn với mọi độc giả, giúp việc đọc trở thành một phần tự nhiên trong cuộc sống.",
  },
  {
    icon: FaLightbulb,
    title: "Khơi nguồn cảm hứng",
    description:
      "Mỗi cuốn sách được lựa chọn đều có khả năng mở ra một góc nhìn mới, một ý tưởng mới hoặc một hành trình mới.",
  },
  {
    icon: FaHandshake,
    title: "Đồng hành cùng bạn",
    description:
      "BookBee không chỉ bán sách mà còn lắng nghe, tư vấn và giúp bạn tìm được cuốn sách phù hợp với mình.",
  },
];

const categories = [
  {
    icon: FaBrain,
    title: "Phát triển bản thân",
    description:
      "Khám phá tư duy, rèn luyện thói quen và từng bước trở thành phiên bản tốt hơn của chính mình.",
  },
  {
    icon: FaHeart,
    title: "Văn học và cảm hứng",
    description:
      "Những câu chuyện giàu cảm xúc, nuôi dưỡng tâm hồn và giúp bạn tìm thấy sự đồng cảm trong cuộc sống.",
  },
  {
    icon: FaMagic,
    title: "Kiến thức và kỹ năng",
    description:
      "Trang bị kiến thức thực tế, kỹ năng học tập, làm việc và thích nghi với thế giới không ngừng thay đổi.",
  },
];

const commitments = [
  {
    icon: FaShieldAlt,
    title: "Sách chính hãng",
    description:
      "Sản phẩm có nguồn gốc rõ ràng, được chọn lọc từ các nhà xuất bản và đơn vị phát hành uy tín.",
  },
  {
    icon: FaSearch,
    title: "Tìm sách dễ dàng",
    description:
      "Hệ thống tìm kiếm và gợi ý thông minh giúp bạn nhanh chóng khám phá những cuốn sách phù hợp.",
  },
  {
    icon: FaBoxOpen,
    title: "Đóng gói cẩn thận",
    description:
      "Mỗi đơn hàng đều được kiểm tra và đóng gói kỹ lưỡng trước khi giao đến tay bạn.",
  },
  {
    icon: FaTruck,
    title: "Giao hàng thuận tiện",
    description:
      "Quy trình đặt hàng đơn giản, hỗ trợ nhiều phương thức thanh toán và giao hàng trên toàn quốc.",
  },
];

const About = () => {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf5] text-slate-800">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />

        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />

        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
          {/* Hero Content */}
          <div className="order-2 lg:order-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm">
              <FaMagic size={15} />
              Câu chuyện thương hiệu BookBee
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Mỗi cuốn sách là một
              <span className="relative mx-2 inline-block text-orange-500">
                giọt mật
                <svg
                  viewBox="0 0 200 12"
                  className="absolute -bottom-1 left-0 w-full text-orange-300"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8C48 2 120 2 198 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              của tri thức
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              BookBee là nơi những cuốn sách giá trị được chọn lọc để truyền
              cảm hứng, mở rộng tư duy và đồng hành cùng bạn trên hành trình
              phát triển mỗi ngày.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/products"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Khám phá kho sách

                <FaArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 shadow-sm transition duration-300 hover:border-orange-200 hover:text-orange-600"
              >
                Liên hệ BookBee
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2">
                <FaCheckCircle size={17} className="text-orange-500" />
                Sách bản quyền
              </span>

              <span className="flex items-center gap-2">
                <FaCheckCircle size={17} className="text-orange-500" />
                Chọn lọc kỹ lưỡng
              </span>

              <span className="flex items-center gap-2">
                <FaCheckCircle size={17} className="text-orange-500" />
                Tư vấn tận tâm
              </span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-xl">
              <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-gradient-to-br from-orange-300 to-amber-200 opacity-50" />

              <div className="relative overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl shadow-orange-900/15">
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85"
                  alt="Không gian sách tại BookBee"
                  className="h-[380px] w-full object-cover sm:h-[480px]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                    BookBee.com
                  </p>

                  <p className="mt-2 max-w-sm text-xl font-bold leading-snug sm:text-2xl">
                    Chọn một cuốn sách. Mở ra một thế giới mới.
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-xl sm:-left-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <FaBookOpen size={22} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      BookBee lựa chọn
                    </p>

                    <p className="font-bold text-slate-900">
                      Những cuốn sách đáng đọc
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
              Về chúng tôi
            </p>

            <h2 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
              BookBee được tạo nên từ tình yêu dành cho sách
            </h2>
          </div>

          <div className="space-y-5 text-base leading-8 text-slate-600">
            <p>
              Giống như những chú ong cần mẫn tìm kiếm mật ngọt từ nhiều loài
              hoa, BookBee luôn nỗ lực tìm kiếm và chọn lọc những cuốn sách
              giàu giá trị từ nhiều lĩnh vực khác nhau.
            </p>

            <p>
              Chúng tôi tin rằng đọc sách không chỉ là tiếp nhận kiến thức.
              Đó còn là cách mỗi người hiểu thêm về thế giới, thấu hiểu chính
              mình và tìm thấy động lực để tiến về phía trước.
            </p>

            <blockquote className="rounded-2xl border-l-4 border-orange-500 bg-orange-50 px-6 py-5 font-semibold italic text-slate-700">
              “BookBee mong muốn mỗi cuốn sách đến tay bạn đều trở thành một
              hạt giống tốt, được gieo vào tư duy và lớn lên cùng những trải
              nghiệm trong cuộc sống.”
            </blockquote>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
              Điều BookBee theo đuổi
            </p>

            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
              Trao sách hay, gửi giá trị tốt đẹp
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Mọi hoạt động tại BookBee đều hướng đến việc xây dựng một không
              gian mua sách gần gũi, đáng tin cậy và giàu cảm hứng.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {coreValues.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-[#fffaf5] p-7 transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-900/5"
                >
                  <span className="absolute right-5 top-3 text-6xl font-black text-orange-100">
                    0{index + 1}
                  </span>

                  <div className="relative">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
                      <Icon size={25} />
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Book Categories */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
                Không gian sách
              </p>

              <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
                Mỗi chủ đề, một hành trình khám phá
              </h2>
            </div>

            <a
              href="/categories"
              className="group inline-flex items-center gap-2 font-bold text-orange-600"
            >
              Xem tất cả danh mục

              <FaArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <article
                  key={category.title}
                  className="group flex gap-5 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 transition duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    <Icon size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {category.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {category.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-300">
                <FaCheckCircle size={16} />
                Cam kết từ BookBee
              </div>

              <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">
                An tâm trong từng lần lựa chọn
              </h2>

              <p className="mt-5 max-w-md leading-7 text-slate-400">
                Từ lúc bạn bắt đầu tìm kiếm cho đến khi cuốn sách được giao
                tận tay, BookBee luôn cố gắng mang lại trải nghiệm chỉn chu,
                minh bạch và thuận tiện.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {commitments.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:border-orange-400/30 hover:bg-white/10"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                      <Icon size={21} />
                    </div>

                    <h3 className="font-extrabold text-white">{item.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-14 text-center text-white shadow-2xl shadow-orange-500/20 sm:px-12">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border-[40px] border-white/10" />

          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative mx-auto max-w-3xl">
            <FaHeart className="mx-auto mb-5" size={42} />

            <h2 className="text-3xl font-black sm:text-4xl">
              Cuốn sách dành cho bạn đang chờ được khám phá
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-orange-50">
              Bắt đầu hành trình đọc sách cùng BookBee và để mỗi trang sách
              mang đến cho bạn thêm một góc nhìn, một cảm hứng và một cơ hội
              để trưởng thành.
            </p>

            <a
              href="/products"
              className="group mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-extrabold text-orange-600 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-orange-50"
            >
              Chọn sách ngay

              <FaArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>

            <p className="mt-7 text-lg font-bold text-white">
              BookBee.com – Đọc hôm nay, vươn xa ngày mai
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;