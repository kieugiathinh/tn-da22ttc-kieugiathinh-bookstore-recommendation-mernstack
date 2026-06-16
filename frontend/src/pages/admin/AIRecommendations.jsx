import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { toast } from "react-toastify";
import {
  FaRobot,
  FaDatabase,
  FaBookOpen,
  FaStar,
  FaHandPointer,
  FaShoppingCart,
  FaSync,
  FaPlay,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaMicrochip
} from "react-icons/fa";

// Component con hiển thị thẻ thống kê
const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-${colorClass.split("-")[1]}-600`}>
        <Icon size={20} />
      </div>
      {subtitle && <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{subtitle}</span>}
    </div>
    <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
    <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
  </div>
);

const AdminRecommendations = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  // States cho Simulator
  const [simUserId, setSimUserId] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch Health Data
  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/recommend/health");
      setHealth(res.data);
    } catch (error) {
      toast.error("Không thể kết nối đến AI Service.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Handle Retrain
  const handleRetrain = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn buộc AI huấn luyện lại mô hình? Việc này có thể tốn vài phút tùy thuộc vào lượng dữ liệu.")) return;
    
    try {
      setRetraining(true);
      const res = await userRequest.post("/recommend/retrain");
      toast.success(res.data.message || "Đã kích hoạt huấn luyện lại thành công!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi kích hoạt huấn luyện.");
    } finally {
      setRetraining(false);
    }
  };

  // Handle Simulate
  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simUserId.trim()) return;

    try {
      setSimLoading(true);
      const res = await userRequest.get(`/recommend/simulator/${simUserId.trim()}?top_k=5`);
      setSimResult(res.data);
      toast.success("Đã lấy kết quả giả lập!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lấy dữ liệu giả lập.");
      setSimResult(null);
    } finally {
      setSimLoading(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <FaSync className="animate-spin text-indigo-500 text-2xl" />
        <span className="font-medium text-lg">Đang kết nối tới BookBee AI Service...</span>
      </div>
    );
  }

  const dataSummary = health?.data_summary || {};
  const isOk = health?.status === "ok";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <FaRobot className="text-indigo-600" /> AI Recommendation Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Trung tâm quản lý, theo dõi sức khỏe và giả lập hệ thống gợi ý cá nhân hóa.
          </p>
        </div>
        
        {/* Status Badge & Retrain Button */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold shadow-sm ${
            isOk ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
          }`}>
            {isOk ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{isOk ? "AI Service Online" : "AI Service Offline"}</span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining || !isOk}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-bold text-sm transition shadow-sm"
          >
            <FaPlay className={retraining ? "animate-pulse" : ""} />
            {retraining ? "Đang huấn luyện..." : "Huấn luyện lại (Retrain)"}
          </button>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {!isOk && health?.errors && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
          <h3 className="text-rose-800 font-bold mb-1">Cảnh báo lỗi kết nối Data:</h3>
          <ul className="list-disc ml-5 text-sm text-rose-700">
            {health.errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* ── DATA METRICS GRID ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FaDatabase className="text-gray-400" /> Khối lượng Dữ liệu Huấn luyện (Training Data)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Sản phẩm (Sách)" 
            value={(dataSummary.products?.count || 0).toLocaleString()} 
            icon={FaBookOpen} 
            colorClass="text-blue-500 bg-blue-500" 
          />
          <StatCard 
            title="Đánh giá (Explicit)" 
            value={(dataSummary.ratings?.count || 0).toLocaleString()} 
            icon={FaStar} 
            colorClass="text-amber-500 bg-amber-500"
            subtitle={`${dataSummary.ratings?.avg_rating || 0}★ TB`}
          />
          <StatCard 
            title="Tương tác (Implicit)" 
            value={(dataSummary.interactions?.count || 0).toLocaleString()} 
            icon={FaHandPointer} 
            colorClass="text-violet-500 bg-violet-500" 
            subtitle="Click / Cart"
          />
          <StatCard 
            title="Lịch sử Mua (Implicit)" 
            value={(dataSummary.purchases?.count || 0).toLocaleString()} 
            icon={FaShoppingCart} 
            colorClass="text-emerald-500 bg-emerald-500" 
          />
        </div>
      </div>

      {/* ── AI SIMULATOR ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaMicrochip className="text-indigo-500" /> Trình Giả Lập Gợi Ý (AI Sandbox)
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-6 max-w-3xl">
          Nhập ID của người dùng để xem hệ thống AI phân tích và đưa ra gợi ý gì cho họ. Nếu người dùng chưa từng tương tác, hệ thống sẽ trả về dự phòng (Cold Start).
        </p>

        <form onSubmit={handleSimulate} className="flex gap-3 max-w-xl mb-8">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              required
              placeholder="Nhập User ID (ví dụ: 6a1330961d23...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm font-medium bg-gray-50 focus:bg-white"
              value={simUserId}
              onChange={(e) => setSimUserId(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={simLoading || !simUserId.trim()}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-sm transition shadow-sm disabled:bg-gray-400 flex items-center gap-2"
          >
            {simLoading ? <FaSync className="animate-spin" /> : <FaPlay />}
            {simLoading ? "Đang chạy..." : "Mô phỏng"}
          </button>
        </form>

        {/* Kết quả Simulator */}
        {simResult && (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <div className="px-5 py-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-700 text-sm">Kết quả cho User: <span className="font-mono text-indigo-600">{simUserId}</span></span>
              <span className={`px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full ${
                simResult.isColdStart ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}>
                {simResult.isColdStart ? "COLD START (Best Seller)" : "PERSONALIZED (AI SVD)"}
              </span>
            </div>
            
            <div className="p-5">
              {simResult.products?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {simResult.products.map((p, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center text-center shadow-sm relative hover:-translate-y-1 hover:shadow-md transition duration-300">
                      {/* AI Meta Badge */}
                      {!simResult.isColdStart && p._aiMeta?.predictedRating && (
                         <span className="absolute top-2 left-2 bg-indigo-500 text-white shadow-sm text-[10px] font-bold px-2 py-0.5 rounded-full">
                           {p._aiMeta.predictedRating.toFixed(2)}★
                         </span>
                      )}
                      
                      <div className="h-28 w-full flex items-center justify-center bg-gray-50 rounded-lg mb-3 overflow-hidden p-2">
                        <img src={p.img} alt={p.title} className="h-full w-auto object-contain" />
                      </div>
                      
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-1 h-8">{p.title}</h4>
                      
                      <div className="mt-auto w-full flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                        <span className="text-xs font-bold text-rose-600">
                          {(p.discountedPrice || p.originalPrice || 0).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-6">Không tìm thấy sản phẩm nào.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecommendations;
