import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import foodApi from '../services/foodApi';
import categoryApi from '../services/categoryApi';
import FoodCard from '../components/FoodCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import useAddToCartAnimation from '../hooks/useAddToCartAnimation';
import ProductCustomizationModal from '../components/product/ProductCustomizationModal';

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  
  // Custom toast for voucher & actions
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Modal state for featured dishes
  const [modalFood, setModalFood] = useState(null);
  const [modalMode, setModalMode] = useState('cart');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addToCartWithAnimation] = useAddToCartAnimation();

  // URL search and filter params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'popular';
  const priceFilter = searchParams.get('price') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page')) || 1;

  // Search input local state
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Featured Dishes Carousel Ref
  const featuredScrollRef = useRef(null);

  // 3 Promo Banner Slides (Auto-slide carousel)
  const PROMO_SLIDES = [
    {
      id: 1,
      image: '/banner-combo-1.jpg',
      tag: 'ƯU ĐÃI ĐỘC QUYỀN',
      title: 'COMBO SIÊU TIẾT KIỆM',
      description: 'Tiết kiệm đến 20% khi đặt combo gà giòn, burger và khoai tây cho nhóm bạn hoặc gia đình.',
      buttonText: 'Xem Combo ngay',
      priceText: 'Chỉ từ 85.000đ',
      categoryTarget: 'combo',
    },
    {
      id: 2,
      image: '/banner-combo-2.jpg',
      tag: 'SIÊU PHẨM GÀ RÁN',
      title: 'XÔ GÀ GIÒN BÙNG NỔ',
      description: 'Xô gà rán giòn rụm đậm đà gia vị thảo mộc, lớp vỏ siêu giòn, thịt mọng nước chuẩn vị.',
      buttonText: 'Đặt xô gà ngay',
      priceText: 'Chỉ từ 119.000đ',
      categoryTarget: 'chicken',
    },
    {
      id: 3,
      image: '/banner-combo-3.jpg',
      tag: 'MỚI RA MẮT',
      title: 'GÀ SỐT CAY & BỎNG GÀ',
      description: 'Đùi gà sốt cay hảo hạng kết hợp bỏng gà giòn tan và burger gà đậm đà khó cưỡng.',
      buttonText: 'Thưởng thức ngay',
      priceText: 'Chỉ từ 69.000đ',
      categoryTarget: 'chicken',
    },
  ];

  // Promo Banner Auto-Slide State
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const [isPromoHovered, setIsPromoHovered] = useState(false);

  // Auto advance slide every 4 seconds (pauses on hover)
  useEffect(() => {
    if (isPromoHovered) return;
    const interval = setInterval(() => {
      setCurrentPromoSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPromoHovered, PROMO_SLIDES.length]);

  const handlePrevPromo = () => {
    setCurrentPromoSlide((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1));
  };

  const handleNextPromo = () => {
    setCurrentPromoSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  // Hardcoded 8 Static Categories with Icons and Counts (matching reference design)
  // Mapping to backend category names if they match
  const staticCategories = [
    { id: 'burger', name: 'Burger', icon: '🍔', count: '24 món', matchName: 'Burger' },
    { id: 'chicken', name: 'Gà rán', icon: '🍗', count: '18 món', matchName: 'Chicken' },
    { id: 'pizza', name: 'Pizza', icon: '🍕', count: '15 món', matchName: 'Pizza' },
    { id: 'pasta', name: 'Mì Ý', icon: '🍝', count: '12 món', matchName: 'Mì Ý' },
    { id: 'rice', name: 'Cơm', icon: '🍚', count: '16 món', matchName: 'Cơm' },
    { id: 'fries', name: 'Ăn vặt', icon: '🍟', count: '20 món', matchName: 'French Fries' },
    { id: 'drinks', name: 'Đồ uống', icon: '🧋', count: '14 món', matchName: 'Drinks' },
    { id: 'combo', name: 'Combo', icon: '🎁', count: '9 món', matchName: 'Combo' },
  ];

  // 3 Featured Dishes matching reference design
  const featuredDishes = [
    {
      _id: 'feat-1',
      name: 'Burger Bò Phô Mai Đặc Biệt',
      description: 'Thịt bò Úc nướng than hồng, 2 lớp phô mai cheddar béo ngậy kèm sốt BBQ bí truyền.',
      price: 59000,
      originalPrice: 79000,
      rating: 4.9,
      reviewCount: '1.2k',
      badge: '🔥 Bán chạy nhất',
      tag: '• Tặng kèm nước',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
      isAvailable: true,
      category: { name: 'Burger' },
    },
    {
      _id: 'feat-2',
      name: 'Combo Gà Rán Giòn & Mì Ý',
      description: '1 Miếng Gà Rán Giòn + 1 Mì Ý Sốt Bò Bằm + 1 Ly Coca mát lạnh sảng khoái.',
      price: 85000,
      originalPrice: 110000,
      rating: 4.9,
      reviewCount: '980',
      badge: '⭐ TOP COMBO',
      badgeColor: 'bg-amber-500',
      tag: '• Tiết kiệm 25k',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop',
      isAvailable: true,
      category: { name: 'Combo' },
    },
    {
      _id: 'feat-3',
      name: 'Pizza Pepperoni Phô Mai Dẻo',
      description: 'Lớp xúc xích Ý cay nồng phủ ngập phô mai Mozzarella kéo sợi thơm béo vô tận.',
      price: 149000,
      originalPrice: 189000,
      rating: 4.8,
      reviewCount: '850',
      badge: '✨ MỚI RA MẮT',
      badgeColor: 'bg-emerald-600',
      tag: '• Đã bán 114 suất',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop',
      isAvailable: true,
      category: { name: 'Pizza' },
    },
  ];

  // Favorite states for featured dishes
  const [featuredFavs, setFeaturedFavs] = useState({});
  const toggleFeaturedFav = (id) => {
    setFeaturedFavs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch foods from backend
  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: 12,
        };

        if (search) params.search = search;
        
        // Find matching backend category id if category filter is active
        if (category) {
          // If category matches a backend category ID directly or matched by name
          const matchedCat = categories.find(
            (c) => c._id === category || c.name.toLowerCase() === category.toLowerCase()
          );
          if (matchedCat) {
            params.category = matchedCat._id;
          } else {
            params.category = category;
          }
        }

        // Map sorting
        if (sort === 'price_asc') params.sort = 'price_asc';
        else if (sort === 'price_desc') params.sort = 'price_desc';
        else if (sort === 'rating_desc') params.sort = 'rating_desc';
        else params.sort = 'createdAt';

        const response = await foodApi.getAllFoods(params);
        setFoods(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 12, total: response.data?.length || 0, totalPages: 1 });
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách món ăn');
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [search, category, sort, page, categories]);

  // Update URL params
  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset to page 1 unless updating page directly
    if (!('page' in updates)) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  // Handle category card click
  const handleCategoryClick = (cat) => {
    // Find backend category that matches
    const matched = categories.find(
      (c) => c.name.toLowerCase() === cat.matchName.toLowerCase()
    );
    const targetValue = matched ? matched._id : cat.id;

    if (category === targetValue || category === cat.id) {
      updateParams({ category: '' });
    } else {
      updateParams({ category: targetValue });
    }
  };

  // Check if a static category is active
  const isCategoryActive = (cat) => {
    if (!category) return false;
    const matched = categories.find(
      (c) => c.name.toLowerCase() === cat.matchName.toLowerCase()
    );
    return category === cat.id || (matched && category === matched._id);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  // Copy Freeship code
  const handleCopyFreeship = () => {
    navigator.clipboard?.writeText('FREESHIP99K');
    showToast('🎉 Đã lưu mã FREESHIP99K vào giỏ hàng thành công!');
  };

  // Scroll to section helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter foods by price range and status if set
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      if (priceFilter === 'under_50' && food.price >= 50000) return false;
      if (priceFilter === '50_100' && (food.price < 50000 || food.price > 100000)) return false;
      if (priceFilter === 'above_100' && food.price <= 100000) return false;
      return true;
    });
  }, [foods, priceFilter]);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-5 z-50 bg-gray-900/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md border border-gray-700 animate-slide-in">
          <span className="text-xl">✨</span>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Product Customization Modal for Featured Items */}
      {modalFood && (
        <ProductCustomizationModal
          product={modalFood}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMode={modalMode}
        />
      )}

      <div className="container-custom pt-6 space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: HERO "KHÁM PHÁ THỰC ĐƠN"                                      */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
                <span>🔥</span>
                <span>HƠN 120+ MÓN NGON NÓNG HỔI</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                KHÁM PHÁ <span className="text-orange-600">THỰC ĐƠN</span>
              </h1>

              {/* Subtitle */}
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Khám phá những món ăn ngon được yêu thích nhất tại <strong className="text-gray-900">MSon Food</strong>. Hương vị chuẩn hảo hạng, nguyên liệu chọn lọc cao cấp và cam kết giao nhanh nóng hổi chỉ trong 30 phút.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => scrollTo('all-foods')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-full text-sm sm:text-base shadow-md shadow-orange-600/25 flex items-center gap-2 transition-all duration-200 hover:scale-102 active:scale-95"
                >
                  <span>Khám phá món ngon</span>
                  <span className="text-lg">↓</span>
                </button>

                <button
                  onClick={() => scrollTo('promo-banner')}
                  className="bg-white hover:bg-gray-50 text-gray-800 font-semibold px-5 py-3 rounded-full text-sm sm:text-base border border-gray-200 shadow-2xs flex items-center gap-2 transition-all duration-200"
                >
                  <span>🎁</span>
                  <span>Ưu đãi hôm nay</span>
                </button>
              </div>

              {/* 3 Trust Checkmarks */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 text-xs sm:text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-600 text-xs">🛡️</span>
                  <span>100% Thịt Tươi Sạch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-600 text-xs">⚡</span>
                  <span>Giao Thần Tốc 30 Phút</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 text-xs">🛡️</span>
                  <span>Chuẩn ATVSTP</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card with 3 Outside Floating Badges */}
            <div className="lg:col-span-5 relative py-3 sm:py-5 px-1 sm:px-3">
              {/* Badge 1: Nằm bên ngoài phía trên bên trái của ảnh banner */}
              <div className="absolute -top-3 left-0 sm:-top-4 sm:left-1 md:-top-5 md:-left-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center gap-2.5 select-none animate-float-menu-1">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                  ★
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">4.9 / 5.0</div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium whitespace-nowrap">10.000+ đánh giá</div>
                </div>
              </div>

              {/* Badge 2: Nằm bên ngoài phía trên bên phải của ảnh banner */}
              <div className="absolute top-6 -right-2 sm:top-8 sm:-right-4 md:top-10 md:-right-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center gap-2 select-none animate-float-menu-2">
                <span className="text-base sm:text-lg">🚀</span>
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">Giao nhanh 30p</div>
                  <div className="text-[9px] sm:text-[10px] text-orange-600 font-semibold whitespace-nowrap">Miễn phí ship 3km</div>
                </div>
              </div>

              {/* Badge 3: Nằm gối góc dưới bên trái vươn ra ngoài ảnh banner */}
              <div className="absolute -bottom-3 left-4 sm:-bottom-4 sm:left-8 md:-bottom-4 md:left-8 z-20 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-extrabold shadow-[0_10px_25px_rgba(234,88,12,0.35)] flex items-center gap-2 select-none animate-float-menu-3">
                <span className="text-sm">🔥</span>
                <span className="tracking-wide">Giảm 20% cho Combo</span>
              </div>

              {/* Clean Banner Image container with NO overlapping badges */}
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/11] shadow-xl border-4 border-white bg-gray-100 group">
                <img
                  src="/menu-hero.jpg"
                  alt="MSon Food Feast"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent"></div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: PROMO BANNER AUTO-SLIDER (3 Posters)                          */}
        {/* ========================================================================= */}
        <section
          id="promo-banner"
          className="relative rounded-3xl overflow-hidden shadow-xl min-h-[230px] sm:min-h-[270px] md:min-h-[290px] bg-gray-950 group select-none"
          onMouseEnter={() => setIsPromoHovered(true)}
          onMouseLeave={() => setIsPromoHovered(false)}
        >
          {/* Horizontal Slide Track with Smooth Transform */}
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentPromoSlide * 100}%)` }}
          >
            {PROMO_SLIDES.map((slide) => (
              <div
                key={slide.id}
                className="min-w-full w-full relative flex-shrink-0 min-h-[230px] sm:min-h-[270px] md:min-h-[290px] flex items-center"
              >
                {/* Background Image */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover object-center sm:object-right transition-transform duration-700 group-hover:scale-103"
                />

                {/* Left Dark Gradient Overlay so text is 100% readable while food pops on right */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent sm:w-2/3 pointer-events-none" />

                {/* Content on the left */}
                <div className="px-8 sm:px-14 py-6 sm:py-8 max-w-xl relative z-10 text-white">
                  {/* Tag */}
                  <div className="inline-block bg-orange-600 text-white text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-md">
                    {slide.tag}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2 drop-shadow-md">
                    {slide.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-200 text-xs sm:text-sm font-medium mb-5 leading-relaxed drop-shadow-xs max-w-md line-clamp-2">
                    {slide.description}
                  </p>

                  {/* Action Row */}
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => {
                        const targetCat = categories.find(
                          (c) => c.name.toLowerCase() === slide.categoryTarget.toLowerCase()
                        );
                        if (targetCat) {
                          updateParams({ category: targetCat._id });
                        } else {
                          updateParams({ category: slide.categoryTarget });
                        }
                        scrollTo('all-foods');
                      }}
                      className="bg-white hover:bg-orange-50 text-gray-900 font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      {slide.buttonText}
                    </button>
                    <span className="text-xs sm:text-sm font-black text-amber-300 drop-shadow-xs">
                      {slide.priceText}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left / Right Carousel Arrow Buttons */}
          <button
            type="button"
            onClick={handlePrevPromo}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-all z-20 cursor-pointer shadow-md opacity-80 hover:opacity-100 hover:scale-105 active:scale-95"
            title="Xem ưu đãi trước"
          >
            ❮
          </button>
          <button
            type="button"
            onClick={handleNextPromo}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-all z-20 cursor-pointer shadow-md opacity-80 hover:opacity-100 hover:scale-105 active:scale-95"
            title="Xem ưu đãi tiếp theo"
          >
            ❯
          </button>

          {/* Pagination Dots at Bottom Center */}
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {PROMO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPromoSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentPromoSlide
                    ? 'w-6 bg-white shadow-xs'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                title={`Chuyển đến slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: "DANH MỤC MÓN ĂN"                                              */}
        {/* ========================================================================= */}
        <section id="categories">
          {/* Header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Danh Mục Món Ăn
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-normal">
                Chọn danh mục để xem nhanh các món theo sở thích
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              8 Danh mục
            </span>
          </div>

          {/* Category Cards Horizontal Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
            {staticCategories.map((cat) => {
              const active = isCategoryActive(cat);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 group text-center ${
                    active
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 scale-102 border-transparent'
                      : 'bg-white hover:bg-orange-50/50 text-gray-800 border border-gray-200/80 shadow-2xs hover:border-orange-200'
                  }`}
                >
                  <span className="text-2xl mb-1 transition-transform duration-200 group-hover:scale-110">
                    {cat.icon}
                  </span>
                  <span className="text-xs font-bold leading-tight line-clamp-1 mb-1">
                    {cat.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 text-gray-400 group-hover:text-orange-600 group-hover:bg-orange-100/50'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: SEARCH & FILTER TOOLBAR                                       */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs space-y-3">
          {/* Row 1: Search input and dropdowns */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Bạn đang thèm món gì? (vd: burger bò, gà giòn, khoai tây...)"
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ search: '' });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-4 h-4 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown 1: Price Range */}
            <div className="md:col-span-2">
              <select
                value={priceFilter}
                onChange={(e) => updateParams({ price: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all">Khoảng giá (Tất cả)</option>
                <option value="under_50">Dưới 50.000đ</option>
                <option value="50_100">50.000đ - 100.000đ</option>
                <option value="above_100">Trên 100.000đ</option>
              </select>
            </div>

            {/* Dropdown 2: Status */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => updateParams({ status: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all">Trạng thái (Tất cả)</option>
                <option value="bestseller">Bán chạy</option>
                <option value="discount">Giảm giá sốc</option>
                <option value="new">Mới ra mắt</option>
              </select>
            </div>

            {/* Dropdown 3: Sort */}
            <div className="md:col-span-2">
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="popular">Sắp xếp: Phổ biến nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="rating_desc">Đánh giá: Cao nhất</option>
              </select>
            </div>
          </form>

          {/* Row 2: Quick suggestion tag chips & Results count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-400 font-medium">Gợi ý nhanh:</span>
              {[
                { label: '🔥 Gà rán', query: 'Gà' },
                { label: '🍔 Burger bò', query: 'Burger' },
                { label: '🍕 Pizza', query: 'Pizza' },
                { label: '🧋 Trà sữa', query: 'Trà' },
                { label: '🍟 Khoai tây', query: 'Khoai' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchInput(chip.query);
                    updateParams({ search: chip.query });
                  }}
                  className="bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Results count & Clear button */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-gray-500 font-semibold">
                {filteredFoods.length} món ăn được tìm thấy
              </span>
              {(search || category || priceFilter !== 'all' || statusFilter !== 'all' || sort !== 'popular') && (
                <button
                  onClick={handleClearFilters}
                  className="text-orange-600 hover:text-orange-700 font-bold underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: "MÓN NỔI BẬT HÔM NAY" (FEATURED DISHES)                        */}
        {/* ========================================================================= */}
        <section id="featured-dishes">
          {/* Section Header with Navigation Arrows */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌟</span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Món Nổi Bật Hôm Nay
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-normal">
                Top món ăn ngon được gọi nhiều nhất trong 24 giờ qua
              </p>
            </div>

            {/* Arrow navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (featuredScrollRef.current) {
                    featuredScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                  }
                }}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors shadow-2xs"
                title="Trước"
              >
                ❮
              </button>
              <button
                onClick={() => {
                  if (featuredScrollRef.current) {
                    featuredScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                  }
                }}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors shadow-2xs"
                title="Sau"
              >
                ❯
              </button>
            </div>
          </div>

          {/* 3 Featured Cards Grid */}
          <div
            ref={featuredScrollRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {featuredDishes.map((dish) => {
              const isFav = featuredFavs[dish._id];
              return (
                <div
                  key={dish._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1"
                >
                  {/* Image container */}
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Left Badge */}
                    <span
                      className={`absolute top-3 left-3 ${
                        dish.badgeColor || 'bg-red-600'
                      } text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1`}
                    >
                      {dish.badge}
                    </span>

                    {/* Favorite Button Top Right */}
                    <button
                      type="button"
                      onClick={() => toggleFeaturedFav(dish._id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-xs backdrop-blur-xs transition-all"
                      title={isFav ? 'Đã yêu thích' : 'Yêu thích món này'}
                    >
                      {isFav ? (
                        <span className="text-red-500 text-sm">❤️</span>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Rating & Special Tag */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="text-gray-900 font-bold">{dish.rating}</span>
                          <span className="text-gray-400 font-normal">({dish.reviewCount})</span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {dish.tag}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-extrabold text-base text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-1.5">
                        {dish.name}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">
                        {dish.description}
                      </p>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through leading-none mb-0.5">
                          {dish.originalPrice.toLocaleString()}đ
                        </span>
                        <span className="text-lg font-black text-red-700 tracking-tight leading-none">
                          {dish.price.toLocaleString()}đ
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick Add Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            addToCartWithAnimation(dish, 1, e.currentTarget);
                          }}
                          className="w-8 h-8 rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white flex items-center justify-center font-bold text-base transition-all duration-150 shadow-2xs active:scale-95"
                          title="Thêm nhanh vào giỏ"
                        >
                          +
                        </button>

                        {/* Mua ngay button */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalFood(dish);
                            setModalMode('buynow');
                            setIsModalOpen(true);
                          }}
                          className="bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs hover:shadow-sm active:scale-95 transition-all duration-150 whitespace-nowrap"
                        >
                          Mua ngay
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: "TẤT CẢ MÓN NGON" (4-COLUMNS FOOD GRID)                       */}
        {/* ========================================================================= */}
        <section id="all-foods">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Tất Cả Món Ngon
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-normal">
              Chọn món ăn nóng hổi được giao tận tay bạn sau 15 phút
            </p>
          </div>

          {/* Foods Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loading />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 p-8 shadow-xs">
              <div className="text-5xl mb-3">🍽️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Không tìm thấy món ăn phù hợp</h3>
              <p className="text-gray-500 text-xs mb-4">
                Vui lòng thử điều chỉnh lại từ khóa hoặc xóa bớt bộ lọc
              </p>
              <button
                onClick={handleClearFilters}
                className="btn-primary text-xs py-2 px-4 rounded-full font-bold"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredFoods.map((food, idx) => (
                <FoodCard
                  key={food._id}
                  food={food}
                  badgeType={
                    idx === 0
                      ? 'bestseller'
                      : idx === 1
                      ? 'bestseller'
                      : idx === 2
                      ? '-20%'
                      : idx === 3
                      ? 'new'
                      : idx % 4 === 0
                      ? 'bestseller'
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 7: PAGINATION & LOAD MORE BAR                                    */}
          {/* ========================================================================= */}
          {!loading && filteredFoods.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200/80 text-xs text-gray-600">
              {/* Left count */}
              <div>
                Hiển thị <span className="font-bold text-gray-900">{filteredFoods.length}</span> / {pagination.total || filteredFoods.length} món ăn
              </div>

              {/* Center Pagination Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Prev */}
                <button
                  onClick={() => updateParams({ page: page - 1 })}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-700 flex items-center justify-center font-bold transition-all shadow-2xs"
                  title="Trang trước"
                >
                  ❮
                </button>

                {/* Page numbers */}
                {[...Array(Math.min(pagination.totalPages || 3, 5))].map((_, index) => {
                  const pNum = index + 1;
                  const isCur = page === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => updateParams({ page: pNum })}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all shadow-2xs ${
                        isCur
                          ? 'bg-[#991b1b] text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                {pagination.totalPages > 5 && (
                  <>
                    <span className="px-1 text-gray-400">...</span>
                    <button
                      onClick={() => updateParams({ page: pagination.totalPages })}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all shadow-2xs ${
                        page === pagination.totalPages
                          ? 'bg-[#991b1b] text-white'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  onClick={() => updateParams({ page: page + 1 })}
                  disabled={page >= (pagination.totalPages || 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-700 flex items-center justify-center font-bold transition-all shadow-2xs"
                  title="Trang sau"
                >
                  ❯
                </button>
              </div>

              {/* Right: Load more button */}
              <div>
                <button
                  onClick={() => updateParams({ page: page + 1 })}
                  disabled={page >= (pagination.totalPages || 1)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700 shadow-2xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Tải thêm món</span>
                  <span className="text-sm">⟳</span>
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Menu;
