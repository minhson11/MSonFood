import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import foodApi from '../../services/foodApi';
import useCartStore from '../../store/cartStore';
import ProductCustomizationModal from '../../components/product/ProductCustomizationModal';
import useAddToCartAnimation from '../../hooks/useAddToCartAnimation';

/* ─────────────────────────────────────────
   Helpers & Static Fallbacks
───────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả Combo' },
  { id: '1-2', label: 'Combo 1-2 Người' },
  { id: 'family', label: 'Combo Gia Đình (3-4 Người)' },
  { id: 'party', label: 'Combo Tiệc Nhóm (5+ Người)' },
  { id: 'flash', label: '⚡ Flash Deal', isSpecial: true }
];

const ComboHot = () => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [addToCartWithAnimation] = useAddToCartAnimation();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Modal customization
  const [modalFood, setModalFood] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('cart');

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');

  // Countdown timer state: 02h : 49m : 32s
  const [countdown, setCountdown] = useState({
    hours: 2,
    minutes: 49,
    seconds: 32
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Combo foods TRỰC TIẾP từ Database — không dùng ảnh cứng
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await foodApi.getAllFoods({ limit: 100 });
        const allFetched = Array.isArray(res.data) ? res.data : [];

        // Chỉ lấy các món thuộc danh mục Combo từ DB
        const comboFoods = allFetched.filter((f) => {
          const catName = (f.category?.name || '').toLowerCase();
          return catName === 'combo' || catName.includes('combo') || (f.name || '').toLowerCase().includes('combo');
        });

        const targetList = comboFoods.length > 0 ? comboFoods : allFetched;

        const processed = targetList.map((f) => {
          let comboGroup = f.comboGroup;
          if (!comboGroup) {
            const name = (f.name || '').toLowerCase();
            const p = Number(f.price) || 0;
            if (name.includes('đội nhóm') || name.includes('party') || name.includes('tiệc') || p >= 400000) {
              comboGroup = 'party';
            } else if (name.includes('gia đình') || name.includes('family') || name.includes('đột phá') || p >= 200000) {
              comboGroup = 'family';
            } else {
              comboGroup = '1-2';
            }
          }

          const items = (Array.isArray(f.items) && f.items.length > 0)
            ? f.items
            : (f.description ? f.description.split(/[+,]/).map((s) => s.trim()).filter(Boolean) : []);

          return {
            ...f,
            comboGroup,
            items,
            originalPrice: f.originalPrice || Math.round((f.price * 1.3) / 1000) * 1000,
            badge: f.badge || (f.price > 400000 ? 'TIỆC ĐÔNG SIÊU TIẾT KIỆM' : f.price > 200000 ? 'BEST SELLER #1' : 'HOT DEAL')
          };
        });

        setFoods(processed);
      } catch (err) {
        console.error('Error fetching combos from API:', err);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCombos();
  }, []);

  // 2 Deals Khủng Độc Quyền (dùng món thật từ DB)
  const dealFoods = useMemo(() => {
    // Ưu tiên món có tên chứa "Đột Phá" và "Hoàng Kim" hoặc 2 món combo đắt nhất
    const p1 = foods.find((f) => f.name.includes('Đột Phá')) || foods[0];
    const p2 = foods.find((f) => f.name.includes('Hoàng Kim') || f.name.includes('Xô Gà')) || foods[1];

    if (p1 && p2 && p1._id !== p2._id) {
      return [p1, p2];
    }

    return [...foods]
      .sort((a, b) => (b.originalPrice || b.price * 1.3) - (a.originalPrice || a.price * 1.3))
      .slice(0, 2);
  }, [foods]);

  const gridFoods = useMemo(() => {
    // Lấy phần còn lại (bỏ qua 2 deal foods)
    const dealIds = new Set(dealFoods.map((f) => f._id));
    const rest = foods.filter((f) => !dealIds.has(f._id));

    if (activeTab === 'all') return rest;
    if (activeTab === 'flash') {
      return [...foods]
        .sort((a, b) => {
          const discA = (a.originalPrice || a.price * 1.25) - a.price;
          const discB = (b.originalPrice || b.price * 1.25) - b.price;
          return discB - discA;
        })
        .slice(0, 6);
    }
    return rest.filter((f) => f.comboGroup === activeTab);
  }, [foods, activeTab, dealFoods]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Add directly to cart
  const handleQuickAdd = (food, event) => {
    event.stopPropagation();
    if (!food.isAvailable) return;

    addToCartWithAnimation(food, 1, event.currentTarget);
    showToast(`Đã thêm "${food.name}" vào giỏ hàng!`);
  };

  // Open customization modal
  const handleOpenCustomize = (food, mode = 'cart') => {
    setModalFood(food);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#fcfaf7] min-h-screen text-gray-800 pb-16 selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fadeIn border border-gray-700">
          <span className="text-xl">✅</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-6 pb-10 lg:pt-10 lg:pb-14 border-b border-orange-100/60 bg-gradient-to-b from-[#fff7ed]/50 via-[#fcfaf7] to-[#fcfaf7]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              {/* Badge */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-[#b91c1c] bg-[#fee2e2]/70 border border-[#fecaca]">
                  ƯU ĐÃI SIÊU CẤP • GIỜ VÀNG TIỆC TÙNG THẢ GA
                </span>
              </div>

              {/* Main Titles */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  Đại Tiệc Combo
                </h1>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#c2410c] tracking-tight leading-tight">
                  Càng Đông Càng Hời
                </h2>
              </div>

              {/* Filter Tabs / Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  if (tab.isSpecial) {
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-full text-xs font-black transition-all shadow-xs flex items-center gap-1 ${
                          isActive
                            ? 'bg-amber-400 text-gray-950 ring-2 ring-amber-500 scale-105'
                            : 'bg-[#fde047] hover:bg-yellow-300 text-gray-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-2xs ${
                        isActive
                          ? 'bg-[#991b1b] text-white shadow-sm ring-2 ring-[#991b1b]/20 scale-105'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:text-[#991b1b]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* 3 Quick Stat / Benefit Cards */}
              <div className="grid grid-cols-3 gap-3 pt-1 max-w-lg">
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-xs flex flex-col justify-center">
                  <span className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                    25 Phút
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium leading-snug mt-0.5">
                    Giao nóng giòn tận bàn
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-xs flex flex-col justify-center">
                  <span className="text-lg sm:text-xl font-black text-[#e11d48] leading-tight">
                    -35%
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium leading-snug mt-0.5">
                    Tiết kiệm tối đa
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-xs flex flex-col justify-center">
                  <span className="text-lg sm:text-xl font-black text-[#d97706] leading-tight">
                    x2 Điểm
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium leading-snug mt-0.5">
                    Tích luỹ thẻ hội viên
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Big Circular Hero Visual */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              <div className="relative w-72 sm:w-84 md:w-96 aspect-square rounded-full p-2 bg-gradient-to-tr from-orange-400/30 via-red-500/20 to-yellow-400/40 shadow-xl">
                {/* Inner Image Container */}
                <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-white shadow-inner bg-black/5">
                  <img
                    src="/combos/banner_combo_hot.jpg?v=2"
                    alt="Đại Tiệc Combo MSon Food"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = '/combos/hero_circle.png';
                    }}
                  />
                  {/* Bottom Arch Gradient & Text */}
                  <div className="absolute inset-x-0 bottom-0 pt-10 pb-4 px-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-center">
                    <p className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight drop-shadow-md">
                      Vị tiệc trọn vẹn, thỏa mãn mọi vị giác
                    </p>
                  </div>
                </div>

                {/* Overlapping Floating Badge */}
                <div className="absolute -bottom-2 left-2 sm:left-4 w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#c82333] to-[#8a1c14] text-white flex flex-col items-center justify-center shadow-2xl border-2 border-white transform -rotate-6 hover:rotate-0 transition-transform">
                  <span className="text-[9px] font-bold tracking-widest uppercase opacity-90 leading-tight">
                    CHỈ
                  </span>
                  <span className="text-xl sm:text-2xl font-black leading-none my-0.5">
                    69k
                  </span>
                  <span className="text-[9px] font-semibold opacity-90 leading-tight">
                    /Người
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. SECTION: DEAL KHỦNG ĐỘC QUYỀN
      ══════════════════════════════════════════════════════════════════ */}
      <section className="container-custom py-10 lg:py-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-pulse" />
              <span className="text-xs font-black text-[#dc2626] uppercase tracking-wider">
                TOP DEAL BÁN CHẠY HÔM NAY
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Deal Khủng Độc Quyền
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Các siêu phẩm cháy hàng liên tục được nâng cấp với mức giá ưu đãi kỷ lục.
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div className="inline-flex items-center gap-2 bg-[#f0f4f9] px-4 py-2 rounded-2xl border border-gray-200/80 shadow-2xs self-start md:self-auto">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Kết thúc sau:
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-red-600">
              <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* 2 Big Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {dealFoods.map((item, idx) => {
            const discPercent = item.originalPrice
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 30;

            return (
              <div
                key={item._id || idx}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {discPercent > 0 && (
                    <div className="absolute top-3.5 left-3.5 bg-[#dc2626] text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow">
                      -{discPercent}%
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {/* Top line: Tag & Rating */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider ${
                        idx === 0 ? 'text-[#b45309]' : 'text-[#dc2626]'
                      }`}
                    >
                      {item.badge || (idx === 0 ? 'BEST SELLER #1' : 'SIÊU CAY BÙNG NỔ')}
                    </span>
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <span className="text-amber-500">★</span> {item.rating || 4.9}{' '}
                      <span className="text-gray-400">({item.reviewCount || '1.4k+ đã đặt'})</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => handleOpenCustomize(item, 'cart')}
                    className="text-lg sm:text-xl font-black text-gray-900 mb-3 hover:text-orange-600 transition-colors cursor-pointer line-clamp-1"
                  >
                    {item.name}
                  </h3>

                  {/* Items List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-gray-600 mb-6 flex-1">
                    {item.items && item.items.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-1.5 truncate">
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div>
                      {item.originalPrice > item.price && (
                        <div className="text-xs text-gray-400 line-through leading-none mb-1">
                          {fmt(item.originalPrice)}đ
                        </div>
                      )}
                      <div className="text-xl sm:text-2xl font-black text-[#8a2512]">
                        {fmt(item.price)}đ
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleQuickAdd(item, e)}
                      className="bg-[#8a2512] hover:bg-[#721d0d] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>🛒</span>
                      <span>Thêm vào giỏ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. SECTION: KHÁM PHÁ CÁC GÓI COMBO HẤP DẪN
      ══════════════════════════════════════════════════════════════════ */}
      <section className="container-custom py-8 lg:py-12">
        {/* Section Header */}
        <div className="mb-7">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#ea580c] mb-1">
            THỰC ĐƠN ĐA DẠNG
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Khám Phá Các Gói Combo Hấp Dẫn
          </h2>
        </div>

        {/* 6 Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridFoods.map((combo, idx) => {
            return (
              <div
                key={combo._id || idx}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img
                    src={combo.image}
                    alt={combo.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Title */}
                  <h3
                    onClick={() => handleOpenCustomize(combo, 'cart')}
                    className="text-base sm:text-lg font-black text-gray-900 mb-3 hover:text-orange-600 transition-colors cursor-pointer line-clamp-1"
                  >
                    {combo.name}
                  </h3>

                  {/* Bullet points */}
                  <div className="space-y-1.5 text-xs text-gray-500 mb-5 flex-1">
                    {combo.items && combo.items.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-gray-400">•</span>
                        <span className="line-clamp-1">{bullet.replace(/^[•\s]+/, '')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Customization Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    <div>
                      {combo.originalPrice > combo.price && (
                        <div className="text-[11px] text-gray-400 line-through leading-none mb-1">
                          {fmt(combo.originalPrice)}đ
                        </div>
                      )}
                      <div className="text-lg font-black text-[#8a2512]">
                        {fmt(combo.price)}đ
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenCustomize(combo, 'cart')}
                      className="bg-[#fef1ec] hover:bg-[#fde4db] text-[#b93815] font-bold text-xs px-4 py-2 rounded-full transition-all shadow-2xs active:scale-95"
                    >
                      Tùy chỉnh & Đặt món
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. SECTION: ĐẶC QUYỀN KHI ĐẶT COMBO TIỆC
      ══════════════════════════════════════════════════════════════════ */}
      <section className="container-custom pt-8 pb-4">
        <div className="bg-[#eef5ff] rounded-3xl p-6 sm:p-10 border border-blue-100/90 shadow-xs">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#dc2626]">
              CAM KẾT TỪ BẾP TRƯỞNG MSON
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              Đặc Quyền Khi Đặt Combo Tiệc
            </h2>
          </div>

          {/* 3 White Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-blue-50/80 shadow-2xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center text-2xl mb-3 shadow-inner">
                ⚡
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                Giao Nhanh 25 Phút
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Giữ trọn độ giòn nóng sốt khi giao tận tay.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-blue-50/80 shadow-2xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center text-2xl mb-3 shadow-inner">
                🚚
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                Freeship Từ 200K
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Miễn phí vận chuyển bán kính 7km cho combo từ 200k.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-blue-50/80 shadow-2xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center text-2xl mb-3 shadow-inner">
                🏆
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                Tích Lũy x2 Điểm
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tích điểm nhân đôi, đổi voucher giảm giá hấp dẫn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. PRODUCT CUSTOMIZATION MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {modalFood && (
        <ProductCustomizationModal
          product={modalFood}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalFood(null);
          }}
          initialMode={modalMode}
        />
      )}
    </div>
  );
};

export default ComboHot;
