/**
 * ============================================================
 * seedMockData.js — Bơm dữ liệu giả lập cho Recommendation System
 * ============================================================
 * Thực hiện 2 nhiệm vụ:
 *   Task 1: Gán tags cho 35 sản phẩm dựa theo category
 *   Task 2: Sinh ~200 ratings giả vào collection reviews
 *
 * Chạy lệnh:
 *   node --env-file=.env scripts/seedMockData.js
 * ============================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ─── Kết nối DB ───────────────────────────────────────────────────────────────
const connectDB = async () => {
  const DB = process.env.DB;
  if (!DB) { console.error("❌ Thiếu biến DB trong .env"); process.exit(1); }
  await mongoose.connect(DB);
  console.log(`✅ MongoDB: ${mongoose.connection.host}`);
};

// ─── Bản đồ Tags theo Category ────────────────────────────────────────────────
/**
 * Map tên category → danh sách tags phù hợp.
 * Tags được thiết kế để tối đa hóa TF-IDF similarity giữa sách cùng nhóm.
 */
const CATEGORY_TAGS_MAP = {
  "Kinh tế": [
    "kinh doanh", "đầu tư", "tài chính", "khởi nghiệp", "quản trị",
    "marketing", "doanh nghiệp", "thương mại", "lợi nhuận", "chiến lược kinh doanh",
  ],
  "Văn học": [
    "tiểu thuyết", "truyện ngắn", "văn học", "sáng tác", "nhân vật",
    "cốt truyện", "hư cấu", "tình cảm", "lãng mạn", "bi kịch",
  ],
  "Tâm lý - kỹ năng sống": [
    "kỹ năng mềm", "phát triển bản thân", "tâm lý học", "tư duy", "thói quen",
    "giao tiếp", "lãnh đạo", "cảm xúc", "hạnh phúc", "thành công",
  ],
  "Thiếu nhi": [
    "thiếu nhi", "truyện tranh", "giáo dục trẻ em", "phiêu lưu", "cổ tích",
    "tưởng tượng", "màu sắc", "học vui", "kỹ năng sống cho trẻ",
  ],
  "Giáo khoa - tham khảo": [
    "học thuật", "giáo khoa", "tham khảo", "bài tập", "luyện thi",
    "toán học", "vật lý", "hóa học", "sinh học", "lịch sử",
  ],
  "Tiểu sử - Hồi ký": [
    "tiểu sử", "hồi ký", "cuộc đời", "nhân vật lịch sử", "cảm hứng",
    "thành công thực tế", "trải nghiệm sống", "lãnh đạo vĩ đại",
  ],
  "Ngoại ngữ": [
    "tiếng anh", "từ vựng", "ngữ pháp", "giao tiếp tiếng anh",
    "học ngoại ngữ", "ielts", "toeic", "luyện nói", "luyện nghe",
  ],
  "Nuôi dạy con": [
    "nuôi dạy con", "làm cha mẹ", "phát triển trẻ", "giáo dục gia đình",
    "tâm lý trẻ em", "dinh dưỡng cho trẻ", "kỹ năng làm cha mẹ",
  ],
};

/**
 * Bổ sung tags dựa vào từ khóa trong title (fallback khi category không có map).
 */
const TITLE_KEYWORD_TAGS = [
  { keywords: ["tiền", "giàu", "tài chính", "đầu tư"],  tags: ["tài chính cá nhân", "làm giàu", "đầu tư thông minh"] },
  { keywords: ["khởi nghiệp", "startup"],                tags: ["startup", "lean startup", "mô hình kinh doanh"] },
  { keywords: ["tiếng anh", "english", "ielts", "toeic"], tags: ["tiếng anh", "luyện thi", "ngoại ngữ"] },
  { keywords: ["trẻ em", "thiếu nhi", "bé"],             tags: ["trẻ em", "giáo dục sớm", "vui học"] },
  { keywords: ["tâm lý", "cảm xúc", "hạnh phúc"],        tags: ["sức khỏe tâm thần", "cân bằng cuộc sống"] },
  { keywords: ["lịch sử", "chiến tranh", "kháng chiến"],  tags: ["lịch sử việt nam", "văn học chiến tranh"] },
  { keywords: ["làm mẹ", "làm cha", "nuôi con"],         tags: ["parenting", "chăm sóc trẻ sơ sinh"] },
];

// ─── Task 1: Seed Tags ────────────────────────────────────────────────────────
const seedTags = async () => {
  console.log("\n📌 TASK 1: Gán tags cho sản phẩm...");
  const db = mongoose.connection.db;

  // Lấy tất cả categories để map _id → name
  const categories = await db.collection("categories").find({}).toArray();
  const categoryMap = {};
  categories.forEach((c) => { categoryMap[c._id.toString()] = c.name; });

  const products = await db.collection("products").find({}).toArray();
  console.log(`   Tổng số sản phẩm: ${products.length}`);

  let updatedCount = 0;
  const bulkOps = [];

  for (const product of products) {
    const categoryName = categoryMap[product.category?.toString()] ?? "";
    const titleLower = (product.title ?? "").toLowerCase();

    // Lấy tags từ category map
    let newTags = [...(CATEGORY_TAGS_MAP[categoryName] ?? [])];

    // Bổ sung tags từ title keywords
    for (const { keywords, tags } of TITLE_KEYWORD_TAGS) {
      if (keywords.some((kw) => titleLower.includes(kw.toLowerCase()))) {
        newTags = [...new Set([...newTags, ...tags])]; // Merge, loại trùng
      }
    }

    // Chỉ update nếu có tags mới (hoặc tags cũ rỗng)
    const existingTags = product.tags ?? [];
    if (newTags.length > 0 && existingTags.length === 0) {
      bulkOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { tags: newTags } },
        },
      });
      updatedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await db.collection("products").bulkWrite(bulkOps);
    console.log(`   ✅ Đã gán tags cho ${updatedCount} sản phẩm`);
  } else {
    console.log("   ℹ️  Tất cả sản phẩm đã có tags — bỏ qua");
  }
};

