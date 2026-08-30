import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCustomizationModal from './product/ProductCustomizationModal';

const FoodCard = ({ food }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('cart');

  const handleOpenCustomize = (e, mode = 'cart') => {
    e.preventDefault();
    e.stopPropagation();
    if (!food.isAvailable) return;
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Product Customization Modal */}
      <ProductCustomizationModal
        product={food}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />

      <div className="h-full flex flex-col bg-white rounded-2xl shadow-xs hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 group">
        {/* Image Box */}
        <Link to={`/food/${food._id}`} className="block relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
          {food.image ? (
            <img
              src={food.image}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!food.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-2xs">
              <span className="text-white font-bold bg-red-600 px-3.5 py-1.5 rounded-full text-xs shadow-sm">
                Hết hàng
              </span>
            </div>
          )}

          {/* Category Tag */}
          {food.category?.name && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs">
              {food.category.name}
            </span>
          )}
        </Link>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <Link to={`/food/${food._id}`}>
              <h3 className="font-bold text-base text-gray-900 hover:text-orange-600 transition-colors line-clamp-1 mb-1.5">
                {food.name}
              </h3>
            </Link>

            <p className="text-gray-500 text-xs mb-3 line-clamp-2 min-h-[32px] leading-relaxed">
              {food.description || 'Món ăn thơm ngon, chuẩn bị nhanh chóng và hấp dẫn.'}
            </p>
          </div>

          {/* Price & Rating Row */}
          <div className="mt-auto">
            <div className="flex items-center justify-between pt-2 pb-3 border-t border-gray-100">
              <span className="text-lg font-extrabold text-orange-600">
                {food.price?.toLocaleString()}đ
              </span>

              {food.rating > 0 ? (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="text-xs text-amber-800 font-bold">{food.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[11px] text-gray-400">Mới</span>
              )}
            </div>

            {/* Action Buttons: 2 Equal, Even Buttons */}
            <div className="flex items-center gap-2">
              {food.isAvailable ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleOpenCustomize(e, 'cart')}
                    className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                    title="Tùy chỉnh và thêm vào giỏ hàng"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Thêm giỏ</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenCustomize(e, 'buynow')}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition shadow-sm hover:shadow active:scale-98"
                    title="Tùy chỉnh và mua ngay"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Mua ngay</span>
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold cursor-not-allowed text-center"
                >
                  Tạm hết hàng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodCard;

