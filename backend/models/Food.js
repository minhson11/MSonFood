const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên món ăn là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả là bắt buộc']
  },
  price: {
    type: Number,
    required: [true, 'Giá là bắt buộc'],
    min: [0, 'Giá phải lớn hơn hoặc bằng 0']
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Danh mục là bắt buộc']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng tồn kho không thể âm']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  toppings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topping'
  }],
  variants: [{
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }
  }],
  sizes: [{
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

// Index for search
foodSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Food', foodSchema);
