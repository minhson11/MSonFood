const mongoose = require('mongoose');

const toppingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên topping là bắt buộc'],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'Giá topping là bắt buộc'],
    min: [0, 'Giá phải lớn hơn hoặc bằng 0']
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Topping', toppingSchema);
