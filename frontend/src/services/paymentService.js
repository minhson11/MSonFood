/**
 * Payment Service — API calls liên quan đến thanh toán
 * Các payment functions nằm trong orderApi (simulateSuccess, getPaymentStatus)
 */
import { orderApi } from './orderApi';
import axiosClient from '../api/axiosClient';

const paymentService = {
  /** Lấy trạng thái thanh toán của đơn hàng */
  getPaymentStatus: (orderId) => orderApi.getPaymentStatus(orderId),

  /** Mô phỏng thanh toán thành công (DEV ONLY) */
  simulateSuccess: (orderId) => orderApi.simulateSuccess(orderId),

  /** Webhook handled server-side — không cần gọi từ client */
};

export default paymentService;
export { paymentService };
