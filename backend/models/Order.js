const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    basePrice: {
      type: Number
    },
    selectedVariant: {
      name: String,
      price: { type: Number, default: 0 }
    },
    selectedSize: {
      name: String,
      price: { type: Number, default: 0 }
    },
    selectedToppings: [{
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topping' },
      name: String,
      price: Number
    }],
    toppingsPrice: {
      type: Number,
      default: 0
    },
    note: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ''
    }
  },
  orderCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'ONLINE', 'VNPAY', 'MOMO', 'CARD'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentDetails: {
    bankCode: { type: String, default: '' },
    cardType: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    paidAt: { type: Date }
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 15000
  },
  distanceKm: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
