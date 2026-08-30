import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authApi from '../services/authApi';
import Loading from '../components/Loading';
import MapPreview from '../components/MapPreview';
import { getRealLocation, searchAddressSuggestions, geocodeAddress } from '../utils/geolocation';

const Profile = () => {
  const location = useLocation();
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gender: 'male',
    birthday: '',
    location: null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Address search & autocomplete states
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceTimer = useRef(null);
  const geocodeDebounceTimer = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        gender: user.gender || 'male',
        birthday: user.birthday || '',
        location: user.location || null,
      });
    }
  }, [user]);

  // Xử lý khi người dùng nhập tay địa chỉ trong Profile
  const handleAddressInputChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, address: val }));

    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    if (geocodeDebounceTimer.current) clearTimeout(geocodeDebounceTimer.current);

    if (!val || val.trim().length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 1. Tìm gợi ý nhanh
    searchDebounceTimer.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      const results = await searchAddressSuggestions(val);
      setAddressSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearchingAddress(false);
    }, 350);

    // 2. Tự động định vị trên bản đồ sau khi dừng gõ 900ms
    geocodeDebounceTimer.current = setTimeout(async () => {
      const geo = await geocodeAddress(val);
      if (geo) {
        setFormData((prev) => ({
          ...prev,
          location: {
            lat: geo.lat,
            lng: geo.lng,
            formattedAddress: geo.formattedAddress,
          },
        }));
      }
    }, 900);
  };

  // Khi chọn một địa chỉ từ danh sách gợi ý
  const handleSelectAddressSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      address: suggestion.formattedAddress,
      location: {
        lat: suggestion.lat,
        lng: suggestion.lng,
        formattedAddress: suggestion.formattedAddress,
      },
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    setError('');
    try {
      const loc = await getRealLocation();
      setFormData((prev) => ({
        ...prev,
        address: loc.formattedAddress,
        location: {
          lat: loc.lat,
          lng: loc.lng,
          formattedAddress: loc.formattedAddress,
        },
      }));
      setShowSuggestions(false);
      setSuccess(`Đã xác định vị trí thực: ${loc.formattedAddress}`);
    } catch (err) {
      setError(err.message || 'Không thể lấy vị trí hiện tại');
    } finally {
      setIsLocating(false);
    }
  };

  // Hàm định vị thủ công từ chuỗi địa chỉ người dùng đã nhập
  const handleManualGeocode = async () => {
    if (!formData.address || !formData.address.trim()) {
      setError('Vui lòng nhập địa chỉ trước khi tìm vị trí.');
      return;
    }
    setIsLocating(true);
    setError('');
    try {
      const geo = await geocodeAddress(formData.address);
      if (geo) {
        setFormData((prev) => ({
          ...prev,
          location: {
            lat: geo.lat,
            lng: geo.lng,
            formattedAddress: geo.formattedAddress || prev.address,
          },
        }));
        setSuccess(`Đã định vị thành công: ${geo.formattedAddress || formData.address}`);
      } else {
        setError('Không tìm thấy tọa độ cho địa chỉ này. Vui lòng nhập chi tiết hơn (VD: Quận, Tỉnh/Thành).');
      }
    } catch (err) {
      setError('Lỗi khi định vị địa chỉ.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let payload = { ...formData };

      // Nếu có địa chỉ nhưng chưa có tọa độ hoặc đã sửa địa chỉ, tự động geocode trước khi lưu
      if (formData.address && formData.address.trim()) {
        if (!formData.location?.lat || formData.location?.formattedAddress !== formData.address) {
          const geo = await geocodeAddress(formData.address);
          if (geo) {
            payload.location = {
              lat: geo.lat,
              lng: geo.lng,
              formattedAddress: formData.address,
            };
            setFormData((prev) => ({ ...prev, location: payload.location }));
          }
        }
      }

      const response = await authApi.updateProfile(payload);
      updateUser(response.data);
      setSuccess('Cập nhật hồ sơ & vị trí thành công!');
    } catch (err) {
      setError(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Đổi mật khẩu thành công');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="text-center">
                {/* Avatar with edit button */}
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white hover:bg-orange-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">Thành viên Hạng Bạc</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Thông tin cá nhân</span>
              </button>

              <Link
                to="/orders"
                className="w-full flex items-center gap-3 px-6 py-4 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-medium">Lịch sử đơn hàng</span>
              </Link>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                  activeTab === 'security'
                    ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">Đổi mật khẩu</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>

            {/* Loyalty Points Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 mt-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">ĐIỂM TÍCH LUỸ</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-4xl font-bold mb-1">1,450 đ</div>
              <div className="text-sm opacity-90">Còn 550đ để lên Hạng Vàng</div>
              
              {/* Progress bar */}
              <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full font-medium">
                    QUẢN LÝ TÀI KHOẢN
                  </span>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Họ và tên */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="0901234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      placeholder="nguyenvana@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      Giới tính
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-4 h-4 text-orange-600"
                          disabled={loading}
                        />
                        <span>Nam</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-4 h-4 text-orange-600"
                          disabled={loading}
                        />
                        <span>Nữ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="other"
                          checked={formData.gender === 'other'}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-4 h-4 text-orange-600"
                          disabled={loading}
                        />
                        <span>Khác</span>
                      </label>
                    </div>
                  </div>

                  {/* Vị trí & Địa chỉ giao hàng mặc định */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 text-[#a83210]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Vị trí & Địa chỉ nhận hàng</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating || loading}
                        className="bg-orange-50 hover:bg-orange-100 text-[#a83210] font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-orange-200 self-start sm:self-auto disabled:opacity-50"
                      >
                        <svg className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="8" strokeWidth="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                        </svg>
                        <span>{isLocating ? 'Đang lấy vị trí thực...' : 'Lấy vị trí thực hiện tại'}</span>
                      </button>
                    </div>

                    <div className="space-y-3 relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            className="input-field pr-8 w-full"
                            placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, thành phố..."
                            value={formData.address}
                            onChange={handleAddressInputChange}
                            onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleManualGeocode();
                              }
                            }}
                            disabled={loading}
                            autoComplete="off"
                          />
                          {isSearchingAddress && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleManualGeocode}
                          disabled={isLocating || loading}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 active:scale-95 shadow-xs flex-shrink-0"
                          title="Định vị địa chỉ này trên bản đồ"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>Tìm vị trí</span>
                        </button>
                      </div>

                      {/* Floating Autocomplete Suggestions Dropdown */}
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 max-h-60 overflow-y-auto divide-y divide-gray-50">
                          <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Gợi ý địa chỉ</span>
                            <button
                              type="button"
                              onClick={() => setShowSuggestions(false)}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          {addressSuggestions.map((sug) => (
                            <button
                              key={sug.id}
                              type="button"
                              onClick={() => handleSelectAddressSuggestion(sug)}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50/70 transition flex items-start gap-2.5 group cursor-pointer"
                            >
                              <span className="text-[#a83210] mt-0.5 flex-shrink-0">📍</span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-gray-900 group-hover:text-[#a83210] truncate">
                                  {sug.name || sug.formattedAddress}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {sug.formattedAddress}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* GPS Coordinates Badge & Map if available */}
                      {formData.location?.lat && formData.location?.lng && (
                        <div className="space-y-3 pt-2">
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>
                                <strong>Tọa độ GPS thực:</strong> {formData.location.lat.toFixed(5)}, {formData.location.lng.toFixed(5)}
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-600 font-medium">Đã liên kết vị trí</span>
                          </div>

                          <MapPreview
                            coords={formData.location}
                            locationStatus={formData.address}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loading size="sm" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span>Lưu thay đổi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">Bảo mật tài khoản</h2>
                </div>

                {/* Security Items */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 border-2 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold">Mật khẩu</p>
                        <p className="text-sm text-gray-500">Bảo vệ tài khoản của bạn bằng mật khẩu mạnh.</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full font-medium">Đã thiết lập</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold">Xác thực 2 yếu tố</p>
                        <p className="text-sm text-gray-500">Tăng cường bảo mật với mã xác nhận qua SMS.</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium">
                      Chưa bật
                    </button>
                  </div>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="space-y-6 pt-6 border-t-2">
                  <h3 className="text-lg font-bold mb-4">Đổi mật khẩu</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <Loading size="sm" /> : 'Đổi mật khẩu'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
