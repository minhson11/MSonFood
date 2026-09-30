import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import foodApi from '../../services/foodApi';
import reviewApi from '../../services/reviewApi';
import useAuth from '../../hooks/useAuth';
import useAddToCartAnimation from '../../hooks/useAddToCartAnimation';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import ProductCustomizationModal from '../../components/product/ProductCustomizationModal';

const getAvatarBg = (name = '') => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Gần đây';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
};

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [addToCartWithAnimation, showToast, toastMessage] = useAddToCartAnimation();
  
  const [food, setFood] = useState(null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const relatedScrollRef = useRef(null);

  // Database toppings
  const toppings = food?.toppings || [];

  useEffect(() => {
    fetchFoodDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        const catId = foodData.category._id || foodData.category;
        const relatedResponse = await foodApi.getAllFoods({
          category: catId,
          limit: 8
        });
        const list = Array.isArray(relatedResponse?.data) ? relatedResponse.data : [];
        setRelatedFoods(list.filter(f => f._id !== id));
      }

      // Fetch real reviews from database
      try {
        const reviewResponse = await reviewApi.getFoodReviews(id);
        const rawReviews = reviewResponse?.data || (Array.isArray(reviewResponse) ? reviewResponse : []);
        const visibleReviews = Array.isArray(rawReviews) ? rawReviews.filter((r) => !r.isHidden) : [];
        setReviews(visibleReviews);
        setAverageRating(reviewResponse?.averageRating || 0);
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

  const handleScrollRelated = (direction) => {
    if (relatedScrollRef.current) {
      const scrollAmount = 320;
      relatedScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError('');
      setReviewSuccess('');

      await reviewApi.createReview({
        food: food._id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      setReviewSuccess('Đánh giá của bạn đã được gửi thành công!');
      
      // Refresh reviews from server
      const reviewResponse = await reviewApi.getFoodReviews(id);
      const rawReviews = reviewResponse?.data || (Array.isArray(reviewResponse) ? reviewResponse : []);
      const visibleReviews = Array.isArray(rawReviews) ? rawReviews.filter((r) => !r.isHidden) : [];
      setReviews(visibleReviews);
      setAverageRating(reviewResponse?.averageRating || 0);

      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewComment('');
        setReviewRating(5);
        setReviewSuccess('');
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi đánh giá';
      setReviewError(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <Loading />
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="container-custom py-12 bg-white">
        <ErrorMessage message={error || 'Không tìm thấy món ăn'} />
      </div>
    );
  }

  // Calculate displayed rating and count
  const ratingValue = reviews.length > 0
    ? (averageRating ? averageRating.toFixed(1) : (food.rating ? food.rating.toFixed(1) : '5.0'))
    : (food.rating > 0 ? food.rating.toFixed(1) : '4.8');
  const reviewCountValue = reviews.length > 0 ? reviews.length : (food.reviewCount || 120);

  return (
    <div className="bg-white min-h-screen text-gray-900 pb-20">
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

      <div className="container-custom max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="py-4">
          <nav className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
            <Link to="/menu" className="hover:text-[#a32e08] transition-colors">
              Thực đơn
            </Link>
            <span className="text-gray-400 font-light">&gt;</span>
            <span className="text-gray-800 font-medium">
              {food.category?.name || 'Món ăn'}
            </span>
          </nav>
        </div>

        {/* Top Section: Image & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 items-start">
          {/* Left Column: Exactly 1 Main Image as requested */}
          <div className="lg:col-span-6">
            <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-xs border border-gray-100 bg-gray-50">
              {food.image ? (
                <img
                  src={food.image}
                  alt={food.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-6 flex flex-col pt-1">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
              {food.name}
            </h1>

            {/* Rating & Calories */}
            <div className="flex items-center gap-4 text-xs sm:text-sm mb-4">
              <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span>{ratingValue}</span>
                <span className="text-gray-400 font-normal">({reviewCountValue} đánh giá)</span>
              </div>

              <div className="flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium">
                <span className="text-base">🔥</span>
                <span>{food.calories ? `${food.calories} kcal` : '650 kcal'}</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#a32e08] tracking-tight">
                {food.price?.toLocaleString()}đ
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              {food.description || 'Hương vị bùng nổ được chế biến tinh tế từ nguyên liệu tươi ngon nhất, giữ trọn hương vị đậm đà và độ thơm ngon khó cưỡng.'}
            </p>

            {/* Variants / Phần ăn */}
            {food?.variants && food.variants.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                  CHỌN PHẦN ĂN
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {food.variants.map((v, idx) => {
                    const isSelected = selectedVariant?.name === v.name;
                    const isOutOfStock = v.isAvailable === false;
                    const priceDiff = Number(v.price) || 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#a32e08] bg-orange-50/50 text-[#a32e08] ring-1 ring-[#a32e08]'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{v.name}</div>
                        {priceDiff > 0 && <div className="text-[11px] text-gray-500">+{priceDiff.toLocaleString()}đ</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {food?.sizes && food.sizes.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                  CHỌN KÍCH THƯỚC / SIZE
                </h4>
                <div className="flex gap-2.5">
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
                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                          isSelected
                            ? 'border-[#a32e08] bg-orange-50/60 text-[#a32e08]'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        {s.name} {priceDiff > 0 && `(+${priceDiff.toLocaleString()}đ)`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Toppings (Styled exactly like mockup) */}
            {toppings.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                  THÊM TOPPING
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toppings.map((topping, index) => {
                    const toppingId = topping._id || topping.id || topping.name;
                    const isSelected = selectedToppings.some(t => (t._id || t.id || t.name) === toppingId);
                    const isOutOfStock = topping.isActive === false;

                    return (
                      <label
                        key={index}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition cursor-pointer select-none text-xs sm:text-sm ${
                          isOutOfStock
                            ? 'bg-gray-100 opacity-50 cursor-not-allowed border-gray-200'
                            : isSelected
                            ? 'bg-blue-50/90 border-blue-400 text-blue-950 shadow-2xs'
                            : 'bg-[#f0f7ff]/60 hover:bg-[#f0f7ff] border-blue-100/80 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isOutOfStock}
                            onChange={() => handleToppingToggle(topping)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-800">{topping.name}</span>
                        </div>
                        <span className="text-gray-500 font-medium text-xs">
                          +{topping.price?.toLocaleString()}đ
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special note */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Ghi chú cho quán
                </span>
                <span className="text-[11px] font-normal text-gray-400">{note.length}/200</span>
              </div>
              <input
                type="text"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Ít cay, không hành, để riêng sốt..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400 bg-gray-50/40"
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Số lượng:</span>
              <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-1.5">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-black transition text-sm font-bold"
                >
                  —
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={incrementQuantity}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-black transition text-sm font-bold"
                >
                  +
                </button>
              </div>

              {totalPrice !== basePrice * quantity && (
                <div className="text-xs text-gray-500 font-medium ml-auto">
                  Tổng: <span className="font-bold text-[#a32e08] text-sm">{totalPrice.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            {/* Action Buttons (Pill shaped exactly as in mockup) */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!food.isAvailable}
                className="add-to-cart-btn flex-1 py-3.5 px-6 rounded-full font-semibold text-sm sm:text-base bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e40af] transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Thêm vào giỏ</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!food.isAvailable}
                className="buy-now-btn flex-1 py-3.5 px-6 rounded-full font-semibold text-sm sm:text-base bg-[#a32e08] hover:bg-[#882606] text-white transition active:scale-95 shadow-md shadow-orange-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mua ngay
              </button>
            </div>

            {!food.isAvailable && (
              <div className="mt-3 text-red-600 text-xs font-semibold text-center bg-red-50 py-2 rounded-xl">
                Món ăn hiện đang tạm hết hàng
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Đánh giá từ thực khách */}
        <div className="mt-14 pt-10 border-t border-gray-100" id="reviews-section">
          {/* Header & Overall Rating */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Đánh giá từ thực khách
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#a32e08] leading-none">
                  {ratingValue}
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    Dựa trên {reviewCountValue} đánh giá
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="self-start sm:self-auto px-5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Viết đánh giá
            </button>
          </div>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review, idx) => {
                const userName = review.user?.name || 'Khách hàng';
                const userAvatar = review.user?.avatar;
                const initial = userName.charAt(0).toUpperCase();

                return (
                  <div
                    key={review._id || review.id || idx}
                    className="bg-[#f8fafc] rounded-2xl p-5 border border-gray-100/90 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center ${getAvatarBg(
                              userName
                            )}`}
                          >
                            {initial}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{userName}</h4>
                          <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating ? 'fill-current' : 'text-gray-200 fill-current'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-gray-400 font-normal">
                        {formatTimeAgo(review.createdAt)}
                      </span>
                    </div>

                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mt-2">
                      {review.comment || 'Món ăn rất ngon, giữ trọn hương vị nóng hổi, phục vụ nhanh chóng.'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#f8fafc] rounded-2xl p-8 border border-dashed border-gray-200 text-center">
              <p className="text-gray-600 text-sm mb-4">
                Chưa có đánh giá nào cho món ăn này từ người dùng thực tế.
              </p>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-white transition cursor-pointer"
              >
                Gửi đánh giá đầu tiên
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Có thể bạn sẽ thích */}
        {relatedFoods.length > 0 && (
          <div className="mt-14 pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Có thể bạn sẽ thích
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScrollRelated('left')}
                  className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer"
                  title="Trước"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollRelated('right')}
                  className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer"
                  title="Sau"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              ref={relatedScrollRef}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {relatedFoods.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-md transition group flex flex-col"
                >
                  {/* Food Image */}
                  <Link to={`/food/${item._id}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-50">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </Link>

                  {/* Card Info */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <Link to={`/food/${item._id}`}>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1 hover:text-[#a32e08] transition">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <span className="text-amber-500">★</span>
                        <span>{item.rating ? Number(item.rating).toFixed(1) : '4.5'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-sm sm:text-base text-[#a32e08]">
                        {Number(item.price || 0).toLocaleString()}đ
                      </span>

                      {/* Plus button to open customize or add */}
                      <button
                        type="button"
                        onClick={() => setCustomizingProduct(item)}
                        className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer active:scale-95"
                        title="Chọn món"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setIsReviewModalOpen(false);
                setReviewError('');
                setReviewSuccess('');
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Đánh giá món ăn
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-5">
              {food.name}
            </p>

            {reviewSuccess ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-center font-medium text-sm my-4">
                {reviewSuccess}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Rating stars */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Mức độ hài lòng:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (reviewHoverRating || reviewRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="text-3xl focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                        >
                          <span className={active ? 'text-amber-400' : 'text-gray-200'}>★</span>
                        </button>
                      );
                    })}
                    <span className="text-xs font-semibold text-gray-600 ml-2">
                      {reviewRating === 5
                        ? 'Tuyệt vời'
                        : reviewRating === 4
                        ? 'Tốt'
                        : reviewRating === 3
                        ? 'Bình thường'
                        : reviewRating === 2
                        ? 'Chưa hài lòng'
                        : 'Rất tệ'}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Nhận xét của bạn:
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Hãy chia sẻ cảm nhận về hương vị, độ nóng hổi và chất lượng món ăn..."
                    className="w-full text-sm p-3.5 rounded-2xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition resize-none placeholder:text-gray-400"
                    required
                  />
                </div>

                {reviewError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs sm:text-sm">
                    {reviewError}
                    {reviewError.includes('hoàn thành') && (
                      <div className="mt-2">
                        <Link
                          to="/orders"
                          className="font-bold underline text-[#a32e08] hover:text-[#882606]"
                        >
                          Đến trang đơn hàng của tôi &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 py-3 rounded-full border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 rounded-full bg-[#a32e08] hover:bg-[#882606] text-white font-semibold text-sm transition shadow-md shadow-orange-950/20 disabled:opacity-50"
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDetail;
