const mongoose = require('mongoose');
const Order = require('../models/Order');
const Food = require('../models/Food');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const { computeItemPricing, computeDiscount, computeTotal } = require('../utils/calculatePrice');
const { ORDER_STATUS, CANCELLABLE_STATUSES } = require('../constants/orderStatus');
const { ONLINE_PAYMENT_METHODS } = require('../constants/paymentStatus');

/** Tạo orderCode duy nhất dạng MSF-XXXXXX */
const generateOrderCode = async () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `MSF-${randomPart}`;
    const existing = await Order.findOne({ orderCode: code });
    if (!existing) isUnique = true;
  }
  return code;
};

/**
 * Tạo đơn hàng mới
 */
const createOrder = async ({ userId, items, shippingAddress, paymentMethod, couponCode, shippingFee: reqShippingFee, distanceKm }) => {
  const processedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const food = await Food.findById(item.food);

    if (!food) {
      const err = new Error(`Không tìm thấy món ăn với ID ${item.food}`);
      err.statusCode = 404;
      throw err;
    }
    if (!food.isAvailable) {
      const err = new Error(`${food.name} hiện không khả dụng`);
      err.statusCode = 400;
      throw err;
    }
    if (food.stock < item.quantity) {
      const err = new Error(`Không đủ hàng cho ${food.name}. Còn lại: ${food.stock}`);
      err.statusCode = 400;
      throw err;
    }

    const pricing = await computeItemPricing(food, item);
    const { unitPrice, validSelectedVariant, validSelectedSize, validSelectedToppings, toppingsPrice } = pricing;
    const itemSubtotal = unitPrice * item.quantity;

    processedItems.push({
      food: food._id,
      name: food.name,
      price: unitPrice,
      basePrice: food.price,
      selectedVariant: validSelectedVariant,
      selectedSize: validSelectedSize,
      selectedToppings: validSelectedToppings,
      toppingsPrice,
      note: (item.note || '').slice(0, 200),
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });

    subtotal += itemSubtotal;
  }

  // Shipping fee
  let shippingFee = 15000;
  if (reqShippingFee !== undefined && Number(reqShippingFee) >= 0) {
    shippingFee = Number(reqShippingFee);
  }

  // Coupon
  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

    if (!coupon) {
      const err = new Error('Không tìm thấy mã giảm giá');
      err.statusCode = 404;
      throw err;
    }
    if (!coupon.isActive) {
      const err = new Error('Mã giảm giá không hoạt động');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      const err = new Error('Mã giảm giá đã hết hạn hoặc chưa có hiệu lực');
      err.statusCode = 400;
      throw err;
    }
    if (coupon.quantity <= coupon.usedCount) {
      const err = new Error('Mã giảm giá đã hết lượt sử dụng');
      err.statusCode = 400;
      throw err;
    }
    if (subtotal < coupon.minOrderValue) {
      const err = new Error(`Đơn hàng phải đạt tối thiểu ${coupon.minOrderValue}đ để sử dụng mã này`);
      err.statusCode = 400;
      throw err;
    }

    discount = computeDiscount(coupon, subtotal);
    appliedCoupon = coupon._id;

    coupon.usedCount += 1;
    await coupon.save();
  }

  const totalPrice = computeTotal(subtotal, shippingFee, discount);
  const orderCode = await generateOrderCode();

  const order = await Order.create({
    user: userId,
    orderCode,
    items: processedItems,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      address: shippingAddress.address,
      note: shippingAddress.note || '',
    },
    paymentMethod: paymentMethod || 'COD',
    subtotal,
    shippingFee,
    distanceKm: Number(distanceKm) || 0,
    discount,
    totalPrice,
    coupon: appliedCoupon,
    status: ORDER_STATUS.PENDING,
  });

  // Tạo Payment record ban đầu cho online payment
  const isOnlinePayment = ONLINE_PAYMENT_METHODS.includes(order.paymentMethod);
  if (isOnlinePayment) {
    await Payment.create({
      order: order._id,
      orderCode: order.orderCode,
      amount: order.totalPrice,
      currency: 'VND',
      method: order.paymentMethod === 'ONLINE' ? 'VIETQR' : order.paymentMethod,
      provider: 'SEPAY',
      bankCode: process.env.TECHCOMBANK_BANK_CODE || '970407',
      accountNumber: process.env.TECHCOMBANK_ACCOUNT_NUMBER || '19073053712019',
      transferContent: order.orderCode,
      status: 'PENDING',
    });
  }

  // Trừ stock và tăng soldCount
  for (const item of processedItems) {
    await Food.findByIdAndUpdate(item.food, {
      $inc: { stock: -item.quantity, soldCount: item.quantity },
    });
  }

  await order.populate('items.food', 'name image');
  await order.populate('user', 'name email phone');
  if (appliedCoupon) {
    await order.populate('coupon', 'code discountType discountValue');
  }

  return order;
};

