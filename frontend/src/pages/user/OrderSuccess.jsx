import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import orderApi from '../../services/orderApi';
import foodApi from '../../services/foodApi';
import Loading from '../../components/common/Loading';
import ProductCustomizationModal from '../../components/product/ProductCustomizationModal';

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recommendedFoods, setRecommendedFoods] = useState([]);
  const [selectedFoodForCustomization, setSelectedFoodForCustomization] = useState(null);



  useEffect(() => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch initial fresh data from database
    if (id) {
      fetchOrder(!order);
    }

    // Fetch recommended foods
    fetchRecommendedFoods();

    // Auto-poll order status every 4 seconds to reflect Admin status updates in real-time
    const interval = setInterval(() => {
      if (id) {
        fetchOrder(false);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = async (showFullLoading = false) => {
    try {
      if (showFullLoading) setLoading(true);
      setIsRefreshing(true);
      const res = await orderApi.getOrderById(id);
      const orderData = res.data?.order || res.data?.data || res.data || res;
      setOrder(orderData);
    } catch (err) {
      console.warn('Cannot fetch order:', err);
    } finally {
      if (showFullLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchRecommendedFoods = async () => {
    try {
      const res = await foodApi.getAllFoods({ limit: 8 });
      const foods = Array.isArray(res.data?.data)
        ? res.data.data
        : (Array.isArray(res.data?.foods) ? res.data.foods : (Array.isArray(res.data) ? res.data : []));
      setRecommendedFoods(foods.slice(0, 4));
    } catch (err) {
      console.warn('Cannot fetch recommendations:', err);
      setRecommendedFoods([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
        <Loading size="lg" />
      </div>
    );
  }

  // Calculate order metrics from real order response
  const orderCode = order?.orderNumber
    ? `#${order.orderNumber}`
    : order?._id
    ? `#ORD-${order._id.slice(-6).toUpperCase()}`
    : '#ORD-2024';

  const items = order?.items || [];
  const totalItemCount = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

  const subtotal = order?.subtotal !== undefined
    ? Number(order.subtotal)
    : items.reduce((acc, item) => acc + (item.subtotal || ((item.price || 0) * (item.quantity || 1))), 0);

  const shippingFee = order?.shippingFee !== undefined
    ? Number(order.shippingFee)
    : 15000;

  const distanceKm = order?.distanceKm !== undefined ? Number(order.distanceKm) : 0;
  const discount = order?.discount !== undefined ? Number(order.discount) : 0;

  const totalAmount = order?.totalPrice !== undefined
    ? Number(order.totalPrice)
    : Math.max(0, subtotal + shippingFee - discount);

  const rewardPoints = Math.max(1, Math.round(totalAmount / 10000));
  const estimatedMinutes = distanceKm > 0
    ? Math.round(15 + distanceKm * 2)
    : 30;

  const paymentMethodLabel = order?.paymentMethod === 'COD'
    ? 'Tiền mặt (COD)'
    : order?.paymentMethod === 'ONLINE'
    ? 'Thẻ / Ví điện tử'
    : order?.paymentMethod || 'Tiền mặt (COD)';

  // Status mapping & progress calculation
  const currentStatus = order?.status || 'pending';

  const getStatusDetails = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          text: 'Đã xác nhận',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          dotColor: 'bg-blue-500',
          progressPercent: '35%',
          stepIndex: 1,
          desc: 'Quán đã tiếp nhận và xác nhận đơn hàng của bạn.',
        };
      case 'preparing':
        return {
          text: 'Đang chuẩn bị',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          dotColor: 'bg-purple-500',
          progressPercent: '65%',
          stepIndex: 2,
          desc: 'Đầu bếp đang chế biến các món ăn nóng hổi.',
        };
      case 'shipping':
        return {
          text: 'Đang giao hàng',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dotColor: 'bg-indigo-500',
          progressPercent: '85%',
          stepIndex: 3,
          desc: 'Tài xế đang trên đường giao món đến bạn.',
        };
      case 'completed':
        return {
          text: 'Đã hoàn thành',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500',
          progressPercent: '100%',
          stepIndex: 4,
          desc: 'Đơn hàng đã được giao thành công. Chúc bạn ngon miệng!',
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: 'bg-red-50 text-red-700 border-red-200',
          dotColor: 'bg-red-500',
          progressPercent: '100%',
          stepIndex: -1,
          desc: 'Đơn hàng đã bị hủy.',
        };
      default:
        return {
          text: 'Chờ xác nhận',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dotColor: 'bg-amber-500',
          progressPercent: '15%',
          stepIndex: 0,
          desc: 'Đơn hàng đã gửi tới quán, đang chờ nhân viên duyệt.',
        };
    }
  };

  const statusInfo = getStatusDetails(currentStatus);

  const stepsList = [
    { label: 'Chờ xác nhận', key: 'pending' },
    { label: 'Đã xác nhận', key: 'confirmed' },
    { label: 'Đang chuẩn bị', key: 'preparing' },
    { label: 'Đang giao', key: 'shipping' },
    { label: 'Hoàn thành', key: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafc] py-8 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* ================= MAIN SUCCESS CARD ================= */}
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100/90 text-center transition-all duration-300">
          
          {/* Top Warm Banner Area */}
          <div className="bg-gradient-to-b from-[#fcf6f2] to-white pt-10 sm:pt-12 pb-6 px-6 sm:px-12">
            
            {/* Terracotta Circle Checkmark Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8b2b10] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#8b2b10]/20 mb-6 transform hover:scale-105 transition">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2.5">
              Đặt hàng thành công!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Cảm ơn bạn đã lựa chọn MSon Food. Món ngon của bạn đang được chuẩn bị.
            </p>
          </div>

          {/* Card Body */}
          <div className="px-5 sm:px-10 pb-8 space-y-6">
            
            {/* 4 Highlight Info Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
              
              {/* Tile 1: Mã đơn hàng */}
              <div className="bg-[#f0f5fb] rounded-2xl p-4 sm:p-5 border border-[#e2eaf5]/60 flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 tracking-wider uppercase block mb-1">
                  MÃ ĐƠN HÀNG
                </span>
                <span className="text-sm sm:text-lg font-black text-[#a83210] tracking-tight truncate">
                  {orderCode}
                </span>
              </div>

              {/* Tile 2: Tổng thanh toán */}
              <div className="bg-[#f0f5fb] rounded-2xl p-4 sm:p-5 border border-[#e2eaf5]/60 flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 tracking-wider uppercase block mb-1">
                  TỔNG THANH TOÁN
                </span>
                <span className="text-sm sm:text-lg font-black text-gray-900 tracking-tight">
                  {totalAmount.toLocaleString()} <span className="text-xs font-bold underline">đ</span>
                </span>
              </div>

              {/* Tile 3: Thanh toán */}
              <div className="bg-[#f0f5fb] rounded-2xl p-4 sm:p-5 border border-[#e2eaf5]/60 flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 tracking-wider uppercase block mb-1">
                  THANH TOÁN
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 tracking-tight truncate">
                  {paymentMethodLabel}
                </span>
              </div>

              {/* Tile 4: Trạng thái (Live updated) */}
              <div className="bg-[#f0f5fb] rounded-2xl p-4 sm:p-5 border border-[#e2eaf5]/60 flex flex-col justify-center relative group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 tracking-wider uppercase block">
                    TRẠNG THÁI
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchOrder(false)}
                    className="text-gray-400 hover:text-orange-600 transition cursor-pointer p-0.5"
                    title="Bấm để cập nhật trạng thái mới nhất"
                  >
                    <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
                  <span className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border inline-block w-fit ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Estimate Box & Progress Bar (Real-Time Status Flow) */}
            <div className="bg-[#fffdf8] border border-[#faecd8] rounded-2xl p-5 sm:p-6 text-left space-y-4">
              
              {/* Top Row: Estimate time & status description */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/60 text-[#a83210] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      Thời gian giao hàng dự kiến
                    </div>
                    <div className="text-lg sm:text-xl font-black text-gray-900">
                      {estimatedMinutes} Phút {distanceKm > 0 && <span className="text-xs font-normal text-gray-500">({distanceKm} km từ chi nhánh Hà Nội)</span>}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-gray-600 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                  {statusInfo.desc}
                </div>
              </div>

              {/* Dynamic Horizontal Progress Bar */}
              {currentStatus === 'cancelled' ? (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 text-center">
                  Đơn hàng này đã bị hủy.
                </div>
              ) : (
                <div className="pt-2">
                  <div className="w-full bg-gray-200/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8b2b10] h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: statusInfo.progressPercent }}
                    />
                  </div>
                  <div className="grid grid-cols-5 text-center mt-3 text-[10px] sm:text-[11px] font-semibold gap-1">
                    {stepsList.map((step, sIdx) => {
                      const isPast = sIdx < statusInfo.stepIndex;
                      const isCurrent = sIdx === statusInfo.stepIndex;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <span
                            className={`${
                              isCurrent
                                ? 'text-[#8b2b10] font-black scale-105'
                                : isPast
                                ? 'text-gray-800 font-bold'
                                : 'text-gray-400 font-medium'
                            } transition-colors`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ================= ORDER DETAILS BREAKDOWN (TÓM TẮT ĐƠN HÀNG) ================= */}
            {items.length > 0 && (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 text-left shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#a83210] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                      Chi tiết món ăn đã đặt ({totalItemCount} món)
                    </h3>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-100 space-y-3">
                  {items.map((item, idx) => {
                    const itemUnitPrice = Number(item.price) || 0;
                    const itemQty = Number(item.quantity) || 1;
                    const itemSubtotal = item.subtotal !== undefined ? Number(item.subtotal) : (itemUnitPrice * itemQty);
                    const foodImage = item.food?.image || item.image;
                    const foodName = item.name || item.food?.name || 'Món ăn';

                    const hasOptions =
                      item.selectedVariant ||
                      item.selectedSize ||
                      (item.selectedToppings && item.selectedToppings.length > 0) ||
                      item.note;

                    return (
                      <div key={item._id || idx} className="pt-3 first:pt-0 flex items-start gap-3.5">
                        {/* Image with Badge */}
                        <div className="relative flex-shrink-0">
                          {foodImage ? (
                            <img
                              src={foodImage}
                              alt={foodName}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-2xl border border-gray-100 shadow-2xs"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <span className="absolute -top-1.5 -right-1.5 bg-[#a83210] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                            {itemQty}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                            {foodName}
                          </h4>

                          {/* Options */}
                          {hasOptions && (
                            <div className="text-[11px] text-gray-500 mt-0.5 space-y-0.5">
                              {item.selectedVariant && (
                                <div>Phần: <span className="font-semibold text-gray-700">{item.selectedVariant.name}</span> {item.selectedVariant.price > 0 && `(+${item.selectedVariant.price.toLocaleString()}đ)`}</div>
                              )}
                              {item.selectedSize && (
                                <div>Size: <span className="font-semibold text-gray-700">{item.selectedSize.name}</span> {item.selectedSize.price > 0 && `(+${item.selectedSize.price.toLocaleString()}đ)`}</div>
                              )}
                              {item.selectedToppings?.length > 0 && (
                                <div>
                                  Topping: <span className="font-semibold text-gray-700">{item.selectedToppings.map(t => `${t.name}${t.price ? ` (+${t.price.toLocaleString()}đ)` : ''}`).join(', ')}</span>
                                </div>
                              )}
                              {item.note && (
                                <div className="italic text-gray-400">"{item.note}"</div>
                              )}
                            </div>
                          )}

                          {/* Price */}
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-[#a83210]">
                              {itemSubtotal.toLocaleString()} đ
                            </span>
                            <span className="text-[11px] text-gray-400">
                              ({itemUnitPrice.toLocaleString()} đ × {itemQty})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Information Box */}
                {order?.shippingAddress && (
                  <div className="bg-[#f8faff] border border-blue-100/60 rounded-xl p-3.5 text-xs text-gray-700 space-y-1">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-[#a83210]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>Địa chỉ nhận hàng:</span>
                    </div>
                    <div>
                      <strong className="text-gray-900">{order.shippingAddress.fullName}</strong> - {order.shippingAddress.phone}
                    </div>
                    <div className="text-gray-600">
                      {order.shippingAddress.address}
                    </div>
                    {order.shippingAddress.note && (
                      <div className="text-gray-500 italic">
                        Ghi chú: {order.shippingAddress.note}
                      </div>
                    )}
                  </div>
                )}

                {/* Pricing Summary Breakdown */}
                <div className="border-t border-gray-100 pt-3 space-y-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tạm tính ({totalItemCount} món)</span>
                    <span className="font-bold text-gray-800">{subtotal.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span>Phí giao hàng</span>{' '}
                      {distanceKm > 0 && (
                        <span className="text-[11px] text-gray-400 font-semibold">
                          ({distanceKm} km)
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-gray-800">{shippingFee.toLocaleString()} đ</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-[#a83210] font-bold">
                      <span>Giảm giá {order?.coupon?.code && `(${order.coupon.code})`}</span>
                      <span>-{discount.toLocaleString()} đ</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-2.5 flex justify-between items-baseline font-black text-gray-900 text-sm sm:text-base">
                    <span>Tổng thanh toán</span>
                    <span className="text-lg sm:text-xl text-[#a83210]">
                      {totalAmount.toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dual CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              
              {/* Button 1: Theo Dõi Đơn Hàng */}
              <button
                type="button"
                onClick={() => navigate(`/orders/${id || order?._id}`)}
                className="w-full sm:w-auto bg-[#8b2b10] hover:bg-[#74230d] text-white px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-[#8b2b10]/20 hover:shadow-lg transition active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <span>Theo Dõi Đơn Hàng</span>
              </button>

              {/* Button 2: Tiếp Tục Mua Sắm */}
              <Link
                to="/menu"
                className="w-full sm:w-auto bg-[#eef4fb] hover:bg-[#e2edf9] text-gray-700 font-bold text-xs sm:text-sm px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>←</span>
                <span>Tiếp Tục Mua Sắm</span>
              </Link>
            </div>
          </div>

          {/* Bottom Rewards Strip */}
          <div className="bg-[#eef4fd] px-6 py-3.5 border-t border-blue-100/50 flex items-center justify-center gap-2 text-xs font-semibold text-gray-700">
            <span className="text-[#a83210]">🏷️</span>
            <span>
              Bạn được tích luỹ <strong className="text-[#a83210] font-black">{rewardPoints} điểm</strong> MSon Rewards.
            </span>
          </div>
        </div>

        {/* ================= "CÓ THỂ BẠN SẼ THÍCH" SECTION ================= */}
        {recommendedFoods.length > 0 && (
        <div className="mt-14 sm:mt-16 text-left">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Có thể bạn sẽ thích
            </h2>
            <div className="w-12 h-1 bg-[#a83210] rounded-full mt-2" />
          </div>

          {/* Grid 4 Foods */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {recommendedFoods.map((food) => (
              <div
                key={food._id}
                onClick={() => setSelectedFoodForCustomization(food)}
                className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>

                {/* Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#a83210] transition-colors">
                    {food.name}
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm font-black text-[#a83210]">
                    {(food.finalPrice || food.price || 45000).toLocaleString()}{' '}
                    <span className="text-[11px] underline">đ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Product Customization Modal if user clicks any recommended dish */}
      {selectedFoodForCustomization && (
        <ProductCustomizationModal
          product={selectedFoodForCustomization}
          isOpen={!!selectedFoodForCustomization}
          onClose={() => setSelectedFoodForCustomization(null)}
        />
      )}
    </div>
  );
};

export default OrderSuccess;
