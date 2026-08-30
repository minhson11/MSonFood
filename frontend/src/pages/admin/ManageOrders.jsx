import { useState, useEffect } from 'react';
import { adminOrderApi } from '../../services/adminApi';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
  });

  // Accurate Status configurations
  const statusConfig = {
    pending: { 
      label: 'Chờ xác nhận', 
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'CXN',
      badgeColor: 'bg-amber-500',
      nextAction: 'confirmed',
      nextLabel: 'Xác nhận đơn',
      nextBtnColor: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    confirmed: { 
      label: 'Đã xác nhận', 
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'DXN',
      badgeColor: 'bg-blue-500',
      nextAction: 'preparing',
      nextLabel: 'Chuẩn bị món',
      nextBtnColor: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    preparing: { 
      label: 'Đang chuẩn bị', 
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'DCB',
      badgeColor: 'bg-purple-500',
      nextAction: 'shipping',
      nextLabel: 'Giao hàng',
      nextBtnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white'
    },
    shipping: { 
      label: 'Đang giao hàng', 
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badge: 'DGH',
      badgeColor: 'bg-indigo-500',
      nextAction: 'completed',
      nextLabel: 'Hoàn thành đơn',
      nextBtnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    completed: { 
      label: 'Đã hoàn thành', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: '✓',
      badgeColor: 'bg-emerald-500',
      nextAction: null,
      nextLabel: null
    },
    cancelled: { 
      label: 'Đã hủy', 
      color: 'bg-red-50 text-red-700 border-red-200',
      badge: '✕',
      badgeColor: 'bg-red-500',
      nextAction: null,
      nextLabel: null
    },
  };

  const allStatuses = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'shipping', label: 'Đang giao hàng' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  // Payment method icons
  const paymentIcons = {
    COD: { icon: '💵', label: 'Tiền mặt (COD)' },
    MOMO: { icon: '🔴', label: 'Momo' },
    VNPAY: { icon: '💳', label: 'VNPAY' },
    ONLINE: { icon: '💳', label: 'Thẻ / Ví điện tử' },
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [activeTab, currentPage, searchQuery]);

  // Auto-refresh every 10 seconds for real-time order tracking
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false);
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab, currentPage]);

  const fetchOrders = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await adminOrderApi.getAllOrders(params);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalOrders(response.pagination?.total || 0);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [allRes, pendingRes, confirmedRes, preparingRes, shippingRes, completedRes, cancelledRes] =
        await Promise.all([
          adminOrderApi.getAllOrders({ limit: 1 }),
          adminOrderApi.getAllOrders({ status: 'pending', limit: 1 }),
          adminOrderApi.getAllOrders({ status: 'confirmed', limit: 1 }),
          adminOrderApi.getAllOrders({ status: 'preparing', limit: 1 }),
          adminOrderApi.getAllOrders({ status: 'shipping', limit: 1 }),
          adminOrderApi.getAllOrders({ status: 'completed', limit: 1 }),
          adminOrderApi.getAllOrders({ status: 'cancelled', limit: 1 }),
        ]);

      setStats({
        all: allRes.pagination?.total || 0,
        pending: pendingRes.pagination?.total || 0,
        confirmed: confirmedRes.pagination?.total || 0,
        preparing: preparingRes.pagination?.total || 0,
        shipping: shippingRes.pagination?.total || 0,
        completed: completedRes.pagination?.total || 0,
        cancelled: cancelledRes.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Lỗi tải thống kê đơn hàng:', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await adminOrderApi.updateOrderStatus(orderId, newStatus);
      showToast(`Đã chuyển đơn hàng sang trạng thái: "${statusConfig[newStatus]?.label || newStatus}"`);
      
      // Update selected order in modal if open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }

      fetchOrders(false);
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    return {
      time: `${hours}:${minutes}`,
      date: isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN'),
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-white text-sm font-semibold animate-slide-in-right ${
            toastMessage.type === 'error' ? 'bg-red-600 shadow-red-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Quản lý đơn hàng
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Theo dõi và cập nhật trạng thái đơn hàng theo thời gian thực.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchOrders();
              fetchStats();
            }}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Làm mới danh sách đơn hàng"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="p-5 pb-0 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-thin">
            {[
              { id: 'all', label: 'Tất cả', count: stats.all },
              { id: 'pending', label: 'Chờ xác nhận', count: stats.pending, color: 'text-amber-600' },
              { id: 'confirmed', label: 'Đã xác nhận', count: stats.confirmed, color: 'text-blue-600' },
              { id: 'preparing', label: 'Đang chuẩn bị', count: stats.preparing, color: 'text-purple-600' },
              { id: 'shipping', label: 'Đang giao', count: stats.shipping, color: 'text-indigo-600' },
              { id: 'completed', label: 'Đã hoàn thành', count: stats.completed, color: 'text-emerald-600' },
              { id: 'cancelled', label: 'Đã hủy', count: stats.cancelled, color: 'text-red-600' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                      : 'bg-[#f8faff] text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="py-4 border-t border-gray-100">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo mã đơn, họ tên khách hàng, số điện thoại..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#f8faff] border border-gray-200/80 rounded-2xl text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="m-4">
            <ErrorMessage message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Table Content */}
        {loading && orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loading size="lg" />
            <span className="text-xs text-gray-400">Đang tải danh sách đơn hàng...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800">Không có đơn hàng nào</h3>
            <p className="text-xs text-gray-400 mt-1">Chưa có đơn hàng trong mục này.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8faff] border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Mã đơn hàng</th>
                  <th className="py-4 px-5">Khách hàng</th>
                  <th className="py-4 px-5">Tổng tiền</th>
                  <th className="py-4 px-5">Thanh toán</th>
                  <th className="py-4 px-5">Thời gian</th>
                  <th className="py-4 px-5">Trạng thái</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {orders.map((order) => {
                  const timeInfo = formatTime(order.createdAt);
                  const config = statusConfig[order.status] || statusConfig.pending;

                  return (
                    <tr key={order._id} className="hover:bg-orange-50/20 transition duration-150">
                      {/* Order Code & Badge */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 ${config.badgeColor} text-white rounded-xl flex items-center justify-center font-black text-xs shadow-2xs flex-shrink-0`}>
                            {config.badge}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900">
                              #ORD-{order._id.slice(-6).toUpperCase()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {order.items?.length || 0} món
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">
                          {order.shippingAddress?.fullName || order.user?.name || 'Khách hàng'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {order.shippingAddress?.phone || order.user?.phone || 'Chưa có SĐT'}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="py-4 px-5">
                        <span className="font-black text-orange-600 text-sm">
                          {(order.totalPrice || 0).toLocaleString()} <span className="text-xs underline">đ</span>
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-medium text-gray-700 text-xs">
                          <span>{paymentIcons[order.paymentMethod]?.icon || '💵'}</span>
                          <span>{paymentIcons[order.paymentMethod]?.label || order.paymentMethod}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-4 px-5 text-xs text-gray-500">
                        <div className="font-bold text-gray-800">{timeInfo.time}</div>
                        <div className="text-[11px] text-gray-400">{timeInfo.date}</div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-5">
                        <select
                          value={order.status}
                          disabled={order.status === 'completed' || order.status === 'cancelled' || actionLoading}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className={`${config.color} px-3 py-1.5 rounded-xl font-bold text-xs border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200 transition cursor-pointer disabled:cursor-default`}
                        >
                          {allStatuses.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions: View Detail */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end">
                          {/* Detail Modal Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order)}
                            className="p-2.5 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-xl transition cursor-pointer"
                            title="Xem chi tiết đơn hàng"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Hiển thị {orders.length} trên {totalOrders} đơn hàng
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* ================= MODAL: ORDER DETAIL & STATUS CONTROL ================= */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-gray-100 animate-scaleIn text-left space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${statusConfig[selectedOrder.status]?.badgeColor || 'bg-orange-500'} text-white font-black text-sm flex items-center justify-center shadow-xs`}>
                  {statusConfig[selectedOrder.status]?.badge || 'ORD'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    Đơn hàng #ORD-{selectedOrder._id.slice(-6).toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')} {new Date(selectedOrder.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${statusConfig[selectedOrder.status]?.color || ''}`}>
                      {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="bg-[#f8faff] p-4 rounded-2xl border border-gray-200/80 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Trạng thái hiện tại:</span>
                <span className="font-black text-sm text-gray-900">
                  {statusConfig[selectedOrder.status]?.label}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedOrder.status !== 'confirmed' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Xác nhận
                  </button>
                )}

                {selectedOrder.status !== 'preparing' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'preparing')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Chuẩn bị
                  </button>
                )}

                {selectedOrder.status !== 'shipping' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'shipping')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Giao hàng
                  </button>
                )}

                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'completed')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    ✓ Hoàn thành
                  </button>
                )}

                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>

            {/* Recipient & Delivery Info */}
            <div className="bg-[#f8faff] p-4 rounded-2xl border border-gray-200/80 text-xs space-y-1.5">
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>Thông tin giao nhận</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 pt-1">
                <div>
                  <span className="text-gray-400">Người nhận:</span> <strong className="text-gray-900">{selectedOrder.shippingAddress?.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Số điện thoại:</span> <strong className="text-gray-900">{selectedOrder.shippingAddress?.phone}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400">Địa chỉ:</span> <span className="font-semibold text-gray-900">{selectedOrder.shippingAddress?.address}</span>
                </div>
                {selectedOrder.shippingAddress?.note && (
                  <div className="sm:col-span-2 italic text-gray-500">
                    <span className="text-gray-400">Ghi chú:</span> "{selectedOrder.shippingAddress.note}"
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Món ăn trong đơn ({selectedOrder.items?.length || 0} món)</span>
              </h4>

              <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {selectedOrder.items?.map((item, iIdx) => (
                  <div key={item._id || iIdx} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      {item.food?.image || item.image ? (
                        <img
                          src={item.food?.image || item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                          🍽️
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{item.name || item.food?.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 space-y-0.5">
                          {item.selectedVariant && <div>Phần: {item.selectedVariant.name}</div>}
                          {item.selectedSize && <div>Size: {item.selectedSize.name}</div>}
                          {item.selectedToppings?.length > 0 && (
                            <div>Topping: {item.selectedToppings.map((t) => t.name).join(', ')}</div>
                          )}
                          {item.note && <div className="italic text-gray-400">"{item.note}"</div>}
                        </div>
                        <div className="text-gray-500 mt-1">
                          {(item.price || 0).toLocaleString()}đ × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="font-black text-gray-900 text-sm whitespace-nowrap">
                      {(item.subtotal || (item.price * item.quantity) || 0).toLocaleString()} đ
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary Breakdown */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs sm:text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-bold text-gray-800">{(selectedOrder.subtotal || 0).toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng {selectedOrder.distanceKm > 0 && `(${selectedOrder.distanceKm} km)`}</span>
                <span className="font-bold text-gray-800">{(selectedOrder.shippingFee || 0).toLocaleString()} đ</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-orange-600 font-bold">
                  <span>Giảm giá</span>
                  <span>-{(selectedOrder.discount || 0).toLocaleString()} đ</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between font-black text-gray-900 text-base">
                <span>Tổng thanh toán</span>
                <span className="text-orange-600">{(selectedOrder.totalPrice || 0).toLocaleString()} đ</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
