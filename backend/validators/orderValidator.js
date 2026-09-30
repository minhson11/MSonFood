/**
 * Validators cho Order
 */

const validateCreateOrder = ({ items, shippingAddress }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { isValid: false, message: 'Vui lòng cung cấp danh sách món ăn' };
  }

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.address
  ) {
    return {
      isValid: false,
      message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng (họ tên, số điện thoại, địa chỉ)',
    };
  }

  for (const item of items) {
    if (!item.food || !item.quantity) {
      return { isValid: false, message: 'Mỗi món ăn phải có ID và số lượng' };
    }
    if (item.quantity <= 0) {
      return { isValid: false, message: 'Số lượng phải lớn hơn 0' };
    }
  }

  return { isValid: true };
};

module.exports = { validateCreateOrder };
