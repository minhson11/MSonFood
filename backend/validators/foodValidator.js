/**
 * Validators cho Food CRUD
 */

const validateCreateFood = ({ name, price, category }) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Tên món ăn là bắt buộc' };
  }
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return { isValid: false, message: 'Giá món ăn phải là số không âm' };
  }
  if (!category) {
    return { isValid: false, message: 'Danh mục món ăn là bắt buộc' };
  }
  return { isValid: true };
};

const validateUpdateFood = (data) => {
  if (data.price !== undefined && (isNaN(Number(data.price)) || Number(data.price) < 0)) {
    return { isValid: false, message: 'Giá món ăn phải là số không âm' };
  }
  if (data.stock !== undefined && (isNaN(Number(data.stock)) || Number(data.stock) < 0)) {
    return { isValid: false, message: 'Số lượng tồn kho phải là số không âm' };
  }
  return { isValid: true };
};

module.exports = { validateCreateFood, validateUpdateFood };
