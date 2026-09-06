import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import foodApi from '../services/foodApi';
import categoryApi from '../services/categoryApi';
import Loading from '../components/Loading';
import FoodCard from '../components/FoodCard';
import useAddToCartAnimation from '../hooks/useAddToCartAnimation';

const BANNER_SLIDES = [
  {
    id: 1,
    image: 'https://i.pinimg.com/736x/71/d6/2d/71d62d1ffcc23054aa4666989fbde8d4.jpg',
    title: 'Combo Thượng Hạng',
    subtitle: 'Burger bò phô mai & gà giòn cay chuẩn vị',
    tag: 'Bán chạy nhất'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    title: 'Pizza Ý Truyền Thống',
    subtitle: 'Phô mai Mozzarella kéo sợi nóng hổi thơm lừng',
    tag: 'Mới ra mắt'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop',
    title: 'Gà Rán Giòn Rụm',
    subtitle: 'Công thức ướp 11 loại gia vị bí truyền đậm đà',
    tag: 'Ưu đãi -30%'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop',
    title: 'Thực Đơn Đa Dạng',
    subtitle: 'Hơn 150+ món ăn nóng sốt phục vụ mỗi ngày',
    tag: 'Giao nhanh 30p'
  }
];

const Home = () => {
  const navigate = useNavigate();

  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State quản lý banner slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlideHovered, setIsSlideHovered] = useState(false);

  // Tự động chuyển slide sau mỗi 4 giây (tạm dừng khi người dùng hover chuột vào banner)
  useEffect(() => {
    if (isSlideHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isSlideHovered]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy 4 món ăn nổi bật
        const foodsResponse = await foodApi.getAllFoods({ limit: 4, sort: 'rating' });
        setFeaturedFoods(foodsResponse.data || []);

        // Lấy danh mục
        const categoriesResponse = await categoryApi.getAllCategories();
        setCategories(categoriesResponse.data || []);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Section - 2 Cột chuẩn theo ảnh mẫu */}
      <section className="relative py-10 sm:py-16 overflow-visible" style={{ backgroundColor: '#fdf0e8' }}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">

            {/* Cột Trái (Left Column - 6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 bg-[#f4f2f0] text-[#9a3407] px-4 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
                <span>🚀</span>
                <span>Giao hàng hỏa tốc trong 30 phút</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-gray-900 leading-[1.12] tracking-tight">
                Ngon mỗi ngày,<br />
                <span className="text-[#9a3407]">giao tận nơi</span>
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg font-normal">
                Thưởng thức hàng ngàn món ăn nóng hổi từ các nhà hàng yêu thích của bạn. MSon Food mang hương vị tuyệt hảo đến tận cửa nhà.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-md sm:max-w-lg">
                <div className="flex bg-white rounded-full p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 items-center focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition">
                  <div className="flex-1 relative flex items-center pl-4">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Bạn đang muốn ăn gì hôm nay?"
                      className="w-full bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#9a3407] hover:bg-[#832c05] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-colors shadow-sm flex-shrink-0 cursor-pointer"
                  >
                    Tìm món
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/menu"
                  className="bg-[#9a3407] hover:bg-[#832c05] text-white px-7 sm:px-8 py-3 rounded-full font-bold text-xs sm:text-sm transition-colors shadow-md shadow-[#9a3407]/20 inline-flex items-center gap-2"
                >
                  Đặt món ngay
                </Link>
                <Link
                  to="/menu"
                  className="bg-[#eef2f6] hover:bg-[#e2e8f0] text-gray-700 px-7 sm:px-8 py-3 rounded-full font-semibold text-xs sm:text-sm transition-colors inline-flex items-center"
                >
                  Xem thực đơn
                </Link>
              </div>
            </div>

            {/* Cột Phải (Right Column - 6 cols): Banner Landscape Slider To Hơn & Đẹp Hơn */}
            <div className="lg:col-span-6 relative py-6 sm:py-8 px-1 sm:px-3">

              {/* Badge 1: Nằm bên ngoài phía trên bên phải */}
              <div className="absolute -top-3 right-0 sm:-top-5 sm:right-2 md:-top-6 md:right-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center gap-3 select-none animate-float-badge-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">4.9</div>
                  <div className="text-[11px] font-medium text-gray-500 whitespace-nowrap">Đánh giá xuất sắc</div>
                </div>
              </div>

              {/* Badge 2: Nằm gối góc dưới bên trái của ảnh banner */}
              <div className="absolute -bottom-3 left-0 sm:-bottom-5 sm:-left-2 md:-bottom-6 md:-left-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center gap-3 select-none animate-float-badge-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shadow-xs flex-shrink-0">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">30 Phút</div>
                  <div className="text-[11px] font-medium text-gray-500 whitespace-nowrap">Giao hàng nhanh</div>
                </div>
              </div>

              {/* Landscape Banner Auto-Slider Container (Tỉ lệ ngang 16:10 mở rộng) */}
              <div
                className="relative w-full aspect-[16/10] min-h-[280px] sm:min-h-[330px] md:min-h-[370px] lg:min-h-[390px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100 group select-none"
                onMouseEnter={() => setIsSlideHovered(true)}
                onMouseLeave={() => setIsSlideHovered(false)}
              >
                {/* Slides Images with Smooth Cross-fade */}
                {BANNER_SLIDES.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                      }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Subtle bottom gradient for tag / title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-85" />

                    {/* Small Caption at the bottom */}
                    <div className="absolute bottom-4 left-5 right-16 z-20 text-white">
                      <span className="inline-block bg-[#9a3407]/95 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 shadow-xs">
                        {slide.tag}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white drop-shadow-sm line-clamp-1">
                        {slide.title}
                      </h3>
                      <p className="text-xs text-gray-200 line-clamp-1 opacity-90 hidden sm:block">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Prev / Next Arrows on Hover */}
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-105"
                  title="Ảnh trước"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-105"
                  title="Ảnh tiếp theo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Slider Dots */}
                <div className="absolute bottom-3.5 right-4 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-full">
                  {BANNER_SLIDES.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${index === currentSlide
                        ? 'w-5 sm:w-6 h-1.5 bg-orange-500'
                        : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                        }`}
                      title={`Chuyển tới ảnh ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bạn muốn ăn gì?</h2>
            <Link to="/menu" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              Xem tất cả
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <p className="text-gray-600 mb-8">Khám phá các danh mục món ăn yêu thích</p>

          {/* Category Grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category._id}
                  to={`/menu?category=${category._id}`}
                  className="flex flex-col items-center group"
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow overflow-hidden border border-orange-100">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-14 h-14 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            const fallback = e.currentTarget.parentElement.querySelector('.cat-fallback-icon');
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="cat-fallback-icon w-full h-full items-center justify-center text-2xl bg-orange-50 text-orange-600"
                      style={{ display: category.image ? 'none' : 'flex' }}
                    >
                      🍔
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center group-hover:text-orange-600 transition-colors">{category.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Đang tải danh mục...</p>
          )}
        </div>
      </section>

      {/* Featured Foods Section */}
      <section className="py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Món ăn được yêu thích</h2>
              <p className="text-gray-600">Lựa chọng món ăn được ưa thích nhất từ thực đơn của chúng tôi</p>
            </div>
            <Link to="/menu" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              Xem tất cả
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Food Grid */}
          {featuredFoods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredFoods.map((food) => (
                <FoodCard key={food._id} food={food} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Chưa có món ăn nào.</p>
            </div>
          )}
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-12">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl overflow-hidden shadow-xl">
            <div className="grid md:grid-cols-2 items-center">
              {/* Left - Text */}
              <div className="p-8 md:p-12 text-white">
                <div className="inline-block bg-orange-700 px-4 py-1 rounded-full text-sm mb-4">
                  ƯU ĐÃI ĐẶC BIỆT
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Giảm 20% cho<br />đơn hàng đầu tiên
                </h2>
                <p className="text-orange-100 mb-6">
                  Đặt món ngay và nhận ngay mã khuyến mãi giảm giá dành riêng cho khách hàng mới.
                  Chương trình có hạn - đừng bỏ lỡ!
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-bold">
                    <span className="text-lg">MSON20</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('MSON20');
                        alert('Đã sao chép mã giảm giá MSON20');
                      }}
                      className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-600 px-2 py-1 rounded transition-colors"
                    >
                      Sao chép
                    </button>
                  </div>
                  <Link
                    to="/menu"
                    className="inline-flex items-center gap-2 bg-orange-800 hover:bg-orange-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Xem thực đơn
                  </Link>
                </div>
              </div>

              {/* Right - Image */}
              <div className="hidden md:block h-full">
                <img
                  src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop"
                  alt="Khuyến mãi"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
