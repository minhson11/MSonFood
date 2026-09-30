import { useState } from 'react';

const ProductHeader = ({ product, onClose }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  if (!product) return null;

  const rating = product.rating ? Number(product.rating).toFixed(1) : '0.0';
  const reviewCount = product.reviewCount || 0;

  return (
    <div className="relative">
      {/* Top Action Bar (Favorite & Close) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFavorited(!isFavorited)}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:bg-white flex items-center justify-center text-gray-600 hover:text-red-500 transition active:scale-95 border border-gray-100"
          aria-label="Lưu vào món yêu thích"
          title="Yêu thích"
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              isFavorited ? 'text-red-500 fill-current' : 'fill-none'
            }`}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:bg-white flex items-center justify-center text-gray-700 hover:text-gray-900 transition active:scale-95 border border-gray-100"
          aria-label="Đóng cửa sổ"
          title="Đóng (ESC)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Banner / Image + Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-5 sm:p-7 border-b border-gray-100 bg-gradient-to-b from-orange-50/40 via-white to-white">
        {/* Product Image */}
        <div className="sm:col-span-4 relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square bg-gray-100 shadow-sm border border-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-2xs">
              <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-full text-xs shadow-md">
                Tạm hết hàng
              </span>
            </div>
          )}

          {product.category?.name && (
            <span className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="sm:col-span-8 flex flex-col justify-between pr-2 sm:pr-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug mb-2">
              {product.name}
            </h2>

            {/* Rating and review stats */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-100">
                <div className="flex text-amber-400 text-xs">
                  {'★'.repeat(5)}
                </div>
                <span className="font-bold text-xs">{rating}</span>
              </div>

              <span className="text-xs text-gray-500 font-medium">
                {reviewCount} đánh giá
              </span>

              {product.stock !== undefined && product.stock > 0 && (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                  Còn {product.stock} phần
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
              {product.description || 'Món ăn đậm đà, tươi ngon được chế biến theo công thức độc quyền từ MSon Food.'}
            </p>
          </div>

          {/* Base Price Tag */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-baseline gap-2">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Giá gốc:</span>
            <span className="text-2xl font-black text-orange-600 tracking-tight">
              {product.price?.toLocaleString()}đ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;
