import { useState, useEffect, useRef } from 'react';
import { userApi } from '../../services/adminApi';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalAllUsers: 0,
    totalCustomers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailData, setUserDetailData] = useState(null);

  // Delete Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'customer',
    gender: 'male',
  });
  const [formErrors, setFormErrors] = useState({});

  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, roleFilter, sortOption]);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(val);
    }, 400);
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUserStats = async () => {
    try {
      const [allRes, customerRes, adminRes] = await Promise.allSettled([
        userApi.getAllUsers({ limit: 1 }),
        userApi.getAllUsers({ role: 'customer', limit: 1 }),
        userApi.getAllUsers({ role: 'admin', limit: 1 }),
      ]);

      const totalAll = allRes.status === 'fulfilled' ? (allRes.value?.pagination?.total ?? allRes.value?.data?.length ?? 0) : 0;
      const totalCust = customerRes.status === 'fulfilled' ? (customerRes.value?.pagination?.total ?? customerRes.value?.data?.length ?? 0) : 0;
      const totalAdm = adminRes.status === 'fulfilled' ? (adminRes.value?.pagination?.total ?? adminRes.value?.data?.length ?? 0) : 0;

      setStats({
        totalAllUsers: totalAll,
        totalCustomers: totalCust,
        totalAdmins: totalAdm,
      });
    } catch (err) {
      console.warn('Lỗi tải thống kê người dùng:', err);
    }
  };

  const fetchUsers = async (customSearch = searchQuery) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        limit: 10,
        sort: sortOption,
        search: customSearch.trim(),
      };

      if (roleFilter && roleFilter !== 'all') {
        params.role = roleFilter;
      }

      const response = await userApi.getAllUsers(params);
      const userList = response.data || [];
      setUsers(userList);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.total || userList.length);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng từ cơ sở dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Open View Detail Modal
  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    setUserDetailLoading(true);
    try {
      const response = await userApi.getUserById(user._id);
      setUserDetailData(response.data);
    } catch (err) {
      showToast(err.message || 'Không thể tải chi tiết người dùng', 'error');
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: 'customer',
      gender: 'male',
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'customer',
      gender: user.gender || 'male',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Validate form
  const validateForm = (isCreate = true) => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    if (isCreate) {
      if (!formData.password) {
        errors.password = 'Vui lòng nhập mật khẩu';
      } else if (formData.password.length < 6) {
        errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự nếu muốn đổi mật khẩu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    try {
      setActionLoading(true);
      await userApi.createUser(formData);
      showToast('Đã thêm tài khoản người dùng mới thành công!');
      setShowCreateModal(false);
      fetchUsers();
      fetchUserStats();
    } catch (err) {
      showToast(err.message || 'Không thể tạo người dùng. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    try {
      setActionLoading(true);
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      await userApi.updateUser(selectedUser._id, updateData);
      showToast('Đã cập nhật thông tin người dùng thành công!');
      setShowEditModal(false);
      fetchUsers();
      fetchUserStats();
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật người dùng.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Role Toggle
  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    const roleText = newRole === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng (Customer)';
    if (!window.confirm(`Bạn có chắc muốn chuyển vai trò của "${user.name}" thành ${roleText}?`)) {
      return;
    }

    try {
      await userApi.updateUser(user._id, { role: newRole });
      showToast(`Đã chuyển vai trò của ${user.name} thành ${roleText}`);
      fetchUsers();
      fetchUserStats();
    } catch (err) {
      showToast(err.message || 'Không thể đổi vai trò người dùng', 'error');
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(true);
      await userApi.deleteUser(userToDelete._id);
      showToast(`Đã xóa tài khoản "${userToDelete.name}" thành công!`);
      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchUsers();
      fetchUserStats();
    } catch (err) {
      showToast(err.message || 'Không thể xóa người dùng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper avatar initials
  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-orange-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-amber-600',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-white text-sm font-semibold animate-slide-in-right ${
            toastMessage.type === 'error' ? 'bg-red-600 shadow-red-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Quản lý người dùng
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Dữ liệu tài khoản thật, phân quyền và lịch sử hoạt động liên kết trực tiếp từ MongoDB.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { fetchUsers(); fetchUserStats(); }}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Làm mới danh sách"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm người dùng</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Tổng người dùng
            </span>
            <span className="text-2xl font-black text-gray-900">
              {stats.totalAllUsers || totalCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Khách hàng
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {stats.totalCustomers || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Quản trị viên
            </span>
            <span className="text-2xl font-black text-purple-600">
              {stats.totalAdmins || 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Current Filter Count */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Đang hiển thị
            </span>
            <span className="text-2xl font-black text-orange-600">
              {users.length} <span className="text-xs text-gray-400 font-normal">/ {totalCount}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
              className="w-full pl-11 pr-4 py-3 bg-[#f8faff] border border-gray-200/80 rounded-2xl text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchUsers('');
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-3 px-4 bg-[#f8faff] border border-gray-200/80 rounded-2xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition font-medium"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="customer">Khách hàng (Customer)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="sm:col-span-3">
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-3 px-4 bg-[#f8faff] border border-gray-200/80 rounded-2xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition font-medium"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 m-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loading size="lg" />
            <span className="text-xs text-gray-400 font-medium">Đang tải dữ liệu từ database...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800">Không tìm thấy người dùng nào</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Không có dữ liệu phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#f8faff] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Người dùng</th>
                  <th className="py-4 px-5">Liên hệ & Địa chỉ</th>
                  <th className="py-4 px-5">Vai trò</th>
                  <th className="py-4 px-5 text-center">Đơn hàng</th>
                  <th className="py-4 px-5">Tổng chi tiêu</th>
                  <th className="py-4 px-5">Ngày tạo</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {users.map((user) => {
                  const initials = getAvatarInitials(user.name);
                  const avatarColor = getAvatarColor(user.name);
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr key={user._id} className="hover:bg-orange-50/30 transition duration-150 group">
                      {/* User Info & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-2xl object-cover border border-gray-100 shadow-2xs flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-2xl ${avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0`}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 hover:text-orange-600 transition flex items-center gap-1.5 truncate">
                              <span>{user.name}</span>
                              {user.gender === 'female' && (
                                <span className="text-[10px] text-pink-500" title="Nữ">♀</span>
                              )}
                              {user.gender === 'male' && (
                                <span className="text-[10px] text-blue-500" title="Nam">♂</span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-4 px-5 max-w-[200px]">
                        <div className="text-gray-800 font-semibold truncate">
                          {user.phone || <span className="text-gray-400 font-normal italic">Chưa có SĐT</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate" title={user.address || ''}>
                          {user.address || <span className="text-gray-300 italic">Chưa có địa chỉ</span>}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(user)}
                          title="Bấm để đổi vai trò"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer hover:shadow-xs ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              <span>Admin</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Customer</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Orders Count */}
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                          user.orderCount > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {user.orderCount || 0} đơn
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-gray-900">
                          {(user.totalSpent || 0).toLocaleString()} <span className="text-[11px] underline">đ</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-5 text-[11px] text-gray-500">
                        {user.createdAt ? (
                          <>
                            <div className="font-semibold text-gray-700">
                              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                            <div>
                              {new Date(user.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => handleViewDetail(user)}
                            className="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-xl transition cursor-pointer"
                            title="Xem chi tiết & lịch sử đơn hàng"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-xl transition cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(user)}
                            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition cursor-pointer"
                            title="Xóa người dùng"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Hiển thị {users.length} trên tổng số {totalCount} người dùng
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE USER ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 animate-scaleIn text-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Thêm người dùng mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
                {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Email & Mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  {formErrors.password && <p className="text-[11px] text-red-500 mt-1">{formErrors.password}</p>}
                </div>
              </div>

              {/* SĐT & Giới tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vai trò quyền hạn
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition ${
                    formData.role === 'customer'
                      ? 'border-orange-600 bg-orange-50/50'
                      : 'border-gray-200 bg-[#f8faff]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="customer"
                      checked={formData.role === 'customer'}
                      onChange={() => setFormData({ ...formData, role: 'customer' })}
                      className="hidden"
                    />
                    <div className="w-4 h-4 rounded-full border-2 border-orange-600 flex items-center justify-center">
                      {formData.role === 'customer' && <div className="w-2 h-2 rounded-full bg-orange-600" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Khách hàng</div>
                      <div className="text-[10px] text-gray-500">Đặt món & tài khoản</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition ${
                    formData.role === 'admin'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-gray-200 bg-[#f8faff]'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={() => setFormData({ ...formData, role: 'admin' })}
                      className="hidden"
                    />
                    <div className="w-4 h-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                      {formData.role === 'admin' && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Quản trị viên</div>
                      <div className="text-[10px] text-gray-500">Toàn quyền hệ thống</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Địa chỉ giao hàng mặc định
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, tên đường, quận/huyện..."
                  className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loading size="sm" /> : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 animate-scaleIn text-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">
                    Chỉnh sửa người dùng
                  </h3>
                  <p className="text-xs text-gray-400">ID: {selectedUser._id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
                {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Email & Mật khẩu mới (Tùy chọn) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đặt lại mật khẩu (Tùy chọn)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Để trống nếu không đổi"
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  {formErrors.password && <p className="text-[11px] text-red-500 mt-1">{formErrors.password}</p>}
                </div>
              </div>

              {/* SĐT & Giới tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vai trò quyền hạn
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition ${
                    formData.role === 'customer'
                      ? 'border-orange-600 bg-orange-50/50'
                      : 'border-gray-200 bg-[#f8faff]'
                  }`}>
                    <input
                      type="radio"
                      name="editRole"
                      value="customer"
                      checked={formData.role === 'customer'}
                      onChange={() => setFormData({ ...formData, role: 'customer' })}
                      className="hidden"
                    />
                    <div className="w-4 h-4 rounded-full border-2 border-orange-600 flex items-center justify-center">
                      {formData.role === 'customer' && <div className="w-2 h-2 rounded-full bg-orange-600" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Khách hàng</div>
                      <div className="text-[10px] text-gray-500">Customer</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition ${
                    formData.role === 'admin'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-gray-200 bg-[#f8faff]'
                  }`}>
                    <input
                      type="radio"
                      name="editRole"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={() => setFormData({ ...formData, role: 'admin' })}
                      className="hidden"
                    />
                    <div className="w-4 h-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                      {formData.role === 'admin' && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Quản trị viên</div>
                      <div className="text-[10px] text-gray-500">Admin</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Địa chỉ giao hàng
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loading size="sm" /> : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW USER DETAIL ================= */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-gray-100 animate-scaleIn text-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${getAvatarColor(selectedUser.name)} text-white font-black text-sm flex items-center justify-center shadow-xs`}
                >
                  {getAvatarInitials(selectedUser.name)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{selectedUser.email}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${
                      selectedUser.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {selectedUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {userDetailLoading ? (
              <div className="py-12 flex justify-center">
                <Loading size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#f8faff] p-4 rounded-2xl border border-gray-200/60 text-xs">
                  <div>
                    <span className="text-gray-400 block font-medium">Số điện thoại</span>
                    <span className="font-bold text-gray-800">{selectedUser.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Giới tính</span>
                    <span className="font-bold text-gray-800">
                      {selectedUser.gender === 'female' ? 'Nữ' : selectedUser.gender === 'male' ? 'Nam' : 'Khác'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Ngày tham gia</span>
                    <span className="font-bold text-gray-800">
                      {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-gray-200/60">
                    <span className="text-gray-400 block font-medium">Địa chỉ</span>
                    <span className="font-bold text-gray-800">{selectedUser.address || 'Chưa có địa chỉ'}</span>
                  </div>
                </div>

                {/* Spending Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-orange-700 uppercase">Tổng số đơn hàng</span>
                    <div className="text-2xl font-black text-orange-950 mt-0.5">
                      {userDetailData?.statistics?.totalOrders || selectedUser.orderCount || 0} đơn
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">Tổng tiền đã mua</span>
                    <div className="text-2xl font-black text-emerald-950 mt-0.5">
                      {(userDetailData?.statistics?.totalSpent || selectedUser.totalSpent || 0).toLocaleString()} đ
                    </div>
                  </div>
                </div>

                {/* Recent Orders List */}
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Lịch sử đơn hàng gần đây</span>
                  </h4>

                  {userDetailData?.recentOrders && userDetailData.recentOrders.length > 0 ? (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {userDetailData.recentOrders.map((ord) => (
                        <div key={ord._id} className="p-3 bg-white hover:bg-gray-50 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-gray-900">
                              #ORD-{ord._id.slice(-6).toUpperCase()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {new Date(ord.createdAt).toLocaleDateString('vi-VN')} {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-orange-600">
                              {(ord.totalPrice || 0).toLocaleString()} đ
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-medium">
                      Người dùng này chưa có đơn hàng nào.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-5 mt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE DIALOG ================= */}
      {showDeleteDialog && userToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Xác nhận xóa tài khoản người dùng"
          message={`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${userToDelete.name}" (${userToDelete.email}) khỏi cơ sở dữ liệu không? Hành động này không thể hoàn tác.`}
          confirmText={actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
          cancelText="Hủy bỏ"
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default ManageUsers;