// ─── Task 2: Seed Ratings ─────────────────────────────────────────────────────
const seedRatings = async (targetCount = 200) => {
  console.log(`\n⭐ TASK 2: Sinh ${targetCount} ratings giả...`);
  const db = mongoose.connection.db;

  // Lấy danh sách User và Product IDs từ DB
  const users = await db.collection("users").find(
    { role: 0, status: 1 }, // Chỉ lấy user thường đang hoạt động
    { projection: { _id: 1 } }
  ).toArray();

  const products = await db.collection("products").find(
    {}, { projection: { _id: 1 } }
  ).toArray();

  const orders = await db.collection("orders").find(
    {}, { projection: { _id: 1 } }
  ).toArray();

  if (users.length === 0) { console.error("   ❌ Không có user nào trong DB"); return; }
  if (products.length === 0) { console.error("   ❌ Không có sản phẩm nào trong DB"); return; }
  if (orders.length === 0) { console.error("   ❌ Không có order nào trong DB (cần ref)"); return; }

  console.log(`   Users: ${users.length} | Products: ${products.length} | Orders: ${orders.length}`);

  // Xóa mock ratings cũ (nếu có) để tránh duplicate
  const deleteResult = await db.collection("reviews").deleteMany({ comment: /\[MOCK\]/ });
  if (deleteResult.deletedCount > 0) {
    console.log(`   🗑  Đã xóa ${deleteResult.deletedCount} mock ratings cũ`);
  }

  /**
   * Phân bố ratings thực tế hơn (không hoàn toàn ngẫu nhiên):
   * - 5 sao: 35% (users thường rate cao khi mua)
   * - 4 sao: 30%
   * - 3 sao: 20%
   * - 2 sao: 10%
   * - 1 sao: 5%
   */
  const RATING_DIST = [5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 1];
  const randomRating = () => RATING_DIST[Math.floor(Math.random() * RATING_DIST.length)];
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Bình luận mẫu theo điểm sao (phân loại cho tự nhiên)
  const COMMENTS = {
    5: ["[MOCK] Sách rất hay, đọc rất cuốn!", "[MOCK] Tuyệt vời, xứng đáng 5 sao!", "[MOCK] Nội dung chất lượng, tôi rất hài lòng.", "[MOCK] Cực kỳ bổ ích, đọc xong thấy ngay tác dụng."],
    4: ["[MOCK] Sách khá tốt, nội dung phong phú.", "[MOCK] Đọc được, có nhiều điểm thú vị.", "[MOCK] Hài lòng, sẽ giới thiệu cho bạn bè."],
    3: ["[MOCK] Tạm được, không quá ấn tượng.", "[MOCK] Nội dung ổn, nhưng còn nhiều điểm chưa sâu."],
    2: ["[MOCK] Sách bình thường, không như kỳ vọng.", "[MOCK] Nội dung khá nhạt, cần cải thiện."],
    1: ["[MOCK] Không phù hợp, không như quảng cáo.", "[MOCK] Thất vọng với nội dung sách."],
  };
  const randomComment = (rating) => randomItem(COMMENTS[rating]);

  // Tracking để tránh (user, product, order) trùng nhau — review schema có unique index
  const usedCombinations = new Set();
  const mockReviews = [];

  let attempts = 0;
  const maxAttempts = targetCount * 10;

  while (mockReviews.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const user = randomItem(users);
    const product = randomItem(products);
    const order = randomItem(orders);
    const key = `${user._id}-${product._id}-${order._id}`;

    if (usedCombinations.has(key)) continue;
    usedCombinations.add(key);

    const rating = randomRating();

    // Thêm random timestamp trong vòng 180 ngày qua
    const daysAgo = Math.floor(Math.random() * 180);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    mockReviews.push({
      user: user._id,
      product: product._id,
      order: order._id,
      rating,
      comment: randomComment(rating),
      images: [],
      reply: "",
      isHidden: false,
      createdAt,
      updatedAt: createdAt,
    });
  }

  if (mockReviews.length === 0) {
    console.error("   ❌ Không tạo được rating nào (có thể thiếu data)");
    return;
  }

  await db.collection("reviews").insertMany(mockReviews);

  // Báo cáo phân bố ratings
  const dist = mockReviews.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {});

  console.log(`   ✅ Đã tạo ${mockReviews.length} mock ratings`);
  console.log("   Phân bố sao:", Object.entries(dist).sort().map(([k, v]) => `${k}⭐=${v}`).join(" | "));
};

// ─── Entry Point ──────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    await seedTags();
    await seedRatings(200);
    console.log("\n🎉 Seed hoàn tất! Restart FastAPI để model retrain với data mới.\n");
  } catch (err) {
    console.error("❌ Seed thất bại:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🛑 Đóng kết nối MongoDB.");
    process.exit(0);
  }
})();
