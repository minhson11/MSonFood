import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import foodApi from '../../services/foodApi';
import categoryApi from '../../services/categoryApi';
import Loading from '../../components/common/Loading';
import useAddToCartAnimation from '../../hooks/useAddToCartAnimation';
import ProductCustomizationModal from '../../components/product/ProductCustomizationModal';

// Icon SVG chuyên nghiệp cho từng danh mục THỰC TẾ của Database
const CATEGORY_META = {
  Burger: {
    label: 'Burger',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h16M4 16h16M6 12h12" />
        <path d="M3 10a1 1 0 001 1h16a1 1 0 001-1V8a5 5 0 00-5-5H8a5 5 0 00-5 5v2z" />
        <rect x="3" y="16" width="18" height="3" rx="1.5" />
      </svg>
    ),
  },
  Chicken: {
    label: 'Gà Rán',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3.5 5.5L8 20h8l-1.5-6.5C16.5 12.5 18 10.5 18 8c0-3.5-2.5-6-6-6z" />
        <path d="M10 8h4" />
      </svg>
    ),
  },
  Pizza: {
    label: 'Pizza',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L3 20h18L12 2z" />
        <circle cx="12" cy="13" r="1.5" fill="currentColor" />
        <circle cx="9" cy="16" r="1" fill="currentColor" />
        <circle cx="15" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
  },
  'French Fries': {
    label: 'Khoai Tây Chiên',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="11" width="12" height="9" rx="1" />
        <path d="M8 11V7m0 0l1-3m-1 3h2m6 4V7m0 0l-1-3m1 3h-2" />
      </svg>
    ),
  },
  Drinks: {
    label: 'Đồ Uống',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l1 16a1 1 0 001 1h10a1 1 0 001-1l1-16H5z" />
        <path d="M9 3V2m6 1V2M3 7h18" />
      </svg>
    ),
  },
  Combo: {
    label: 'Combo',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <circle cx="17" cy="13" r="4" />
        <path d="M9 11v6m8-10v6" />
      </svg>
    ),
  },
};

