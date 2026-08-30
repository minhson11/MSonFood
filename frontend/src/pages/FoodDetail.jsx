import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import foodApi from '../services/foodApi';
import reviewApi from '../services/reviewApi';
import useAddToCartAnimation from '../hooks/useAddToCartAnimation';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ProductCustomizationModal from '../components/product/ProductCustomizationModal';

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addToCartWithAnimation, showToast, toastMessage] = useAddToCartAnimation();
  
  const [food, setFood] = useState(null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState(null);

  // Database toppings
  const toppings = food?.toppings || [];

  useEffect(() => {
    fetchFoodDetail();
  }, [id]);

  const fetchFoodDetail = async () => {
    try {
      setLoading(true);
      const response = await foodApi.getFoodById(id);
      const foodData = response.data;
      setFood(foodData);

      // Default variant
      if (foodData.variants && foodData.variants.length > 0) {
        const defaultVar =
          foodData.variants.find((v) => v.isDefault && v.isAvailable !== false) ||
          foodData.variants.find((v) => v.isAvailable !== false) ||
          foodData.variants[0];
        setSelectedVariant(defaultVar);
      } else {
        setSelectedVariant(null);
      }

      // Default size
      if (foodData.sizes && foodData.sizes.length > 0) {
        const defaultSize =
          foodData.sizes.find((s) => s.isAvailable !== false) || foodData.sizes[0];
        setSelectedSize(defaultSize);
      } else {
        setSelectedSize(null);
      }

      setSelectedToppings([]);
      setQuantity(1);
      setNote('');
      
      // Fetch related foods from same category
      if (foodData.category) {
        const relatedResponse = await foodApi.getAllFoods({
          category: foodData.category._id,
          limit: 4
        });
        setRelatedFoods(relatedResponse.data.filter(f => f._id !== id));
      }

      // Fetch real reviews from database
      try {
        const reviewResponse = await reviewApi.getFoodReviews(id);
        if (reviewResponse && reviewResponse.success) {
          setReviews(reviewResponse.data || []);
          setAverageRating(reviewResponse.averageRating || 0);
        } else if (reviewResponse && Array.isArray(reviewResponse.data)) {
          setReviews(reviewResponse.data);
          setAverageRating(reviewResponse.averageRating || 0);
        } else if (Array.isArray(reviewResponse)) {
          setReviews(reviewResponse);
          setAverageRating(0);
        } else {
          setReviews([]);
          setAverageRating(0);
        }
      } catch (reviewErr) {
        console.error('Error fetching food reviews:', reviewErr);
        setReviews([]);
        setAverageRating(0);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin món ăn');
    } finally {
      setLoading(false);
    }
  };

  const handleToppingToggle = (topping) => {
    setSelectedToppings(prev => {
      const toppingId = topping._id || topping.id || topping.name;
      const exists = prev.some(t => (t._id || t.id || t.name) === toppingId);
      if (exists) {
        return prev.filter(t => (t._id || t.id || t.name) !== toppingId);
      }
      return [...prev, topping];
    });
  };

  const basePrice = food?.price || 0;
  const variantPrice = selectedVariant?.price || 0;
  const sizePrice = selectedSize?.price || 0;
  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const unitPrice = basePrice + variantPrice + sizePrice + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  const buildConfiguredItem = () => {
    return {
      ...food,
      selectedVariant: selectedVariant ? { name: selectedVariant.name, price: variantPrice } : null,
      selectedSize: selectedSize ? { name: selectedSize.name, price: sizePrice } : null,
      selectedToppings: selectedToppings.map(t => ({
        _id: t._id || t.id,
        name: t.name,
        price: Number(t.price) || 0
      })),
      toppingsPrice,
      note: note.trim(),
      unitPrice,
      finalPrice: unitPrice,
      totalPrice
    };
  };

  const handleAddToCart = (e) => {
    if (food && food.isAvailable) {
      const foodWithConfig = buildConfiguredItem();
      const addButton = e?.currentTarget || document.querySelector('.add-to-cart-btn');
      addToCartWithAnimation(foodWithConfig, quantity, addButton);
    }
  };

  const handleBuyNow = () => {
    if (food && food.isAvailable) {
      const foodWithConfig = buildConfiguredItem();
      navigate('/checkout', {
        state: {
          buyNowItem: {
            food: foodWithConfig,
            quantity: quantity,
            itemKey: `buynow-${food._id}-${Date.now()}`
          }
        }
      });
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="container-custom py-12">
        <ErrorMessage message={error || 'Không tìm thấy món ăn'} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Customization Modal for Related Product */}
      {customizingProduct && (
        <ProductCustomizationModal
          product={customizingProduct}
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl z-[100] animate-slide-in-right flex items-center gap-2.5">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold text-sm">{toastMessage || `Đã thêm ${quantity} món vào giỏ hàng!`}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600 flex items-center gap-2">
            <Link to="/" className="hover:text-orange-600 transition-colors">Trang chủ</Link>
            <span>&gt;</span>
            <Link to="/menu" className="hover:text-orange-600 transition-colors">{food.category?.name || 'Burger'}</Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Left Column - Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
              {food.image ? (
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-3">
              {[food.image, food.image].slice(0, 2).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-orange-600 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {food.name}
              </h1>
              
              {/* Rating & Reviews */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="font-semibold text-lg">
                    {reviews.length > 0
                      ? (averageRating ? averageRating.toFixed(1) : (food.rating ? food.rating.toFixed(1) : '5.0'))
                      : (food.rating > 0 ? food.rating.toFixed(1) : '0.0')}
                  </span>
                  <span className="text-gray-500">({reviews.length} đánh giá)</span>
                </div>
                <span className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full font-medium">
                  Đã bán {food.stock > 0 ? '100+' : '0'}
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-orange-600">
                  {food.price?.toLocaleString()}đ
                </span>
              </div>

              {/* Description */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-bold text-lg mb-3">Mô tả chi tiết</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {food.description}
                </p>
                
                {/* Additional Info */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {food.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-gray-600">Còn {food.stock} sản phẩm</span>
                  </div>
                </div>
              </div>

              {/* Variants / Phần ăn */}
              {food?.variants && food.variants.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-bold text-base text-gray-900 mb-3">CHỌN PHẦN ĂN</h3>
                  <div className="space-y-2">
                    {food.variants.map((v, idx) => {
                      const isSelected = selectedVariant?.name === v.name;
                      const isOutOfStock = v.isAvailable === false;
                      const priceDiff = Number(v.price) || 0;

                      return (
                        <label
                          key={idx}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isOutOfStock
                              ? 'bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="detail-variant"
                              checked={isSelected}
                              disabled={isOutOfStock}
                              onChange={() => setSelectedVariant(v)}
                              className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                            />
                            <span className={`text-sm font-bold ${isSelected ? 'text-orange-950' : 'text-gray-800'}`}>
                              {v.name}
                            </span>
                          </div>
                          {priceDiff > 0 ? (
                            <span className="text-sm font-extrabold text-orange-600">
                              +{priceDiff.toLocaleString()}đ
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400">Tiêu chuẩn</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {food?.sizes && food.sizes.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-bold text-base text-gray-900 mb-3">CHỌN KÍCH THƯỚC / SIZE</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {food.sizes.map((s, idx) => {
                      const isSelected = selectedSize?.name === s.name;
                      const isOutOfStock = s.isAvailable === false;
                      const priceDiff = Number(s.price) || 0;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => setSelectedSize(s)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isOutOfStock
                              ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'border-orange-600 bg-orange-50/70 font-bold text-orange-950 ring-1 ring-orange-400/40'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                          }`}
                        >
                          <div className="text-sm font-bold mb-1">{s.name}</div>
                          {priceDiff > 0 ? (
                            <div className="text-xs font-bold text-orange-600">+{priceDiff.toLocaleString()}đ</div>
                          ) : (
                            <div className="text-xs text-gray-400">Gốc</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toppings */}
              {toppings.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-bold text-base text-gray-900 mb-3">THÊM TOPPING</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {toppings.map((topping, index) => {
                      const toppingId = topping._id || topping.id || topping.name;
                      const isSelected = selectedToppings.some(t => (t._id || t.id || t.name) === toppingId);
                      const isOutOfStock = topping.isActive === false;

                      return (
                        <label 
                          key={index} 
                          className={`flex items-center justify-between p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                            isOutOfStock
                              ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'border-orange-600 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isOutOfStock}
                              onChange={() => handleToppingToggle(topping)}
                              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <span className="font-medium text-sm">{topping.name}</span>
                          </div>
                          <span className="text-orange-600 font-semibold text-sm">+{topping.price.toLocaleString()}đ</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Note */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-base text-gray-900">Yêu cầu đặc biệt</h3>
                  <span className="text-xs text-gray-400">{note.length}/200</span>
                </div>
                <textarea
                  value={note}
                  maxLength={200}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Không hành, ít sốt cay, để riêng nước chấm..."
                  rows={2}
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition resize-none placeholder:text-gray-400 bg-gray-50/50"
                />
              </div>

              {/* Price summary strip */}
              <div className="mb-6 p-4 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Tổng thanh toán tạm tính:</span>
                <span className="text-2xl font-black text-orange-600">{totalPrice.toLocaleString()}đ</span>
              </div>

              {/* Quantity & Actions */}
              <div className="space-y-4">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700">Số lượng:</span>
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={decrementQuantity}
                      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-colors font-semibold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center bg-transparent font-semibold focus:outline-none"
                      min="1"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-colors font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!food.isAvailable}
                    className="add-to-cart-btn flex-1 bg-white border-2 border-orange-600 text-orange-600 py-4 rounded-xl font-bold hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thêm vào giỏ
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={!food.isAvailable}
                    className="buy-now-btn flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/30"
                  >
                    Mua ngay
                  </button>
                </div>

                {/* Availability Notice */}
                {!food.isAvailable && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <span className="text-red-600 font-semibold">❌ Món ăn hiện tại đã hết hàng</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-12" id="reviews-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Đánh giá từ thực khách</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-orange-600">
                  {reviews.length > 0
                    ? (averageRating ? averageRating.toFixed(1) : (food.rating ? food.rating.toFixed(1) : '5.0'))
                    : (food.rating > 0 ? food.rating.toFixed(1) : '0.0')}
                </div>
                <div>
                  <div className="flex mb-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const curAvg = averageRating || food.rating || 0;
                      return (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(curAvg) ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500">
                    {reviews.length > 0 ? `Dựa trên ${reviews.length} đánh giá từ người dùng thực tế` : 'Chưa có đánh giá nào'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-md shadow-orange-600/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Đánh giá từ đơn hàng</span>
            </button>
          </div>

          {/* Review List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review, idx) => {
                const userName = review.user?.name || 'Khách hàng';
                const userAvatar = review.user?.avatar;
                const formattedDate = review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Gần đây';

                return (
                  <div key={review._id || review.id || idx} className="border-b pb-6 last:border-0">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-xs">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-base">{userName}</h4>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Đã mua hàng
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formattedDate}</span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-2.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                          <span className="text-xs font-semibold text-gray-500 ml-1.5">
                            {review.rating === 5
                              ? 'Tuyệt vời'
                              : review.rating === 4
                              ? 'Tốt'
                              : review.rating === 3
                              ? 'Bình thường'
                              : review.rating === 2
                              ? 'Tệ'
                              : 'Rất tệ'}
                          </span>
                        </div>

                        {/* Comment */}
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                          {review.comment || 'Khách hàng không để lại nhận xét bằng chữ.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 mx-auto mb-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl shadow-inner">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có đánh giá nào</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
                Món ăn này hiện chưa có đánh giá nào từ thực khách. Hãy đặt món và hoàn tất đơn hàng để gửi đánh giá đầu tiên!
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/20 transition cursor-pointer"
              >
                <span>Xem đơn hàng đã đặt</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedFoods.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Có thể bạn sẽ thích</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedFoods.map(item => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group"
                >
                  {/* Image */}
                  <Link to={`/food/${item._id}`} className="block relative aspect-square overflow-hidden bg-gray-100">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200"></div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link to={`/food/${item._id}`}>
                      <h3 className="font-bold text-lg mb-2 line-clamp-1 hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="ml-1 font-semibold">{item.rating || 4.5}</span>
                      </div>
                      <span className="text-orange-600 font-bold text-lg">{item.price.toLocaleString()}đ</span>
                    </div>

                    {/* Add Button */}
                    <button 
                      onClick={() => setCustomizingProduct(item)}
                      className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Tùy chỉnh món</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDetail;
