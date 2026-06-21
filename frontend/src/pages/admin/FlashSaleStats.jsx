import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { FaFire, FaTrophy, FaFrown, FaWarehouse, FaMoneyBillWave } from "react-icons/fa";
import PageHeader from "../../components/admin/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const FlashSaleStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await userRequest.get("/stats/flashsale-analytics");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch flash sale stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div className="text-center p-10 text-gray-500">Lỗi tải dữ liệu</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Thống Kê Flash Sale & Đề Xuất Xả Kho" subtitle="Phân tích hiệu quả chiến dịch giảm giá" />

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <FaFire size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng Số Chiến Dịch</p>
            <p className="mt-1 text-3xl font-black text-gray-900">{stats.totalCampaigns}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-green-500">
            <FaMoneyBillWave size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng Doanh Thu Flash Sale</p>
            <p className="mt-1 text-3xl font-black text-green-600">{stats.totalRevenue.toLocaleString()} đ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* TOP BÁN CHẠY TRONG FLASH SALE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" size={18} />
            <h3 className="font-bold text-gray-800">Top Bán Chạy Nhất (Flash Sale)</h3>
          </div>
          <div className="p-4 flex-1">
            {stats.topSoldProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-5">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-3">
                {stats.topSoldProducts.map((p, idx) => (
                  <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-6 font-black text-gray-300">#{idx + 1}</div>
                      <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200" />
                      <div>
                        <p className="font-bold text-gray-800 text-[13px] line-clamp-1">{p.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Giá gốc: {p.originalPrice?.toLocaleString()} đ</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-500">{p.soldCount} <span className="text-xs font-semibold text-gray-400 uppercase">đã bán</span></p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Doanh thu: {p.revenue?.toLocaleString()} đ</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TOP BÁN Ế TRONG FLASH SALE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FaFrown className="text-gray-400" size={18} />
            <h3 className="font-bold text-gray-800">Bán Kém Trong Flash Sale</h3>
          </div>
          <div className="p-4 flex-1">
            {stats.slowSellingProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-5">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-3">
                {stats.slowSellingProducts.map((p, idx) => (
                  <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border border-red-50 bg-red-50/20">
                    <div className="flex items-center gap-3">
                      <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200" />
                      <div>
                        <p className="font-bold text-gray-800 text-[13px] line-clamp-1">{p.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Đã cấp quota: {p.quantityLimit} quyển</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-red-500">{p.soldCount} <span className="text-xs font-semibold text-gray-400 uppercase">đã bán</span></p>
                      <p className="text-[11px] font-bold text-red-400 mt-0.5">{p.sellThroughRate.toFixed(1)}% tỉ lệ chốt</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ĐỀ XUẤT XẢ KHO */}
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaWarehouse className="text-primary" size={18} />
            <h3 className="font-bold text-gray-800">AI Đề Xuất Xả Kho (Hàng tồn lâu, bán chậm)</h3>
          </div>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-orange-200 shadow-sm">Có thể thêm vào Sale tiếp theo</span>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3.5">Sách</th>
                  <th className="px-5 py-3.5">Giá Gốc</th>
                  <th className="px-5 py-3.5 text-center">Tồn Kho</th>
                  <th className="px-5 py-3.5 text-center">Tổng Đã Bán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {stats.recommendedForSale.map(p => (
                  <tr key={p._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200" />
                      <div>
                        <p className="font-bold text-gray-800 text-[13px] line-clamp-1 max-w-[300px]">{p.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">ID: {p._id.slice(-6)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-semibold text-xs">{p.originalPrice?.toLocaleString()} đ</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-500 font-black text-sm border border-red-100">{p.countInStock}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-700">{p.sold}</td>
                  </tr>
                ))}
                {stats.recommendedForSale.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-400 text-sm">Kho hàng của bạn đang rất khỏe mạnh, không có sách tồn lâu bán ế!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleStats;
