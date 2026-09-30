const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Order = require('./models/Order');
const Payment = require('./models/Payment');
const User = require('./models/User');
const Food = require('./models/Food');

const API_BASE = 'http://localhost:5000/api';
const SEPAY_KEY = process.env.SEPAY_WEBHOOK_API_KEY || 'MSON_FOOD_SEPAY_DEV_KEY_2026';
const TECHCOMBANK_ACCOUNT = process.env.TECHCOMBANK_ACCOUNT_NUMBER || '19073053712019';

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG THANH TOÁN SEPAY');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Đã kết nối MongoDB Atlas thành công');

  // 0. Prepare a test customer user and food
  let user = await User.findOne({ role: 'customer' });
  if (!user) {
    user = await User.findOne({});
  }
  const token = require('jsonwebtoken').sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const food = await Food.findOne({ isAvailable: true });
  if (!food) {
    throw new Error('Không tìm thấy món ăn nào trong DB để test');
  }

  console.log(`✓ Người dùng test: ${user.name} (${user.email})`);
  console.log(`✓ Món ăn test: ${food.name} (Giá: ${food.price}đ)`);

  // ==========================================
  // TEST 1: TẠO ĐƠN HÀNG VỚI ONLINE PAYMENT
  // ==========================================
  console.log('\n--- TEST 1: TẠO ORDER & KIỂM TRA ORDERCODE, PAYMENT PENDING ---');
  const createRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [{ food: food._id.toString(), quantity: 1 }],
      shippingAddress: {
        fullName: 'Nguyễn Văn Test',
        phone: '0901234567',
        address: '123 Đường Test, Quận 1, TP.HCM'
      },
      paymentMethod: 'ONLINE'
    })
  });

  const createData = await createRes.json();
  if (!createData.success) {
    throw new Error(`Tạo đơn hàng thất bại: ${createData.message}`);
  }

  const orderId = createData.data._id;
  const orderCode = createData.data.orderCode;
  const totalPrice = createData.data.totalPrice;

  console.log(`✓ Đơn hàng tạo thành công: ID = ${orderId}`);
  console.log(`✓ orderCode duy nhất được sinh: ${orderCode}`);
  console.log(`✓ order.paymentStatus = ${createData.data.paymentStatus}`);
  console.log(`✓ order.totalPrice = ${totalPrice}đ`);

  // Verify in MongoDB Atlas
  const dbOrder = await Order.findById(orderId);
  const dbPendingPayment = await Payment.findOne({ order: orderId });
  console.log(`✓ MongoDB Atlas: order.orderCode = "${dbOrder.orderCode}"`);
  console.log(`✓ MongoDB Atlas: payment.status = "${dbPendingPayment?.status}", provider = "${dbPendingPayment?.provider}"`);

  if (!orderCode || !orderCode.startsWith('MSF-')) {
    throw new Error('TEST 1 THẤT BẠI: orderCode không đúng định dạng MSF-');
  }
  if (dbPendingPayment?.status !== 'PENDING') {
    throw new Error('TEST 1 THẤT BẠI: Payment record không ở trạng thái PENDING');
  }

  // ==========================================
  // TEST 2: GET PAYMENT STATUS KHI PENDING
  // ==========================================
  console.log('\n--- TEST 2: GET /api/orders/:id/payment-status (PENDING) ---');
  const statusRes = await fetch(`${API_BASE}/orders/${orderId}/payment-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statusData = await statusRes.json();
  console.log(`✓ Response: paymentStatus = "${statusData.data.paymentStatus}", orderCode = "${statusData.data.orderCode}"`);
  if (statusData.data.paymentStatus !== 'pending') {
    throw new Error('TEST 2 THẤT BẠI: Trạng thái không phải pending');
  }

  // ==========================================
  // TEST 3: CHẶN CLIENT TỰ Ý GỌI PUT /api/orders/:id/payment (CLIENT BYPASS)
  // ==========================================
  console.log('\n--- TEST 3: BẢO MẬT - CHẶN CLIENT TỰ Ý CẬP NHẬT PAID QUA PUT /payment ---');
  const bypassRes = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentMethod: 'VIETQR',
      transactionId: 'FAKE_TXN_FROM_BROWSER'
    })
  });
  const bypassData = await bypassRes.json();
  console.log(`✓ HTTP Status: ${bypassRes.status}, Message: "${bypassData.message}"`);
  if (bypassRes.status !== 400 || bypassData.success !== false) {
    throw new Error('TEST 3 THẤT BẠI: Lỗ hổng bypass chưa được chặn!');
  }

  // ==========================================
  // TEST 4: WEBHOOK VỚI SAI API KEY
  // ==========================================
  console.log('\n--- TEST 4: WEBHOOK - TỪ CHỐI KHI SAI API KEY ---');
  const wrongKeyRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Apikey WRONG_INVALID_KEY_123'
    },
    body: JSON.stringify({
      id: 999901,
      gateway: 'Techcombank',
      accountNumber: TECHCOMBANK_ACCOUNT,
      code: orderCode,
      content: orderCode,
      transferType: 'in',
      transferAmount: totalPrice
    })
  });
  console.log(`✓ HTTP Status: ${wrongKeyRes.status} (Kỳ vọng: 401 Unauthorized)`);
  if (wrongKeyRes.status !== 401) {
    throw new Error('TEST 4 THẤT BẠI: Webhook không chặn khi sai API key');
  }

  // ==========================================
  // TEST 5: WEBHOOK VỚI TIỀN RA (transferType = "out")
  // ==========================================
  console.log('\n--- TEST 5: WEBHOOK - TỪ CHỐI GIAO DỊCH TIỀN RA (out) ---');
  const outRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${SEPAY_KEY}`
    },
    body: JSON.stringify({
      id: 999902,
      gateway: 'Techcombank',
      accountNumber: TECHCOMBANK_ACCOUNT,
      code: orderCode,
      content: orderCode,
      transferType: 'out',
      transferAmount: totalPrice
    })
  });
  console.log(`✓ HTTP Status: ${outRes.status} (Kỳ vọng: 400 Rejected)`);
  if (outRes.status !== 400) {
    throw new Error('TEST 5 THẤT BẠI: Giao dịch tiền ra không bị từ chối');
  }

  // ==========================================
  // TEST 6: WEBHOOK SAI SỐ TÀI KHOẢN THỤ HƯỞNG
  // ==========================================
  console.log('\n--- TEST 6: WEBHOOK - TỪ CHỐI KHI SAI SỐ TÀI KHOẢN NHẬN ---');
  const wrongAccRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${SEPAY_KEY}`
    },
    body: JSON.stringify({
      id: 999903,
      gateway: 'Techcombank',
      accountNumber: '999988887777', // Tài khoản lạ
      code: orderCode,
      content: orderCode,
      transferType: 'in',
      transferAmount: totalPrice
    })
  });
  console.log(`✓ HTTP Status: ${wrongAccRes.status} (Kỳ vọng: 400 Rejected)`);
  if (wrongAccRes.status !== 400) {
    throw new Error('TEST 6 THẤT BẠI: Webhook chấp nhận tài khoản lạ');
  }

  // ==========================================
  // TEST 7: WEBHOOK SAI MÃ ORDERCODE
  // ==========================================
  console.log('\n--- TEST 7: WEBHOOK - TỪ CHỐI KHI SAI MÃ ORDERCODE ---');
  const wrongCodeRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${SEPAY_KEY}`
    },
    body: JSON.stringify({
      id: 999904,
      gateway: 'Techcombank',
      accountNumber: TECHCOMBANK_ACCOUNT,
      code: 'MSF-NONEXIST',
      content: 'MSF-NONEXIST',
      transferType: 'in',
      transferAmount: totalPrice
    })
  });
  console.log(`✓ HTTP Status: ${wrongCodeRes.status} (Kỳ vọng: 404 Not Found)`);
  if (wrongCodeRes.status !== 404) {
    throw new Error('TEST 7 THẤT BẠI: Webhook không báo lỗi khi sai orderCode');
  }

  // ==========================================
  // TEST 8: WEBHOOK THIẾU TIỀN (CHỐNG GIAN LẬN SỐ TIỀN)
  // ==========================================
  console.log('\n--- TEST 8: WEBHOOK - TỪ CHỐI KHI SAI SỐ TIỀN THANH TOÁN ---');
  const wrongAmountRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${SEPAY_KEY}`
    },
    body: JSON.stringify({
      id: 999905,
      gateway: 'Techcombank',
      accountNumber: TECHCOMBANK_ACCOUNT,
      code: orderCode,
      content: orderCode,
      transferType: 'in',
      transferAmount: totalPrice - 1000 // Chuyển thiếu 1000đ
    })
  });
  console.log(`✓ HTTP Status: ${wrongAmountRes.status} (Kỳ vọng: 400 Rejected)`);
  if (wrongAmountRes.status !== 400) {
    throw new Error('TEST 8 THẤT BẠI: Webhook chấp nhận số tiền sai lệch');
  }

  // ==========================================
  // TEST 9: WEBHOOK HỢP LỆ (GIAO DỊCH THÀNH CÔNG)
  // ==========================================
  console.log('\n--- TEST 9: WEBHOOK HỢP LỆ - XÁC MINH VÀ CẬP NHẬT PAID ---');
  const validTxnId = `TXN_${Date.now()}`;
  const validRef = `FT_TCB_${Math.floor(100000 + Math.random() * 900000)}`;

  const validRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${SEPAY_KEY}`
    },
    body: JSON.stringify({
      id: validTxnId,
      gateway: 'Techcombank',
      transactionDate: new Date().toISOString(),
      accountNumber: TECHCOMBANK_ACCOUNT,
      code: orderCode,
      content: `MSON ${orderCode}`,
      transferType: 'in',
      transferAmount: totalPrice,
      referenceCode: validRef,
      description: `NGUYEN MINH SON chuyen khoan ${orderCode}`
    })
  });

  const validData = await validRes.json();
  console.log(`✓ HTTP Status: ${validRes.status}, Success: ${validData.success}`);
  if (validRes.status !== 200 || !validData.success) {
    throw new Error('TEST 9 THẤT BẠI: Webhook hợp lệ bị từ chối');
  }

  // Kiểm tra MongoDB Atlas thực tế
  const updatedOrder = await Order.findById(orderId);
  const updatedPayment = await Payment.findOne({ order: orderId });

  console.log(`✓ MongoDB Atlas: order.paymentStatus = "${updatedOrder.paymentStatus}" (Kỳ vọng: paid)`);
  console.log(`✓ MongoDB Atlas: order.status = "${updatedOrder.status}" (Kỳ vọng: confirmed)`);
  console.log(`✓ MongoDB Atlas: payment.status = "${updatedPayment.status}" (Kỳ vọng: SUCCESS)`);
  console.log(`✓ MongoDB Atlas: payment.transactionId = "${updatedPayment.transactionId}"`);
  console.log(`✓ MongoDB Atlas: payment.referenceCode = "${updatedPayment.referenceCode}"`);
  console.log(`✓ MongoDB Atlas: payment.paidAt = "${updatedPayment.paidAt}"`);

  if (updatedOrder.paymentStatus !== 'paid' || updatedOrder.status !== 'confirmed') {
    throw new Error('TEST 9 THẤT BẠI: Order không cập nhật paid và confirmed');
  }
  if (updatedPayment.status !== 'SUCCESS') {
    throw new Error('TEST 9 THẤT BẠI: Payment không cập nhật SUCCESS');
  }

  // ==========================================
  // TEST 10: IDEMPOTENCY - GỬI LẠI CÙNG GIAO DỊCH
  // ==========================================
  console.log('\n--- TEST 10: IDEMPOTENCY - GỬI TRÙNG GIAO DỊCH (KHÔNG DUPLICATE) ---');
  const duplicateRes = await fetch(`${API_BASE}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${SEPAY_KEY}`
    },
    body: JSON.stringify({
      id: validTxnId, // Trùng ID
      gateway: 'Techcombank',
      accountNumber: TECHCOMBANK_ACCOUNT,
      code: orderCode,
      content: orderCode,
      transferType: 'in',
      transferAmount: totalPrice,
      referenceCode: validRef
    })
  });

  const duplicateData = await duplicateRes.json();
  console.log(`✓ HTTP Status: ${duplicateRes.status}, Message: "${duplicateData.message}"`);
  const paymentCount = await Payment.countDocuments({ transactionId: validTxnId });
  console.log(`✓ Số lượng Payment records với transactionId này: ${paymentCount} (Kỳ vọng: chính xác 1)`);
  if (paymentCount !== 1) {
    throw new Error('TEST 10 THẤT BẠI: Idempotency bị vi phạm, tạo trùng bản ghi payment!');
  }

  // ==========================================
  // TEST 11: GET PAYMENT STATUS SAU KHI PAID (POLLING SUCCESS)
  // ==========================================
  console.log('\n--- TEST 11: GET /api/orders/:id/payment-status (PAID) ---');
  const paidStatusRes = await fetch(`${API_BASE}/orders/${orderId}/payment-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const paidStatusData = await paidStatusRes.json();
  console.log(`✓ Response: paymentStatus = "${paidStatusData.data.paymentStatus}"`);
  console.log(`✓ Transaction ID trả về: "${paidStatusData.data.transactionId}"`);
  console.log(`✓ PaidAt: "${paidStatusData.data.paidAt}"`);

  if (paidStatusData.data.paymentStatus !== 'paid' || !paidStatusData.data.transactionId) {
    throw new Error('TEST 11 THẤT BẠI: Polling không nhận được trạng thái paid và transactionId thật');
  }

  // ==========================================
  // TEST 12: DEV SIMULATION VS PRODUCTION PROTECTION
  // ==========================================
  console.log('\n--- TEST 12: CHỐNG CHẠY SIMULATION TRONG PRODUCTION ---');
  // Tạo 1 order mới để test simulation
  const simOrderCode = `MSF-SIM${Date.now().toString().slice(-6)}`;
  const createOrder2 = await Order.create({
    user: user._id,
    orderCode: simOrderCode,
    items: [{
      food: food._id,
      name: food.name,
      price: food.price,
      quantity: 1,
      subtotal: food.price
    }],
    shippingAddress: {
      fullName: 'Sim Test',
      phone: '0901234567',
      address: 'Test'
    },
    subtotal: food.price,
    shippingFee: 15000,
    totalPrice: food.price + 15000,
    paymentMethod: 'ONLINE',
    status: 'pending'
  });

  // Test dev simulation (NODE_ENV=development)
  const devSimRes = await fetch(`${API_BASE}/payments/test/simulate-success`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: createOrder2._id })
  });
  const devSimData = await devSimRes.json();
  console.log(`✓ Dev Simulation Status: ${devSimRes.status}, Success: ${devSimData.success}`);

  // Kiểm tra controller trực tiếp khi NODE_ENV = 'production'
  const paymentController = require('./controllers/paymentController');
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  let mockStatus = 0;
  let mockBody = null;
  const mockReq = { body: { orderId: createOrder2._id } };
  const mockRes = {
    status: (code) => {
      mockStatus = code;
      return {
        json: (data) => {
          mockBody = data;
        }
      };
    }
  };

  await paymentController.simulateSuccessDev(mockReq, mockRes, () => {});
  process.env.NODE_ENV = originalEnv;

  console.log(`✓ Production Simulation Status: ${mockStatus} (Kỳ vọng: 403 Forbidden), Message: "${mockBody?.message}"`);
  if (mockStatus !== 403) {
    throw new Error('TEST 12 THẤT BẠI: Endpoint simulate không bị chặn trong production');
  }

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ 12 TEST CASES ĐỀU ĐÃ ĐẠT 100% THÀNH CÔNG!');
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(0);
};

runTests().catch(err => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
