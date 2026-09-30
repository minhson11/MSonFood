/**
 * Validators cho Coupon
 */

const validateCreateCoupon = ({ code, discountType, discountValue, startDate, endDate }) => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Mã coupon là bắt buộc' };
  }
  if (!['percent', 'fixed'].includes(discountType)) {
    return { isValid: false, message: 'Loại giảm giá phải là "percent" hoặc "fixed"' };
  }
  if (discountValue === undefined || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
    return { isValid: false, message: 'Giá trị giảm phải là số dương' };
  }
  if (discountType === 'percent' && Number(discountValue) > 100) {
    return { isValid: false, message: 'Giảm theo phần trăm không được vượt 100%' };
  }
  if (!startDate || !endDate) {
    return { isValid: false, message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc' };
  }
  if (new Date(startDate) >= new Date(endDate)) {
    return { isValid: false, message: 'Ngày kết thúc phải sau ngày bắt đầu' };
  }
  return { isValid: true };
};

const validateApplyCoupon = ({ code, subtotal }) => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Mã coupon là bắt buộc' };
  }
  if (subtotal === undefined || isNaN(Number(subtotal)) || Number(subtotal) < 0) {
    return { isValid: false, message: 'Tổng giá trị đơn hàng không hợp lệ' };
  }
  return { isValid: true };
};

module.exports = { validateCreateCoupon, validateApplyCoupon };
