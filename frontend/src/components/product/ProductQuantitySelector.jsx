const ProductQuantitySelector = ({
  quantity = 1,
  onChange,
  maxStock,
}) => {
  const isMinDisabled = quantity <= 1;
  const isMaxDisabled = maxStock !== undefined && maxStock > 0 && quantity >= maxStock;

  const handleDecrement = () => {
    if (!isMinDisabled) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (!isMaxDisabled) {
      onChange(quantity + 1);
    }
  };

  const handleDirectChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      onChange(1);
    } else if (maxStock !== undefined && maxStock > 0 && val > maxStock) {
      onChange(maxStock);
    } else {
      onChange(val);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
      <div>
        <h4 className="font-extrabold text-sm text-gray-900">Số lượng</h4>
        {maxStock !== undefined && (
          <span className="text-[11px] text-gray-400 font-medium">
            (Tối đa: {maxStock} phần)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl border border-gray-200/70">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isMinDisabled}
          className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-gray-700 font-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Giảm số lượng"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </button>

        <input
          type="number"
          min="1"
          max={maxStock || 99}
          value={quantity}
          onChange={handleDirectChange}
          className="w-12 text-center text-sm font-black text-gray-900 bg-transparent focus:outline-none"
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={isMaxDisabled}
          className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-gray-700 font-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Tăng số lượng"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductQuantitySelector;
