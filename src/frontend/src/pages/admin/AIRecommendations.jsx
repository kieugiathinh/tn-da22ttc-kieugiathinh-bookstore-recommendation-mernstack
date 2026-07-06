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
  FaMicrochip,
  FaChartPie,
  FaChartBar
} from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

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
  const [simUserIdDisplay, setSimUserIdDisplay] = useState(""); // State hiển thị trong ô search
  const [simResult, setSimResult] = useState(null);
  const [simHistory, setSimHistory] = useState(null); // Lịch sử hành vi
  const [simLoading, setSimLoading] = useState(false);
  const [users, setUsers] = useState([]); // Danh sách users cho dropdown
  
  // States cho Thống kê (Biểu đồ)
  const [globalStats, setGlobalStats] = useState([]);
  const [userStats, setUserStats] = useState([]);

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
    
    // Lấy danh sách users cho dropdown
    const fetchUsers = async () => {
      try {
        const res = await userRequest.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách users", err);
      }
    };
    fetchUsers();

    // Lấy thống kê toàn cục
    const fetchGlobalStats = async () => {
      try {
        const res = await userRequest.get("/interactions/analytics/categories");
        setGlobalStats(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy thống kê toàn hệ thống", err);
      }
    };
    fetchGlobalStats();
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
      
      // Chạy song song 3 API: Lấy Gợi ý, Lấy Lịch sử hành vi, Lấy Thống kê User
      const [aiRes, historyRes, statsRes] = await Promise.all([
        userRequest.get(`/recommend/simulator/${simUserId.trim()}?top_k=12`),
        userRequest.get(`/interactions?keyword=${simUserId.trim()}&limit=30`),
        userRequest.get(`/interactions/analytics/categories?userId=${simUserId.trim()}`)
      ]);

      setSimResult(aiRes.data);
      setSimHistory(historyRes.data.interactions || []);
      setUserStats(statsRes.data.data || []);
      toast.success("Đã lấy kết quả giả lập & hồ sơ!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lấy dữ liệu giả lập.");
      setSimResult(null);
      setSimHistory(null);
      setUserStats([]);
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

      {/* ── THỐNG KÊ TOÀN CỤC (GLOBAL STATS) ── */}
      {globalStats && globalStats.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-4">
            <FaChartBar className="text-indigo-500" /> Thống Kê Quan Tâm Toàn Hệ Thống
          </h2>
          <p className="text-sm text-gray-500 font-medium mb-6 max-w-3xl">
            Biểu đồ thể hiện tổng số lượt tương tác (xem, giỏ hàng, mua...) của tất cả người dùng phân bổ theo từng thể loại sách. Giúp Admin nắm bắt nhanh xu hướng thị trường hiện tại.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <RechartsTooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" name="Lượt tương tác" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {globalStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── AI SIMULATOR ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <FaRobot className="text-indigo-500" /> Trình Giả Lập Gợi Ý (AI Sandbox)
          </h2>
        </div>
        <p className="text-sm text-gray-500 font-medium mb-6 max-w-3xl">
          Chọn người dùng từ danh sách để xem hồ sơ hoạt động (sách đã xem/mua) và kết quả gợi ý tương ứng mà AI phân tích cho họ.
        </p>

        <form onSubmit={handleSimulate} className="flex gap-3 max-w-2xl mb-8">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              required
              list="users-datalist"
              placeholder="Nhập tên hoặc email người dùng để tìm kiếm..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-bold bg-gray-50 focus:bg-white"
              value={simUserIdDisplay}
              onChange={(e) => {
                setSimUserIdDisplay(e.target.value);
                const matched = users.find(u => `${u.fullname} (${u.email})` === e.target.value);
                if (matched) setSimUserId(matched._id);
                else setSimUserId("");
              }}
            />
            <datalist id="users-datalist">
              {users.map((u) => (
                <option key={u._id} value={`${u.fullname} (${u.email})`} />
              ))}
            </datalist>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Cột 1: Hồ Sơ Hành Vi */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <span className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                  <FaHandPointer className="text-indigo-500" /> Hồ Sơ Thao Tác (Quá khứ)
                </span>
                <p className="text-xs text-gray-500 mt-1">Các sách khách hàng này đã xem, giỏ hàng, mua gần đây nhất.</p>
              </div>

              {/* Chart for User */}
              {userStats && userStats.length > 0 && (
                <div className="bg-white border-b border-gray-100 p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FaChartPie className="text-indigo-400" /> Phân bổ thể loại quan tâm
                  </p>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="category"
                          stroke="none"
                        >
                          {userStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="p-4 bg-white flex-1 overflow-y-auto max-h-[500px]">
                {simHistory && simHistory.length > 0 ? (
                  <div className="space-y-4">
                    {simHistory.map((interaction, idx) => (
                      <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-indigo-50/30 transition-colors">
                        <img src={interaction.productId?.img} alt="book" className="w-12 h-16 object-contain rounded drop-shadow-sm bg-white" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 truncate" title={interaction.productId?.title}>
                            {interaction.productId?.title || "Sách không tồn tại"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              interaction.interactionType === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
                              interaction.interactionType === 'add_to_cart' ? 'bg-amber-100 text-amber-700' :
                              interaction.interactionType === 'review' ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {interaction.interactionType}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(interaction.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 opacity-60">
                    <FaBookOpen className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Chưa có dữ liệu hành vi</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cột 2: Gợi Ý Thực Tế (Sách người dùng đang thấy trên web) */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full bg-emerald-50/20">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-teal-900 text-sm flex items-center gap-2">
                    <FaBookOpen className="text-emerald-500" /> Sách Gợi Ý Thực Tế
                  </span>
                  <p className="text-[11px] text-teal-700/70 mt-1">Kết quả Hybrid đang hiển thị trên trang chủ cho user.</p>
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
                {simResult.actualProducts?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {simResult.actualProducts.map((p, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center text-center shadow-sm relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        <div className="h-28 w-full flex items-center justify-center mb-2">
                          <img src={p.img} alt={p.title} className="h-full w-auto object-contain drop-shadow-sm" />
                        </div>
                        <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1 min-h-[32px]">{p.title}</h4>
                        
                        <p className="text-[9px] text-teal-600 mb-2 italic">
                          Lý do: Thuộc thuật toán lai ghép (Thịnh hành + Nội dung)
                        </p>

                        <div className="mt-auto w-full flex justify-between items-center border-t border-gray-50 pt-2">
                          <span className="text-[10px] font-black text-gray-400">#{idx + 1}</span>
                          <span className="text-[11px] font-black text-emerald-600">
                            {(p.discountedPrice || p.originalPrice || 0).toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60 h-full">
                    <FaExclamationTriangle className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-bold">Không có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cột 3: Gợi Ý AI (Dự đoán tương lai) */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full bg-indigo-50/20">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-indigo-900 text-sm flex items-center gap-2">
                    <FaRobot className="text-purple-500" /> Dự Đoán Tương Lai
                  </span>
                  <p className="text-[11px] text-indigo-600/70 mt-1">Dựa vào hành vi, AI Collaborative dự đoán user sẽ mua.</p>
                </div>
                <span className={`px-2 py-1 text-[9px] uppercase tracking-widest font-black rounded flex-shrink-0 border ${
                  simResult.isColdStart ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-purple-50 text-purple-600 border-purple-200"
                }`}>
                  {simResult.isColdStart ? "COLD START" : "AI SVD"}
                </span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
                {simResult.cfProducts?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {simResult.cfProducts.map((p, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center text-center shadow-sm relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        {/* AI Meta Badge */}
                        {!simResult.isColdStart && p._aiMeta?.predictedRating && (
                           <span className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md text-[10px] font-black px-2 py-0.5 rounded-md transform rotate-3 z-10">
                             {p._aiMeta.predictedRating.toFixed(2)}★
                           </span>
                        )}
                        
                        <div className="h-28 w-full flex items-center justify-center mb-2">
                          <img src={p.img} alt={p.title} className="h-full w-auto object-contain drop-shadow-sm" />
                        </div>
                        <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1 min-h-[32px]">{p.title}</h4>
                        
                        <p className="text-[9px] text-purple-600 mb-2 italic">
                          Lý do: Hành vi của nhóm KH tương đồng thích sách này.
                        </p>

                        <div className="mt-auto w-full flex justify-between items-center border-t border-gray-50 pt-2">
                          <span className="text-[10px] font-black text-gray-400">#{idx + 1}</span>
                          <span className="text-[11px] font-black text-rose-600">
                            {(p.discountedPrice || p.originalPrice || 0).toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60 h-full">
                    <FaExclamationTriangle className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-bold">Không có gợi ý nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecommendations;
