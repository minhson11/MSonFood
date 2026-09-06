import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import useCartStore from '../store/cartStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const getItemCount = useCartStore((state) => state.getItemCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
          <Link to="/" className="text-2xl font-black flex items-center gap-2.5 group">
            <img 
              src="/logo-icon.png" 
              alt="MSon Food" 
              className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
            <span className="font-extrabold tracking-tight">
              <span className="text-orange-600">MSon</span> <span className="text-red-700">Food</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 text-sm">
            <NavLink to="/" className={getNavLinkClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/menu" className={getNavLinkClass}>
              <span className="relative inline-flex items-center">
                Thực đơn
                <span className="ml-1.5 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  HOT
                </span>
              </span>
            </NavLink>
            <NavLink to="/about" className={getNavLinkClass}>
              Về chúng tôi
            </NavLink>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
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

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                >
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user?.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Đơn hàng của tôi
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Quản trị
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Đăng ký
                </Link>
              </>
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
              <Link to="/" className="text-gray-700 hover:text-primary-600">
                Trang chủ
              </Link>
              <Link to="/menu" className="text-gray-700 hover:text-primary-600">
                Thực đơn
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-orange-600" onClick={() => setIsMenuOpen(false)}>
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
