const ProductToppingSelector = ({
  toppings = [],
  selectedToppings = [],
  onToggle,
}) => {
  if (!toppings || toppings.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
            Thêm Topping
          </h3>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
            Tùy chọn
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">Chọn nhiều</span>
      </div>

      {/* Topping Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {toppings.map((topping, index) => {
          const toppingId = topping._id || topping.id || topping.name;
          const isSelected = selectedToppings.some(
            (t) => (t._id || t.id || t.name) === toppingId
          );
          const isOutOfStock = topping.isActive === false || topping.isAvailable === false;
          const price = Number(topping.price) || 0;

          return (
            <label
              key={toppingId || index}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isOutOfStock
                  ? 'bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isOutOfStock}
                  onChange={() => !isOutOfStock && onToggle(topping)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="min-w-0">
                  <span
                    className={`block text-xs sm:text-sm font-bold truncate ${
                      isSelected ? 'text-orange-950' : 'text-gray-800'
                    }`}
                  >
                    {topping.name}
                  </span>
                  {topping.description && (
                    <span className="block text-[11px] text-gray-400 truncate">
                      {topping.description}
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="block text-[10px] text-red-600 font-semibold mt-0.5">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`text-xs font-extrabold flex-shrink-0 ml-2 ${
                  isSelected ? 'text-orange-600' : 'text-gray-700'
                }`}
              >
                +{price.toLocaleString()}đ
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ProductToppingSelector;
