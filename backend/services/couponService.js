const Coupon = require('../models/Coupon');
const { computeDiscount } = require('../utils/calculatePrice');

/**
 * Validate và tính discount cho coupon
 */
const applyCoupon = async ({ code, orderValue }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    const err = new Error('Không tìm thấy mã giảm giá');
    err.statusCode = 404;
    throw err;
  }

  if (!coupon.isActive) {
    const err = new Error('Mã giảm giá này không hoạt động');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  if (now < coupon.startDate) {
    const err = new Error('Mã giảm giá này chưa có hiệu lực');
    err.statusCode = 400;
    throw err;
  }
  if (now > coupon.endDate) {
    const err = new Error('Mã giảm giá này đã hết hạn');
    err.statusCode = 400;
    throw err;
  }
  if (coupon.quantity <= coupon.usedCount) {
    const err = new Error('Mã giảm giá đã hết lượt sử dụng');
    err.statusCode = 400;
    throw err;
  }
  if (orderValue < coupon.minOrderValue) {
    const err = new Error(
      `Đơn hàng phải đạt tối thiểu ${coupon.minOrderValue.toLocaleString()}đ để sử dụng mã này`
    );
    err.statusCode = 400;
    throw err;
  }

  const discount = computeDiscount(coupon, orderValue);

  return {
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount,
    },
    discount,
    finalAmount: orderValue - discount,
  };
};

/**
 * Lấy danh sách coupon đang active (public)
 */
const getActiveCoupons = async () => {
  const now = new Date();
  return Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $expr: { $lt: ['$usedCount', '$quantity'] },
  })
    .select('-usedCount')
    .sort({ createdAt: -1 });
};

/**
 * Lấy tất cả coupon (Admin)
 */
const getAllCoupons = async () => {
  return Coupon.find().sort({ createdAt: -1 });
};

/**
 * Lấy 1 coupon
 */
const getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    const err = new Error('Không tìm thấy mã giảm giá');
    err.statusCode = 404;
    throw err;
  }
  return coupon;
};

/**
 * Tạo coupon mới (Admin)
 */
const createCoupon = async (data) => {
  const { code, discountType, discountValue, minOrderValue, maxDiscount, quantity, startDate, endDate, isActive } = data;

  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    const err = new Error('Mã giảm giá đã tồn tại');
    err.statusCode = 400;
    throw err;
  }

  return Coupon.create({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    minOrderValue: minOrderValue || 0,
    maxDiscount: maxDiscount || null,
    quantity,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isActive: isActive !== undefined ? isActive : true,
  });
};

/**
 * Cập nhật coupon (Admin)
 */
const updateCoupon = async (id, data) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    const err = new Error('Không tìm thấy mã giảm giá');
    err.statusCode = 404;
    throw err;
  }

  const { code, discountType, discountValue, minOrderValue, maxDiscount, quantity, startDate, endDate, isActive } = data;

  if (quantity !== undefined && quantity < coupon.usedCount) {
    const err = new Error(`Số lượng không thể nhỏ hơn số lần đã sử dụng (${coupon.usedCount})`);
    err.statusCode = 400;
    throw err;
  }

  if (code && code.toUpperCase() !== coupon.code) {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      const err = new Error('Mã giảm giá đã tồn tại');
      err.statusCode = 400;
      throw err;
    }
    coupon.code = code.toUpperCase();
  }

  if (discountType) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
  if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
  if (quantity !== undefined) coupon.quantity = quantity;
  if (startDate) coupon.startDate = new Date(startDate);
  if (endDate) coupon.endDate = new Date(endDate);
  if (isActive !== undefined) coupon.isActive = isActive;

  await coupon.save();
  return coupon;
};

/**
 * Xóa coupon (Admin)
 */
const deleteCoupon = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    const err = new Error('Không tìm thấy mã giảm giá');
    err.statusCode = 404;
    throw err;
  }

  if (coupon.usedCount > 0) {
    const err = new Error(
      `Không thể xóa mã giảm giá đã được sử dụng ${coupon.usedCount} lần. Hãy xem xét vô hiệu hóa thay vì xóa.`
    );
    err.statusCode = 400;
    throw err;
  }

  await coupon.deleteOne();
};

module.exports = { applyCoupon, getActiveCoupons, getAllCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon };
