import { useState } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */
const CONTACT_INFO = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Phản hồi nhanh chóng',
    value: 'Dưới 15 phút',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: 'Hotline CSKH',
    value: '1900 1234',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Cơ sở phục vụ',
    value: '4 Chi Nhánh Hot',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    label: 'Cam kết đặt hàng',
    value: '100% Nóng giòn',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
];

const BRANCHES = [
  {
    city: 'TP. HCM',
    tag: 'TP.HCM • GT',
    isHot: true,
    hotLabel: 'Đông nhất',
    name: 'MSon Food Nguyễn Trãi',
    address: '47 Nguyễn Trãi, P. Bến Thành, Quận 1',
    hours: '07:30 – 23:00',
    phone: '028 3925 1234',
    mapUrl: 'https://maps.google.com',
  },
  {
    city: 'TP. HCM',
    tag: 'TP.HCM • Bình Thạnh',
    isHot: false,
    hotLabel: '',
    name: 'MSon Food Landmark Plus',
    address: '208 Nguyễn Hữu Cảnh, P. 22, Bình Thạnh',
    hours: '08:00 – 23:00',
    phone: '028 8460 8888',
    mapUrl: 'https://maps.google.com',
  },
  {
    city: 'HN',
    tag: 'TP.HCM • Gò Vấp',
    isHot: false,
    hotLabel: '',
    name: 'MSon Food Cầu Giấy Hub',
    address: '15A Xuân Thủy, Cầu Giấy, HN (tòa trung tâm)',
    hours: '08:00 – 22:30',
    phone: '024 3968 9999',
    mapUrl: 'https://maps.google.com',
  },
  {
    city: 'HN',
    tag: 'TP.HCM • Đống Đa',
    isHot: false,
    hotLabel: '',
    name: 'MSon Food Chùa Bộc',
    address: '97 101 Chùa Bộc, P. Đống Đa, Đống Đa',
    hours: '08:00 – 22:00',
    phone: '024 3934 1234',
    mapUrl: 'https://maps.google.com',
  },
];

