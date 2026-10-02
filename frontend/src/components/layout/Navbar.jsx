import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import useCartStore from '../../store/cartStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const getItemCount = useCartStore((state) => state.getItemCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cartItemCount = getItemCount();

  const getNavLinkClass = ({ isActive }) =>
    isActive
      ? 'text-orange-600 font-bold transition-colors'
      : 'text-gray-700 hover:text-orange-600 transition-colors font-medium';

  return (
    <nav className="bg-white shadow-xs sticky top-0 z-40 border-b border-gray-100">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo-icon.png" 
              alt="MSon Food" 
              className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
            <div className="flex flex-col justify-center">
              <span className="font-extrabold tracking-tight text-lg text-gray-900 leading-none">
                <span className="text-[#ea580c]">MSon</span>Food
              </span>
              <span className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                VỊ NGON ĐỈNH CAO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? 'bg-[#fff0ed] text-[#ea580c] px-4 py-1.5 rounded-full font-bold transition-all shadow-2xs'
                  : 'text-gray-700 hover:text-[#ea580c] px-3 py-1.5 rounded-full transition-colors'
              }
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                isActive
                  ? 'bg-[#fff0ed] text-[#ea580c] px-4 py-1.5 rounded-full font-bold transition-all shadow-2xs'
                  : 'text-gray-700 hover:text-[#ea580c] px-3 py-1.5 rounded-full transition-colors'
              }
            >
              Thực đơn
            </NavLink>
            <NavLink
              to="/combo-hot"
              className={({ isActive }) =>
                isActive
                  ? 'bg-[#fff0ed] text-[#ea580c] px-4 py-1.5 rounded-full font-bold transition-all shadow-2xs'
                  : 'text-gray-700 hover:text-[#ea580c] px-3 py-1.5 rounded-full transition-colors'
              }
            >
              Combo Hot
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? 'bg-[#fff0ed] text-[#ea580c] px-4 py-1.5 rounded-full font-bold transition-all shadow-2xs'
                  : 'text-gray-700 hover:text-[#ea580c] px-3 py-1.5 rounded-full transition-colors'
              }
            >
              Về chúng tôi
            </NavLink>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-[#ea580c] cart-icon-target transition-colors"
              title="Giỏ hàng"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#ea580c] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center cart-badge shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu / Tài khoản */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 px-3 py-1.5 rounded-full border border-gray-200 bg-white"
                >
                  <div className="w-7 h-7 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">Tài khoản</span>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Xin chào</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Đơn hàng của tôi
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Quản trị hệ thống
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-1">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-orange-600 px-3 py-1.5 rounded-full border border-gray-200 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Tài khoản</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Cart & Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Cart Icon */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-primary-600 cart-icon-target">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cart-badge">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mobile Avatar Quick Access (khi đã login) */}
            {isAuthenticated && (
              <Link
                to={user?.role === 'admin' ? '/admin' : '/profile'}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden border border-orange-200"
                title={user?.name || 'Tài khoản'}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'A'
                )}
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-5 pt-3 border-t border-gray-100 animate-fadeIn">
            {/* Header info khi đã đăng nhập */}
            {isAuthenticated ? (
              <div className="mb-4 p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'A'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {user?.name || 'Người dùng'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.email || 'admin@msonfood.com'}
                    </div>
                  </div>
                  {user?.role === 'admin' ? (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-orange-600 text-white rounded-full">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-full">
                      Thành viên
                    </span>
                  )}
                </div>

                {/* Nút vào Quản trị hệ thống dành riêng cho Admin trên mobile */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Quản trị hệ thống (Admin)</span>
                  </Link>
                )}
              </div>
            ) : null}

            {/* Navigation links */}
            <div className="flex flex-col space-y-3 font-medium text-sm">
              <Link to="/" className="text-gray-700 hover:text-[#ea580c] py-1 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>
              <Link to="/menu" className="text-gray-700 hover:text-[#ea580c] py-1 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Thực đơn
              </Link>
              <Link to="/combo-hot" className="text-gray-700 hover:text-[#ea580c] py-1 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Combo Hot
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-[#ea580c] py-1 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Về chúng tôi
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-[#ea580c] py-1 flex items-center justify-between transition-colors" onClick={() => setIsMenuOpen(false)}>
                <span>Giỏ hàng</span>
                {cartItemCount > 0 && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Các liên kết tài khoản khi đã đăng nhập */}
              {isAuthenticated ? (
                <>
                  <hr className="my-1 border-gray-100" />
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-[#ea580c] py-1 flex items-center gap-2.5 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    to="/orders"
                    className="text-gray-700 hover:text-[#ea580c] py-1 flex items-center gap-2.5 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-left text-red-600 hover:text-red-700 py-2 font-semibold flex items-center gap-2.5 mt-1 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                /* Khi chưa đăng nhập */
                <div className="pt-2 flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    className="w-full text-center py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-orange-500 hover:text-orange-600 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 shadow-xs transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
