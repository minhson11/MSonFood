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

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700"
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
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-[#ea580c]" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>
              <Link to="/menu" className="text-gray-700 hover:text-[#ea580c]" onClick={() => setIsMenuOpen(false)}>
                Thực đơn
              </Link>
              <Link to="/combo-hot" className="text-gray-700 hover:text-[#ea580c]" onClick={() => setIsMenuOpen(false)}>
                Combo Hot
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-[#ea580c]" onClick={() => setIsMenuOpen(false)}>
                Về chúng tôi
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-primary-600">
                Giỏ hàng
              </Link>
              <Link to="/login" className="btn-outline text-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Đăng ký
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
