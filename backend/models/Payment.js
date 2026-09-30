const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderCode: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'VND'
  },
  method: {
    type: String,
    default: 'VIETQR'
  },
  provider: {
    type: String,
    default: 'SEPAY'
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  referenceCode: {
    type: String,
    sparse: true,
    index: true
  },
  bankCode: {
    type: String,
    default: 'TCB'
  },
  accountNumber: {
    type: String,
    default: '19073053712019'
  },
  transferContent: {
    type: String,
    default: ''
  },
  transactionDate: {
    type: Date
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
