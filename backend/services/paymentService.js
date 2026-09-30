const Order = require('../models/Order');
const Payment = require('../models/Payment');

/**
 * Xử lý SePay webhook
 * Logic chiết xuất từ paymentController.handleSePayWebhook
 */
const handleSePayWebhook = async ({ body, apiKey, configuredApiKey }) => {
  // 1. Xác thực API key
  if (!configuredApiKey) {
    const err = new Error('Server payment configuration error');
    err.statusCode = 500;
    throw err;
  }

  const token = apiKey.replace(/^Apikey\s+/i, '').replace(/^Bearer\s+/i, '').trim();
  if (!token || token !== configuredApiKey) {
    const err = new Error('Unauthorized: Invalid or missing Webhook API key');
    err.statusCode = 401;
    throw err;
  }

  const { id, transactionDate, accountNumber, code, content, transferType, transferAmount, referenceCode, description } = body;

  // 2. Chỉ xử lý giao dịch đến
  if (transferType !== 'in') {
    const err = new Error('Transaction rejected: Only incoming transactions ("in") are processed');
    err.statusCode = 400;
    throw err;
  }

  // 3. Kiểm tra tài khoản nhận
  const expectedAccount = (process.env.TECHCOMBANK_ACCOUNT_NUMBER || '19073053712019').replace(/\s+/g, '');
  const receivedAccount = (accountNumber ? accountNumber.toString() : '').replace(/\s+/g, '');

  if (receivedAccount !== expectedAccount) {
    const err = new Error('Transaction rejected: Beneficiary account number mismatch');
    err.statusCode = 400;
    throw err;
  }

  // 4. Trích xuất orderCode
  let extractedOrderCode = '';
  if (code && typeof code === 'string' && code.trim().startsWith('MSF-')) {
    extractedOrderCode = code.trim().toUpperCase();
  } else {
    const textToSearch = `${content || ''} ${description || ''} ${code || ''}`;
    const match = textToSearch.match(/MSF-[A-Z0-9]{4,12}/i);
    if (match) extractedOrderCode = match[0].toUpperCase();
  }

  if (!extractedOrderCode) {
    const err = new Error('Transaction rejected: Cannot find valid orderCode (format MSF-XXXXXX) in transfer content');
    err.statusCode = 404;
    throw err;
  }

  // 5. Tìm order
  const order = await Order.findOne({ orderCode: extractedOrderCode });
  if (!order) {
    const err = new Error(`Order not found with orderCode: ${extractedOrderCode}`);
    err.statusCode = 404;
    throw err;
  }

  // 6. Kiểm tra số tiền
  const receivedAmount = Number(transferAmount);
  const expectedAmount = Number(order.totalPrice);

  if (isNaN(receivedAmount) || receivedAmount !== expectedAmount) {
    const err = new Error(`Transaction rejected: Amount mismatch (Expected ${expectedAmount}đ, received ${receivedAmount}đ)`);
    err.statusCode = 400;
    throw err;
  }

  // 7. Idempotency check
  const txnIdString = id ? id.toString() : null;
  if (txnIdString) {
    const existingSuccessPayment = await Payment.findOne({
      $or: [
        { transactionId: txnIdString },
        ...(referenceCode ? [{ referenceCode: referenceCode.toString() }] : []),
      ],
      status: 'SUCCESS',
    });

    if (existingSuccessPayment) {
      return { alreadyProcessed: true, order };
    }
  }

  // 8. Kiểm tra order đã paid chưa
  if (order.paymentStatus === 'paid') {
    return { alreadyPaid: true, order };
  }

  // 9. Ghi Payment record
  const parsedTxnDate = transactionDate ? new Date(transactionDate) : new Date();

  let payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    payment = new Payment({
      order: order._id,
      orderCode: order.orderCode,
      amount: receivedAmount,
      currency: 'VND',
      method: 'VIETQR',
      provider: 'SEPAY',
      bankCode: 'TCB',
      accountNumber: expectedAccount,
    });
  }

  payment.status = 'SUCCESS';
  payment.transactionId = txnIdString || `SEPAY_${Date.now()}`;
  payment.referenceCode = referenceCode ? referenceCode.toString() : '';
  payment.transferContent = content || description || '';
  payment.transactionDate = !isNaN(parsedTxnDate.getTime()) ? parsedTxnDate : new Date();
  payment.paidAt = new Date();
  payment.rawData = body;
  await payment.save();

  // 10. Cập nhật order
  order.paymentStatus = 'paid';
  if (order.status === 'pending') order.status = 'confirmed';
  order.paymentDetails = {
    bankCode: 'TCB',
    cardType: 'VIETQR',
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
  };
  await order.save();

  return {
    success: true,
    orderCode: order.orderCode,
    paymentStatus: order.paymentStatus,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
  };
};

/**
 * Mô phỏng thanh toán thành công (DEV ONLY)
 */
const simulateSuccessDev = async ({ orderId, orderCode }) => {
  const query = orderId ? { _id: orderId } : { orderCode };
  const order = await Order.findOne(query);

  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng để mô phỏng');
    err.statusCode = 404;
    throw err;
  }

  if (order.status === 'cancelled') {
    const err = new Error('Đơn hàng này đã bị hủy, không thể mô phỏng thanh toán');
    err.statusCode = 400;
    throw err;
  }

  const simTransactionId = `SIM_TCB_${Date.now()}`;
  const simRef = `FT_SIM_${Math.floor(100000 + Math.random() * 900000)}`;

  let payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    payment = new Payment({
      order: order._id,
      orderCode: order.orderCode || `ORD${order._id.toString().slice(-6).toUpperCase()}`,
      amount: order.totalPrice,
      currency: 'VND',
      method: 'VIETQR',
      provider: 'SEPAY_SIMULATOR',
      bankCode: 'TCB',
      accountNumber: process.env.TECHCOMBANK_ACCOUNT_NUMBER || '19073053712019',
    });
  }

  payment.status = 'SUCCESS';
  payment.transactionId = simTransactionId;
  payment.referenceCode = simRef;
  payment.transferContent = `SIMULATE PAYMENT ${order.orderCode}`;
  payment.transactionDate = new Date();
  payment.paidAt = new Date();
  payment.rawData = { simulated: true, simulatedAt: new Date() };
  await payment.save();

  order.paymentStatus = 'paid';
  if (order.status === 'pending') order.status = 'confirmed';
  order.paymentDetails = {
    bankCode: 'TCB',
    cardType: 'VIETQR',
    transactionId: simTransactionId,
    paidAt: payment.paidAt,
  };
  await order.save();

  return {
    orderId: order._id,
    orderCode: order.orderCode,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    amount: order.totalPrice,
    transactionId: simTransactionId,
    referenceCode: simRef,
    paidAt: payment.paidAt,
  };
};

module.exports = { handleSePayWebhook, simulateSuccessDev };
