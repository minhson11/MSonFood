/**
 * CartContext — thin wrapper quanh Zustand cartStore.
 *
 * Project đang dùng Zustand (cartStore) với persist middleware và
 * generateItemKey logic phức tạp, hoạt động tốt.
 * Context này export lại cùng interface cho pattern Context nếu cần.
 *
 * Source of truth: src/store/cartStore.js
 */
import { createContext, useContext } from 'react';
import useCartStore from '../store/cartStore';

export const CartContext = createContext(null);

/**
 * CartProvider — wrap app để cung cấp cart state qua Context.
 */
export const CartProvider = ({ children }) => {
  const cart = useCartStore();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
};

/**
 * useCartContext — hook để dùng CartContext.
 * Ưu tiên dùng useCartStore() trực tiếp thay vì hook này.
 */
export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) return useCartStore.getState();
  return context;
};

export default CartContext;
