import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { dashboardApi } from '../services/adminApi';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(12);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  useEffect(() => {
    // Fetch dashboard stats to get real pending count if available
    dashboardApi.getStats()
      .then((res) => {
        const stats = res?.data?.orderStats;
        if (stats && stats.pending !== undefined) {
          setPendingOrdersCount(stats.pending || 0);
        }
      })
      .catch(() => {});
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const systemNav = [
    {
      name: 'Tổng quan',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'Quản lý đơn hàng',
      path: '/admin/orders',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-red-500 text-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      name: 'Quản lý món ăn',
      path: '/admin/foods',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: 'Danh mục món',
      path: '/admin/categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      name: 'Quản lý Topping',
      path: '/admin/toppings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      name: 'Khách hàng',
      path: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Khuyến mãi & Voucher',
      path: '/admin/coupons',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      name: 'Đánh giá & Phản hồi',
      path: '/admin/reviews',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
  ];

  const reportNav = [
    {
      name: 'Báo cáo tài chính',
      path: '/admin#finance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Cài đặt hệ thống',
      path: '/admin#settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Bar matching screenshot */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left: Mobile Toggle & Store Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden"
              title="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Store Status Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đang mở cửa</span>
            </div>
          </div>

          {/* Middle: Quick Search Input */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhanh đơn hàng, món ăn, khách hàng..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200/80 rounded-full text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>

          {/* Right: Actions, Notification, Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* New Order Button */}
            <Link
              to="/menu"
              className="bg-[#9a3407] hover:bg-[#832c05] text-white px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span className="text-base leading-none font-normal">+</span>
              <span className="hidden sm:inline">Tạo đơn mới</span>
            </Link>

            {/* Notification Bell with Badge */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
                title="Thông báo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {pendingOrdersCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-800">Thông báo mới</span>
                    <span className="text-[11px] text-orange-600 font-semibold">{pendingOrdersCount} đơn chờ</span>
                  </div>
                  <div className="p-2 text-xs text-gray-600 space-y-1">
                    <Link
                      to="/admin/orders"
                      onClick={() => setIsNotificationOpen(false)}
                      className="block p-2 rounded-xl hover:bg-orange-50/60 transition"
                    >
                      <div className="font-semibold text-gray-900">Có {pendingOrdersCount} đơn hàng mới</div>
                      <div className="text-[11px] text-gray-500">Cần tiếp nhận và chuyển giao cho nhà bếp</div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 pl-2 py-1 pr-1 hover:bg-gray-50 rounded-full transition text-left"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-xs overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'A'
                  )}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-bold text-gray-900 leading-tight">
                    {user?.name || 'Admin Minh Sơn'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Quản lý cửa hàng (Super Admin)
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in text-xs">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-bold text-gray-900">{user?.name || 'Admin Minh Sơn'}</p>
                    <p className="text-gray-400 truncate">{user?.email || 'admin@msonfood.com'}</p>
                  </div>
                  <Link
                    to="/"
                    className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    🏠 Về trang người dùng
                  </Link>
                  <Link
                    to="/admin/orders"
                    className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    📦 Quản lý đơn hàng
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition font-semibold"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out flex flex-col justify-between`}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Brand in Sidebar */}
            <div className="px-2 pt-1">
              <Link to="/admin" className="flex items-center gap-2.5 group">
                <img
                  src="/logo-icon.png"
                  alt="MSon Food"
                  className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
                <div>
                  <div className="text-lg font-black tracking-tight leading-tight">
                    <span className="text-orange-600">MSon</span> <span className="text-red-700">Food</span>
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                    ADMIN CENTRAL
                  </div>
                </div>
              </Link>
            </div>

            {/* Group 1: QUẢN TRỊ HỆ THỐNG */}
            <div>
              <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                QUẢN TRỊ HỆ THỐNG
              </div>
              <nav className="space-y-1">
                {systemNav.map((item) => {
                  const isActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25 font-bold'
                          : 'text-gray-700 hover:bg-orange-50/50 hover:text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-orange-600'}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Group 2: BÁO CÁO & CẤU HÌNH */}
            <div>
              <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                BÁO CÁO & CẤU HÌNH
              </div>
              <nav className="space-y-1">
                {reportNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-orange-50/50 hover:text-orange-600 transition"
                  >
                    <span className="text-gray-400">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-gray-600">Chi nhánh 01 - Q1</span>
            </div>
            <span className="font-mono text-[11px] text-gray-400">v2.4.0</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
