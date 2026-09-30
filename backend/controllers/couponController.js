const couponService = require('../services/couponService');
const { validateCreateCoupon, validateApplyCoupon } = require('../validators/couponValidator');

// @desc    Apply/Validate coupon
// @route   POST /api/coupons/apply
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  try {
    const validation = validateApplyCoupon({ code: req.body.code, subtotal: req.body.orderValue });
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { code, orderValue } = req.body;
    const data = await couponService.applyCoupon({ code, orderValue });

    res.status(200).json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get all active coupons (public)
// @route   GET /api/coupons
// @access  Public
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getActiveCoupons();

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin — including inactive)
// @route   GET /api/admin/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getAllCoupons();

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private/Admin
exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const validation = validateCreateCoupon(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const coupon = await couponService.createCoupon(req.body);

    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      data: coupon,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      data: coupon,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa mã giảm giá thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
