import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateItemKey = (food) => {
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

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (food, quantity = 1) => {
        set((state) => {
          const itemKey = food.itemKey || generateItemKey(food);
          
          const existingItemIndex = state.items.findIndex(
            (item) => (item.itemKey || generateItemKey(item.food)) === itemKey
          );
          
          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity,
            };
            return { items: updatedItems };
          }
          
          return {
            items: [...state.items, { food: { ...food, itemKey }, quantity, itemKey }],
          };
        });
      },

      removeItem: (itemKeyOrFoodId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.itemKey !== itemKeyOrFoodId && item.food._id !== itemKeyOrFoodId
          ),
        }));
      },

      updateQuantity: (itemKeyOrFoodId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemKeyOrFoodId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.itemKey === itemKeyOrFoodId || item.food._id === itemKeyOrFoodId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      increaseQuantity: (itemKeyOrFoodId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.itemKey === itemKeyOrFoodId || item.food._id === itemKeyOrFoodId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }));
      },

      decreaseQuantity: (itemKeyOrFoodId) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.itemKey === itemKeyOrFoodId || item.food._id === itemKeyOrFoodId) {
                const newQuantity = item.quantity - 1;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
              }
              return item;
            })
            .filter((item) => item.quantity > 0),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const itemPrice = item.food.finalPrice || item.food.price || 0;
          return total + itemPrice * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;

