/**
 * Cart Service — không gọi API (cart được quản lý client-side bởi Zustand cartStore)
 * File này export các helper utilities cho cart nếu cần dùng ngoài store.
 */

/**
 * Tạo composite key cho cart item dựa trên food + variant + size + toppings + note
 * Đồng bộ với generateItemKey trong cartStore.js
 */
export const generateCartItemKey = (food) => {
  const foodId = food._id || food.id || '';
  const variantName = food.selectedVariant?.name || 'default-variant';
  const sizeName = food.selectedSize?.name || 'default-size';
  const toppingIds = (food.selectedToppings || [])
    .map((t) => t._id || t.id || t.name)
    .sort()
    .join('-');
  const noteText = (food.note || '').trim().toLowerCase();

  return `${foodId}__v:${variantName}__s:${sizeName}__t:${toppingIds || 'none'}__n:${noteText || 'none'}`;
};

/**
 * Tính finalPrice của 1 food item (basePrice + variant + size + toppings)
 */
export const computeItemFinalPrice = (food) => {
  const basePrice = food.price || 0;
  const variantPrice = food.selectedVariant?.price || 0;
  const sizePrice = food.selectedSize?.price || 0;
  const toppingsPrice = (food.selectedToppings || []).reduce((sum, t) => sum + (t.price || 0), 0);
  return basePrice + variantPrice + sizePrice + toppingsPrice;
};
