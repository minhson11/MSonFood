import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import foodApi from '../services/foodApi';
import categoryApi from '../services/categoryApi';
import Loading from '../components/Loading';
import FoodCard from '../components/FoodCard';
import useAddToCartAnimation from '../hooks/useAddToCartAnimation';

const Home = () => {
  const navigate = useNavigate();
  
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      {/* Hero Section - Banner với Hero Image */}
      <section className="bg-orange-50 py-8 md:py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text & CTA */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm mb-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-medium">Giảm khuyến mãi lên đến 40%</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Ngon mỗi ngày,<br />
                <span className="text-orange-600">giao tận nơi</span>
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-lg mb-6 max-w-md">
                Thưởng thức những món ăn ngon được làm từ nguyên liệu tươi ngon. 
                MSon Food mang hương vị tuyệt hảo đến tận cửa nhà bạn.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Bạn đang thèm gì hôm nay?"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Tìm món
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link to="/menu" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
                  Đặt món ngay
                </Link>
                <Link to="/menu" className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 transition-colors">
                  Xem thực đơn
                </Link>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative">
              {/* Rating Badge */}
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg shadow-lg z-10">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div>
                    <div className="font-bold text-lg">4.9</div>
                    <div className="text-xs">3k+ đánh giá</div>
                  </div>
                </div>
              </div>

              {/* Delivery Time Badge */}
              <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-lg z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">30 Phút</div>
                    <div className="text-sm text-gray-500">Giao hàng nhanh</div>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop"
                  alt="Món ăn ngon"
                  className="w-full h-[400px] object-cover"
                />
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
