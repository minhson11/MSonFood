const paymentService = require('../services/paymentService');

// @desc    SePay Webhook Receiver
// @route   POST /api/payments/webhook
// @access  Public (Protected by API Key in Authorization header)
exports.handleSePayWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || '';
    const configuredApiKey = process.env.SEPAY_WEBHOOK_API_KEY;

    const result = await paymentService.handleSePayWebhook({
      body: req.body,
      apiKey: authHeader,
      configuredApiKey,
    });

    if (result.alreadyProcessed || result.alreadyPaid) {
      return res.status(200).json({
        success: true,
        message: result.alreadyProcessed
          ? 'Transaction already processed successfully'
          : 'Order is already in paid state',
      });
    }

    console.log(`✅ [PAYMENT SUCCESS] Order ${result.orderCode} successfully marked as PAID via Techcombank SePay Webhook!`);

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        orderCode: result.orderCode,
        paymentStatus: result.paymentStatus,
        transactionId: result.transactionId,
        paidAt: result.paidAt,
      },
    });
  } catch (error) {
    console.error('❌ Error handling SePay webhook:', error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Simulate payment success (DEVELOPMENT / TEST ONLY)
// @route   POST /api/payments/test/simulate-success
// @access  Private / Dev Only
exports.simulateSuccessDev = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Tính năng mô phỏng thanh toán bị vô hiệu hóa hoàn toàn trong môi trường Production.',
      });
    }

    const { orderId, orderCode } = req.body;

    if (!orderId && !orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp orderId hoặc orderCode',
      });
    }

    const data = await paymentService.simulateSuccessDev({ orderId, orderCode });

    console.log(`⚡ [DEV SIMULATION] Order ${data.orderCode || data.orderId} simulated as PAID.`);

    res.status(200).json({
      success: true,
      message: 'Mô phỏng Techcombank báo nhận tiền thành công (Chỉ dành cho môi trường Development)',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