const FAQS = [
  {
    q: 'Thời gian giao hàng mất bao lâu?',
    a: 'MSon Food cam kết giao hàng hỏa tốc trong vòng 25 – 35 phút đối với các đơn hàng trong bán kính 7km. Với đơn hàng từ 200k trở lên, đồng giá nhất, chuyển dụng để giữ trọn vị giòn tan và nhiệt độ hoàn hảo.',
    icon: '⏱',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    q: 'Phương thức thanh toán hỗ trợ?',
    a: 'Chúng tôi hỗ trợ đa dạng: Tiền mặt khi nhận hàng (COD), Thẻ tín dụng/thẻ ghi nợ quốc tế (Visa, Mastercard), Ví MoMo, ZaloPay, VNPay, QR và quét mã Chuyển khoản ngân hàng 24/7 bảo mật.',
    icon: '💳',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    q: 'Đặt tiệc nhóm lớn hoặc teambuilding?',
    a: 'Với đơn tiệc từ 20 phần trở lên, vui lòng gửi form liên hệ trước ít nhất 4 – 6 giờ hoặc gọi hotline để đặt trước. Combo ưu đãi từ 10% đến 20%, kèm thiệp chúc mừng và set up miễn phí.',
    icon: '🎉',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    q: 'Chính sách đổi trả món ăn thế nào?',
    a: 'Nếu món ăn bị nguội, thiếu món hoặc giao sai quy cách và vẫn hết hạn, hãy gọi Hotline ngay trong vòng 30 phút kể từ lúc nhận hàng. MSon Food sẽ đổi mới hoặc hoàn tiền 100% không phiền hà.',
    icon: '🔄',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
];

const CONTACT_METHODS = [
  {
    icon: '📞',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Hotline',
    value: '1900 1234',
    sub: '08:00 – 22:30 hàng ngày',
  },
  {
    icon: '📧',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Email hỗ trợ',
    value: 'support@msonfood.vn',
    sub: 'Phản hồi trong vòng 2 giờ',
  },
  {
    icon: '📍',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Trụ sở chính',
    value: 'MSon Plaza, Tầng 5',
    sub: '101 Nguyễn Thị Minh Khai, Q.1, TP.HCM',
  },
];

const TOPIC_OPTIONS = [
  'Góp ý chất lượng dịch vụ & Món ăn',
  'Đặt tiệc nhóm / Sự kiện',
  'Vấn đề đơn hàng / Giao hàng',
  'Hợp tác kinh doanh / Đại lý',
  'Báo lỗi website / Ứng dụng',
  'Khác',
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
const Contact = () => {
  const [activeBranchTab, setActiveBranchTab] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    topic: TOPIC_OPTIONS[0],
    message: '',
    agree: false,
  });
  const [formState, setFormState] = useState('idle'); // idle | loading | success | error

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agree) return;
    setFormState('loading');
    // Simulate submission — in production connect to your API
    await new Promise((r) => setTimeout(r, 1400));
    setFormState('success');
  };

  const filteredBranches =
    activeBranchTab === 'all'
      ? BRANCHES
      : BRANCHES.filter((b) => b.city === activeBranchTab);

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ══════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100 pt-8 pb-10">
        <div className="container-custom text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            Trung tâm hỗ trợ &amp; Phản hồi 24/7
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3 leading-tight">
            Liên Hệ Với{' '}
            <span className="text-[#ea580c]">MSon Food</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Chúng tôi luôn lắng nghe và sẵn sàng phục vụ bạn mọi lúc mọi nơi.
            <br />
            Hãy gửi tin nhắn hoặc ghé thăm các chi nhánh gần nhất.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {CONTACT_INFO.map((item) => (
              <div
                key={item.label}
                className={`${item.bg} rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left`}
              >
                <div className={`${item.color} flex-shrink-0`}>{item.icon}</div>
                <div>
                  <div className={`font-black text-sm ${item.color}`}>{item.value}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MAIN CONTENT — 2 COLUMNS
      ══════════════════════════════════════════ */}
      <section className="container-custom py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8">

          {/* ──────────── LEFT: FORM ──────────── */}
          <div className="space-y-5">
            {/* Section label */}
            <div>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-0.5">
                GỬI THƯ TRỰC TIẾP
              </p>
              <h2 className="text-xl font-black text-gray-900">
                Để lại tin nhắn cho chúng tôi
              </h2>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Gặp ý phản ánh, đặt tiệc sinh nhật, hoặc bỏ thắc mắc yêu cầu hợp tác đại
                lý, nhóm trưởng và đội ngũ MSon Food sẽ kết nối ngay.
              </p>
            </div>

            {/* ── FORM ── */}
            {formState === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-black text-green-700 text-lg mb-1">Gửi thành công!</h3>
                <p className="text-green-600 text-sm">
                  Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng <strong>15 phút</strong>.
                </p>
                <button
                  onClick={() => { setFormState('idle'); setForm({ fullName: '', phone: '', email: '', topic: TOPIC_OPTIONS[0], message: '', agree: false }); }}
                  className="mt-5 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
              >
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition"
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0912 345 678"
                      className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Địa chỉ Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="an.nguyen@gmail.com"
                      className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition"
                    />
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Vấn đề cần liên hệ / Chủ đề quan tâm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="topic"
                      value={form.topic}
                      onChange={handleChange}
                      required
                      className="w-full appearance-none border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition bg-white pr-10"
                    >
                      {TOPIC_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Vui lòng chi tiết nội dung bạn đang phản ánh, thời gian đặt kiến đặng thức hoặc mã đơn hàng nếu có..."
                    className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition resize-none"
                  />
                </div>

                {/* Agree checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      name="agree"
                      checked={form.agree}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-4.5 h-4.5 w-[18px] h-[18px] rounded border-2 border-gray-300 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition flex items-center justify-center">
                      {form.agree && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 leading-relaxed">
                    Tôi đồng ý để MSon Food lưu trữ và sử dụng thông tin tôi đã điền vào biểu mẫu để hỗ trợ tôi tốt nhất và không chia sẻ với bên thứ ba.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!form.agree || formState === 'loading'}
                  className="w-full bg-[#b91c1c] hover:bg-[#991b1b] disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  {formState === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      Gửi tin nhắn ngay
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Cam kết dịch vụ */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-sm">
                😊
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">CAM KẾT DỊCH VỤ</p>
                <p className="font-black text-gray-900 text-sm">Ăn ngon miệng – Phục vụ tận tâm</p>
                <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                  Mọi ý kiến góp ý đều là động lực để MSon Food nâng tầm trải nghiệm fastfood việt.
                </p>
              </div>
            </div>
          </div>

          {/* ──────────── RIGHT: INFO + BRANCHES ──────────── */}
          <div className="space-y-5">

            {/* Contact methods */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Hotline highlight */}
              <div className="bg-gradient-to-r from-[#7f1d1d] to-[#b45309] p-5 text-white">
                <p className="text-xs font-bold text-white/70 mb-1">Tổng đài Chăm sóc khách hàng</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-black tracking-wide">1900 1234</div>
                    <div className="text-white/70 text-xs">08:00 – 22:30 hàng ngày</div>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="divide-y divide-gray-50">
                {CONTACT_METHODS.slice(1).map((m) => (
                  <div key={m.label} className={`${m.bg} px-5 py-3.5 flex items-start gap-3`}>
                    <div className="text-xl flex-shrink-0 mt-0.5">{m.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</p>
                      <p className="font-bold text-gray-900 text-sm truncate">{m.value}</p>
                      <p className="text-gray-500 text-[11px]">{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Branch system */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-gray-900 text-sm">Hệ thống Cửa Hàng Nổi Bật</h3>
                  <span className="text-[10px] text-gray-400">4 cửa hàng phục vụ tại TP. Hồ Chí Minh &amp; Hà Nội</span>
                </div>

                {/* City tabs */}
                <div className="flex gap-1.5 mt-3 mb-4">
                  {['all', 'TP. HCM', 'HN'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveBranchTab(tab)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                        activeBranchTab === tab
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'all' ? 'Tất cả' : tab}
                    </button>
                  ))}
                </div>

                {/* Branch list */}
                <div className="space-y-3">
                  {filteredBranches.map((b) => (
                    <div
                      key={b.name}
                      className="border border-gray-100 rounded-xl p-3.5 hover:border-orange-200 hover:bg-orange-50/30 transition group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {b.tag}
                          </span>
                          {b.isHot && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              🔥 {b.hotLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-[10px] flex-shrink-0">{b.hours}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-xs mb-0.5">{b.name}</p>
                      <p className="text-gray-500 text-[11px] leading-snug mb-2">{b.address}</p>
                      <div className="flex items-center justify-between">
                        <a
                          href={`tel:${b.phone.replace(/\s/g, '')}`}
                          className="text-orange-600 font-bold text-xs hover:underline"
                        >
                          {b.phone}
                        </a>
                        <a
                          href={b.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Xem bản đồ →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map CTA */}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
                <p className="text-[11px] text-gray-500">
                  🗺 Bản đồ vị trí chi nhánh trung tâm
                </p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full transition"
                >
                  🏆 Tìm đường đến cửa hàng
                </a>
              </div>
            </div>

            {/* Flagship mini card */}
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white text-base flex-shrink-0">
                🏅
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs">MSon Flagship Quận 1</p>
                <p className="text-gray-500 text-[11px]">Cách bạn khoảng 1.7km</p>
              </div>
              <div className="ml-auto">
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Đang mở
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="bg-white py-12">
        <div className="container-custom">
          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">
              HỎI ĐÁP NHANH
            </p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Những thông tin hữu ích giúp bạn sử dụng dịch vụ tại MSon Food trơn vẹn nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:shadow-sm transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-start gap-3 p-5 text-left"
                >
                  <div className={`${faq.iconBg} w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                    {faq.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-snug">{faq.q}</p>
                    {openFaq !== i && (
                      <p className="text-gray-400 text-[11px] mt-1 line-clamp-1">Nhấn để xem câu trả lời</p>
                    )}
                  </div>
                  <div className={`${faq.iconColor} mt-0.5 transition-transform duration-200 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-gray-600 text-xs leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOTTOM CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="container-custom py-8">
        <div className="bg-gradient-to-r from-[#7f1d1d] to-[#b45309] rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h3 className="text-white font-black text-xl md:text-2xl mb-1">
                Bạn vẫn còn băn khoăn?
              </h3>
              <p className="text-white/75 text-sm">
                Các chuyên viên CSKH của MSon Food luôn sẵn sàng hỗ trợ bạn.
              </p>
            </div>
            <a
              href="tel:19001234"
              className="flex-shrink-0 flex items-center gap-2.5 bg-white hover:bg-gray-50 text-[#b91c1c] font-black px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Gọi 1900 1234
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
