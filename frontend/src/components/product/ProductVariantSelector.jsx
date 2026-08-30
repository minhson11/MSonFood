const ProductVariantSelector = ({
  variants = [],
  selectedVariant,
  onChange,
  required = true,
  hasError = false,
}) => {
  if (!variants || variants.length === 0) return null;

  return (
    <div
      id="section-variant"
      className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 ${
        hasError
          ? 'bg-red-50/70 border-2 border-red-400 ring-2 ring-red-100'
          : 'bg-white border border-gray-100 shadow-2xs'
      }`}
    >
      {/* Section Title */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
            Chọn phần ăn
          </h3>
          {required && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md">
              Bắt buộc
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 font-medium">Chọn 1</span>
      </div>

      {hasError && (
        <p className="text-xs text-red-600 font-bold mb-3 flex items-center gap-1">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Vui lòng chọn một phần ăn trước khi tiếp tục
        </p>
      )}

      {/* Options List */}
      <div className="space-y-2.5">
        {variants.map((variant, index) => {
          const isSelected = selectedVariant?.name === variant.name;
          const isOutOfStock = variant.isAvailable === false;
          const priceDiff = Number(variant.price) || 0;

          return (
            <label
              key={index}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="product-variant"
                  value={variant.name}
                  checked={isSelected}
                  disabled={isOutOfStock}
                  onChange={() => !isOutOfStock && onChange(variant)}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <div>
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? 'text-orange-950' : 'text-gray-800'
                    }`}
                  >
                    {variant.name}
                  </span>
                  {isOutOfStock && (
                    <span className="block text-[10px] text-red-600 font-semibold mt-0.5">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                {priceDiff > 0 ? (
                  <span
                    className={`text-xs sm:text-sm font-extrabold ${
                      isSelected ? 'text-orange-600' : 'text-gray-700'
                    }`}
                  >
                    +{priceDiff.toLocaleString()}đ
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-gray-400">
                    Mặc định
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ProductVariantSelector;
