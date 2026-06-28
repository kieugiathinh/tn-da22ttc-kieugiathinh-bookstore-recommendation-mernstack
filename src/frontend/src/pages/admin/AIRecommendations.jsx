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

// ── METRIC CARD COMPONENT ──
const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} text-white relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{title}</p>
        <h3 className="text-3xl font-black tracking-tight leading-none drop-shadow-sm">{value}</h3>
        {subtitle && <p className="mt-2 text-sm font-medium opacity-90">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="text-2xl" />
      </div>
    </div>
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
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
      <div className="flex h-[60vh] items-center justify-center gap-3 text-orange-500">
        <FaSync className="animate-spin text-3xl" />
        <span className="font-bold text-lg">Đang kết nối tới BookBee AI Service...</span>
      </div>
    );
  }

  const dataSummary = health?.data_summary || {};
  const isOk = health?.status === "ok";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
            <FaMicrochip className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              AI Recommendation
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Trung tâm quản lý, theo dõi sức khỏe và giả lập hệ thống gợi ý.
            </p>
          </div>
        </div>
        
        {/* Status Badge & Retrain Button */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-sm ${
            isOk ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"
          }`}>
            {isOk ? <FaCheckCircle size={16} /> : <FaExclamationTriangle size={16} />}
            <span>{isOk ? "AI Service Online" : "AI Service Offline"}</span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining || !isOk}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-black text-sm transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] disabled:shadow-none"
          >
            <FaPlay className={retraining ? "animate-pulse" : ""} />
            {retraining ? "ĐANG HUẤN LUYỆN..." : "HUẤN LUYỆN LẠI"}
          </button>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {!isOk && health?.errors && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex gap-3">
          <FaExclamationTriangle className="text-rose-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-rose-800 font-extrabold mb-2">Cảnh báo lỗi kết nối Data:</h3>
            <ul className="list-disc ml-5 text-sm text-rose-700 font-medium space-y-1">
              {health.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ── DATA METRICS GRID ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
          <FaDatabase className="text-indigo-500" /> Khối lượng Dữ liệu Huấn luyện
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard 
            title="Sản phẩm (Sách)" 
            value={(dataSummary.products?.count || 0).toLocaleString()} 
            icon={FaBookOpen} 
            bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500" 
          />
          <MetricCard 
            title="Đánh giá (Explicit)" 
            value={(dataSummary.ratings?.count || 0).toLocaleString()} 
            icon={FaStar} 
            bgGradient="bg-gradient-to-br from-amber-500 to-yellow-500"
            subtitle={`${dataSummary.ratings?.avg_rating || 0}★ TB`}
          />
          <MetricCard 
            title="Tương tác (Implicit)" 
            value={(dataSummary.interactions?.count || 0).toLocaleString()} 
            icon={FaHandPointer} 
            bgGradient="bg-gradient-to-br from-violet-500 to-purple-500" 
            subtitle="Click / Cart"
          />
          <MetricCard 
            title="Lịch sử Mua" 
            value={(dataSummary.purchases?.count || 0).toLocaleString()} 
            icon={FaShoppingCart} 
            bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500" 
          />
        </div>
      </div>

      {/* ── AI SIMULATOR ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <FaRobot className="text-indigo-500" /> Trình Giả Lập Gợi Ý (AI Sandbox)
          </h2>
        </div>
        <p className="text-sm text-gray-500 font-medium mb-6 max-w-3xl">
          Nhập ID của người dùng để xem hệ thống AI phân tích và đưa ra gợi ý gì cho họ. Nếu người dùng chưa từng tương tác, hệ thống sẽ trả về dự phòng (Cold Start).
        </p>

        <form onSubmit={handleSimulate} className="flex gap-3 max-w-xl mb-8">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              required
              placeholder="Nhập User ID (ví dụ: 6a1330961d23...)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-bold bg-gray-50 focus:bg-white"
              value={simUserId}
              onChange={(e) => setSimUserId(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={simLoading || !simUserId.trim()}
            className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black tracking-wide text-sm transition-all shadow-md disabled:bg-gray-300 disabled:shadow-none flex items-center gap-2"
          >
            {simLoading ? <FaSync className="animate-spin" /> : <FaPlay />}
            {simLoading ? "ĐANG CHẠY..." : "MÔ PHỎNG"}
          </button>
        </form>

        {/* Kết quả Simulator */}
        {simResult && (
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
              <span className="font-extrabold text-gray-800 text-sm">Kết quả cho User: <span className="font-mono text-indigo-600 ml-1">{simUserId}</span></span>
              <span className={`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg shadow-sm border ${
                simResult.isColdStart ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
              }`}>
                {simResult.isColdStart ? "COLD START (Best Seller)" : "PERSONALIZED (AI SVD)"}
              </span>
            </div>
            
            <div className="p-6 bg-gray-50/30">
              {simResult.products?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {simResult.products.map((p, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center text-center shadow-sm relative hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 group">
                      {/* AI Meta Badge */}
                      {!simResult.isColdStart && p._aiMeta?.predictedRating && (
                         <span className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md text-[11px] font-black px-2.5 py-1 rounded-lg transform rotate-3">
                           {p._aiMeta.predictedRating.toFixed(2)}★
                         </span>
                      )}
                      
                      <div className="h-32 w-full flex items-center justify-center bg-gray-50 rounded-lg mb-4 overflow-hidden p-2 group-hover:bg-indigo-50 transition-colors">
                        <img src={p.img} alt={p.title} className="h-full w-auto object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                      </div>
                      
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-2 min-h-[32px] group-hover:text-indigo-600 transition-colors">{p.title}</h4>
                      
                      <div className="mt-auto w-full flex justify-between items-center border-t border-gray-100 pt-3">
                        <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md">#{idx + 1}</span>
                        <span className="text-sm font-black text-rose-600">
                          {(p.discountedPrice || p.originalPrice || 0).toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FaExclamationTriangle className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-sm text-gray-500 font-bold">Không tìm thấy sản phẩm nào.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecommendations;
