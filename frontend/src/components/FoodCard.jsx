import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCustomizationModal from './product/ProductCustomizationModal';
import useAddToCartAnimation from '../hooks/useAddToCartAnimation';

const FoodCard = ({ food, badgeType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('cart');
  const [isFavorite, setIsFavorite] = useState(false);
  const [addToCartWithAnimation] = useAddToCartAnimation();

  const handleOpenCustomize = (e, mode = 'buynow') => {
    e.preventDefault();
    e.stopPropagation();
    if (!food.isAvailable) return;
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!food.isAvailable) return;
    // If food has required size or variants, open modal in cart mode
    if ((food.variants && food.variants.length > 0) || (food.sizes && food.sizes.length > 0)) {
      handleOpenCustomize(e, 'cart');
    } else {
      addToCartWithAnimation(food, 1, e.currentTarget);
    }
  };

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Determine badge to display
  const renderBadge = () => {
    if (!food.isAvailable) {
      return (
        <span className="bg-gray-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          Tạm hết
        </span>
      );
    }
    const badge = badgeType || food.badge;
    if (badge === 'bestseller' || badge === 'hot') {
      return (
        <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <span>🔥</span> Bán chạy
        </span>
      );
    }
    if (badge === 'discount' || badge === '-20%') {
      return (
        <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
          -20%
        </span>
      );
    }
    if (badge === 'new') {
      return (
        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
          <span>✨</span> Mới
        </span>
      );
    }
    // Default dynamic badge if rating is high
    if (food.rating >= 4.8) {
      return (
        <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <span>🔥</span> Bán chạy
        </span>
      );
    }
    return null;
  };

  // Original fake strike price for display like design
  const originalPrice = food.originalPrice || Math.round(food.price * 1.25 / 1000) * 1000;

  return (
    <>
      <ProductCustomizationModal
        product={food}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />

      <div className="h-full flex flex-col bg-white rounded-2xl shadow-xs hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 group hover:-translate-y-1">
        {/* Image Box */}
        <Link to={`/food/${food._id}`} className="block relative aspect-[4/3] bg-gray-100 overflow-hidden flex-shrink-0">
          {food.image ? (
            <img
              src={food.image}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges on Image */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {renderBadge()}
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={toggleFavorite}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 flex items-center justify-center shadow-xs backdrop-blur-xs transition-all z-10"
            title={isFavorite ? 'Đã yêu thích' : 'Yêu thích món này'}
          >
            {isFavorite ? (
              <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>

          {/* Out of stock overlay */}
          {!food.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-2xs">
              <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-full text-xs shadow-sm">
                Tạm hết hàng
              </span>
            </div>
          )}
        </Link>

        {/* Card Body */}
        <div className="p-3.5 flex flex-col flex-1 justify-between">
          <div>
            {/* Rating & Category Row */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="text-gray-800 text-[11px] font-bold">
                  {food.rating ? Number(food.rating).toFixed(1) : '0.0'}
                </span>
                <span className="text-gray-400 text-[11px] font-normal">
                  ({food.reviewCount ?? 0})
                </span>
              </div>

              {food.category?.name && (
                <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                  {food.category.name}
                </span>
              )}
            </div>

            {/* Title */}
            <Link to={`/food/${food._id}`}>
              <h3 className="font-bold text-sm text-gray-900 hover:text-orange-600 transition-colors line-clamp-1 mb-1" title={food.name}>
                {food.name}
              </h3>
            </Link>

            {/* Description */}
            <p className="text-gray-500 text-[11px] line-clamp-2 min-h-[28px] leading-relaxed mb-3">
              {food.description || 'Món ăn thơm ngon, chuẩn bị nhanh chóng và nóng hổi đến tay bạn.'}
            </p>
          </div>

          {/* Price & Action Buttons Row */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
            {/* Prices */}
            <div className="flex flex-col">
              {originalPrice > food.price && (
                <span className="text-[11px] text-gray-400 line-through leading-none mb-0.5">
                  {originalPrice.toLocaleString()}đ
                </span>
              )}
              <span className="text-base font-black text-red-700 tracking-tight leading-none">
                {food.price?.toLocaleString()}đ
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-1.5">
              {food.isAvailable ? (
                <>
                  {/* Plus circular button */}
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    className="w-7 h-7 rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white flex items-center justify-center font-bold text-base transition-all duration-150 shadow-2xs active:scale-95"
                    title="Thêm nhanh vào giỏ"
                  >
                    +
                  </button>

                  {/* Mua ngay pill button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenCustomize(e, 'buynow')}
                    className="bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs hover:shadow-sm active:scale-95 transition-all duration-150 whitespace-nowrap"
                    title="Mua ngay"
                  >
                    Mua ngay
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-gray-400 font-semibold px-2 py-1 bg-gray-100 rounded-full">
                  Hết hàng
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodCard;

