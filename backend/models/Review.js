const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Đánh giá là bắt buộc'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

// One review per user per food per order
reviewSchema.index({ user: 1, food: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
