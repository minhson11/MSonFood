const ProductSizeSelector = ({
  sizes = [],
  selectedSize,
  onChange,
  required = true,
  hasError = false,
}) => {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div
      id="section-size"
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
            Chọn kích thước / Size
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
          Vui lòng chọn kích thước trước khi tiếp tục
        </p>
      )}

      {/* Grid of size cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sizes.map((size, index) => {
          const isSelected = selectedSize?.name === size.name;
          const isOutOfStock = size.isAvailable === false;
          const priceDiff = Number(size.price) || 0;

          return (
            <button
              key={index}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onChange(size)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                isOutOfStock
                  ? 'bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40 text-orange-950 font-bold'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 text-gray-800'
              }`}
            >
              <div className="text-xs sm:text-sm font-extrabold mb-1">
                {size.name}
              </div>

              {isOutOfStock ? (
                <span className="text-[10px] text-red-600 font-bold">Hết hàng</span>
              ) : priceDiff > 0 ? (
                <span className="text-xs font-bold text-orange-600">
                  +{priceDiff.toLocaleString()}đ
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium">Tiêu chuẩn</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSizeSelector;