/**
 * Lấy danh sách đơn hàng của user hiện tại
 */
const getMyOrders = async (userId) => {
  return Order.find({ user: userId })
    .populate('items.food', 'name image')
    .populate('coupon', 'code discountType discountValue')
    .sort({ createdAt: -1 });
};

/**
 * Lấy 1 đơn hàng (kiểm tra quyền truy cập)
 */
const getOrderById = async ({ orderId, userId, isAdmin }) => {
  const order = await Order.findById(orderId)
    .populate('items.food', 'name image category')
    .populate('user', 'name email phone')
    .populate('coupon', 'code discountType discountValue');

  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng');
    err.statusCode = 404;
    throw err;
  }

  if (!isAdmin && order.user._id.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền xem đơn hàng này');
    err.statusCode = 403;
    throw err;
  }

  return order;
};

/**
 * Hủy đơn hàng (user)
 */
const cancelOrder = async ({ orderId, userId }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng');
    err.statusCode = 404;
    throw err;
  }

  if (order.user.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền hủy đơn hàng này');
    err.statusCode = 403;
    throw err;
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    const err = new Error(`Không thể hủy đơn hàng ở trạng thái ${order.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Hoàn stock và coupon
  for (const item of order.items) {
    await Food.findByIdAndUpdate(item.food, { $inc: { stock: item.quantity, soldCount: -item.quantity } });
  }

  if (order.coupon) {
    await Coupon.findByIdAndUpdate(order.coupon, { $inc: { usedCount: -1 } });
  }

  order.status = ORDER_STATUS.CANCELLED;
  await order.save();
  return order;
};

/**
 * Lấy trạng thái thanh toán (cho frontend polling)
 */
const getPaymentStatus = async ({ orderId, userId, isAdmin }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng');
    err.statusCode = 404;
    throw err;
  }

  if (!isAdmin && order.user.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền xem trạng thái thanh toán của đơn hàng này');
    err.statusCode = 403;
    throw err;
  }

  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 });

  return {
    orderId: order._id,
    orderCode: order.orderCode || `ORD${order._id.toString().slice(-6).toUpperCase()}`,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    amount: order.totalPrice,
    transactionId: payment?.transactionId || order.paymentDetails?.transactionId || null,
    referenceCode: payment?.referenceCode || null,
    paidAt: payment?.paidAt || order.paymentDetails?.paidAt || null,
    bankCode: payment?.bankCode || 'TCB',
    accountNumber: payment?.accountNumber || process.env.TECHCOMBANK_ACCOUNT_NUMBER || '19073053712019',
  };
};

/**
 * Lấy tất cả đơn hàng (Admin)
 */
const getAllOrders = async ({ status, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.food', 'name image')
      .populate('coupon', 'code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return { orders, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
};

/** Valid status transitions (Admin) */
const STATUS_FLOW = {
  pending: ['confirmed', 'preparing', 'shipping', 'completed', 'cancelled'],
  confirmed: ['pending', 'preparing', 'shipping', 'completed', 'cancelled'],
  preparing: ['confirmed', 'shipping', 'completed', 'cancelled'],
  shipping: ['preparing', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Cập nhật trạng thái đơn hàng (Admin)
 */
const updateOrderStatus = async ({ orderId, status }) => {
  const validStatuses = Object.keys(STATUS_FLOW);
  if (!validStatuses.includes(status)) {
    const err = new Error(`Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng');
    err.statusCode = 404;
    throw err;
  }

  const allowedNext = STATUS_FLOW[order.status];
  if (allowedNext.length > 0 && !allowedNext.includes(status)) {
    const err = new Error(
      `Không thể thay đổi trạng thái từ ${order.status} sang ${status}. Các trạng thái hợp lệ: ${allowedNext.join(', ')}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Admin hủy đơn → hoàn stock và coupon
  if (status === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.CANCELLED) {
    for (const item of order.items) {
      await Food.findByIdAndUpdate(item.food, { $inc: { stock: item.quantity, soldCount: -item.quantity } });
    }
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon, { $inc: { usedCount: -1 } });
    }
  }

  order.status = status;
  await order.save();
  await order.populate('user', 'name email phone');
  await order.populate('items.food', 'name image');
  return order;
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getPaymentStatus,
  getAllOrders,
  updateOrderStatus,
};
