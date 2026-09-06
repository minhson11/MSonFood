import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuth from '../hooks/useAuth';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, removeItem, updateQuantity, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();

  const getItemKey = (item, index) => item.itemKey || `${item.food._id || item.food.id}-${index}`;

  // State lưu danh sách itemKey của các món được tích chọn để thanh toán
  const [selectedKeys, setSelectedKeys] = useState(() =>
    items.map((item, idx) => getItemKey(item, idx))
  );

  // Đồng bộ selectedKeys khi items thay đổi (loại bỏ key của món đã bị xóa)
  useEffect(() => {
    const currentKeys = items.map((item, idx) => getItemKey(item, idx));
    setSelectedKeys((prev) => prev.filter((k) => currentKeys.includes(k)));
  }, [items]);

  const allKeys = items.map((item, idx) => getItemKey(item, idx));
  const isAllSelected = items.length > 0 && selectedKeys.length === items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allKeys);
    }
  };

  const handleToggleItem = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleQuantityChange = (foodId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (quantity > 0) {
      updateQuantity(foodId, quantity);
    }
  };

  const handleIncrement = (foodId) => {
    increaseQuantity(foodId);
  };

  const handleDecrement = (foodId) => {
    decreaseQuantity(foodId);
  };

  const handleRemove = (foodId) => {
    if (window.confirm('Xóa món này khỏi giỏ hàng?')) {
      removeItem(foodId);
    }
  };

  // Lọc ra các món đang được chọn để tính tiền & chuyển sang checkout
  const selectedItems = items.filter((item, idx) =>
    selectedKeys.includes(getItemKey(item, idx))
  );

  const subtotal = selectedItems.reduce((acc, item) => {
    const unitPrice = item.food.finalPrice || item.food.price || 0;
    return acc + unitPrice * item.quantity;
  }, 0);

  const shippingFee = selectedItems.length > 0 ? 15000 : 0;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng tích chọn ít nhất một món ăn để tiến hành thanh toán.');
      return;
    }
    if (!isAuthenticated) {
      // Save intended destination
      navigate('/login', { state: { from: '/checkout', selectedItems } });
      return;
    }
    navigate('/checkout', { state: { selectedItems } });
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-12">
        <div className="text-center max-w-md mx-auto">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">Thêm món ăn ngon vào giỏ hàng của bạn</p>
          <Link to="/menu" className="btn-primary inline-block">
            Xem Thực Đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8">Giỏ Hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Món trong giỏ ({items.length})
                </h2>
                {/* Nút chọn tất cả ở dưới chữ "Món trong giỏ" */}
                <label className="inline-flex items-center gap-2.5 mt-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                  />
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                    Chọn tất cả ({selectedItems.length}/{items.length} món)
                  </span>
                </label>
              </div>

              {items.length > 0 && (
                <div className="flex items-center gap-3">
                  {selectedKeys.length > 0 && selectedKeys.length < items.length && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Xóa ${selectedItems.length} món đã chọn khỏi giỏ hàng?`)) {
                          selectedKeys.forEach((k) => removeItem(k));
                        }
                      }}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      Xóa món đã chọn ({selectedItems.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Xóa tất cả món khỏi giỏ hàng?')) {
                        clearCart();
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const itemKey = getItemKey(item, index);
                const isSelected = selectedKeys.includes(itemKey);
                const itemUnitPrice = item.food.finalPrice || item.food.price;
                const itemTotal = itemUnitPrice * item.quantity;
                const hasToppings = item.food.selectedToppings && item.food.selectedToppings.length > 0;

                return (
                  <div
                    key={itemKey}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-white border-orange-200 shadow-xs ring-1 ring-orange-100/70'
                        : 'bg-gray-50/70 border-gray-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox chọn món hình vuông */}
                    <div className="flex items-center self-start sm:self-center pt-1 sm:pt-0">
                      <label className="relative flex items-center justify-center cursor-pointer p-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(itemKey)}
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                        />
                      </label>
                    </div>

                    {/* Image */}
                    <Link to={`/food/${item.food._id}`} className="flex-shrink-0">
                      {item.food.image ? (
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/food/${item.food._id}`}
                        className="font-bold text-base sm:text-lg hover:text-orange-600 transition-colors block mb-1"
                      >
                        {item.food.name}
                      </Link>

                      <p className="text-gray-500 text-xs mb-2 line-clamp-1">
                        {item.food.description}
                      </p>

                      {/* Hiển thị chi tiết Cấu hình (Phần ăn / Size / Topping) */}
                      {(item.food.selectedVariant || item.food.selectedSize || hasToppings || item.food.note) && (
                        <div className="bg-orange-50/70 border border-orange-100 rounded-lg p-2.5 mb-2 space-y-1">
                          {item.food.selectedVariant && (
                            <div className="text-xs text-orange-950 font-bold flex items-center gap-1">
                              <span className="text-orange-600">🍗 Phần ăn:</span> {item.food.selectedVariant.name}
                              {item.food.selectedVariant.price > 0 && ` (+${item.food.selectedVariant.price.toLocaleString()}đ)`}
                            </div>
                          )}
                          {item.food.selectedSize && (
                            <div className="text-xs text-orange-950 font-bold flex items-center gap-1">
                              <span className="text-orange-600">📏 Kích thước:</span> {item.food.selectedSize.name}
                              {item.food.selectedSize.price > 0 && ` (+${item.food.selectedSize.price.toLocaleString()}đ)`}
                            </div>
                          )}
                          {hasToppings && (
                            <div className="text-xs text-orange-900 font-semibold flex items-center gap-1">
                              <span className="text-orange-600">✨ Topping:</span>{' '}
                              {item.food.selectedToppings.map(t => `${t.name} (+${t.price?.toLocaleString()}đ)`).join(', ')}
                            </div>
                          )}
                          {item.food.note && (
                            <div className="text-xs text-gray-600 italic flex items-center gap-1 pt-0.5 border-t border-orange-200/60">
                              <span>📝 Ghi chú:</span> "{item.food.note}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hiển thị giá gốc và giá topping */}
                      <div className="text-sm space-y-0.5">
                        <div className="text-gray-500 text-xs">
                          Giá gốc: <span className="font-medium text-gray-700">{item.food.price.toLocaleString()}đ</span>
                          {item.food.toppingsPrice > 0 && (
                            <span className="ml-2 text-orange-600 font-medium">
                              (Topping: +{item.food.toppingsPrice.toLocaleString()}đ)
                            </span>
                          )}
                        </div>
                        <div className="text-orange-600 font-bold text-base">
                          Đơn giá: {itemUnitPrice.toLocaleString()}đ
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Subtotal */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(itemKey)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(itemKey, e.target.value)}
                          className="w-14 text-center border border-gray-300 rounded-lg py-1 text-sm font-semibold"
                        />
                        <button
                          onClick={() => handleIncrement(itemKey)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Tạm tính</div>
                        <div className="font-bold text-base text-gray-900">
                          {itemTotal.toLocaleString()}đ
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(itemKey)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold hover:underline"
                      >
                        Xóa món
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Shopping */}
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mt-4 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tiếp tục mua hàng
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <h3 className="text-xl font-bold mb-4">Tóm Tắt Đơn Hàng</h3>

            <div className="space-y-3 mb-4 pb-4 border-b">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Món đã chọn</span>
                <span className="font-bold text-gray-900">
                  {selectedItems.length} / {items.length} món
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tạm tính</span>
                <span className="font-semibold text-gray-900">{subtotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Phí vận chuyển dự kiến</span>
                <span>{shippingFee > 0 ? `${shippingFee.toLocaleString()}đ` : '0đ'}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{total.toLocaleString()}đ</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className={`w-full btn-primary ${
                selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : ''
              }`}
            >
              {selectedItems.length > 0
                ? `Tiến Hành Thanh Toán (${selectedItems.length} món)`
                : 'Vui lòng chọn món để thanh toán'}
            </button>

            {!isAuthenticated && selectedItems.length > 0 && (
              <p className="text-sm text-gray-600 text-center mt-4">
                Vui lòng đăng nhập để thanh toán
              </p>
            )}

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Thanh toán an toàn</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Giao hàng nhanh</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Nhiều phương thức thanh toán</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
