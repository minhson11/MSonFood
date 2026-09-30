const orderService = require('../services/orderService');
const { validateCreateOrder } = require('../validators/orderValidator');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const validation = validateCreateOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { items, shippingAddress, paymentMethod, couponCode, shippingFee, distanceKm } = req.body;

    const order = await orderService.createOrder({
      userId: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      shippingFee,
      distanceKm,
    });

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getMyOrders(req.user._id);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById({
      orderId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.role === 'admin',
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder({
      orderId: req.params.id,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Process online payment (BLOCKED — server-side only via webhook)
// @route   PUT /api/orders/:id/payment
// @access  Private
exports.payOrder = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      'Không thể tự ý cập nhật trạng thái thanh toán từ trình duyệt. Trạng thái thanh toán trực tuyến được ngân hàng Techcombank và hệ thống xác minh tự động.',
  });
};

// @desc    Get order payment status (for frontend polling)
// @route   GET /api/orders/:id/payment-status
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const data = await orderService.getPaymentStatus({
      orderId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.role === 'admin',
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const { orders, pagination } = await orderService.getAllOrders({ status, page, limit });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trạng thái' });
    }

    const order = await orderService.updateOrderStatus({ orderId: req.params.id, status });

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng thành ${status}`,
      data: order,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
