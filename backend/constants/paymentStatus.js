/**
 * Payment status constants
 * Đồng bộ với enum trong Order.js (paymentStatus) và Payment.js (status)
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
};

/** Payment record status (trong model Payment) */
const PAYMENT_RECORD_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

/** Payment methods */
const PAYMENT_METHOD = {
  COD: 'COD',
  ONLINE: 'ONLINE',
  VNPAY: 'VNPAY',
  MOMO: 'MOMO',
  CARD: 'CARD',
};

/** Các method được xem là online payment (cần tạo Payment record) */
const ONLINE_PAYMENT_METHODS = [
  PAYMENT_METHOD.ONLINE,
  PAYMENT_METHOD.VNPAY,
  PAYMENT_METHOD.MOMO,
  PAYMENT_METHOD.CARD,
  'VIETQR',
];

module.exports = {
  PAYMENT_STATUS,
  PAYMENT_RECORD_STATUS,
  PAYMENT_METHOD,
  ONLINE_PAYMENT_METHODS,
};
