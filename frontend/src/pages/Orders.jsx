import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import orderApi from '../services/orderApi';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const formatOrderDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Hôm nay, ${timeStr}`;
  if (isYesterday) return `Hôm qua, ${timeStr}`;

  const dateStr = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${dateStr}, ${timeStr}`;
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [displayCount, setDisplayCount] = useState(6);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      setOrders(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Filter tabs definition
  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'preparing', label: 'Đang chuẩn bị' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'completed', label: 'Hoàn tất' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'pending') {
      return orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');
    }
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // Count active shipping / in-progress orders
  const activeShippingCount = useMemo(() => {
    return orders.filter((o) => o.status === 'shipping').length;
  }, [orders]);

  const visibleOrders = filteredOrders.slice(0, displayCount);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff4ed] text-[#c2410c] border border-[#fed7aa]">
            <svg className="w-3.5 h-3.5 text-[#ea580c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            <span>Đang giao</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#3730a3] border border-[#c7d2fe]">
            <svg className="w-3.5 h-3.5 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Hoàn tất</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
            <svg className="w-3.5 h-3.5 text-[#e11d48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Đã hủy</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#faf5ff] text-[#7e22ce] border border-[#e9d5ff]">
            <svg className="w-3.5 h-3.5 text-[#9333ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Đang chuẩn bị</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
            <svg className="w-3.5 h-3.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Đã xác nhận</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
            <svg className="w-3.5 h-3.5 text-[#d97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Chờ xác nhận</span>
          </span>
        );
    }
  };

  const getLeftStripeColor = (status) => {
    switch (status) {
      case 'shipping':
        return 'border-l-[#ea580c]';
      case 'completed':
        return 'border-l-[#15803d]';
      case 'cancelled':
        return 'border-l-[#e11d48]';
      case 'preparing':
        return 'border-l-[#9333ea]';
      default:
        return 'border-l-[#9a3407]';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[65vh] flex justify-center items-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="container-custom py-16">
        <ErrorMessage message={error} retry={fetchOrders} />
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen py-8 sm:py-10">
      <div className="container-custom max-w-6xl">
        
        {/* ── Header Title & Active Status ── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Lịch sử đơn hàng
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-normal">
            Quản lý và theo dõi trạng thái các đơn hàng của bạn.
          </p>

          {/* Active Orders Sub-Badge (Right Aligned or Inline) */}
          <div className="flex items-center justify-end -mt-5">
            {activeShippingCount > 0 ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#9a3407]">
                <span className="w-2 h-2 rounded-full bg-[#9a3407] animate-pulse" />
                <span>• {activeShippingCount} đơn đang giao</span>
              </div>
            ) : orders.length > 0 ? (
              <div className="text-xs text-gray-400 font-medium">
                • {orders.length} tổng số đơn
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Filter Tabs Bar (Pills) ── */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-7 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setDisplayCount(6);
                }}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#9a3407] text-white shadow-md shadow-[#9a3407]/25'
                    : 'bg-[#edf2fe] text-[#374151] hover:bg-[#e2eafd] hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Orders List ── */}
        {visibleOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-orange-50 text-[#9a3407] rounded-3xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-inner">
              🥡
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'all' ? 'Chưa có đơn hàng nào' : 'Không có đơn hàng nào trong mục này'}
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Hãy khám phá thực đơn đa dạng và chọn những món ăn yêu thích để đặt ngay nhé!
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#9a3407] hover:bg-[#832c05] text-white rounded-full font-bold text-sm shadow-md shadow-[#9a3407]/25 transition"
            >
              <span>Xem Thực Đơn</span>
              <span className="text-base">→</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const firstItem = order.items?.[0] || {};
              const firstItemImg = firstItem.food?.image || firstItem.image;
              const firstItemName = firstItem.name || firstItem.food?.name || 'Món ăn';
              const remainingCount = (order.items?.length || 1) - 1;
              const orderCode = `#MS-${order._id.slice(-4).toUpperCase()}`;

              // Sub-items string
              const subItemsText =
                remainingCount > 0
                  ? order.items
                      .slice(1)
                      .map((i) => i.name || i.food?.name)
                      .filter(Boolean)
                      .join(', ')
                  : firstItem.note || firstItem.selectedToppings?.map((t) => t.name).join(', ') || '';

              const isCancelled = order.status === 'cancelled';
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-2xl border border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all p-5 sm:p-6 border-l-[5px] ${getLeftStripeColor(
                    order.status
                  )} flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Thumbnail Image */}
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      {firstItemImg ? (
                        <img
                          src={firstItemImg}
                          alt={firstItemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#edf2fe] text-2xl text-gray-400">
                          🍜
                        </div>
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      {/* Code & Time */}
                      <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                        <span className="text-[#9a3407] font-bold">{orderCode}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400 font-normal">{formatOrderDate(order.createdAt)}</span>
                      </div>

                      {/* Main Title */}
                      <h3
                        className={`text-base sm:text-lg font-bold text-gray-900 truncate leading-snug tracking-tight ${
                          isCancelled ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {firstItemName}
                        {remainingCount > 0 && (
                          <span className="font-medium text-gray-500 ml-1.5 text-sm">
                            & {remainingCount} món khác
                          </span>
                        )}
                      </h3>

                      {/* Sub-items description */}
                      {subItemsText && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {subItemsText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status, Price & Action Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0">
                    {/* Status Badge */}
                    <div>{getStatusBadge(order.status)}</div>

                    {/* Total Price */}
                    <div className="text-right">
                      <div className={`text-xl sm:text-2xl font-black text-gray-900 ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                        {order.totalPrice?.toLocaleString()}đ
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <Link
                          to={`/orders/${order._id}`}
                          className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#edf2fe] hover:bg-[#e2eafd] text-gray-800 transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Đánh giá</span>
                          <span className="text-amber-500">★</span>
                        </Link>
                      ) : isCancelled ? (
                        <Link
                          to={`/orders/${order._id}`}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                        >
                          Chi tiết hủy
                        </Link>
                      ) : (
                        <Link
                          to={`/orders/${order._id}`}
                          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#9a3407] hover:bg-[#832c05] text-white shadow-md shadow-[#9a3407]/20 transition flex items-center gap-1.5"
                        >
                          <span>Xem chi tiết</span>
                          <span className="text-base leading-none">→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Load More / Refresh Button ── */}
        {filteredOrders.length > displayCount && (
          <div className="text-center mt-9">
            <button
              onClick={() => setDisplayCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Tải thêm đơn hàng</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;
