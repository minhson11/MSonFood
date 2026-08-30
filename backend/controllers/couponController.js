const Coupon = require('../models/Coupon');

// @desc    Apply/Validate coupon
// @route   POST /api/coupons/apply
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;

    // Validate input
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giảm giá'
      });
    }

    if (!orderValue || orderValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp giá trị đơn hàng hợp lệ'
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá này không hoạt động'
      });
    }

    // Check expiration
    const now = new Date();
    if (now < coupon.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá này chưa có hiệu lực'
      });
    }

    if (now > coupon.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá này đã hết hạn'
      });
    }

    // Check quantity
    if (coupon.quantity <= coupon.usedCount) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng'
      });
    }

    // Check minimum order value
    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải đạt tối thiểu ${coupon.minOrderValue.toLocaleString()}đ để sử dụng mã này`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = Math.floor((orderValue * coupon.discountValue) / 100);
      
      // Apply max discount if set
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'fixed') {
      discount = coupon.discountValue;
    }

    // Discount cannot exceed order value
    if (discount > orderValue) {
      discount = orderValue;
    }

    // Return coupon details and calculated discount
    res.status(200).json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount
        },
        discount,
        finalAmount: orderValue - discount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Public (only show active coupons)
exports.getCoupons = async (req, res, next) => {
  try {
    const now = new Date();

    // Only show active coupons that are currently valid
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$quantity'] }
    }).select('-usedCount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin - including inactive)
// @route   GET /api/admin/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
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
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      quantity,
      startDate,
      endDate,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !quantity || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã, loại giảm giá, giá trị, số lượng, ngày bắt đầu và ngày kết thúc'
      });
    }

    // Validate discount type
    if (!['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại giảm giá phải là "percent" hoặc "fixed"'
      });
    }

    // Validate discount value
    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị giảm giá phải lớn hơn 0'
      });
    }

    if (discountType === 'percent' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Giảm giá theo phần trăm không thể vượt quá 100%'
      });
    }

    // Validate quantity
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không thể âm'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải sau ngày bắt đầu'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã tồn tại'
      });
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || null,
      quantity,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      quantity,
      startDate,
      endDate,
      isActive
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    // Validate discount type
    if (discountType && !['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại giảm giá phải là "percent" hoặc "fixed"'
      });
    }

    // Validate discount value
    if (discountValue !== undefined) {
      if (discountValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị giảm giá phải lớn hơn 0'
        });
      }

      const finalDiscountType = discountType || coupon.discountType;
      if (finalDiscountType === 'percent' && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'Giảm giá theo phần trăm không thể vượt quá 100%'
        });
      }
    }

    // Validate quantity
    if (quantity !== undefined && quantity < coupon.usedCount) {
      return res.status(400).json({
        success: false,
        message: `Số lượng không thể nhỏ hơn số lần đã sử dụng (${coupon.usedCount})`
      });
    }

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'Ngày kết thúc phải sau ngày bắt đầu'
        });
      }
    }

    // Check if new code already exists
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã tồn tại'
        });
      }
    }

    // Update fields
    if (code) coupon.code = code.toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (quantity !== undefined) coupon.quantity = quantity;
    if (startDate) coupon.startDate = new Date(startDate);
    if (endDate) coupon.endDate = new Date(endDate);
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    // Check if coupon has been used
    if (coupon.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa mã giảm giá đã được sử dụng ${coupon.usedCount} lần. Hãy xem xét vô hiệu hóa thay vì xóa.`
      });
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    next(error);
  }
};
