import { useState } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../services/authApi';
import Loading from '../components/Loading';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Không thể gửi email đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#fafafa]">
      {/* ── Background Food Imagery with Soft Dreamy Vignette ── */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none scale-105 filter blur-[10px] opacity-75"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=2070&auto=format&fit=crop')`,
        }}
      />
      {/* Radial soft white mask */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.88) 45%, rgba(255,255,255,0.96) 80%, #ffffff 100%)'
        }}
      />

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        
        {/* Floating Brand Cutlery Icon Badge */}
        <div className="w-14 h-14 bg-[#9a3407] rounded-2xl shadow-xl shadow-[#9a3407]/35 border-2 border-white/60 flex items-center justify-center -mb-7 z-20 transition-colors">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8h2.5v-8H23V6c0-2.21-1.79-4-4-4s-4 1.79-4 4zm5 0v3h-3.5V6c0-1.1.9-2 2-2s1.5.9 1.5 2z" />
          </svg>
        </div>

        {/* ── Main Card ── */}
        <div className="w-full bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100/90 overflow-hidden p-7 sm:p-9 pt-12">
          {success ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Kiểm tra Email</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Nếu tài khoản <span className="font-semibold text-gray-800">{email}</span> tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center py-3.5 bg-[#9a3407] hover:bg-[#832c05] text-white font-serif font-bold text-base rounded-full shadow-lg shadow-[#9a3407]/25 transition-colors duration-150"
              >
                Quay lại Đăng nhập
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h1 className="font-serif text-[26px] sm:text-[30px] font-bold text-[#1a1a1a] tracking-tight">
                  Quên Mật Khẩu
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-normal">
                  Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2.5">
                  <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="bg-[#edf2fe] hover:bg-[#e5ecfc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a3407]/30 focus-within:border-[#9a3407] border border-transparent rounded-2xl flex items-center px-4 py-3.5 transition-colors">
                    <svg className="w-5 h-5 text-[#7f8da4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      required
                      placeholder="Địa chỉ Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-transparent text-sm text-gray-900 placeholder:text-[#8896ae] focus:outline-none ml-3 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] bg-[#9a3407] hover:bg-[#832c05] text-white font-serif font-bold text-[17px] rounded-full shadow-lg shadow-[#9a3407]/25 transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <Loading size="sm" color="white" text="Đang gửi liên kết..." />
                  ) : (
                    <>
                      <span>Gửi Liên Kết Đặt Lại</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#9a3407] hover:underline"
                >
                  ← Quay lại Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Legal Notice ── */}
        <p className="text-[11px] sm:text-xs text-gray-500 mt-6 text-center font-normal px-4">
          Bằng việc tiếp tục, bạn đồng ý với{' '}
          <Link to="/about" className="text-[#9a3407] font-semibold hover:underline">
            Điều khoản dịch vụ
          </Link>{' '}
          và{' '}
          <Link to="/about" className="text-[#9a3407] font-semibold hover:underline">
            Chính sách bảo mật
          </Link>{' '}
          của chúng tôi.
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;
