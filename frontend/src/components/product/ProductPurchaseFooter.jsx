const ProductPurchaseFooter = ({
  basePrice = 0,
  variantPrice = 0,
  sizePrice = 0,
  toppingsTotal = 0,
  quantity = 1,
  unitPrice = 0,
  totalPrice = 0,
  isAvailable = true,
  onAddToCart,
  onBuyNow,
}) => {
  const optionsTotal = variantPrice + sizePrice;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 sm:p-5 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] rounded-b-[20px]">
      {/* Price Summary Breakdown Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 text-xs text-gray-500 pb-2.5 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Gốc: <strong className="text-gray-800 font-bold">{basePrice.toLocaleString()}đ</strong>
          </span>
          {optionsTotal > 0 && (
            <span>
              Phần/Size: <strong className="text-orange-600 font-bold">+{optionsTotal.toLocaleString()}đ</strong>
            </span>
          )}
          {toppingsTotal > 0 && (
            <span>
              Topping: <strong className="text-orange-600 font-bold">+{toppingsTotal.toLocaleString()}đ</strong>
            </span>
          )}
          <span>
            SL: <strong className="text-gray-900 font-bold">× {quantity}</strong>
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 ml-auto">
          <span className="text-xs text-gray-400 font-semibold uppercase">Tổng:</span>
          <span className="text-lg sm:text-2xl font-black text-orange-600 tracking-tight">
            {totalPrice.toLocaleString()}đ
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {isAvailable ? (
          <>
            <button
              type="button"
              onClick={onAddToCart}
              className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-150 shadow-2xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Thêm vào giỏ</span>
            </button>

            <button
              type="button"
              onClick={onBuyNow}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors duration-150 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>MUA NGAY</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled
            className="w-full bg-gray-100 text-gray-400 py-3.5 px-4 rounded-xl text-sm font-bold cursor-not-allowed text-center"
          >
            Món ăn tạm thời hết hàng
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductPurchaseFooter;
