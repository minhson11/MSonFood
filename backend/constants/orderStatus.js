/**
 * Order status constants
 * Trạng thái đơn hàng theo đúng enum trong Order.js schema
 */
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/** Các trạng thái cho phép user tự hủy đơn */
const CANCELLABLE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];

module.exports = { ORDER_STATUS, CANCELLABLE_STATUSES };
