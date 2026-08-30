import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../services/authApi';
import useAuth from '../hooks/useAuth';
import Loading from '../components/Loading';

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authApi.register(registerData);
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
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
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center py-6">
        
        {/* Floating Brand Cutlery Icon Badge */}
        <div className="w-14 h-14 bg-[#9a3407] rounded-2xl shadow-xl shadow-[#9a3407]/35 border-2 border-white/60 flex items-center justify-center -mb-7 z-20 transform transition-transform hover:scale-105">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8h2.5v-8H23V6c0-2.21-1.79-4-4-4s-4 1.79-4 4zm5 0v3h-3.5V6c0-1.1.9-2 2-2s1.5.9 1.5 2z" />
          </svg>
        </div>

        {/* ── Main Auth Card ── */}
        <div className="w-full bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100/90 overflow-hidden pt-7">
          
          {/* Top Tabs Bar */}
          <div className="grid grid-cols-2 border-b border-gray-100">
            <Link
              to="/login"
              className="py-4 text-center font-serif text-[17px] font-medium text-gray-400 hover:text-gray-700 border-b-[3px] border-transparent transition-all"
            >
              Đăng Nhập
            </Link>
            <Link
              to="/register"
              className="py-4 text-center font-serif text-[17px] font-bold text-[#1e1e1e] border-b-[3px] border-[#9a3407] transition-all"
            >
              Đăng Ký
            </Link>
          </div>

          {/* Card Body */}
          <div className="p-7 sm:p-9 pt-8">
            <div className="mb-6">
              <h1 className="font-serif text-[26px] sm:text-[30px] font-bold text-[#1a1a1a] tracking-tight">
                Tạo Tài Khoản
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-normal">
                Đăng ký để khám phá thực đơn đa dạng và ưu đãi.
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name Input */}
              <div>
                <div className="bg-[#edf2fe] hover:bg-[#e5ecfc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a3407]/30 focus-within:border-[#9a3407] border border-transparent rounded-2xl flex items-center px-4 py-3.5 transition-all">
                  <svg className="w-5 h-5 text-[#7f8da4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-[#8896ae] focus:outline-none ml-3 font-medium"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div>
                <div className="bg-[#edf2fe] hover:bg-[#e5ecfc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a3407]/30 focus-within:border-[#9a3407] border border-transparent rounded-2xl flex items-center px-4 py-3.5 transition-all">
                  <svg className="w-5 h-5 text-[#7f8da4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    required
                    placeholder="Địa chỉ Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-[#8896ae] focus:outline-none ml-3 font-medium"
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <div className="bg-[#edf2fe] hover:bg-[#e5ecfc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a3407]/30 focus-within:border-[#9a3407] border border-transparent rounded-2xl flex items-center px-4 py-3.5 transition-all">
                  <svg className="w-5 h-5 text-[#7f8da4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input
                    type="tel"
                    required
                    placeholder="Số điện thoại"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-[#8896ae] focus:outline-none ml-3 font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="bg-[#edf2fe] hover:bg-[#e5ecfc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a3407]/30 focus-within:border-[#9a3407] border border-transparent rounded-2xl flex items-center px-4 py-3.5 transition-all">
                  <svg className="w-5 h-5 text-[#7f8da4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-[#8896ae] focus:outline-none ml-3 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#7f8da4] hover:text-gray-700 focus:outline-none ml-2 transition-colors cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <div className="bg-[#edf2fe] hover:bg-[#e5ecfc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9a3407]/30 focus-within:border-[#9a3407] border border-transparent rounded-2xl flex items-center px-4 py-3.5 transition-all">
                  <svg className="w-5 h-5 text-[#7f8da4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Xác nhận mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-[#8896ae] focus:outline-none ml-3 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-[#7f8da4] hover:text-gray-700 focus:outline-none ml-2 transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Agree Checkbox */}
              <div className="pt-1 pb-1">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-[#9a3407] focus:ring-[#9a3407] border-gray-300 accent-[#9a3407]"
                  />
                  <span className="ml-2 text-xs text-gray-600 font-medium">
                    Tôi đồng ý với Điều khoản & Chính sách bảo mật
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#9a3407] hover:bg-[#832c05] active:scale-[0.99] text-white font-serif font-bold text-[17px] py-3.5 rounded-full shadow-lg shadow-[#9a3407]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <Loading size="sm" />
                ) : (
                  <>
                    <span>Đăng Ký</span>
                    <span className="text-lg leading-none">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
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

export default Register;