// Fallback metadata (không chứa ảnh cứng) — chỉ dùng khi API lỗi hoàn toàn
const SEED_FALLBACK_FOODS = [
  {
    _id: '6a8b0553688c47660469173c',
    name: 'Classic Beef Burger',
    description: 'Bò nướng than hoa mềm mọng kết hợp xà lách tươi, cà chua và sốt đặc biệt',
    price: 59000,
    image: '',
    category: { name: 'Burger' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c47660469174c',
    name: 'Gà Rán Giòn Cay',
    description: 'Gà rán da giòn tan với công thức 11 loại gia vị bí truyền đậm đà',
    price: 45000,
    image: '',
    category: { name: 'Chicken' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c476604691758',
    name: 'Pizza Pepperoni',
    description: 'Xúc xích Pepperoni Ý hảo hạng phủ ngập phô mai Mozzarella kéo sợi',
    price: 99000,
    image: '',
    category: { name: 'Pizza' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c476604691744',
    name: 'Cheese Burger',
    description: 'Nhân đôi bò Úc thượng hạng phủ phô mai Cheddar tan chảy thơm lừng',
    price: 69000,
    image: '',
    category: { name: 'Burger' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c476604691750',
    name: 'Cánh Gà Sốt Chua Cay',
    description: 'Cánh gà chiên giòn quyện đẫm sốt chua cay Buffalo cay nồng',
    price: 65000,
    image: '',
    category: { name: 'Chicken' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c476604691764',
    name: 'Pizza Gà Sốt BBQ',
    description: 'Gà nướng xé nhỏ cùng sốt BBQ khói, phô mai và hành tây caramel',
    price: 105000,
    image: '',
    category: { name: 'Pizza' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c47660469176b',
    name: 'Khoai Tây Lắc Phô Mai',
    description: 'Khoai tây nóng hổi lắc đẫm bột phô mai béo ngậy thơm lừng',
    price: 35000,
    image: '',
    category: { name: 'French Fries' },
    isAvailable: true,
  },
  {
    _id: '6a8b0553688c47660469177a',
    name: 'Burger Combo Tiết Kiệm',
    description: 'Gồm 1 Classic Beef Burger + 1 Khoai tây chiên giòn + 1 Coca Cola mát lạnh',
    price: 89000,
    image: '',
    category: { name: 'Combo' },
    isAvailable: true,
  },
];

const Home = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Modal customization & cart animation
  const [modalFood, setModalFood] = useState(null);
  const [modalMode, setModalMode] = useState('cart');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addToCartWithAnimation] = useAddToCartAnimation();

  // Đếm ngược Flash Deal: 02 : 45 : 06 (9906s)
  const [timeLeft, setTimeLeft] = useState(9906);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 9906));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdownUnit = (val) => String(val).padStart(2, '0');
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Chỉ lấy danh mục thực tế từ Database
        const categoriesResponse = await categoryApi.getAllCategories();
        const cats = categoriesResponse.data || [];
        setCategories(cats);

        // 2. Lấy toàn bộ món ăn thực tế từ Database
        const foodsResponse = await foodApi.getAllFoods({ limit: 50 });
        const foods = foodsResponse.data || [];
        if (foods.length > 0) {
          setAllFoods(foods);
        } else {
          setAllFoods(SEED_FALLBACK_FOODS);
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu từ database:', error);
        setAllFoods(SEED_FALLBACK_FOODS);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lọc món ăn theo danh mục đang chọn (nếu chọn 'all' thì hiển thị tất cả)
  const filteredFoods = allFoods.filter((food) => {
    if (selectedCategory === 'all') return true;
    const catName = food.category?.name || '';
    const catId = food.category?._id || food.category;
    return catName === selectedCategory || catId === selectedCategory;
  });

  // Tính số trang và lấy 8 món cho trang hiện tại
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage) || 1;
  const currentDishes = filteredFoods.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1 < totalPages ? prev + 1 : 0));
  };

  // Chọn 2 món thực tế từ database cho 2 thẻ Flash Deal
  const dealFood1 =
    allFoods.find((f) => f.name.includes('Gà Rán') || f.name.includes('Gà')) ||
    allFoods[1] ||
    null;

  const dealFood2 =
    allFoods.find((f) => f.name.includes('Combo') || f.name.includes('Burger')) ||
    allFoods[7] ||
    null;

  const handleQuickAdd = (food, e) => {
    e.stopPropagation();
    if (!food.isAvailable) return;
    if (
      (food.variants && food.variants.length > 0) ||
      (food.sizes && food.sizes.length > 0) ||
      (food.toppings && food.toppings.length > 0)
    ) {
      setModalFood(food);
      setModalMode('cart');
      setIsModalOpen(true);
    } else {
      addToCartWithAnimation(food, 1, e.currentTarget);
    }
  };

  const handleOpenDetail = (food) => {
    setModalFood(food);
    setModalMode('buynow');
    setIsModalOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/menu');
    }
  };

  const handleSuggestionClick = (keyword) => {
    setSearchQuery(keyword);
    navigate(`/menu?search=${encodeURIComponent(keyword)}`);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 1. HERO SECTION - Bố cục chuẩn ảnh, tông màu ấm áp sang trọng */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fff6ef] via-[#fff9f5] to-white pt-6 sm:pt-10 pb-10">
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Cột Trái: Tiêu đề, ô tìm kiếm & 3 tiện ích */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7">
              {/* Badge trên cùng */}
              <div className="inline-flex items-center gap-2 bg-[#fff0eb] text-[#ea580c] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#fbd5c6]/60 shadow-2xs">
                <span className="text-amber-500 font-bold">✦</span>
                <span className="tracking-wide">SIÊU TIỆC GÀ GIÒN &amp; BURGER MỸ</span>
              </div>

              {/* Headline chính */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-gray-900 leading-[1.12] tracking-tight">
                Thưởng Thức <span className="text-[#ea580c]">Trọn Vị</span>,
                <br />
                Nóng Hổi Giao Tận Bàn.
              </h1>

              {/* Mô tả phụ */}
              <p className="text-gray-500 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg font-normal">
                Thực đơn tươi mới mỗi ngày từ nguyên liệu cao cấp, cam kết giao nhanh chỉ 25 phút.
              </p>

              {/* Thanh tìm kiếm & Nút cam */}
              <div className="max-w-lg space-y-2.5">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="w-full sm:flex-1 flex items-center bg-white rounded-full px-4 py-2.5 sm:py-3 border border-gray-200 shadow-sm focus-within:border-[#ea580c] focus-within:ring-2 focus-within:ring-orange-100 transition">
                    <svg className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm món ngon, gà..."
                      className="w-full bg-transparent text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none font-medium"
                    />
                    <button type="button" className="ml-1 text-gray-400 hover:text-[#ea580c] transition shrink-0" title="Bộ lọc">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-md shadow-orange-600/25 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Tìm Món Ngay</span>
                    <span>→</span>
                  </button>
                </form>

                {/* Gợi ý món từ Database thực tế */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 pl-1">
                  <span className="font-medium text-gray-400">Gợi ý:</span>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick('Gà Rán Giòn Cay')}
                    className="hover:text-[#ea580c] transition underline decoration-dotted"
                  >
                    Gà Rán Giòn Cay
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick('Classic Beef Burger')}
                    className="hover:text-[#ea580c] transition underline decoration-dotted"
                  >
                    Classic Beef Burger
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick('Pizza Pepperoni')}
                    className="hover:text-[#ea580c] transition underline decoration-dotted"
                  >
                    Pizza Pepperoni
                  </button>
                </div>
              </div>

              {/* 3 Khối tiện ích nhỏ (Cam kết chất lượng chuẩn ảnh) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-lg">
                {/* 1: Giao nhanh 25 phút */}
                <div className="bg-[#fff5ee]/70 border border-[#fed7aa]/40 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100/90 text-[#ea580c] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">
                      Giao Nhanh 25 Phút
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                      Nóng hổi chuẩn vị
                    </p>
                  </div>
                </div>

                {/* 2: Cam kết hoàn tiền */}
                <div className="bg-[#fff5ee]/70 border border-[#fed7aa]/40 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100/90 text-[#ea580c] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">
                      Cam kết hoàn tiền
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                      Nếu món không nóng giòn
                    </p>
                  </div>
                </div>

                {/* 3: Mở cửa phục vụ */}
                <div className="bg-[#fff5ee]/70 border border-[#fed7aa]/40 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100/90 text-[#ea580c] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">
                      Mở cửa phục vụ
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                      08:00 - 22:30 mỗi ngày
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột Phải: Ảnh bàn tiệc ẩm thực lớn kèm 2 Card Badge nổi bật */}
            <div className="lg:col-span-6 relative pt-4 pb-2">
              {/* Badge nổi góc trên bên phải */}
              <div className="absolute -top-2 right-2 sm:right-6 z-20 animate-float-badge">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-orange-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 text-sm font-black">
                    🍗
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-gray-900 leading-tight">Combo Tiệc Bùng Nổ</p>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-wide">GIẢM 20% HÔM NAY</p>
                  </div>
                </div>
              </div>

              {/* Khung ảnh chính bo cong lớn */}
              <div className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-tr from-gray-200 to-gray-100 aspect-[4/3] w-full border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop"
                  alt="Đại tiệc MSon Food"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />

                {/* Badge nổi góc dưới bên trái */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-3.5 py-2 shadow-lg border border-white/80 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 leading-tight">Đảm Bảo Nóng Giòn</p>
                    <p className="text-[9px] text-gray-500 leading-tight">Chế biến ngay sau khi đặt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DANH MỤC YÊU THÍCH - Chỉ dùng danh mục thực tế từ Database */}
      <section className="bg-white py-6 border-b border-gray-100">
        <div className="container-custom">
          {/* Header danh mục */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#ea580c] font-black text-sm">✦</span>
              <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-gray-900">
                DANH MỤC YÊU THÍCH
              </h3>
            </div>

            <Link
              to="/menu"
              className="text-xs font-semibold text-gray-500 hover:text-[#ea580c] flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả danh mục</span>
              <span>›</span>
            </Link>
          </div>

          {/* Dải Pills Danh mục - Lọc trực tiếp món ăn trên trang chủ */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {/* Pill Tất cả món */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(0);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs ${
                selectedCategory === 'all'
                  ? 'bg-[#ea580c] text-white shadow-orange-500/25 shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-[#ea580c] hover:text-[#ea580c]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Tất cả món</span>
            </button>

            {/* Render chỉ các danh mục có trong Database */}
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat.name] || {
                label: cat.name,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              };

              const isCatActive = selectedCategory === cat.name || selectedCategory === cat._id;

              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setCurrentPage(0);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs ${
                    isCatActive
                      ? 'bg-[#ea580c] text-white shadow-orange-500/25 shadow-md font-bold'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-[#ea580c] hover:text-[#ea580c]'
                  }`}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FLASH DEAL GIỜ VÀNG - Ưu Đãi Đặc Biệt Hôm Nay (Thay món trong ảnh bằng món thật) */}
      <section className="bg-white py-8">
        <div className="container-custom">
          {/* Header Flash Deal kèm đếm ngược */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <span className="text-[#ea580c] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <span>⚡</span>
                <span>FLASH DEAL GIỜ VÀNG</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Ưu Đãi Đặc Biệt Hôm Nay
              </h2>
            </div>

            {/* Đồng hồ đếm ngược kỹ thuật số */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <span className="text-gray-400 font-medium">KẾT THÚC SAU:</span>
              <div className="flex items-center gap-1 text-red-600 font-mono font-black text-sm">
                <span className="bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                  {formatCountdownUnit(hours)}
                </span>
                <span>:</span>
                <span className="bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                  {formatCountdownUnit(minutes)}
                </span>
                <span>:</span>
                <span className="bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                  {formatCountdownUnit(seconds)}
                </span>
              </div>
            </div>
          </div>

          {/* 2 Banner Khuyến Mãi Lớn (Màu tối sang trọng chuẩn ảnh mẫu) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Banner 1: Món thật từ Database (Gà rán giòn cay hoặc combo) */}
            {dealFood1 && (
            <div className="relative rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-br from-[#2a3447] via-[#1f2839] to-[#151c28] p-6 sm:p-8 flex flex-col justify-between min-h-[300px] text-white group">
              <div className="absolute inset-0 z-0">
                {dealFood1.image && (
                  <img
                    src={dealFood1.image}
                    alt={dealFood1.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#141b26]/95 via-[#1a2332]/85 to-transparent" />
              </div>

              {/* Tag giảm giá */}
              <div className="relative z-10 flex items-start justify-between">
                <span className="bg-[#ea580c] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm tracking-wide">
                  TIẾT KIỆM 20%
                </span>
              </div>

              {/* Nội dung món thật */}
              <div className="relative z-10 pt-8">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 drop-shadow-md">
                  {dealFood1.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 max-w-sm mb-5 font-normal leading-relaxed">
                  {dealFood1.description || 'Hương vị giòn rụm chuẩn vị hảo hạng từ đầu bếp MSon Food.'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {Number(dealFood1.price).toLocaleString()}đ
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {(Math.round((Number(dealFood1.price) * 1.25) / 1000) * 1000).toLocaleString()}đ
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDetail(dealFood1)}
                    className="bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md inline-flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <span>Đặt Ngay</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Banner 2: Món thật từ Database (Burger Combo hoặc Pizza) */}
            {dealFood2 && (
            <div className="relative rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-br from-[#2a3447] via-[#1f2839] to-[#151c28] p-6 sm:p-8 flex flex-col justify-between min-h-[300px] text-white group">
              <div className="absolute inset-0 z-0">
                {dealFood2.image && (
                  <img
                    src={dealFood2.image}
                    alt={dealFood2.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#141b26]/95 via-[#1a2332]/85 to-transparent" />
              </div>

              {/* Tag Bán chạy */}
              <div className="relative z-10 flex items-start justify-between">
                <span className="bg-amber-500 text-gray-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm tracking-wide">
                  BÁN CHẠY NHẤT
                </span>
              </div>

              {/* Nội dung món thật */}
              <div className="relative z-10 pt-8">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 drop-shadow-md">
                  {dealFood2.name}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 max-w-sm mb-5 font-normal leading-relaxed">
                  {dealFood2.description || 'Thưởng thức combo trọn vị kết hợp hoàn hảo cùng nước mát lạnh.'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {Number(dealFood2.price).toLocaleString()}đ
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {(Math.round((Number(dealFood2.price) * 1.3) / 1000) * 1000).toLocaleString()}đ
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDetail(dealFood2)}
                    className="bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md inline-flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <span>Đặt Ngay</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. MÓN NGON BÁN CHẠY NHẤT - 8 món THỰC TẾ từ Database, nút túi cam chuẩn ảnh */}
      <section className="bg-white py-8 sm:py-10">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-[#ea580c] font-bold text-[11px] uppercase tracking-wider block mb-1">
                TUYỂN CHỌN BẾP TRƯỞNG
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Món Ngon Bán Chạy Nhất
              </h2>
            </div>

            {/* Mũi tên chuyển trang chuẩn ảnh: Nút trước viền xám, Nút tiếp cam tròn */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center justify-center text-sm font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                title="Món trước"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                className="w-8 h-8 rounded-full bg-[#ea580c] text-white hover:bg-[#c2410c] flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                title="Món tiếp theo"
              >
                →
              </button>
            </div>
          </div>

          {/* Grid 8 món — 2 hàng × 4 cột chuẩn theo ảnh */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {currentDishes.map((dish) => {
              const price = Number(dish.price) || 0;

              return (
                <div
                  key={dish._id}
                  onClick={() => handleOpenDetail(dish)}
                  className="bg-white rounded-2xl border border-gray-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden"
                >
                  {/* Container ảnh món */}
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Body thông tin */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-[#ea580c] transition-colors line-clamp-1 mb-1">
                      {dish.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1 mb-4 flex-1 font-normal">
                      {dish.description || 'Thơm ngon chuẩn vị mỗi ngày từ bếp MSon Food.'}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="font-black text-sm sm:text-base text-gray-900">
                        {price.toLocaleString()}đ
                      </span>

                      {/* Nút màu cam tròn với icon túi xách / giỏ hàng chuẩn 100% ảnh mẫu */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(dish, e)}
                        className="w-8 h-8 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center shadow-md shadow-orange-600/25 transition-all active:scale-90 cursor-pointer shrink-0"
                        title="Thêm vào giỏ hàng"
                      >
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BANNER TẢI APP MSON FOOD (Trải nghiệm thông minh chuẩn ảnh) */}
      <section className="bg-white py-6 pb-12">
        <div className="container-custom">
          <div className="relative rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-[#d9480f] via-[#ea580c] to-[#f97316] shadow-2xl overflow-visible p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Cột chữ bên trái */}
              <div className="flex-1 text-white text-center lg:text-left relative z-10 space-y-3">
                <span className="inline-block bg-white/20 text-orange-100 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-xs">
                  TRẢI NGHIỆM THÔNG MINH
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black leading-tight">
                  Đặt Món Nhanh Hơn Với App MSon Food
                </h2>
                <p className="text-orange-100 text-xs sm:text-sm font-normal max-w-lg leading-relaxed">
                  Tặng ngay mã giảm 50.000đ cho đơn hàng đầu tiên và tích lũy điểm thưởng đổi món miễn phí.
                </p>

                {/* 2 Nút tải kho ứng dụng */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                  <a
                    href="#app-store"
                    className="bg-black/90 hover:bg-black text-white px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-md transition active:scale-95 border border-white/10"
                  >
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.14.64-2.82 1.44-.6.7-1.13 1.77-1.07 2.83 1.07.08 2.18-.55 2.88-1.4z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-[9px] text-gray-400 leading-none">Tải trên</div>
                      <div className="text-xs font-bold leading-tight">App Store</div>
                    </div>
                  </a>

                  <a
                    href="#google-play"
                    className="bg-black/90 hover:bg-black text-white px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-md transition active:scale-95 border border-white/10"
                  >
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a2.03 2.03 0 0 1-.61-.344c-.6-.563-.999-1.47-.999-2.556V4.714c0-1.086.399-1.993.999-2.556.19-.178.4-.298.609-.344zm11.233 11.233l2.485-2.485-11.46-6.49 8.975 8.975zm2.485 1.047l-2.485-2.485-8.975 8.975 11.46-6.49zm1.312-.743l2.846-1.612a1.472 1.472 0 0 0 0-2.56l-2.846-1.612-2.023 2.892 2.023 2.892z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-[9px] text-gray-400 leading-none">Tải trên</div>
                      <div className="text-xs font-bold leading-tight">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Card mã QR quét tải app bên phải */}
              <div className="relative shrink-0 flex items-center">
                <div className="bg-white rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-2.5 w-[210px] text-gray-900 border border-gray-100">
                  {/* Mã QR code mô phỏng */}
                  <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-200 p-2 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                      <rect x="10" y="10" width="30" height="30" rx="4" stroke="#111827" strokeWidth="6" fill="none" />
                      <rect x="20" y="20" width="10" height="10" fill="#111827" />
                      <rect x="60" y="10" width="30" height="30" rx="4" stroke="#111827" strokeWidth="6" fill="none" />
                      <rect x="70" y="20" width="10" height="10" fill="#111827" />
                      <rect x="10" y="60" width="30" height="30" rx="4" stroke="#111827" strokeWidth="6" fill="none" />
                      <rect x="20" y="70" width="10" height="10" fill="#111827" />
                      <rect x="50" y="50" width="8" height="8" fill="#111827" />
                      <rect x="65" y="60" width="10" height="6" fill="#111827" />
                      <rect x="80" y="75" width="10" height="10" fill="#111827" />
                      <rect x="50" y="80" width="6" height="8" fill="#111827" />
                      <rect x="70" y="50" width="8" height="6" fill="#111827" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-xs text-gray-900 leading-tight">Quét mã QR tải app tức thì</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Khả dụng trên iOS &amp; Android</p>
                  </div>
                  {/* Đánh giá sao */}
                  <div className="border-t border-gray-100 pt-2 w-full text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] text-gray-600 font-bold">
                      <span className="text-amber-500">★</span>
                      <span>4.9 / 5.0</span>
                      <span className="text-[10px] text-gray-400 font-normal">(hơn 12.000 đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal tùy chọn món (Biến thể, kích cỡ, topping, ghi chú) */}
      {modalFood && (
        <ProductCustomizationModal
          product={modalFood}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMode={modalMode}
        />
      )}
    </div>
  );
};

export default Home;
