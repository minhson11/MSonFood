import { useState, useEffect } from 'react';
import couponApi from '../../services/couponApi';

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, percent, fixed
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, expired
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    code: '',
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 50000,
    maxDiscount: 30000,
    quantity: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponApi.getAllCoupons();
      if (res && res.data) {
        setCoupons(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      showToastMessage(err?.response?.data?.message || 'Không thể tải danh sách mã giảm giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Quick Seed Default Coupons if empty
  const handleSeedDefaults = async () => {
    try {
      setSubmitting(true);
      const sampleCoupons = [
        {
          code: 'MSON20',
          discountType: 'fixed',
          discountValue: 20000,
          minOrderValue: 80000,
          maxDiscount: null,
          quantity: 200,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          isActive: true,
        },
        {
          code: 'FREESHIP',
          discountType: 'fixed',
          discountValue: 15000,
          minOrderValue: 100000,
          maxDiscount: null,
          quantity: 500,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          isActive: true,
        },
        {
          code: 'MSON50',
          discountType: 'percent',
          discountValue: 20,
          minOrderValue: 150000,
          maxDiscount: 50000,
          quantity: 150,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          isActive: true,
        }
      ];

      for (const item of sampleCoupons) {
        await couponApi.createCoupon(item);
      }
      showToastMessage('Đã tạo 3 mã giảm giá mẫu thành công!');
      fetchCoupons();
    } catch (err) {
      showToastMessage(err?.response?.data?.message || 'Lỗi khi tạo mã mẫu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialFormState);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || '',
      quantity: coupon.quantity,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 10) : '',
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Coupon (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Vui lòng nhập mã giảm giá');
      return;
    }

    if (Number(formData.discountValue) <= 0) {
      setFormError('Giá trị giảm giá phải lớn hơn 0');
      return;
    }

    if (formData.discountType === 'percent' && Number(formData.discountValue) > 100) {
      setFormError('Giảm giá phần trăm không được vượt quá 100%');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    const payload = {
      code: cleanCode,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderValue: Number(formData.minOrderValue) || 0,
      maxDiscount: formData.discountType === 'percent' && formData.maxDiscount ? Number(formData.maxDiscount) : null,
      quantity: Number(formData.quantity) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      if (editingCoupon) {
        await couponApi.updateCoupon(editingCoupon._id, payload);
        showToastMessage(`Cập nhật mã "${cleanCode}" thành công!`);
      } else {
        await couponApi.createCoupon(payload);
        showToastMessage(`Tạo mã giảm giá "${cleanCode}" thành công!`);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu mã');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id) => {
    try {
      setSubmitting(true);
      await couponApi.deleteCoupon(id);
      showToastMessage('Đã xoá mã giảm giá thành công!');
      setDeleteConfirmId(null);
      fetchCoupons();
    } catch (err) {
      showToastMessage(err?.response?.data?.message || 'Không thể xoá mã giảm giá này', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (coupon) => {
    try {
      await couponApi.updateCoupon(coupon._id, { isActive: !coupon.isActive });
      showToastMessage(`Đã ${!coupon.isActive ? 'kích hoạt' : 'tạm dừng'} mã "${coupon.code}"`);
      fetchCoupons();
    } catch (err) {
      showToastMessage(err?.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToastMessage(`Đã sao chép mã "${code}" vào bộ nhớ tạm!`);
  };

  // Filter Logic
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || c.discountType === filterType;

    const now = new Date();
    const isExpired = new Date(c.endDate) < now;
    const isOut = c.usedCount >= c.quantity;

    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = c.isActive && !isExpired && !isOut;
    } else if (filterStatus === 'inactive') {
      matchesStatus = !c.isActive;
    } else if (filterStatus === 'expired') {
      matchesStatus = isExpired || isOut;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Summary Metrics
  const totalCount = coupons.length;
  const activeCount = coupons.filter(c => c.isActive && new Date(c.endDate) >= new Date() && c.usedCount < c.quantity).length;
  const totalUsedCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const totalIssuedCount = coupons.reduce((sum, c) => sum + (c.quantity || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-slide-in-right ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-white' : 'bg-emerald-400'}`}></span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Quản lý mã giảm giá (Vouchers) 🎟️
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
              {totalCount} mã
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Tạo, cấu hình và theo dõi lượt sử dụng các mã ưu đãi dành cho khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {coupons.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition active:scale-95"
            >
              + Tạo 3 mã mẫu
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>Thêm mã giảm giá mới</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Tổng số mã</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{totalCount}</span>
          <span className="text-[11px] text-gray-400 mt-1 block">Trong hệ thống</span>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Đang hoạt động</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{activeCount}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">Sẵn sàng áp dụng</span>
        </div>

        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Lượt đã sử dụng</span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">{totalUsedCount}</span>
          <span className="text-[11px] text-amber-600 mt-1 block">Trên tổng {totalIssuedCount} lượt phát</span>
        </div>

        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Tỷ lệ sử dụng</span>
          <span className="text-2xl font-black text-blue-800 mt-1 block">
            {totalIssuedCount > 0 ? ((totalUsedCount / totalIssuedCount) * 100).toFixed(1) : 0}%
          </span>
          <span className="text-[11px] text-blue-600 mt-1 block">Hiệu quả chiến dịch</span>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã (ví dụ: MSON20)..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold px-3 py-2 text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả hình thức</option>
            <option value="percent">Giảm theo %</option>
            <option value="fixed">Giảm số tiền cố định</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold px-3 py-2 text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiệu lực</option>
            <option value="inactive">Đang tạm dừng</option>
            <option value="expired">Hết hạn / Hết lượt</option>
          </select>
        </div>
      </div>

      {/* Coupons List / Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-sm border border-gray-100">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Đang tải danh sách mã giảm giá...
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 text-3xl flex items-center justify-center mx-auto mb-3">
            🎟️
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">Không tìm thấy mã giảm giá nào</h3>
          <p className="text-gray-500 text-xs max-w-sm mx-auto mb-5">
            Chưa có mã giảm giá nào phù hợp với bộ lọc hiện tại. Hãy tạo mã mới hoặc làm mới bộ lọc.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
          >
            + Tạo mã đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => {
            const now = new Date();
            const isExpired = new Date(coupon.endDate) < now;
            const isOut = coupon.usedCount >= coupon.quantity;
            const usagePercent = coupon.quantity > 0 ? Math.min(100, Math.round((coupon.usedCount / coupon.quantity) * 100)) : 0;

            let statusBadge = { label: 'Đang hoạt động', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            if (!coupon.isActive) {
              statusBadge = { label: 'Tạm dừng', color: 'bg-gray-100 text-gray-600 border-gray-200' };
            } else if (isExpired) {
              statusBadge = { label: 'Đã hết hạn', color: 'bg-red-50 text-red-700 border-red-200' };
            } else if (isOut) {
              statusBadge = { label: 'Hết lượt', color: 'bg-amber-50 text-amber-700 border-amber-200' };
            }

            return (
              <div
                key={coupon._id}
                className={`bg-white rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  coupon.isActive && !isExpired && !isOut ? 'border-orange-200/80' : 'border-gray-200 opacity-90'
                }`}
              >
                {/* Perforated ticket header */}
                <div className="p-5 pb-4 bg-gradient-to-br from-orange-50/60 via-white to-white border-b border-dashed border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>

                    {/* Quick copy code button */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="group/btn flex items-center gap-1.5 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-lg text-xs font-mono font-black transition cursor-pointer"
                      title="Nhấn để sao chép mã"
                    >
                      <span>{coupon.code}</span>
                      <svg className="w-3.5 h-3.5 text-orange-700 group-hover/btn:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Discount Value Display */}
                  <div className="mt-2">
                    <div className="text-2xl font-black text-[#a32e08] tracking-tight">
                      {coupon.discountType === 'percent'
                        ? `Giảm ${coupon.discountValue}%`
                        : `Giảm ${coupon.discountValue.toLocaleString()}đ`}
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">
                      {coupon.discountType === 'percent' && coupon.maxDiscount
                        ? `Tối đa ${coupon.maxDiscount.toLocaleString()}đ cho đơn từ ${(coupon.minOrderValue || 0).toLocaleString()}đ`
                        : `Áp dụng cho đơn từ ${(coupon.minOrderValue || 0).toLocaleString()}đ`}
                    </div>
                  </div>
                </div>

                {/* Ticket Details Body */}
                <div className="p-5 pt-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Usage Progress */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Đã sử dụng:</span>
                        <span className="font-bold text-gray-900">{coupon.usedCount || 0} / {coupon.quantity} lượt</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-red-500' : 'bg-orange-500'}`}
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="text-[11px] text-gray-400 space-y-0.5">
                      <div>
                        Bắt đầu: <span className="text-gray-700 font-medium">{coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                      </div>
                      <div>
                        Hạn dùng: <span className="text-gray-700 font-medium">{coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('vi-VN') : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(coupon)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                        coupon.isActive
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {coupon.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(coupon)}
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(coupon._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa mã"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-black text-gray-900 mb-1">
              {editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Thiết lập thông tin mã khuyến mãi để khách hàng nhập tại bước thanh toán
            </p>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold mb-4 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mã giảm giá (Code) *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: MSON20, FREESHIP..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 uppercase focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  required
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Loại giảm giá *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:border-orange-500 transition cursor-pointer"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Giá trị giảm ({formData.discountType === 'percent' ? '%' : 'đ'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percent' ? 100 : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Min Order Value and Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    placeholder="0 đ"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-orange-500 transition"
                  />
                </div>

                {formData.discountType === 'percent' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="Không giới hạn"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-orange-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Total Quantity */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Tổng số lượt phát hành (Số lượng) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-orange-500 transition"
                  required
                />
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-orange-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-orange-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Is Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800 select-none">
                    Kích hoạt mã ngay sau khi lưu
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-xs text-gray-600 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingCoupon ? 'Cập nhật mã' : 'Tạo mã mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 text-2xl flex items-center justify-center mx-auto mb-3">
              🗑️
            </div>
            <h3 className="text-base font-black text-gray-900 mb-1">
              Xác nhận xoá mã giảm giá?
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xoá mã này không? Hành động này sẽ loại bỏ mã khỏi hệ thống và không thể hoàn tác.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Giữ lại
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDeleteCoupon(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {submitting ? 'Đang xoá...' : 'Đồng ý xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;
