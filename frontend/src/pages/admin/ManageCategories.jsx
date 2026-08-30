import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminCategoryApi, adminFoodApi } from '../../services/adminApi';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

// Preset sample images for quick selection when creating/editing categories
const PRESET_IMAGES = [
  { name: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', icon: '🍔' },
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop', icon: '🍕' },
  { name: 'Gà rán (Chicken)', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', icon: '🍗' },
  { name: 'Khoai tây (Fries)', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&h=400&fit=crop', icon: '🍟' },
  { name: 'Đồ uống (Drinks)', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop', icon: '🥤' },
  { name: 'Combo', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop', icon: '🍱' },
  { name: 'Mì / Phở (Noodles)', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', icon: '🍜' },
  { name: 'Tráng miệng (Dessert)', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=400&fit=crop', icon: '🍰' },
];

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });

  // Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [categoriesRes, foodsRes] = await Promise.allSettled([
        adminCategoryApi.getAllCategories(),
        adminFoodApi.getAllFoods({ limit: 500 }),
      ]);

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.data || []);
      } else {
        setError('Không thể tải danh sách danh mục');
      }

      if (foodsRes.status === 'fulfilled') {
        setFoods(foodsRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Map of food counts per category
  const foodCountMap = useMemo(() => {
    const map = {};
    foods.forEach((food) => {
      const catId = food.category?._id || food.category;
      if (catId) {
        map[catId] = (map[catId] || 0) + 1;
      }
    });
    return map;
  }, [foods]);

  // Filtered categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
    });
    setShowModal(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await adminCategoryApi.createCategory(formData);
        showToast(`Đã thêm danh mục "${formData.name}" thành công!`);
      } else {
        await adminCategoryApi.updateCategory(selectedCategory._id, formData);
        showToast(`Đã cập nhật danh mục "${formData.name}" thành công!`);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Thao tác không thành công', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Dialog
  const handleOpenDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await adminCategoryApi.deleteCategory(categoryToDelete._id);
      showToast(`Đã xóa danh mục "${categoryToDelete.name}" thành công!`);
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Không thể xóa danh mục này', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-2.5 animate-slide-in-right ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Quản lý danh mục
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý các danh mục món ăn hiển thị ở mục "Bạn muốn ăn gì?" trên trang chủ và thực đơn.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Làm mới"
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
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* ── Metric Statistics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Tổng số danh mục
            </span>
            <span className="text-2xl font-black text-gray-900">
              {categories.length}
            </span>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl">
            📑
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Đã có ảnh đại diện
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {categories.filter((c) => !!c.image).length}
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
            🖼️
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Món ăn đang phục vụ
            </span>
            <span className="text-2xl font-black text-blue-600">
              {foods.length}
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
            🍽️
          </div>
        </div>
      </div>

      {/* ── Search & Controls Bar ── */}
      <div className="bg-white p-4 rounded-3xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-500 font-semibold mr-1">
            Hiển thị:
          </span>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Dạng thẻ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Thẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Dạng bảng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Bảng</span>
          </button>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading && categories.length === 0 ? (
        <div className="py-20 flex justify-center">
          <Loading size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retry={fetchData} />
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-md mx-auto my-6">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Không tìm thấy danh mục nào
          </h3>
          <p className="text-gray-500 text-xs mb-5">
            {searchQuery ? `Không có danh mục nào khớp với "${searchQuery}"` : 'Hiện chưa có danh mục nào trong hệ thống.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            + Thêm danh mục mới
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW (Cards) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => {
            const count = foodCountMap[category._id] || 0;
            return (
              <div
                key={category._id}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Row: Circular Image & Food Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 overflow-hidden flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<span style="font-size:24px;">🍔</span>';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">🍔</span>
                        )}
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">
                      {count} món ăn
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] leading-relaxed mb-4">
                    {category.description || 'Chưa có mô tả cho danh mục này.'}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/foods`}
                    className="text-xs text-gray-500 hover:text-orange-600 font-semibold flex items-center gap-1 transition"
                    title="Xem danh sách món"
                  >
                    <span>Quản lý món</span>
                    <span>→</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(category)}
                      className="p-2 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                      title="Chỉnh sửa danh mục"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => handleOpenDelete(category)}
                      className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                      title="Xóa danh mục"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Ảnh & Tên danh mục</th>
                  <th className="py-4 px-6">Mô tả</th>
                  <th className="py-4 px-6 text-center">Số món ăn</th>
                  <th className="py-4 px-6">Ngày tạo</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCategories.map((category) => {
                  const count = foodCountMap[category._id] || 0;
                  return (
                    <tr key={category._id} className="hover:bg-orange-50/40 transition">
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span style="font-size:18px;">🍔</span>';
                                }}
                              />
                            ) : (
                              <span className="text-xl">🍔</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block text-base">
                              {category.name}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              ID: {category._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-6 text-xs text-gray-500 max-w-xs truncate">
                        {category.description || 'Chưa có mô tả'}
                      </td>

                      {/* Food Count */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                          {count} món
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-6 text-xs text-gray-500 whitespace-nowrap">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '--'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(category)}
                            className="p-2 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                            title="Sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => handleOpenDelete(category)}
                            className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-overlay">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-modal-scale">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  {modalMode === 'create' ? '+' : '✎'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {modalMode === 'create'
                      ? 'Tạo danh mục mới hiển thị trên thực đơn và trang chủ.'
                      : `Cập nhật thông tin cho danh mục "${selectedCategory?.name}".`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Burger, Pizza, Gà rán, Đồ uống..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả ngắn gọn về danh mục món ăn này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Image URL & Live Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Đường dẫn hình ảnh (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />

                {/* Circular Live Preview */}
                <div className="mt-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-orange-200 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span style="font-size:24px;">❌</span>';
                        }}
                      />
                    ) : (
                      <span className="text-2xl">🍔</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Xem trước hiển thị hình tròn
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Hình ảnh sẽ hiển thị dạng tròn ở mục "Bạn muốn ăn gì?" trên trang chủ.
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-gray-500 block mb-2">
                    💡 Chọn ảnh mẫu nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            image: preset.url,
                            name: formData.name || preset.name,
                          });
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-orange-50 hover:border-orange-300 text-gray-700 text-xs rounded-xl border border-gray-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : modalMode === 'create' ? (
                    'Thêm danh mục'
                  ) : (
                    'Cập nhật danh mục'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {showDeleteDialog && categoryToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Xác nhận xóa danh mục"
          message={
            foodCountMap[categoryToDelete._id] > 0
              ? `Không thể xóa danh mục "${categoryToDelete.name}" vì đang có ${foodCountMap[categoryToDelete._id]} món ăn thuộc danh mục này. Vui lòng chuyển các món ăn sang danh mục khác trước.`
              : `Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete.name}"? Thao tác này không thể hoàn tác.`
          }
          confirmText={foodCountMap[categoryToDelete._id] > 0 ? 'Đã hiểu' : 'Xóa danh mục'}
          cancelText="Hủy"
          onConfirm={foodCountMap[categoryToDelete._id] > 0 ? () => setShowDeleteDialog(false) : handleConfirmDelete}
          onClose={() => setShowDeleteDialog(false)}
          type="danger"
          loading={deleting}
        />
      )}
    </div>
  );
};

export default ManageCategories;
