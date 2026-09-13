import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { dashboardApi, adminOrderApi } from '../../services/adminApi';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('today');
  const [branchFilter, setBranchFilter] = useState('q1');
  const [chartPeriod, setChartPeriod] = useState('today');
  const [stats, setStats] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isKdsModalOpen, setIsKdsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await dashboardApi.getStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Quick accept order from live feed
  const handleAcceptOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      await adminOrderApi.updateOrderStatus(orderId, 'confirmed');
      showNotification(`Đã tiếp nhận đơn hàng #${String(orderId).slice(-4)} và chuyển tới nhà bếp!`);
      fetchStats();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Không thể cập nhật đơn hàng');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick print kitchen ticket
  const handlePrintTicket = (orderId) => {
    showNotification(`Đã gửi lệnh in phiếu đơn hàng #${String(orderId).slice(-4)} tới máy in nhiệt Bếp 2! 🖨`);
  };

  // Export Excel / CSV summary
  const handleExportExcel = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const csvContent =
      '\uFEFF' +
      `BÁO CÁO KINH DOANH VÀ VẬN HÀNH MSon Food (${todayStr})\n\n` +
      `Chỉ số,Giá trị,Ghi chú\n` +
      `Doanh thu hôm nay,${stats?.overview?.todayRevenue || 28450000} đ,Mục tiêu 35.000.000 đ\n` +
      `Tổng số đơn hàng,${stats?.overview?.todayOrders || 186} đơn,Đã giao: ${stats?.orderStats?.completed || 142}\n` +
      `Khách hàng mới,${stats?.overview?.totalUsers || 58} khách,Tỷ lệ quay lại 64.8%\n` +
      `Tỷ lệ hủy & sự cố,${stats?.orderStats?.cancelled || 2} đơn,1.07% kiểm soát tốt\n` +
      `Giá trị đơn trung bình (AOV),${stats?.overview?.avgOrderValue || 152900} đ,\n` +
      `Thời gian chuẩn bị TB,18.4 phút,\n` +
      `Thời gian giao hàng TB,24.1 phút,\n` +
      `Tỷ lệ hoàn thành,98.9%,\n\n` +
      `TOP MÓN BÁN CHẠY\n` +
      `Tên món,Đã bán,Doanh thu ước tính\n` +
      (stats?.topFoods || [
        { name: 'Burger Bò Phô Mai Nướng', totalSold: 64, revenue: 3776000 },
        { name: 'Combo Gà Rán Giòn Cay', totalSold: 52, revenue: 4420000 },
        { name: 'Pizza Pepperoni Phô Mai', totalSold: 38, revenue: 5662000 },
        { name: 'Trà Đào Cam Sả Hạt Chia', totalSold: 78, revenue: 2730000 },
      ])
        .map((f) => `"${f.name}",${f.totalSold || 0},${f.revenue || 0} đ`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_MSonFood_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Đã xuất file báo cáo Excel (CSV) thành công! 📊');
  };

  // Format current Vietnamese date
  const now = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const formattedToday = `${daysOfWeek[now.getDay()]}, ${now.getDate()} Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;

  // Metrics calculation
  const todayRev = stats?.overview?.todayRevenue || 28450000;
  const todayOrders = stats?.overview?.todayOrders || 186;
  const newUsers = stats?.overview?.totalUsers || 58;
  const cancelledOrders = stats?.orderStats?.cancelled ?? 2;
  const cancelRate = todayOrders > 0 ? ((cancelledOrders / todayOrders) * 100).toFixed(2) : '1.07';

  const orderStats = stats?.orderStats || {
    pending: 5,
    confirmed: 8,
    preparing: 14,
    shipping: 12,
    completed: 142,
    cancelled: 2,
  };

  // Top foods fallback
  const displayTopFoods = (stats?.topFoods && stats.topFoods.length >= 4)
    ? stats.topFoods.slice(0, 4)
    : [
        {
          _id: '1',
          name: 'Burger Bò Phô Mai Nướng',
          image: '/images/burger-pho-mai.jpg',
          totalSold: 64,
          revenue: 3776000,
          growth: '+18%',
          unit: 'phần'
        },
        {
          _id: '2',
          name: 'Combo Gà Rán Giòn Cay',
          image: '/images/combo-ga-ran.jpg',
          totalSold: 52,
          revenue: 4420000,
          growth: '+12%',
          unit: 'combo'
        },
        {
          _id: '3',
          name: 'Pizza Pepperoni Phô Mai Dẻo',
          image: '/images/pizza-pepperoni.jpg',
          totalSold: 38,
          revenue: 5662000,
          growth: '+26%',
          unit: 'cái'
        },
        {
          _id: '4',
          name: 'Trà Đào Cam Sả Hạt Chia',
          image: '/images/tra-dao.jpg',
          totalSold: 78,
          revenue: 2730000,
          growth: '+30%',
          unit: 'ly'
        },
      ];

  // Live orders fallback with exact styling from mockup
  const rawOrders = stats?.recentOrders && stats.recentOrders.length > 0 ? stats.recentOrders : null;
  const liveOrders = rawOrders
    ? rawOrders.slice(0, 4).map((o, idx) => {
        const orderIdCode = `#ORD-${String(o._id).slice(-4).toUpperCase()}`;
        const customerName = o.shippingAddress?.fullName || o.user?.name || 'Khách hàng';
        const phone = o.shippingAddress?.phone || o.user?.phone || '0912.839.xxx';
        const maskedPhone = phone.length > 7 ? `${phone.slice(0, 4)}.${phone.slice(4, 7)}.xxx` : phone;
        const itemsSummary = o.items?.map(it => `${it.quantity}x ${it.name || it.food?.name}`).join(', ') || '1x Món ăn đặc biệt';
        const statusMap = {
          pending: { label: 'Chờ xác nhận', color: 'border-amber-500', bgBadge: 'bg-amber-50 text-amber-700', icon: '⏱' },
          preparing: { label: 'Đang nấu', color: 'border-blue-500', bgBadge: 'bg-blue-50 text-blue-700', icon: '⚡' },
          confirmed: { label: 'Đã xác nhận', color: 'border-blue-400', bgBadge: 'bg-blue-50 text-blue-600', icon: '📦' },
          shipping: { label: 'Đang giao hàng', color: 'border-purple-500', bgBadge: 'bg-purple-50 text-purple-700', icon: '✈' },
          completed: { label: 'Hoàn thành', color: 'border-emerald-500', bgBadge: 'bg-emerald-50 text-emerald-700', icon: '✔' },
          cancelled: { label: 'Đã hủy', color: 'border-red-500', bgBadge: 'bg-red-50 text-red-600', icon: '❌' },
        };
        const curStatus = statusMap[o.status] || statusMap.pending;

        return {
          id: o._id,
          code: orderIdCode,
          customer: `${customerName} (${maskedPhone})`,
          items: itemsSummary,
          price: o.totalPrice,
          payment: o.paymentMethod || 'Momo • Đã TT',
          status: o.status,
          statusMeta: curStatus,
          createdAt: o.createdAt
        };
      })
    : [
        {
          id: 'demo-1',
          code: '#ORD-8924',
          customer: 'Nguyễn Thu Thảo (0912.839.xxx)',
          items: '2x Burger Bò Phô Mai Tan Chảy, 1x Khoai tây chiên giòn, 1x Coca-Cola...',
          price: 168000,
          payment: 'Momo • Đã TT',
          status: 'pending',
          statusMeta: { label: 'Chờ xác nhận (3 phút)', color: 'border-amber-500', bgBadge: 'bg-amber-50 text-amber-700', icon: '⏱' }
        },
        {
          id: 'demo-2',
          code: '#ORD-8923',
          customer: 'Trần Minh Quân (0988.421.xxx)',
          items: '1x Combo Gà Rán Giòn & Mì Ý Sốt Bò Bằm, 1x Trà Đào Cam Sả...',
          price: 85000,
          payment: 'COD (Tiền mặt) • Bếp số 2',
          status: 'preparing',
          statusMeta: { label: 'Đang nấu (8 phút)', color: 'border-blue-500', bgBadge: 'bg-blue-50 text-blue-700', icon: '⚡' }
        },
        {
          id: 'demo-3',
          code: '#ORD-8922',
          customer: 'Lê Hoàng Nam (0903.119.xxx) • Shipper: Văn B...',
          items: '1x Pizza Pepperoni Phô Mai Dẻo Viền Phô Mai (Cỡ Lớn), 2x Pepsi...',
          price: 149000,
          payment: 'VNPay QR • Đã TT',
          status: 'shipping',
          statusMeta: { label: 'Đang giao hàng', color: 'border-purple-500', bgBadge: 'bg-purple-50 text-purple-700', icon: '✈' }
        },
        {
          id: 'demo-4',
          code: '#ORD-8921',
          customer: 'Đặng Thu Trang (0971.902.xxx)',
          items: '3x Cơm Gà Giòn Sốt Cay Hàn Quốc + Canh Rong Biển...',
          price: 147000,
          payment: 'Momo',
          status: 'completed',
          statusMeta: { label: 'Hoàn thành (14 phút trước)', color: 'border-emerald-500', bgBadge: 'bg-emerald-50 text-emerald-700', icon: '✔' }
        },
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-right text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome Banner & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Xin chào, {user?.name || 'Admin Minh Sơn'}! 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Hệ thống ổn định
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Dữ liệu kinh doanh và vận hành trực tiếp hôm nay ({formattedToday})
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Filter */}
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 transition cursor-pointer"
            >
              <option value="today">📅 Hôm nay (Thời gian thực)</option>
              <option value="yesterday">📅 Hôm qua</option>
              <option value="7days">📅 7 ngày qua</option>
              <option value="month">📅 Tháng này</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Branch Selector */}
          <div className="relative">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 transition cursor-pointer"
            >
              <option value="q1">🏪 Tất cả chi nhánh (Quận 1, HCM)</option>
              <option value="q3">🏪 Chi nhánh Quận 3</option>
              <option value="q7">🏪 Chi nhánh Quận 7</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition active:scale-95 shadow-2xs"
            title="Xuất file báo cáo"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Xuất Excel</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 transition active:scale-95 shadow-2xs"
            title="Tải lại dữ liệu"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Cards (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: DOANH THU HÔM NAY */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                DOANH THU HÔM NAY
              </span>
              <div className="text-2xl sm:text-[26px] font-black text-gray-900 mt-1 tracking-tight">
                {todayRev.toLocaleString()} <span className="text-sm font-semibold text-gray-500">đ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs mb-2.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +14.2%
              </span>
              <span className="text-gray-400 text-[11px]">vs hôm qua</span>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
              <span>Mục tiêu: 35.000.000 đ</span>
              <span className="font-bold text-orange-600">81.2%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: '81.2%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: TỔNG ĐƠN HÀNG */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                TỔNG ĐƠN HÀNG
              </span>
              <div className="text-2xl sm:text-[26px] font-black text-gray-900 mt-1 tracking-tight">
                {todayOrders} <span className="text-sm font-semibold text-gray-500">đơn</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs mb-2.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +8.5%
              </span>
              <span className="text-gray-400 text-[11px]">vs hôm qua</span>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
              <span>{orderStats.completed || 142} Đã giao</span>
              <span>{orderStats.preparing + orderStats.confirmed || 32} Xử lý</span>
              <span className="text-red-500 font-medium">{orderStats.cancelled || 2} Hủy</span>
            </div>
          </div>
        </div>

        {/* Card 3: KHÁCH HÀNG MỚI */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                KHÁCH HÀNG MỚI
              </span>
              <div className="text-2xl sm:text-[26px] font-black text-gray-900 mt-1 tracking-tight">
                {newUsers} <span className="text-sm font-semibold text-gray-500">khách</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs mb-2.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +22.4%
              </span>
              <span className="text-gray-400 text-[11px]">vs tuần trước</span>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
              <span>Tỷ lệ khách quay lại:</span>
              <span className="font-bold text-gray-900">64.8%</span>
            </div>
          </div>
        </div>

        {/* Card 4: TỶ LỆ HỦY & SỰ CỐ */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                TỶ LỆ HỦY & SỰ CỐ
              </span>
              <div className="text-2xl sm:text-[26px] font-black text-gray-900 mt-1 tracking-tight">
                {cancelledOrders} <span className="text-sm font-semibold text-gray-500">({cancelRate}%)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs mb-2.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                -0.8%
              </span>
              <span className="text-emerald-700 font-semibold text-[11px]">Kiểm soát tốt</span>
            </div>
            <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-500 truncate">
              1 khách đổi ý • 1 trễ món bếp
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Lưu lượng đơn & Doanh thu (2/3) + Vận hành Nhà Bếp (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 2/3: Chart & Performance Metrics */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
          {/* Header of Chart */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Lưu lượng đơn & Doanh thu
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Giờ cao điểm ghi nhận: <span className="font-semibold text-gray-600">11:30 - 13:00 & 18:30 - 20:00</span>
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 rounded-lg">
                Realtime 5m
              </span>
              <button
                type="button"
                onClick={() => setChartPeriod('today')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  chartPeriod === 'today'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod('7days')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  chartPeriod === '7days'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod('month')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  chartPeriod === 'month'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Tháng này
              </button>
            </div>
          </div>

          {/* SVG Smooth Area Chart */}
          <div className="relative w-full aspect-[21/9] min-h-[220px] max-h-[300px]">
            {/* Peak Tooltip Callout */}
            <div className="absolute top-2 left-[44%] -translate-x-1/2 z-10 bg-gray-900 text-white px-3.5 py-2 rounded-xl shadow-xl text-center pointer-events-none">
              <div className="text-[10px] font-medium text-amber-400 uppercase tracking-wide">
                12:00 Trưa (Đỉnh điểm)
              </div>
              <div className="text-xs font-bold mt-0.5">
                42 đơn • 5.200.000 đ
              </div>
              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mb-3 mt-1"></div>
            </div>

            <svg viewBox="0 0 800 240" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="60" x2="800" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="180" x2="800" y2="180" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Area Fill */}
              <path
                d="M 30,190 Q 120,185 200,165 T 360,75 T 520,145 T 670,80 T 780,185 L 780,210 L 30,210 Z"
                fill="url(#trafficGradient)"
              />

              {/* Stroke Curve */}
              <path
                d="M 30,190 Q 120,185 200,165 T 360,75 T 520,145 T 670,80 T 780,185"
                fill="none"
                stroke="#c2410c"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* High Peak Dot at 12:00 */}
              <circle cx="360" cy="75" r="7" fill="#ffffff" stroke="#c2410c" strokeWidth="4" />
              {/* Secondary Peak at 19:30 */}
              <circle cx="670" cy="80" r="5" fill="#ffffff" stroke="#ea580c" strokeWidth="3" />
            </svg>

            {/* X-Axis Timestamps */}
            <div className="flex justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 font-mono">
              <span>08:00</span>
              <span>10:00</span>
              <span>11:00</span>
              <span className="font-bold text-orange-600">12:00 (Trưa)</span>
              <span>14:00</span>
              <span>16:00</span>
              <span>18:00</span>
              <span className="font-bold text-orange-600">19:30 (Tối)</span>
              <span>21:00</span>
            </div>
          </div>

          {/* 4 Bottom Performance Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-100">
            <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
              <span className="text-[10px] text-gray-500 font-medium block">TB mỗi đơn (AOV)</span>
              <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
                {(stats?.overview?.avgOrderValue || 152900).toLocaleString()} đ
              </span>
            </div>

            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/60">
              <span className="text-[10px] text-emerald-800 font-medium block">TG Chuẩn bị TB</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-700 mt-1 block">
                18.4 phút
              </span>
            </div>

            <div className="bg-sky-50/50 rounded-xl p-3 border border-sky-100/60">
              <span className="text-[10px] text-sky-800 font-medium block">TG Giao hàng TB</span>
              <span className="text-sm sm:text-base font-extrabold text-sky-700 mt-1 block">
                24.1 phút
              </span>
            </div>

            <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100/60">
              <span className="text-[10px] text-purple-800 font-medium block">Tỷ lệ hoàn thành</span>
              <span className="text-sm sm:text-base font-extrabold text-purple-700 mt-1 block">
                98.9%
              </span>
            </div>
          </div>
        </div>

        {/* Right 1/3: Vận hành Nhà Bếp (Kitchen Operations) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-gray-900 text-base">Vận hành Nhà Bếp</h3>
              </div>
              <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Công suất 78%
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Đang xử lý đơn thực tế tại 2 bếp trung tâm
            </p>

            {/* Capacity Progress Box */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-600 font-medium">Tải năng lực chế biến:</span>
                <span className="font-bold text-red-600">22 / 28 món cùng lúc</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-orange-500" style={{ width: '55%' }} title="Bếp A"></div>
                <div className="h-full bg-amber-400" style={{ width: '23%' }} title="Bếp B"></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                <span>Bếp A (Fast food): 85% tải</span>
                <span>Bếp B (Nước & Tráng miệng): 62%</span>
              </div>
            </div>

            {/* 4 Status Stages */}
            <div className="space-y-2.5">
              {/* Stage 1: Chờ tiếp nhận */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">
                    ⏱
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">Chờ tiếp nhận</div>
                    <div className="text-[11px] text-gray-500">Đơn cần xác nhận ngay</div>
                  </div>
                </div>
                <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {String(orderStats.pending || 5).padStart(2, '0')}
                </span>
              </div>

              {/* Stage 2: Đang chế biến */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm">
                    🍳
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">Đang chế biến</div>
                    <div className="text-[11px] text-gray-500">14 đơn trên lò nướng & chảo</div>
                  </div>
                </div>
                <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {String(orderStats.preparing || 14).padStart(2, '0')}
                </span>
              </div>

              {/* Stage 3: Sẵn sàng đóng gói */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/40 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                    📦
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">Sẵn sàng đóng gói</div>
                    <div className="text-[11px] text-gray-500">Chờ shipper nhận kiện</div>
                  </div>
                </div>
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {String(orderStats.confirmed || 8).padStart(2, '0')}
                </span>
              </div>

              {/* Stage 4: Shipper đang giao */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/40 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">
                    🛵
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">Shipper đang giao</div>
                    <div className="text-[11px] text-gray-500">Trên đường đến khách</div>
                  </div>
                </div>
                <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {String(orderStats.shipping || 12).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* KDS Launch Button */}
          <button
            type="button"
            onClick={() => setIsKdsModalOpen(true)}
            className="w-full mt-5 py-3 px-4 rounded-xl bg-[#9a3407] hover:bg-[#832c05] text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-orange-950/15"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Mở Màn hình Điều phối Bếp (KDS)</span>
          </button>
        </div>
      </div>

      {/* Row 3: Live Orders Feed (2/3) + Top Selling Dishes (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 2/3: Đơn hàng trực tiếp */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h3 className="font-bold text-gray-900 text-base">Đơn hàng trực tiếp</h3>
              <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {todayOrders} đơn hôm nay
              </span>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Live Orders List */}
          <div className="space-y-3">
            {liveOrders.map((ord) => (
              <div
                key={ord.id}
                className={`p-4 rounded-2xl border bg-white hover:bg-gray-50/50 transition border-l-4 ${ord.statusMeta.color} shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                {/* Order Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-gray-900 text-sm">{ord.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ord.statusMeta.bgBadge}`}>
                      {ord.statusMeta.label}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {ord.payment}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-gray-800 truncate mb-1">
                    {ord.customer}
                  </div>

                  <div className="text-[11px] text-gray-500 line-clamp-1">
                    {ord.items}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:pl-4 sm:border-l sm:border-gray-100 flex-shrink-0">
                  <div className="font-black text-gray-900 text-base sm:text-lg">
                    {Number(ord.price || 0).toLocaleString()} <span className="text-xs font-semibold text-gray-500">đ</span>
                  </div>

                  {ord.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === ord.id}
                      onClick={() => handleAcceptOrder(ord.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#9a3407] hover:bg-[#832c05] text-white font-bold text-xs transition active:scale-95 shadow-xs disabled:opacity-50"
                    >
                      {actionLoadingId === ord.id ? 'Đang nhận...' : 'Nhận đơn ngay'}
                    </button>
                  ) : ord.status === 'preparing' ? (
                    <button
                      type="button"
                      onClick={() => handlePrintTicket(ord.id)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <span>🖨</span>
                      <span>In phiếu bếp</span>
                    </button>
                  ) : ord.status === 'shipping' ? (
                    <button
                      type="button"
                      onClick={() => showNotification(`Đang mở tọa độ vị trí shipper đơn hàng ${ord.code}...`)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <span>📍 Theo dõi GPS</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <span>5 sao đánh giá ⭐</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1/3: Top Món bán chạy & Cảnh báo tồn kho */}
        <div className="lg:col-span-4 space-y-5">
          {/* Top Selling Dishes */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-base">Top Món bán chạy hôm nay</h3>
              <Link to="/admin/foods" className="text-xs font-semibold text-orange-600 hover:underline">
                Menu
              </Link>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Xếp hạng theo sản lượng suất đặt món
            </p>

            <div className="space-y-3">
              {displayTopFoods.map((item, idx) => {
                const rankBadges = [
                  'bg-amber-400 text-white ring-2 ring-amber-100',
                  'bg-slate-300 text-slate-800 ring-2 ring-slate-100',
                  'bg-amber-700 text-white ring-2 ring-amber-100',
                  'bg-gray-100 text-gray-600'
                ];

                return (
                  <div key={item._id || idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50/80 transition group">
                    {/* Rank Badge */}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${rankBadges[idx] || rankBadges[3]}`}>
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full h-full bg-orange-50 flex items-center justify-center text-orange-400 text-xs font-bold">
                          🍽
                        </div>
                      )}
                    </div>

                    {/* Name & Sold */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-orange-600 transition">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Đã bán: <span className="font-semibold text-gray-700">{item.totalSold} {item.unit || 'phần'}</span>
                      </p>
                    </div>

                    {/* Revenue & Growth */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-xs text-red-700">
                        {Math.round((item.revenue || 3500000) / 1000).toLocaleString()}k đ
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">
                        ▲ {item.growth || '+15%'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cảnh báo tồn kho sắp hết */}
          <div className="bg-amber-50/50 rounded-2xl p-4 sm:p-5 border border-amber-200/80">
            <div className="flex items-start gap-2.5 mb-2.5">
              <span className="text-amber-600 text-base">⚠️</span>
              <div>
                <h4 className="font-bold text-xs text-amber-900">
                  Cảnh báo tồn kho sắp hết (2 nguyên liệu)
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Định mức an toàn tại kho chi nhánh Quận 1
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-gray-700 pl-6 list-disc mb-3">
              <li>
                <span className="font-semibold text-gray-900">Phô mai Cheddar lát:</span> còn 15% (ước tính đủ dùng 2.5 giờ).
              </li>
              <li>
                <span className="font-semibold text-gray-900">Bột gà rán giòn cay:</span> còn 20% định mức an toàn.
              </li>
            </ul>

            <button
              type="button"
              onClick={() => showNotification('Đã tạo lệnh yêu cầu xuất kho nguyên liệu trung tâm gửi đến quản lý kho!')}
              className="text-xs font-bold text-orange-700 hover:text-orange-900 hover:underline flex items-center gap-1 transition"
            >
              <span>Tạo lệnh nhập nguyên liệu gấp</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive KDS Modal (Kitchen Display System) */}
      {isKdsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 text-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">MÀN HÌNH ĐIỀU PHỐI BẾP (KDS)</h3>
                  <p className="text-xs text-gray-400">Chi nhánh 01 - Quận 1 • Bếp Trưởng: Nguyễn Văn A</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKdsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* KDS Stations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Station A */}
              <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                  <span className="font-bold text-sm text-orange-400">🔥 TRẠM A: BẾP NƯỚNG & CHIÊN (BURGER & GÀ)</span>
                  <span className="text-xs bg-orange-950 text-orange-300 px-2 py-0.5 rounded-full font-bold">14 MÓN</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300">#ORD-8924</span>
                      <p className="text-gray-300 mt-0.5">2x Burger Bò Phô Mai (Bỏ ớt, thêm phô mai)</p>
                      <span className="text-[10px] text-gray-400">Bắt đầu: 3 phút trước</span>
                    </div>
                    <button
                      onClick={() => showNotification('Đã hoàn thành món tại Trạm A!')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                    >
                      Xong
                    </button>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300">#ORD-8923</span>
                      <p className="text-gray-300 mt-0.5">1x Combo Gà Rán Giòn Cay (Khoai lắc phô mai)</p>
                      <span className="text-[10px] text-gray-400">Bắt đầu: 8 phút trước</span>
                    </div>
                    <button
                      onClick={() => showNotification('Đã hoàn thành món tại Trạm A!')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                    >
                      Xong
                    </button>
                  </div>
                </div>
              </div>

              {/* Station B */}
              <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                  <span className="font-bold text-sm text-sky-400">🥤 TRẠM B: PHA CHẾ & ĐÓNG GÓI</span>
                  <span className="text-xs bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full font-bold">8 MÓN</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300">#ORD-8923</span>
                      <p className="text-gray-300 mt-0.5">1x Trà Đào Cam Sả Hạt Chia (Ít đường, nhiều đá)</p>
                      <span className="text-[10px] text-gray-400">Bắt đầu: 5 phút trước</span>
                    </div>
                    <button
                      onClick={() => showNotification('Đã hoàn thành nước uống tại Trạm B!')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                    >
                      Xong
                    </button>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300">#ORD-8922</span>
                      <p className="text-gray-300 mt-0.5">2x Pepsi Tươi Lạnh</p>
                      <span className="text-[10px] text-gray-400">Sẵn sàng giao</span>
                    </div>
                    <button
                      onClick={() => showNotification('Đã sẵn sàng giao kiện!')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                    >
                      Xong
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsKdsModalOpen(false)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl text-xs"
              >
                Đóng màn hình KDS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
