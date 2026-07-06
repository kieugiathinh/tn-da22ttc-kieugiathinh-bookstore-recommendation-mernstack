import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import { toast } from "react-toastify";
import { FaSave, FaSync, FaCogs, FaSlidersH, FaBalanceScale, FaUndo } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const AIConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States cho Hybrid Weights
  const [cfWeight, setCfWeight] = useState(40);
  const [cbfWeight, setCbfWeight] = useState(30);
  const [popWeight, setPopWeight] = useState(30);
  
  // States cho Interaction Weights
  const DEFAULT_INTERACTIONS = {
    view: 1, search_click: 2, add_to_cart: 3, favorite: 3.5,
    review: 4, purchase: 5, remove_cart: -3, remove_favorite: -3.5, low_rating: -4
  };
  const [interactionWeights, setInteractionWeights] = useState(DEFAULT_INTERACTIONS);

  const handleRestoreDefaults = () => {
    setCfWeight(40);
    setCbfWeight(30);
    setPopWeight(30);
    setInteractionWeights(DEFAULT_INTERACTIONS);
    toast.info("Đã khôi phục giá trị mặc định. Vui lòng bấm Lưu để áp dụng.");
  };

  const hybridData = [
    { name: "Lọc Cộng tác (CF)", value: cfWeight, color: "#4f46e5" }, // indigo-600
    { name: "Lọc Nội dung (CBF)", value: cbfWeight, color: "#059669" }, // emerald-600
    { name: "Bán chạy (Popularity)", value: popWeight, color: "#e11d48" } // rose-600
  ];

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const [hybridRes, interactionRes] = await Promise.all([
        userRequest.get("/config/HYBRID_WEIGHTS"),
        userRequest.get("/config/INTERACTION_WEIGHTS")
      ]);

      const hybrid = hybridRes.data.value;
      if (hybrid) {
        setCfWeight(hybrid.cf ?? 40);
        setCbfWeight(hybrid.cbf ?? 30);
        setPopWeight(hybrid.pop ?? 30);
      }

      const interactions = interactionRes.data.value;
      if (interactions) {
        setInteractionWeights(interactions);
      }
    } catch (error) {
      toast.error("Không thể tải cấu hình AI.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Handle Hybrid Change - Đảm bảo tổng = 100 theo thứ tự ưu tiên
  // Ưu tiên 1: Lọc cộng tác (CF) - Khi thay đổi, CBF và Pop chia đều phần còn lại
  // Ưu tiên 2: Lọc nội dung (CBF) - Khi thay đổi, CF giữ nguyên, Pop gánh phần còn lại
  // Ưu tiên 3: Phổ biến (Pop) - Khi thay đổi, CF giữ nguyên, CBF gánh phần còn lại
  const handleHybridChange = (type, value) => {
    let newVal = parseInt(value, 10);
    if (isNaN(newVal) || newVal < 0) newVal = 0;
    if (newVal > 100) newVal = 100;

    if (type === "cf") {
      setCfWeight(newVal);
      const remain = 100 - newVal;
      setCbfWeight(Math.floor(remain / 2));
      setPopWeight(Math.ceil(remain / 2));
    } else if (type === "cbf") {
      // CBF không được vượt quá (100 - CF)
      const maxCbf = 100 - cfWeight;
      const actualCbf = Math.min(newVal, maxCbf);
      setCbfWeight(actualCbf);
      setPopWeight(100 - cfWeight - actualCbf);
    } else if (type === "pop") {
      // Pop không được vượt quá (100 - CF)
      const maxPop = 100 - cfWeight;
      const actualPop = Math.min(newVal, maxPop);
      setPopWeight(actualPop);
      setCbfWeight(100 - cfWeight - actualPop);
    }
  };

  const handleInteractionChange = (key, value) => {
    let newVal = parseFloat(value);
    if (isNaN(newVal)) newVal = 0;
    setInteractionWeights(prev => ({ ...prev, [key]: newVal }));
  };

  const handleSave = async () => {
    // Validate Hybrid
    const total = cfWeight + cbfWeight + popWeight;
    if (total !== 100) {
      toast.error("Tổng tỉ lệ Thuật toán phải bằng 100%.");
      return;
    }

    try {
      setSaving(true);
      await Promise.all([
        userRequest.put("/config/HYBRID_WEIGHTS", {
          value: { cf: cfWeight, cbf: cbfWeight, pop: popWeight }
        }),
        userRequest.put("/config/INTERACTION_WEIGHTS", {
          value: interactionWeights
        })
      ]);
      toast.success("Đã lưu cấu hình! Vui lòng Huấn luyện lại (Retrain) để AI áp dụng trọng số mới.");
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải cấu hình..." />;


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
            <FaCogs className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Cấu hình Thuật toán AI
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Chỉnh sửa tỉ lệ pha trộn thuật toán và trọng số tương tác để thay đổi hành vi gợi ý.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRestoreDefaults}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all"
          >
            <FaUndo /> Mặc định
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-black text-sm transition-all shadow-md"
          >
            {saving ? <FaSync className="animate-spin" /> : <FaSave />}
            {saving ? "ĐANG LƯU..." : "LƯU CẤU HÌNH"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── HYBRID WEIGHTS ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FaBalanceScale className="text-indigo-500 text-xl" />
            <h2 className="text-lg font-bold text-gray-900">Tỉ lệ Thuật toán (Hybrid)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Điều chỉnh số lượng sách mà mỗi thuật toán sẽ đóng góp vào danh sách gợi ý. Tổng phải là 100%.
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">Lọc Cộng tác (Collaborative Filtering)</label>
                  <span className="text-indigo-600 font-black">{cfWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="100"
                  value={cfWeight}
                  onChange={(e) => handleHybridChange("cf", e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-gray-400">Gợi ý cá nhân hóa cao dựa trên thói quen của người dùng giống nhau.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">Lọc Nội dung (Content-Based)</label>
                  <span className="text-emerald-600 font-black">{cbfWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="100"
                  value={cbfWeight}
                  onChange={(e) => handleHybridChange("cbf", e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <p className="text-xs text-gray-400">Gợi ý sách tương tự với cuốn sách người dùng vừa xem gần đây.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">Bán chạy nhất (Popularity)</label>
                  <span className="text-rose-600 font-black">{popWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="100"
                  value={popWeight}
                  onChange={(e) => handleHybridChange("pop", e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <p className="text-xs text-gray-400">Sách hot trend làm mồi nhử cho nhóm người dùng mới (Cold Start).</p>
              </div>
            </div>

            {/* Biểu đồ Donut */}
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hybridData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {hybridData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'Tỉ lệ']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgb(0 0 0 / 0.1)' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-2xl font-black ${cfWeight + cbfWeight + popWeight === 100 ? "text-emerald-500" : "text-rose-500"}`}>
                    {cfWeight + cbfWeight + popWeight}%
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Tổng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERACTION WEIGHTS ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FaSlidersH className="text-indigo-500 text-xl" />
            <h2 className="text-lg font-bold text-gray-900">Trọng số Hành vi (Implicit Signals)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Mức điểm mà AI sẽ gán cho mỗi loại hành vi của người dùng khi huấn luyện mô hình.
          </p>

          {/* Nhóm Positive */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-emerald-600 mb-3 border-b border-emerald-100 pb-1 inline-block">Hành vi Tích cực</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "view", label: "Xem sản phẩm", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                { key: "search_click", label: "Click từ tìm kiếm", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
                { key: "add_to_cart", label: "Thêm vào giỏ", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
                { key: "favorite", label: "Yêu thích", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
                { key: "review", label: "Đánh giá tốt", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
                { key: "purchase", label: "Mua hàng", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              ].map(item => (
                <div key={item.key} className={`p-4 rounded-xl border ${item.bg} ${item.border}`}>
                  <label className={`block text-xs font-black uppercase tracking-wider ${item.color} mb-2`}>
                    {item.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center border ${item.border} rounded-lg overflow-hidden bg-white shadow-sm`}>
                      <button
                        type="button"
                        onClick={() => handleInteractionChange(item.key, ((parseFloat(interactionWeights[item.key]) || 0) - 0.5).toFixed(1))}
                        className={`px-3 py-1.5 ${item.bg} ${item.color} hover:opacity-80 font-black border-r ${item.border} transition-colors`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={interactionWeights[item.key]}
                        onChange={(e) => handleInteractionChange(item.key, e.target.value)}
                        className="w-14 px-2 py-1.5 text-center font-bold text-gray-800 border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleInteractionChange(item.key, ((parseFloat(interactionWeights[item.key]) || 0) + 0.5).toFixed(1))}
                        className={`px-3 py-1.5 ${item.bg} ${item.color} hover:opacity-80 font-black border-l ${item.border} transition-colors`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">điểm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nhóm Negative */}
          <div>
            <h3 className="text-sm font-bold text-rose-600 mb-3 border-b border-rose-100 pb-1 inline-block">Hành vi Tiêu cực</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "remove_cart", label: "Xóa khỏi giỏ", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
                { key: "remove_favorite", label: "Bỏ yêu thích", color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
                { key: "low_rating", label: "Đánh giá thấp", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" }
              ].map(item => (
                <div key={item.key} className={`p-4 rounded-xl border ${item.bg} ${item.border}`}>
                  <label className={`block text-xs font-black uppercase tracking-wider ${item.color} mb-2`}>
                    {item.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center border ${item.border} rounded-lg overflow-hidden bg-white shadow-sm`}>
                      <button
                        type="button"
                        onClick={() => handleInteractionChange(item.key, ((parseFloat(interactionWeights[item.key]) || 0) - 0.5).toFixed(1))}
                        className={`px-3 py-1.5 ${item.bg} ${item.color} hover:opacity-80 font-black border-r ${item.border} transition-colors`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={interactionWeights[item.key]}
                        onChange={(e) => handleInteractionChange(item.key, e.target.value)}
                        className="w-14 px-2 py-1.5 text-center font-bold text-gray-800 border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleInteractionChange(item.key, ((parseFloat(interactionWeights[item.key]) || 0) + 0.5).toFixed(1))}
                        className={`px-3 py-1.5 ${item.bg} ${item.color} hover:opacity-80 font-black border-l ${item.border} transition-colors`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">điểm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfig;
