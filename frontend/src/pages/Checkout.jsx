import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useBlocker, Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuth from '../hooks/useAuth';
import orderApi from '../services/orderApi';
import Loading from '../components/Loading';
import MapPreview from '../components/MapPreview';
import { getRealLocation, searchAddressSuggestions, geocodeAddress } from '../utils/geolocation';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();

  // Buy Now item (if navigated from "Mua ngay" on Food Detail page or Modal)
  const buyNowItem = location.state?.buyNowItem;
  const isBuyNow = !!buyNowItem;

  // If Buy Now: only use that specific item; otherwise use cartStore items
  const checkoutItems = isBuyNow ? [buyNowItem] : items;

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
    paymentMethod: 'COD',
    couponCode: '',
  });

  const [coords, setCoords] = useState(
    user?.location?.lat && user?.location?.lng
      ? { lat: user.location.lat, lng: user.location.lng }
      : null
  );

  // Address search & autocomplete states
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceTimer = useRef(null);
  const geocodeDebounceTimer = useRef(null);

  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState(
    user?.address || 'Đang chọn vị trí nhận hàng...'
  );
  const isOrderSuccessRef = useRef(false);

  // Blocker to intercept navigation when user attempts to leave checkout without finishing order
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isOrderSuccessRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  // Intercept browser window/tab closing or reloading
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isOrderSuccessRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Calculate subtotal and quantities
  const totalItemCount = checkoutItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = isBuyNow
    ? ((buyNowItem.food.finalPrice || buyNowItem.food.price) * buyNowItem.quantity)
    : getTotal();

  // Chi nhánh cửa hàng: MSon Food - Chi nhánh Hà Nội (Hồ Hoàn Kiếm)
  const STORE_LOCATION = {
    name: 'MSon Food - Chi nhánh Hà Nội',
    address: 'Số 1 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    lat: 21.0285,
    lng: 105.8542,
    ratePerKm: 5000, // 5.000đ cho 1km
  };

  // Hàm tính khoảng cách địa lý (Haversine Formula) theo km
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Tính khoảng cách thực tế từ Chi nhánh Hà Nội đến vị trí người dùng
  const distanceKm = coords?.lat && coords?.lng
    ? Math.max(0.5, calculateDistanceKm(STORE_LOCATION.lat, STORE_LOCATION.lng, coords.lat, coords.lng))
    : 3.0; // Khoảng cách mặc định 3km khi chưa định vị GPS

  // Phí giao hàng: 5.000đ cho 1km (làm tròn đến nghìn đồng, tối thiểu 5.000đ)
  const shippingFee = Math.max(
    5000,
    Math.round((distanceKm * STORE_LOCATION.ratePerKm) / 1000) * 1000
  );

  const discount = couponApplied ? couponApplied.discount : 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  // Redirect if no items to checkout
  if (checkoutItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Xử lý khi người dùng nhập tay địa chỉ (Tự động tìm kiếm gợi ý & geocode sang tọa độ)
  const handleAddressInputChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, address: val }));

    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    if (geocodeDebounceTimer.current) clearTimeout(geocodeDebounceTimer.current);

    if (!val || val.trim().length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 1. Tìm gợi ý nhanh
    searchDebounceTimer.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      const results = await searchAddressSuggestions(val);
      setAddressSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearchingAddress(false);
    }, 350);

    // 2. Tự động định vị trên bản đồ sau khi dừng gõ 900ms
    geocodeDebounceTimer.current = setTimeout(async () => {
      const geo = await geocodeAddress(val);
      if (geo) {
        setCoords({ lat: geo.lat, lng: geo.lng });
        const dist = calculateDistanceKm(
          STORE_LOCATION.lat,
          STORE_LOCATION.lng,
          geo.lat,
          geo.lng
        );
        const computedFee = Math.max(
          5000,
          Math.round((dist * STORE_LOCATION.ratePerKm) / 1000) * 1000
        );
        setLocationStatus(
          `${geo.formattedAddress} (${dist.toFixed(1)} km từ chi nhánh Hà Nội - Phí ship: ${computedFee.toLocaleString()}đ)`
        );
      }
    }, 900);
  };

  // Khi chọn một địa chỉ từ danh sách gợi ý
  const handleSelectAddressSuggestion = (suggestion) => {
    setFormData((prev) => ({ ...prev, address: suggestion.formattedAddress }));
    setCoords({ lat: suggestion.lat, lng: suggestion.lng });
    setShowSuggestions(false);
    setAddressSuggestions([]);

    const dist = calculateDistanceKm(
      STORE_LOCATION.lat,
      STORE_LOCATION.lng,
      suggestion.lat,
      suggestion.lng
    );
    const computedFee = Math.max(
      5000,
      Math.round((dist * STORE_LOCATION.ratePerKm) / 1000) * 1000
    );
    setLocationStatus(
      `${suggestion.formattedAddress} (${dist.toFixed(1)} km từ chi nhánh Hà Nội - Phí ship: ${computedFee.toLocaleString()}đ)`
    );
  };

  // Định vị thủ công từ chuỗi địa chỉ
  const handleManualGeocode = async () => {
    if (!formData.address || !formData.address.trim()) return;
    setIsGettingLocation(true);
    try {
      const geo = await geocodeAddress(formData.address);
      if (geo) {
        setCoords({ lat: geo.lat, lng: geo.lng });
        const dist = calculateDistanceKm(
          STORE_LOCATION.lat,
          STORE_LOCATION.lng,
          geo.lat,
          geo.lng
        );
        const computedFee = Math.max(
          5000,
          Math.round((dist * STORE_LOCATION.ratePerKm) / 1000) * 1000
        );
        setLocationStatus(
          `${geo.formattedAddress || formData.address} (${dist.toFixed(1)} km từ chi nhánh Hà Nội - Phí ship: ${computedFee.toLocaleString()}đ)`
        );
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Get current Real GPS position & exact street address
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationStatus('Đang định vị GPS & tính khoảng cách từ chi nhánh Hà Nội...');
    setError('');

    try {
      const loc = await getRealLocation();
      setCoords({ lat: loc.lat, lng: loc.lng });

      const dist = calculateDistanceKm(
        STORE_LOCATION.lat,
        STORE_LOCATION.lng,
        loc.lat,
        loc.lng
      );
      const computedFee = Math.max(
        5000,
        Math.round((dist * STORE_LOCATION.ratePerKm) / 1000) * 1000
      );

      setLocationStatus(
        `${loc.formattedAddress} (${dist.toFixed(1)} km từ chi nhánh Hà Nội - Phí ship: ${computedFee.toLocaleString()}đ)`
      );

      setFormData((prev) => ({
        ...prev,
        address: loc.formattedAddress,
      }));
      setShowSuggestions(false);
    } catch (err) {
      setError(err.message || 'Không thể lấy vị trí hiện tại');
      setLocationStatus('Vui lòng nhập địa chỉ nhận hàng tại Hà Nội hoặc khu vực của bạn');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = formData.couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    // Demo coupon codes
    if (code === 'MSON20' || code === 'GIAM20') {
      setCouponApplied({ code, discount: 20000, name: 'Giảm 20.000đ cho đơn đầu' });
      setCouponError('');
    } else if (code === 'FREESHIP') {
      setCouponApplied({ code, discount: shippingFee, name: 'Miễn phí giao hàng' });
      setCouponError('');
    } else if (code === 'MSON50') {
      setCouponApplied({ code, discount: 50000, name: 'Giảm 50.000đ cho đơn lớn' });
      setCouponError('');
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleRemoveCoupon = () => {
    setFormData({ ...formData, couponCode: '' });
    setCouponApplied(null);
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
        setError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
        setLoading(false);
        return;
      }

      // Tự động giải mã tọa độ nếu chưa có
      let currentCoords = coords;
      let computedDistance = distanceKm;
      let computedShippingFee = shippingFee;

      if (!currentCoords && formData.address.trim()) {
        const geo = await geocodeAddress(formData.address.trim());
        if (geo) {
          currentCoords = { lat: geo.lat, lng: geo.lng };
          computedDistance = Math.max(0.5, calculateDistanceKm(STORE_LOCATION.lat, STORE_LOCATION.lng, geo.lat, geo.lng));
          computedShippingFee = Math.max(5000, Math.round((computedDistance * STORE_LOCATION.ratePerKm) / 1000) * 1000);
        }
      }

      // Prepare order data (kèm shippingFee được tính toán)
      const orderData = {
        items: checkoutItems.map((item) => ({
          food: item.food._id || item.food.id,
          quantity: item.quantity,
          selectedVariant: item.food.selectedVariant || null,
          selectedSize: item.food.selectedSize || null,
          selectedToppings: item.food.selectedToppings || [],
          toppingsPrice: item.food.toppingsPrice || 0,
          note: item.food.note || '',
        })),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          note: formData.note.trim(),
        },
        shippingFee: computedShippingFee,
        distanceKm: Number(computedDistance.toFixed(1)),
        paymentMethod: formData.paymentMethod,
        ...(formData.couponCode.trim() && { couponCode: formData.couponCode.trim() }),
      };

      // Create order
      const response = await orderApi.createOrder(orderData);
      const createdOrder = response?.data || response;
      const orderId = createdOrder?._id || response?._id;

      // Mark order as completed synchronously so blocker does not block redirect
      isOrderSuccessRef.current = true;

      // Only clear cart if this was a regular cart checkout (not Buy Now)
      if (!isBuyNow) {
        clearCart();
      }

      // Redirect to Order Success page
      navigate(`/order-success/${orderId}`, {
        state: { order: createdOrder, message: 'Đặt hàng thành công!' },
      });
    } catch (err) {
      setError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= TOP HEADER & STEPPER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-10 pb-6 border-b border-gray-200/70">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Hoàn tất đơn hàng
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              Vui lòng kiểm tra lại thông tin giao hàng và giỏ hàng trước khi xác nhận.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-3 select-none">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#ea580c] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                1
              </span>
              <span className="text-xs font-bold text-gray-800 hidden sm:inline">Giỏ hàng</span>
            </div>

            <div className="w-8 sm:w-12 h-[2px] bg-[#ea580c]/60" />

            {/* Step 2 (Active) */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#a83210] text-white text-xs font-black flex items-center justify-center ring-4 ring-orange-100 shadow-sm">
                2
              </span>
              <span className="text-xs font-black text-[#a83210]">Thanh toán</span>
            </div>

            <div className="w-8 sm:w-12 h-[2px] bg-gray-200" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-medium text-gray-400 hidden sm:inline">Thành công</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-2xl text-red-700 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ================= MAIN CHECKOUT FORM ================= */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ================= LEFT COLUMN: SHIPPING & PAYMENT ================= */}
            <div className="lg:col-span-7 space-y-6">
              {/* CARD 1: THÔNG TIN NHẬN HÀNG */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-[#a83210] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Thông tin nhận hàng
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Row 1: Họ tên & Số điện thoại */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ và tên */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Họ và tên <span className="text-[#a83210]">*</span>
                      </label>
                      <div className="bg-[#f8faff] border border-gray-200/80 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="Nguyễn Văn A"
                          className="bg-transparent focus:outline-none w-full text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                        />
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Số điện thoại <span className="text-[#a83210]">*</span>
                      </label>
                      <div className="bg-[#f8faff] border border-gray-200/80 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          placeholder="0901 234 567"
                          className="bg-transparent focus:outline-none w-full text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Địa chỉ giao hàng & Autocomplete Search */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Địa chỉ giao hàng <span className="text-[#a83210]">*</span>
                    </label>
                    <div className="bg-[#f8faff] border border-gray-200/80 rounded-2xl p-2 pl-3.5 flex items-center gap-2 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition relative z-20">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleAddressInputChange}
                        onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                        required
                        autoComplete="off"
                        placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..."
                        className="bg-transparent focus:outline-none w-full text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                      />
                      {isSearchingAddress && (
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mr-1" />
                      )}
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex-shrink-0 bg-[#fef2f0] hover:bg-[#fee4e0] text-[#c0391b] font-bold text-[11px] px-3 py-2 rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-[#c0391b]/10"
                      >
                        <svg className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="8" strokeWidth="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                        </svg>
                        <span>{isGettingLocation ? 'Đang định vị...' : 'Vị trí hiện tại'}</span>
                      </button>
                    </div>

                    {/* Floating Autocomplete Suggestions Dropdown */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 max-h-60 overflow-y-auto divide-y divide-gray-50">
                        <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Gợi ý địa chỉ</span>
                          <button
                            type="button"
                            onClick={() => setShowSuggestions(false)}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        {addressSuggestions.map((sug) => (
                          <button
                            key={sug.id}
                            type="button"
                            onClick={() => handleSelectAddressSuggestion(sug)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50/70 transition flex items-start gap-2.5 group cursor-pointer"
                          >
                            <span className="text-[#a83210] mt-0.5 flex-shrink-0">📍</span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 group-hover:text-[#a83210] truncate">
                                {sug.name || sug.formattedAddress}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">
                                {sug.formattedAddress}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Leaflet Map Preview */}
                  <MapPreview
                    coords={coords}
                    locationStatus={locationStatus}
                    distanceKm={distanceKm}
                  />

                  {/* Row 3: Ghi chú cho quán */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Ghi chú cho quán (Tùy chọn)
                    </label>
                    <div className="bg-[#f8faff] border border-gray-200/80 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <input
                        type="text"
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        placeholder="Thêm ít cay, không hành, giao giờ hành chính..."
                        className="bg-transparent focus:outline-none w-full text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: PHƯƠNG THỨC THANH TOÁN */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-[#a83210] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: COD (Selected style) */}
                  <label
                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center justify-between ${
                      formData.paymentMethod === 'COD'
                        ? 'border-[#a83210] bg-white ring-2 ring-orange-100/70 shadow-xs'
                        : 'border-gray-200 bg-[#f8faff] hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {/* Cash Icon */}
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="2" />
                          <circle cx="12" cy="12" r="3" strokeWidth="2" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900">
                          Tiền mặt (COD)
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Thanh toán khi nhận hàng.
                        </div>
                      </div>
                    </div>

                    {/* Checked Circle Indicator */}
                    {formData.paymentMethod === 'COD' && (
                      <div className="w-5 h-5 rounded-full bg-[#a83210] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>

                  {/* Option 2: Thẻ / Ví điện tử */}
                  <label
                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center justify-between ${
                      formData.paymentMethod === 'ONLINE'
                        ? 'border-[#a83210] bg-white ring-2 ring-orange-100/70 shadow-xs'
                        : 'border-gray-200 bg-[#f8faff] hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ONLINE"
                        checked={formData.paymentMethod === 'ONLINE'}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {/* Card Icon */}
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900">
                          Thẻ / Ví điện tử
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Chuyển hướng đến cổng thanh toán.
                        </div>
                      </div>
                    </div>

                    {/* Overlapping Badges */}
                    <div className="flex items-center -space-x-1.5 flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-red-400/80 border border-white" />
                      <div className="w-4 h-4 rounded-full bg-amber-400/90 border border-white" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: ORDER SUMMARY ================= */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 sticky top-20">
                {/* Header Strip with subtle warm blur */}
                <div className="bg-gradient-to-br from-orange-100/50 via-amber-50/30 to-white p-5 sm:p-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ea580c] text-white flex items-center justify-center shadow-xs">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                      Tóm tắt đơn hàng
                    </h3>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Items List */}
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1 divide-y divide-gray-100">
                    {checkoutItems.map((item, index) => {
                      const itemUnitPrice = item.food.finalPrice || item.food.price;
                      const itemTotal = itemUnitPrice * item.quantity;
                      const hasOptions =
                        item.food.selectedVariant ||
                        item.food.selectedSize ||
                        (item.food.selectedToppings && item.food.selectedToppings.length > 0) ||
                        item.food.note;

                      return (
                        <div
                          key={item.itemKey || `${item.food._id}-${index}`}
                          className="pt-3 first:pt-0 flex items-start gap-3.5"
                        >
                          {/* Image with Quantity Badge */}
                          <div className="relative flex-shrink-0">
                            {item.food.image ? (
                              <img
                                src={item.food.image}
                                alt={item.food.name}
                                className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-2xs"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <span className="absolute -top-1.5 -right-1.5 bg-[#a83210] text-white text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                              {item.quantity}
                            </span>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1">
                              {item.food.name}
                            </h4>

                            {/* Options Details (Combo, Size, Topping, Note) */}
                            {hasOptions && (
                              <div className="text-[11px] text-gray-500 mt-0.5 space-y-0.5">
                                {item.food.selectedVariant && (
                                  <div>Phần: {item.food.selectedVariant.name}</div>
                                )}
                                {item.food.selectedSize && (
                                  <div>Size: {item.food.selectedSize.name}</div>
                                )}
                                {item.food.selectedToppings?.length > 0 && (
                                  <div>Topping: {item.food.selectedToppings.map((t) => t.name).join(', ')}</div>
                                )}
                                {item.food.note && (
                                  <div className="italic text-gray-400">"{item.food.note}"</div>
                                )}
                              </div>
                            )}

                            {/* Price */}
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="font-extrabold text-xs sm:text-sm text-[#a83210]">
                                {itemTotal.toLocaleString()} đ
                              </span>
                              {item.food.price && item.food.price > itemUnitPrice && (
                                <span className="text-[11px] text-gray-400 line-through">
                                  {(item.food.price * item.quantity).toLocaleString()} đ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Code Input */}
                  <div className="mt-5">
                    <div className="bg-[#f0f4f9] border border-gray-200/80 rounded-2xl p-1.5 pl-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <input
                          type="text"
                          name="couponCode"
                          value={formData.couponCode}
                          onChange={handleChange}
                          disabled={!!couponApplied}
                          placeholder="Nhập mã giảm giá..."
                          className="bg-transparent focus:outline-none w-full text-xs text-gray-800 placeholder:text-gray-400 uppercase font-semibold"
                        />
                      </div>
                      {!couponApplied ? (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="text-[#a83210] hover:text-[#912b0e] font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Áp dụng
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-red-500 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    {couponError && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1 pl-1">
                        {couponError}
                      </p>
                    )}

                    {couponApplied && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1 pl-1 flex items-center gap-1">
                        <span>✓</span> {couponApplied.name} (-{couponApplied.discount.toLocaleString()}đ)
                      </p>
                    )}
                  </div>

                  {/* Pricing Breakdown Rows */}
                  <div className="mt-5 space-y-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tạm tính ({totalItemCount} món)</span>
                      <span className="font-bold text-gray-800">{subtotal.toLocaleString()} đ</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span>Phí giao hàng</span>{' '}
                        <span className="text-[11px] text-gray-400 font-semibold">
                          ({distanceKm.toFixed(1)} km - 5.000đ/km)
                        </span>
                      </div>
                      <span className="font-bold text-gray-800">{shippingFee.toLocaleString()} đ</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-[#a83210] font-bold">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                          Giảm giá
                        </span>
                        <span>-{discount.toLocaleString()} đ</span>
                      </div>
                    )}
                  </div>

                  {/* Dotted Perforated Line */}
                  <div className="border-b-2 border-dashed border-gray-200 my-5" />

                  {/* Total Amount Row */}
                  <div className="flex justify-between items-baseline mb-6">
                    <div>
                      <div className="text-base sm:text-lg font-black text-gray-900">
                        Tổng cộng
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium">
                        (Đã bao gồm VAT)
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#a83210] tracking-tight">
                      {total.toLocaleString()} đ
                    </div>
                  </div>

                  {/* Main CTA Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#a83210] hover:bg-[#912b0e] active:scale-98 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-orange-950/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loading size="sm" />
                    ) : (
                      <>
                        <span>ĐẶT HÀNG NGAY</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium mt-3.5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Thông tin được bảo mật mã hóa 256-bit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ================= MODAL XÁC NHẬN KHI RỜI KHỎI TRANG ================= */}
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 text-center animate-scaleIn border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Bạn có chắc muốn rời đi?
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Đơn hàng của bạn chưa hoàn tất. Nếu rời khỏi trang lúc này, các thông tin đang nhập sẽ không được lưu.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => blocker.reset()}
                  className="flex-1 px-4 py-3.5 bg-[#a83210] hover:bg-[#912b0e] text-white font-bold rounded-xl transition shadow-sm"
                >
                  Tiếp tục thanh toán
                </button>
                <button
                  type="button"
                  onClick={() => blocker.proceed()}
                  className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                >
                  Xác nhận rời đi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
