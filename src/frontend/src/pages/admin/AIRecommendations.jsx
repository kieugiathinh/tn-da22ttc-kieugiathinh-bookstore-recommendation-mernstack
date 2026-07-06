import LoadingSpinner from "../../components/admin/LoadingSpinner";
import React, { useEffect, useState } from "react";
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

const COLORS = ['#f59e0b', '#d97706', '#10b981', '#059669', '#3b82f6', '#2563eb', '#8b5cf6', '#6366f1'];

// ── METRIC CARD COMPONENT ──
const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle }) => (
  <div className={`rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-1 ${bgGradient} relative overflow-hidden group border border-white/20 backdrop-blur-sm`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 text-white/90">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight leading-none text-white drop-shadow-sm">{value}</h3>
        {subtitle && <p className="mt-2 text-sm font-medium text-white/80">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="text-2xl text-white" />
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
  const [simUserIdDisplay, setSimUserIdDisplay] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [simHistory, setSimHistory] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [users, setUsers] = useState([]);
  
  // States cho Thống kê (Biểu đồ)
  const [globalStats, setGlobalStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [recFunnel, setRecFunnel] = useState(null);

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
    
    const fetchUsers = async () => {
      try {
        const res = await userRequest.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách users", err);
      }
    };
    fetchUsers();

    const fetchGlobalStats = async () => {
      try {
        const res = await userRequest.get("/interactions/analytics/categories");
        setGlobalStats(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy thống kê toàn hệ thống", err);
      }
    };
    fetchGlobalStats();

    const fetchRecFunnel = async () => {
      try {
        const res = await userRequest.get("/stats/recommendation-funnel");
        setRecFunnel(res.data);
      } catch (err) {
        console.error("Lỗi lấy recommendation funnel", err);
      }
    };
    fetchRecFunnel();
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

  if (loading) return <LoadingSpinner text="Đang kết nối tới AI Service..." />;


  const dataSummary = health?.data_summary || {};
  const isOk = health?.status === "ok";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100/40 to-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 text-white">
            <FaMicrochip className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              AI Recommendation
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Trung tâm quản lý, theo dõi sức khỏe và giả lập hệ thống gợi ý cá nhân hóa.
            </p>
          </div>
        </div>
        
        {/* Status Badge & Retrain Button */}
        <div className="flex items-center gap-3 relative z-10">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold shadow-sm ${
            isOk ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
          }`}>
            {isOk ? <FaCheckCircle size={16} /> : <FaExclamationTriangle size={16} />}
            <span>{isOk ? "AI Online" : "AI Offline"}</span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining || !isOk}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white rounded-2xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <FaPlay className={retraining ? "animate-pulse text-amber-400" : "text-amber-400"} />
            {retraining ? "ĐANG HUẤN LUYỆN..." : "HUẤN LUYỆN LẠI"}
          </button>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {!isOk && health?.errors && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl shadow-sm flex gap-3">
          <FaExclamationTriangle className="text-rose-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-rose-800 font-bold mb-2">Cảnh báo lỗi kết nối Data:</h3>
            <ul className="list-disc ml-5 text-sm text-rose-700 font-medium space-y-1">
              {health.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ── DATA METRICS GRID ── */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <FaDatabase className="text-amber-500" /> Khối lượng Dữ liệu Huấn luyện
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard 
            title="Sản phẩm (Sách)" 
            value={(dataSummary.products?.count || 0).toLocaleString()} 
            icon={FaBookOpen} 
            bgGradient="bg-gradient-to-br from-amber-400 to-orange-500" 
          />
          <MetricCard 
            title="Đánh giá (Explicit)" 
            value={(dataSummary.ratings?.count || 0).toLocaleString()} 
            icon={FaStar} 
            bgGradient="bg-gradient-to-br from-orange-500 to-red-500"
            subtitle={`${dataSummary.ratings?.avg_rating || 0}★ TB`}
          />
          <MetricCard 
            title="Tương tác (Implicit)" 
            value={(dataSummary.interactions?.count || 0).toLocaleString()} 
            icon={FaHandPointer} 
            bgGradient="bg-gradient-to-br from-emerald-400 to-teal-500" 
            subtitle="Click / Cart"
          />
          <MetricCard 
            title="Lịch sử Mua" 
            value={(dataSummary.purchases?.count || 0).toLocaleString()} 
            icon={FaShoppingCart} 
            bgGradient="bg-gradient-to-br from-teal-500 to-cyan-600" 
          />
        </div>
      </div>

      {/* ── RECOMMENDATION FUNNEL ── */}
      {recFunnel && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <FaChartBar className="text-emerald-500" /> Hiệu Quả Gợi Ý AI
          </h2>
          <p className="text-sm text-gray-500 font-medium mb-5">Funnel: Khách xem sách từ gợi ý → Thêm giỏ → Mua. Chứng minh giá trị của thuật toán cá nhân hóa.</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: "Xem từ Gợi Ý", count: recFunnel.funnel[0]?.count, fill: "#f59e0b", icon: "👁️" },
              { label: "Thêm giỏ (từ GY)", count: recFunnel.funnel[1]?.count, fill: "#10b981", icon: "🛒" },
              { label: "Mua (từ GY)", count: recFunnel.funnel[2]?.count, fill: "#059669", icon: "✅" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 text-center transition-all hover:bg-gray-50">
                <p className="text-3xl mb-2">{item.icon}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
                <p className="text-3xl font-bold" style={{color: item.fill}}>{(item.count || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: "Xem → Giỏ hàng", rate: recFunnel.viewToCart, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Giỏ → Mua", rate: recFunnel.cartToPurchase, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Tổng: Xem → Mua", rate: recFunnel.viewToPurchase, color: "text-teal-600", bg: "bg-teal-50" },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-4 text-center border border-white/50`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color} mt-1`}>{item.rate}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── THỐNG KÊ TOÀN CỤC (GLOBAL STATS) ── */}
      {globalStats && globalStats.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <FaChartPie className="text-orange-500" /> Thống Kê Quan Tâm Toàn Hệ Thống
          </h2>
          <p className="text-sm text-gray-500 font-medium mb-6 max-w-3xl">
            Biểu đồ thể hiện tổng số lượt tương tác (xem, giỏ hàng, mua...) của tất cả người dùng phân bổ theo từng thể loại sách. Giúp Admin nắm bắt nhanh xu hướng thị trường hiện tại.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} />
                <RechartsTooltip 
                  cursor={{fill: '#fef3c7'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" name="Lượt tương tác" fill="#f59e0b" radius={[8, 8, 0, 0]} maxBarSize={60}>
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
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaRobot className="text-teal-500" /> Trình Giả Lập Gợi Ý (AI Sandbox)
          </h2>
        </div>
        <p className="text-sm text-gray-500 font-medium mb-6 max-w-3xl">
          Chọn người dùng từ danh sách để xem hồ sơ hoạt động (sách đã xem/mua) và kết quả gợi ý tương ứng mà AI phân tích cho họ.
        </p>

        <form onSubmit={handleSimulate} className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-8">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              required
              list="users-datalist"
              placeholder="Nhập tên hoặc email người dùng để tìm kiếm..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-sm font-bold bg-gray-50 focus:bg-white"
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
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black tracking-wide text-sm transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {simLoading ? <FaSync className="animate-spin" /> : <FaPlay />}
            {simLoading ? "ĐANG CHẠY..." : "MÔ PHỎNG"}
          </button>
        </form>

        {/* Kết quả Simulator */}
        {simResult && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Cột 1: Hồ Sơ Hành Vi */}
            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full bg-white">
              <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                <span className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                  <FaHandPointer className="text-amber-500" /> Hồ Sơ Thao Tác (Quá khứ)
                </span>
                <p className="text-xs text-gray-500 font-medium mt-1">Các sách khách hàng này đã tương tác gần đây.</p>
              </div>

              {/* Chart for User */}
              {userStats && userStats.length > 0 && (
                <div className="bg-white border-b border-gray-100 p-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FaChartPie className="text-amber-400" /> Phân bổ quan tâm
                  </p>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="category"
                          stroke="none"
                        >
                          {userStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
                {simHistory && simHistory.length > 0 ? (
                  <div className="space-y-3">
                    {simHistory.map((interaction, idx) => (
                      <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 transition-colors shadow-sm">
                        <img src={interaction.productId?.img} alt="book" className="w-12 h-16 object-contain rounded-xl drop-shadow-sm bg-white" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-2" title={interaction.productId?.title}>
                            {interaction.productId?.title || "Sách không tồn tại"}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-widest ${
                              interaction.interactionType === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
                              interaction.interactionType === 'add_to_cart' ? 'bg-amber-100 text-amber-700' :
                              interaction.interactionType === 'review' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {interaction.interactionType}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">{new Date(interaction.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                    <FaBookOpen className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-bold">Chưa có dữ liệu hành vi</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cột 2: Gợi Ý Thực Tế */}
            <div className="border border-emerald-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full bg-emerald-50/30">
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-teal-900 text-sm flex items-center gap-2">
                    <FaBookOpen className="text-emerald-500" /> Sách Gợi Ý Thực Tế
                  </span>
                  <p className="text-[11px] text-teal-700/70 font-medium mt-1">Kết quả Hybrid đang hiển thị trên trang chủ.</p>
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
                {simResult.actualProducts?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {simResult.actualProducts.map((p, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-emerald-100 p-3 flex flex-col items-center text-center shadow-sm relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        <div className="h-28 w-full flex items-center justify-center mb-2">
                          <img src={p.img} alt={p.title} className="h-full w-auto object-contain drop-shadow-sm" />
                        </div>
                        <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1 min-h-[32px]">{p.title}</h4>
                        
                        <p className="text-[9px] text-teal-600 font-medium mb-2 italic">
                          Thuật toán lai ghép
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
                  <div className="flex flex-col items-center justify-center py-10 opacity-50 h-full">
                    <FaExclamationTriangle className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-bold">Không có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cột 3: Gợi Ý AI (Dự đoán) */}
            <div className="border border-orange-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full bg-orange-50/30">
              <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-orange-900 text-sm flex items-center gap-2">
                    <FaRobot className="text-orange-500" /> Dự Đoán AI Thuần
                  </span>
                  <p className="text-[11px] text-orange-700/70 font-medium mt-1">Dự đoán user sẽ mua (Collaborative).</p>
                </div>
                <span className={`px-2 py-1 text-[9px] uppercase tracking-widest font-black rounded-lg border ${
                  simResult.isColdStart ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-orange-100 text-orange-700 border-orange-200"
                }`}>
                  {simResult.isColdStart ? "COLD START" : "AI SVD"}
                </span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
                {simResult.cfProducts?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {simResult.cfProducts.map((p, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-orange-100 p-3 flex flex-col items-center text-center shadow-sm relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        {/* AI Meta Badge */}
                        {!simResult.isColdStart && p._aiMeta?.predictedRating && (
                           <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md text-[10px] font-black px-2 py-0.5 rounded-lg transform rotate-3 z-10">
                             {p._aiMeta.predictedRating.toFixed(2)}★
                           </span>
                        )}
                        
                        <div className="h-28 w-full flex items-center justify-center mb-2">
                          <img src={p.img} alt={p.title} className="h-full w-auto object-contain drop-shadow-sm" />
                        </div>
                        <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1 min-h-[32px]">{p.title}</h4>
                        
                        <p className="text-[9px] text-orange-600 font-medium mb-2 italic">
                          Dựa vào hành vi tương đồng
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
                  <div className="flex flex-col items-center justify-center py-10 opacity-50 h-full">
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
