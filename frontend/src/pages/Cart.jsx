import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuth from '../hooks/useAuth';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, removeItem, updateQuantity, increaseQuantity, decreaseQuantity, clearCart, getTotal } = useCartStore();

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

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Save intended destination
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  const subtotal = getTotal();
  const shippingFee = 15000;
  const total = subtotal + shippingFee;

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
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h2 className="text-xl font-semibold">Món trong giỏ ({items.length})</h2>
              {items.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Xóa tất cả món khỏi giỏ hàng?')) {
                      clearCart();
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Xóa Giỏ Hàng
                </button>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const itemKey = item.itemKey || `${item.food._id}-${index}`;
                const itemUnitPrice = item.food.finalPrice || item.food.price;
                const itemTotal = itemUnitPrice * item.quantity;
                const hasToppings = item.food.selectedToppings && item.food.selectedToppings.length > 0;

                return (
                  <div
                    key={itemKey}
                    className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Image */}
                    <Link to={`/food/${item.food._id}`} className="flex-shrink-0">
                      {item.food.image ? (
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
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
                        className="font-semibold text-lg hover:text-primary-600 transition-colors block mb-1"
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
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
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
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mt-4"
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
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({items.length} món)</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{shippingFee.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{total.toLocaleString()}đ</span>
            </div>

            <button onClick={handleCheckout} className="w-full btn-primary">
              Tiến Hành Thanh Toán
            </button>

            {!isAuthenticated && (
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
