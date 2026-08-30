const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã giảm giá là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Giá trị giảm giá là bắt buộc'],
    min: [0, 'Giá trị giảm giá phải lớn hơn 0']
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Số lượng không thể âm']
  },
  usedCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
