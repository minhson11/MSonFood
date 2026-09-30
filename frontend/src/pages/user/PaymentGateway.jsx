import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import orderApi from '../../services/orderApi';
import Loading from '../../components/common/Loading';

// Danh sách các ngân hàng nội địa phổ biến
const POPULAR_BANKS = [
  { id: 'VCB', name: 'Vietcombank', code: '970436', shortName: 'VCB', color: 'from-emerald-700 to-teal-900' },
  { id: 'TCB', name: 'Techcombank', code: '970407', shortName: 'TCB', color: 'from-red-600 to-rose-900' },
  { id: 'MB', name: 'MB Bank', code: '970422', shortName: 'MB', color: 'from-blue-600 to-indigo-950' },
  { id: 'BIDV', name: 'BIDV', code: '970418', shortName: 'BIDV', color: 'from-teal-600 to-emerald-950' },
  { id: 'CTG', name: 'VietinBank', code: '970415', shortName: 'VietinBank', color: 'from-sky-700 to-blue-900' },
  { id: 'ACB', name: 'ACB', code: '970416', shortName: 'ACB', color: 'from-blue-500 to-cyan-900' },
  { id: 'TPB', name: 'TPBank', code: '970423', shortName: 'TPBank', color: 'from-purple-600 to-indigo-900' },
  { id: 'VPB', name: 'VPBank', code: '970432', shortName: 'VPBank', color: 'from-emerald-600 to-green-900' },
  { id: 'STB', name: 'Sacombank', code: '970403', shortName: 'Sacombank', color: 'from-blue-700 to-slate-900' },
  { id: 'VIB', name: 'VIB', code: '970441', shortName: 'VIB', color: 'from-amber-600 to-yellow-900' },
];

const PaymentGateway = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('VIETQR'); // 'VIETQR' | 'ATM' | 'CARD'

  // Countdown timer: 15 minutes (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyToast, setCopyToast] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  // ATM Card Form
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0]);
  const [atmCard, setAtmCard] = useState({
    cardNumber: '',
    cardHolder: '',
    validDate: '',
  });

  // Credit Card Form
  const [creditCard, setCreditCard] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  // Fetch full Order initially, then poll /api/orders/:id/payment-status every 3s
  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    const loadInitialOrder = async () => {
      try {
        setLoading(true);
        const res = await orderApi.getOrderById(id);
        const orderData = res.data?.order || res.data?.data || res.data || res;

        if (isMounted && orderData) {
          setOrder(orderData);

          // If already paid on initial load, navigate directly
          if (orderData.paymentStatus === 'paid') {
            navigate(`/order-success/${orderData._id}`, { replace: true });
            return;
          }

          // Start polling payment status every 3 seconds
          pollInterval = setInterval(async () => {
            try {
              const statusRes = await orderApi.getPaymentStatus(id);
              const statusData = statusRes.data?.data || statusRes.data;

              if (statusData && statusData.paymentStatus === 'paid') {
                if (pollInterval) clearInterval(pollInterval);
                setPaymentInfo(statusData);
                setShowSuccessModal(true);
                setTimeout(() => {
                  navigate(`/order-success/${orderData._id}`, {
                    replace: true,
                    state: {
                      order: { ...orderData, paymentStatus: 'paid' },
                      paymentInfo: statusData,
                      message: 'Thanh toán thành công!'
                    }
                  });
                }, 2200);
              } else if (statusData && (statusData.paymentStatus === 'failed' || statusData.orderStatus === 'cancelled')) {
                if (pollInterval) clearInterval(pollInterval);
                setError('Đơn hàng đã bị hủy hoặc thanh toán không thành công.');
              }
            } catch (pollErr) {
              console.warn('Payment status polling error:', pollErr);
            }
          }, 3000);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Không thể tải thông tin đơn hàng');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      loadInitialOrder();
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, navigate]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toast copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyToast(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyToast(''), 2500);
  };

  // Order Details Derived
  const orderCode = useMemo(() => {
    if (!order) return '';
    return order.orderCode || order.orderNumber || `ORD${order._id.slice(-6).toUpperCase()}`;
  }, [order]);

  const transferMemo = useMemo(() => {
    return orderCode;
  }, [orderCode]);

  const bankAccountInfo = {
    bankName: 'Techcombank (Ngân hàng TMCP Kỹ thương Việt Nam)',
    shortBankName: 'Techcombank',
    accountNumber: '19073053712019',
    accountNumberDisplay: '1907 3053 7120 19',
    accountName: 'NGUYEN MINH SON',
  };

  // VietQR Image URL (Techcombank BIN: 970407)
  const vietQrUrl = useMemo(() => {
    if (!order) return '';
    const amount = order.totalPrice || 0;
    const memo = encodeURIComponent(transferMemo);
    const accName = encodeURIComponent(bankAccountInfo.accountName);
    return `https://img.vietqr.io/image/970407-${bankAccountInfo.accountNumber}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accName}`;
  }, [order, transferMemo]);

  // Credit Card type detection
  const cardBrand = useMemo(() => {
    const num = creditCard.cardNumber.replace(/\s+/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MASTERCARD';
    if (/^35/.test(num)) return 'JCB';
    return 'CARD';
  }, [creditCard.cardNumber]);

  // Handle ATM number input with spaces
  const handleAtmNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 19);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAtmCard((prev) => ({ ...prev, cardNumber: val }));
  };

  // Handle Credit Card number input with spaces
  const handleCreditCardChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCreditCard((prev) => ({ ...prev, cardNumber: val }));
  };

  // Format valid date MM/YY
  const handleDateChange = (setter, key) => (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setter((prev) => ({ ...prev, [key]: val }));
  };

  // Execute payment simulation (DEV ONLY)
  const handleSimulatePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await orderApi.simulateSuccess(order._id);
      const simData = res.data?.data;
      if (simData) {
        setPaymentInfo(simData);
      }
      setShowSuccessModal(true);

      setTimeout(() => {
        navigate(`/order-success/${order._id}`, {
          replace: true,
          state: {
            order: { ...order, paymentStatus: 'paid' },
            paymentInfo: simData,
            message: 'Thanh toán thành công!'
          },
        });
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Mô phỏng thất bại.');
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    try {
      if (import.meta.env.DEV) {
        await handleSimulatePayment();
      } else {
        setError('Cổng thanh toán thẻ ATM / Quốc tế đang được bảo trì. Vui lòng quét mã VietQR Techcombank để được hệ thống tự động xác nhận ngay lập tức.');
        setIsProcessing(false);
      }
    } catch (err) {
      setError(err.message || 'Không thể xử lý giao dịch thẻ.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center">
        <Loading size="lg" text="Đang kết nối cổng thanh toán an toàn..." />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link
            to="/orders"
            className="inline-block px-6 py-3 bg-[#a83210] hover:bg-[#8b2b10] text-white font-bold rounded-xl text-sm transition"
          >
            Về danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= HEADER BAR ================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 mb-6 shadow-sm border border-gray-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#a83210] text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-950/20">
              KFC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900">
                  Cổng Thanh Toán Trực Tuyến
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PCI-DSS Bảo Mật
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Mã đơn hàng: <strong className="text-gray-800">#{orderCode}</strong> · Khách hàng:{' '}
                <strong className="text-gray-800">{order.shippingAddress?.fullName}</strong>
              </p>
            </div>
          </div>

          {/* Countdown timer badge */}
          <div className="flex items-center gap-3 bg-orange-50/80 border border-orange-200/80 rounded-2xl px-4 py-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#a83210] text-white flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 3" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Đơn hàng hết hạn sau
              </div>
              <div
                className={`text-base font-black tracking-widest ${
                  timeLeft < 180 ? 'text-red-600 animate-pulse' : 'text-[#a83210]'
                }`}
              >
                {formatTimer(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================= LEFT COLUMN: PAYMENT METHODS ================= */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-200/70">
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  Chọn phương thức thanh toán
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng chọn hình thức thuận tiện nhất để hoàn tất đơn hàng của bạn.
                </p>
              </div>

              {/* TAB SELECTOR BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-[#f0f4f9] rounded-2xl mb-7">
                {/* Tab 1: VietQR Techcombank */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('VIETQR')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    selectedMethod === 'VIETQR'
                      ? 'bg-white text-[#a83210] shadow-sm border border-orange-200/70'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">📱</span>
                  <span>Quét QR Ngân Hàng (Techcombank)</span>
                </button>

                {/* Tab 2: Thẻ ATM Napas */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('ATM')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    selectedMethod === 'ATM'
                      ? 'bg-white text-[#a83210] shadow-sm border border-orange-200/70'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">💳</span>
                  <span>Thẻ ATM Nội địa (Napas)</span>
                </button>

                {/* Tab 3: Thẻ Quốc Tế */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    selectedMethod === 'CARD'
                      ? 'bg-white text-[#a83210] shadow-sm border border-orange-200/70'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">🌐</span>
                  <span>Thẻ Quốc Tế (Visa / Master)</span>
                </button>
              </div>

              {/* ================= CONTENT METHOD 1: VIETQR TECHCOMBANK ================= */}
              {selectedMethod === 'VIETQR' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row items-center gap-6 bg-[#fffaf5] border border-orange-200/80 rounded-3xl p-6">
                    {/* QR Code Container */}
                    <div className="relative bg-white p-5 rounded-3xl shadow-md border border-orange-100 flex-shrink-0 flex flex-col items-center">
                      {/* Clean QR Box */}
                      <div className="w-60 h-60 sm:w-64 sm:h-64 overflow-hidden rounded-2xl bg-white border border-gray-100 flex items-center justify-center p-2">
                        <img
                          src={vietQrUrl}
                          alt="Mã VietQR Techcombank thanh toán"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Download QR Button */}
                      <a
                        href={vietQrUrl}
                        download={`Techcombank-QR-${orderCode}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3.5 w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-[#a83210] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Tải ảnh mã QR</span>
                      </a>
                    </div>

                    {/* Bank Info Details Box */}
                    <div className="flex-1 space-y-3.5 w-full text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className="text-sm font-black uppercase text-gray-900 tracking-wider">
                            Tài khoản Techcombank chính thức
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          Techcombank 24/7
                        </span>
                      </div>

                      {/* Row 1: Ngân hàng */}
                      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Ngân hàng thụ hưởng</div>
                          <div className="font-extrabold text-gray-900 mt-0.5">{bankAccountInfo.bankName}</div>
                        </div>
                      </div>

                      {/* Row 2: Số tài khoản + Copy */}
                      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Số tài khoản</div>
                          <div className="font-black text-base text-gray-900 tracking-wider mt-0.5">
                            {bankAccountInfo.accountNumberDisplay}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankAccountInfo.accountNumber, 'Số tài khoản')}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#a83210] font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Sao chép
                        </button>
                      </div>

                      {/* Row 3: Tên chủ tài khoản */}
                      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Chủ tài khoản</div>
                          <div className="font-black text-sm text-gray-900 mt-0.5">{bankAccountInfo.accountName}</div>
                        </div>
                      </div>

                      {/* Row 4: Số tiền + Copy */}
                      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Số tiền thanh toán</div>
                          <div className="font-black text-lg text-[#a83210] mt-0.5">
                            {(order.totalPrice || 0).toLocaleString()} đ
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.totalPrice.toString(), 'Số tiền')}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#a83210] font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Sao chép
                        </button>
                      </div>

                      {/* Row 5: Nội dung chuyển khoản + Copy */}
                      <div className="bg-white p-3 rounded-2xl border border-orange-300 bg-orange-50/20 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-orange-600 font-bold uppercase">
                            Nội dung chuyển khoản (Bắt buộc đúng)
                          </div>
                          <div className="font-black text-sm text-[#a83210] tracking-wider mt-0.5">
                            {transferMemo}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferMemo, 'Nội dung chuyển khoản')}
                          className="px-3 py-1.5 bg-[#a83210] text-white font-bold rounded-xl text-xs hover:bg-[#8b2b10] transition cursor-pointer shadow-xs"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3 Step Guide */}
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                      3 Bước quét mã nhanh bằng ứng dụng ngân hàng:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                      <div className="bg-gray-50 p-3 rounded-2xl flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#a83210] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                          1
                        </span>
                        <span>Mở ứng dụng Mobile Banking của Techcombank hoặc bất kỳ ngân hàng nào</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#a83210] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                          2
                        </span>
                        <span>Chọn tính năng <strong>Quét mã QR</strong> và hướng vào mã phía trên.</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#a83210] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                          3
                        </span>
                        <span>Kiểm tra đúng tên <strong>NGUYEN MINH SON</strong>, số tiền và xác nhận chuyển tiền.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= CONTENT METHOD 2: THẺ ATM NỘI ĐỊA ================= */}
              {selectedMethod === 'ATM' && (
                <div className="space-y-6 animate-fadeIn text-left">
                  {/* Bank Logos Grid */}
                  <div>
                    <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block mb-2.5">
                      1. Chọn ngân hàng phát hành thẻ ATM của bạn:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`p-2.5 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            selectedBank.id === b.id
                              ? 'border-[#a83210] bg-orange-50/40 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="font-black text-xs text-gray-900">{b.shortName}</span>
                          <span className="text-[9px] text-gray-400 font-medium">Napas 247</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Card Mockup & Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Live ATM Card Preview */}
                    <div
                      className={`h-48 rounded-3xl p-5 text-white shadow-xl bg-gradient-to-tr ${selectedBank.color} flex flex-col justify-between relative overflow-hidden transition-all duration-500`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black tracking-widest uppercase opacity-90">
                          {selectedBank.name}
                        </span>
                        <span className="text-[11px] font-black italic bg-white/20 px-2 py-0.5 rounded-md">
                          NAPAS
                        </span>
                      </div>

                      {/* Chip & Contactless */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded-md bg-amber-300 border border-amber-400/80 shadow-inner flex items-center justify-center">
                          <div className="w-6 h-4 border-t border-b border-amber-600/40" />
                        </div>
                        <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>

                      <div>
                        <div className="font-mono text-base sm:text-lg font-black tracking-widest">
                          {atmCard.cardNumber || '9704 •••• •••• ••••'}
                        </div>
                        <div className="flex justify-between items-end mt-2 text-[10px]">
                          <div>
                            <div className="opacity-70 uppercase">Chủ thẻ</div>
                            <div className="font-bold uppercase tracking-wider text-xs">
                              {atmCard.cardHolder || 'NGUYEN VAN A'}
                            </div>
                          </div>
                          <div>
                            <div className="opacity-70 uppercase">Hiệu lực</div>
                            <div className="font-bold">{atmCard.validDate || 'MM/YY'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ATM Inputs Form */}
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Số thẻ in trên thẻ (16 hoặc 19 số)</label>
                        <input
                          type="text"
                          value={atmCard.cardNumber}
                          onChange={handleAtmNumberChange}
                          placeholder="9704 0000 0000 0000"
                          className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Tên in trên thẻ (Không dấu)</label>
                        <input
                          type="text"
                          value={atmCard.cardHolder}
                          onChange={(e) =>
                            setAtmCard((prev) => ({
                              ...prev,
                              cardHolder: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="NGUYEN VAN A"
                          className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 uppercase font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Ngày phát hành / hết hạn (MM/YY)</label>
                        <input
                          type="text"
                          value={atmCard.validDate}
                          onChange={handleDateChange(setAtmCard, 'validDate')}
                          placeholder="08/25"
                          className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= CONTENT METHOD 3: THẺ QUỐC TẾ ================= */}
              {selectedMethod === 'CARD' && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Live Credit Card Preview */}
                    <div className="h-48 rounded-3xl p-5 text-white shadow-xl bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-950 flex flex-col justify-between relative overflow-hidden border border-gray-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black tracking-widest uppercase opacity-80">
                          INTERNATIONAL CARD
                        </span>
                        <span className="font-black text-base italic tracking-tight text-amber-300">
                          {cardBrand}
                        </span>
                      </div>

                      {/* Chip & Waves */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded-md bg-amber-400 border border-amber-500 flex items-center justify-center">
                          <div className="w-6 h-4 border-t border-b border-amber-700/40" />
                        </div>
                        <div className="text-xs tracking-wider opacity-60">)))</div>
                      </div>

                      <div>
                        <div className="font-mono text-base sm:text-lg font-black tracking-widest">
                          {creditCard.cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className="flex justify-between items-end mt-2 text-[10px]">
                          <div>
                            <div className="opacity-70 uppercase">Cardholder</div>
                            <div className="font-bold uppercase tracking-wider text-xs">
                              {creditCard.cardHolder || 'CARD HOLDER'}
                            </div>
                          </div>
                          <div>
                            <div className="opacity-70 uppercase">Expires</div>
                            <div className="font-bold">{creditCard.expiryDate || 'MM/YY'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Credit Card Inputs */}
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Số thẻ tín dụng / ghi nợ</label>
                        <input
                          type="text"
                          value={creditCard.cardNumber}
                          onChange={handleCreditCardChange}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Tên chủ thẻ (In trên thẻ)</label>
                        <input
                          type="text"
                          value={creditCard.cardHolder}
                          onChange={(e) =>
                            setCreditCard((prev) => ({
                              ...prev,
                              cardHolder: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="NGUYEN VAN A"
                          className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 uppercase font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Hạn thẻ (MM/YY)</label>
                          <input
                            type="text"
                            value={creditCard.expiryDate}
                            onChange={handleDateChange(setCreditCard, 'expiryDate')}
                            placeholder="12/26"
                            className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Mã CVV/CVC</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={creditCard.cvv}
                            onChange={(e) =>
                              setCreditCard((prev) => ({
                                ...prev,
                                cvv: e.target.value.replace(/\D/g, ''),
                              }))
                            }
                            placeholder="•••"
                            className="w-full bg-[#f8faff] border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper / Guarantee Footer Card */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/70 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Hệ thống bảo vệ giao dịch trực tuyến an toàn tuyệt đối 100%</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
                <span>Napas 24/7</span>
                <span>•</span>
                <span>Verified by VISA</span>
                <span>•</span>
                <span>Mastercard ID Check</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ORDER SUMMARY & ACTIONS ================= */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200/70 sticky top-20 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-base font-black text-gray-900">Chi tiết thanh toán</h3>
                <span className="text-xs font-bold text-[#a83210]">#{orderCode}</span>
              </div>

              {/* Items List Preview */}
              <div className="py-4 space-y-3 max-h-56 overflow-y-auto divide-y divide-gray-100">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-[#a83210] font-black text-[10px] flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="font-bold text-gray-800 truncate">
                        {item.name || item.food?.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-gray-900 flex-shrink-0">
                      {(item.subtotal || item.price * item.quantity).toLocaleString()} đ
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-bold text-gray-800">
                    {(order.subtotal || 0).toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng</span>
                  <span className="font-bold text-gray-800">
                    {(order.shippingFee || 0).toLocaleString()} đ
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#a83210] font-bold">
                    <span>Giảm giá</span>
                    <span>-{(order.discount || 0).toLocaleString()} đ</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-baseline">
                  <div>
                    <div className="font-black text-sm text-gray-900">Tổng thanh toán</div>
                    <div className="text-[10px] text-gray-400">(Đã gồm VAT)</div>
                  </div>
                  <div className="text-2xl font-black text-[#a83210] tracking-tight">
                    {(order.totalPrice || 0).toLocaleString()} đ
                  </div>
                </div>
              </div>

              {/* CTA Action Area */}
              <div className="mt-6 space-y-3">
                {selectedMethod === 'VIETQR' ? (
                  <>
                    {/* Realtime Auto-Detection Radar Box */}
                    <div className="bg-gradient-to-b from-orange-50/90 to-amber-50/70 border border-orange-200/90 rounded-2xl p-4 text-center space-y-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="font-extrabold text-xs text-gray-900 tracking-wide uppercase">
                          Hệ thống tự động chờ nhận tiền
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Bạn chỉ cần mở app ngân hàng quét mã QR để chuyển khoản. Khi tài khoản Techcombank nhận được tiền, hệ thống sẽ <strong>tự động báo thành công và chuyển trang ngay lập tức</strong> mà bạn không cần phải bấm xác nhận.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-orange-700/80 font-bold pt-1">
                        <svg className="w-3.5 h-3.5 animate-spin text-orange-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Đang đồng bộ trực tuyến với Techcombank...</span>
                      </div>
                    </div>

                    {/* Developer / Demo Simulator Button for instant testing (DEV ONLY) */}
                    {import.meta.env.DEV && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleSimulatePayment}
                        className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Mô phỏng ngân hàng Techcombank gửi thông báo đã nhận tiền (Chỉ hiển thị trong môi trường Development)"
                      >
                        <span>⚡</span>
                        <span>Mô phỏng Techcombank báo đã nhận tiền (Dev Test Only)</span>
                      </button>
                    )}
                  </>
                ) : (
                  /* Button for ATM and Card */
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleCardPayment}
                    className="w-full h-12 bg-[#a83210] hover:bg-[#8b2b10] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-950/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loading size="sm" color="white" text="Đang xử lý thanh toán thẻ..." />
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{selectedMethod === 'ATM' ? 'THANH TOÁN BẰNG THẺ ATM' : 'THANH TOÁN BẰNG THẺ QUỐC TẾ'}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Back to Order / Change Method */}
                <div className="text-center pt-2">
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-xs text-gray-500 hover:text-gray-800 font-semibold transition underline"
                  >
                    Xem chi tiết đơn hàng hoặc thanh toán sau
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400">✓</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* Celebration Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 animate-scaleIn">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
              🎉
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Thanh toán thành công!</h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              MSon Food đã nhận được thanh toán của bạn qua Techcombank.
            </p>
            {paymentInfo && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mb-4 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-bold text-gray-900">{paymentInfo.orderCode || orderCode}</span>
                </div>
                {paymentInfo.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã giao dịch:</span>
                    <span className="font-bold text-emerald-700">{paymentInfo.transactionId}</span>
                  </div>
                )}
                {paymentInfo.referenceCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã tham chiếu:</span>
                    <span className="font-bold text-gray-700">{paymentInfo.referenceCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tiền:</span>
                  <span className="font-black text-[#a83210]">
                    {Number(paymentInfo.amount || order?.totalPrice || 0).toLocaleString()} đ
                  </span>
                </div>
                {paymentInfo.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Thời gian:</span>
                    <span className="font-medium text-gray-700">
                      {new Date(paymentInfo.paidAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;
