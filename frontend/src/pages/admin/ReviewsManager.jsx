import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminReviewApi, adminFoodApi } from '../../services/adminApi';

/* ─── helpers ─────────────────────────────────────────── */
const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = rawBaseUrl.replace(/\/api\/?$/, '');

function foodImage(img) {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_BASE}/uploads/${img}`;
}

function Avatar({ src, name }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    const url = src.startsWith('http') ? src : `${API_BASE}/uploads/${src}`;
    return <img src={url} alt={name || 'Avatar'} className="w-10 h-10 rounded-full object-cover shadow-xs ring-2 ring-orange-100" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white text-xs font-bold select-none shadow-xs">
      {initials || 'U'}
    </div>
  );
}

const starIcon = (
  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
);

/* ─── main component ───────────────────────────────────── */
export default function ReviewsManager() {
  const [foods, setFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null); // null = "Tất cả đánh giá"
  const [sidebarTab, setSidebarTab] = useState('all'); // 'all' | 'has_reviews'
  const [reviewStats, setReviewStats] = useState({ byFood: {}, totalReviews: 0, overallAvgRating: 0 });

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [starFilter, setStarFilter] = useState(0);
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);

  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Load stats from backend
  const loadReviewStats = useCallback(async () => {
    try {
      const res = await adminReviewApi.getReviewStats();
      const statsData = res?.data || res;
      if (statsData) {
        setReviewStats(statsData);
      }
    } catch (err) {
      console.error('Error loading review stats:', err);
    }
  }, []);

  // Initial load: foods & review stats
  useEffect(() => {
    setLoadingFoods(true);
    Promise.all([
      adminFoodApi.getAllFoods({ limit: 999 }),
      adminReviewApi.getReviewStats().catch(() => null)
    ])
      .then(([foodsRes, statsRes]) => {
        const foodList = Array.isArray(foodsRes?.data)
          ? foodsRes.data
          : Array.isArray(foodsRes?.data?.data)
            ? foodsRes.data.data
            : Array.isArray(foodsRes)
              ? foodsRes
              : [];
        setFoods(foodList);

        if (statsRes) {
          const statsData = statsRes?.data || statsRes;
          setReviewStats(statsData);
        }
      })
      .catch(() => showToast('Không thể tải danh sách món ăn', 'error'))
      .finally(() => setLoadingFoods(false));
  }, []);

  // Load real reviews (either for all foods or a single selected food)
  const loadReviews = useCallback(async (food, star) => {
    setLoadingReviews(true);
    try {
      const params = {};
      if (star) params.rating = star;

      let res;
      if (food) {
        // Specific food review request
        res = await adminReviewApi.getFoodReviews(food._id, params);
      } else {
        // All real reviews across system
        res = await adminReviewApi.getAllReviews({ ...params, limit: 100 });
      }

      // Handle axios response interceptor
      const reviewsList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
            ? res
            : [];

      let avg = 0;
      if (res?.averageRating !== undefined) {
        avg = Number(res.averageRating) || 0;
      } else if (reviewsList.length > 0) {
        const sum = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        avg = parseFloat((sum / reviewsList.length).toFixed(1));
      }

      setReviews(reviewsList);
      setAverageRating(avg);
    } catch (err) {
      console.error('Error loading reviews:', err);
      showToast('Không thể tải đánh giá thực tế', 'error');
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadReviews(selectedFood, starFilter);
  }, [selectedFood, starFilter, loadReviews]);

  // Toggle hide review
  async function handleToggleHide(review) {
    setActionId(review._id);
    try {
      const res = await adminReviewApi.toggleHideReview(review._id);
      const updated = res?.data?.data || res?.data || res;
      const nextHidden = updated?.isHidden !== undefined ? updated.isHidden : !review.isHidden;
      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, isHidden: nextHidden } : r))
      );
      showToast(res?.message || (nextHidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị đánh giá'));
      loadReviewStats();
    } catch (err) {
      console.error(err);
      showToast('Thao tác thất bại', 'error');
    } finally {
      setActionId(null);
    }
  }

  // Delete review
  async function handleDelete(review) {
    setConfirmDelete(null);
    setActionId(review._id);
    try {
      const res = await adminReviewApi.deleteReview(review._id);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
      showToast(res?.message || 'Đã xóa đánh giá');
      loadReviewStats();
    } catch (err) {
      console.error(err);
      showToast('Xóa thất bại', 'error');
    } finally {
      setActionId(null);
    }
  }

  const displayedReviews = showHiddenOnly ? reviews.filter((r) => r.isHidden) : reviews;

  // Filtered sidebar foods
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch = f.name?.toLowerCase().includes(foodSearch.toLowerCase());
      if (!matchesSearch) return false;

      const fStat = reviewStats.byFood?.[f._id];
      const count = fStat?.count || 0;
      if (sidebarTab === 'has_reviews') {
        return count > 0;
      }
      return true;
    });
  }, [foods, foodSearch, sidebarTab, reviewStats]);

  // Count foods with reviews
  const foodsWithReviewsCount = useMemo(() => {
    return foods.filter((f) => {
      const fStat = reviewStats.byFood?.[f._id];
      return (fStat?.count || 0) > 0;
    }).length;
  }, [foods, reviewStats]);

  const starDist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-100px)] relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium transition-all transform animate-bounce ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toast.type === 'error' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            )}
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 text-red-600">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Xóa đánh giá này?</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              Đánh giá thực của người dùng sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: Food List & Filter */}
      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
          <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>⭐</span> Quản lý đánh giá
            </h2>
            <p className="text-orange-100 text-xs mt-0.5">
              Tổng cộng {reviewStats.totalReviews || 0} đánh giá thực tế từ khách hàng
            </p>
          </div>

          {/* Quick Option: All Reviews across all dishes */}
          <div className="p-3 border-b border-gray-100 bg-orange-50/40">
            <button
              onClick={() => {
                setSelectedFood(null);
                setStarFilter(0);
                setShowHiddenOnly(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                selectedFood === null
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'bg-white border border-orange-200 text-orange-900 hover:bg-orange-100/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🌟</span>
                <div className="text-left">
                  <p className="font-bold leading-tight">Tất cả đánh giá</p>
                  <p className={`text-[11px] ${selectedFood === null ? 'text-orange-100' : 'text-gray-500'}`}>
                    Xem toàn bộ đánh giá từ các món
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  selectedFood === null ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                }`}
              >
                {reviewStats.totalReviews || 0}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative mb-2.5">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên món ăn..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Filter Tabs: All Foods vs Foods With Reviews */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
              <button
                onClick={() => setSidebarTab('all')}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all ${
                  sidebarTab === 'all' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'
                }`}
              >
                Tất cả ({foods.length})
              </button>
              <button
                onClick={() => setSidebarTab('has_reviews')}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                  sidebarTab === 'has_reviews'
                    ? 'bg-white text-orange-600 shadow-xs font-semibold'
                    : 'hover:text-gray-900'
                }`}
              >
                <span>Có đánh giá</span>
                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {foodsWithReviewsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Food List */}
          <div className="overflow-y-auto max-h-[calc(100vh-340px)] p-2">
            {loadingFoods ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-400">
                <p className="text-sm font-medium">Không tìm thấy món nào</p>
                {sidebarTab === 'has_reviews' && (
                  <button
                    onClick={() => setSidebarTab('all')}
                    className="mt-2 text-xs text-orange-600 hover:underline"
                  >
                    Xem tất cả món
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredFoods.map((food) => {
                  const isActive = selectedFood?._id === food._id;
                  const imgUrl = foodImage(food.image);
                  const fStat = reviewStats.byFood?.[food._id];
                  const realCount = fStat?.count || 0;
                  const realAvg = fStat?.avgRating || (realCount > 0 ? food.rating : 0);

                  return (
                    <li key={food._id}>
                      <button
                        onClick={() => {
                          setSelectedFood(food);
                          setStarFilter(0);
                          setShowHiddenOnly(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                          isActive
                            ? 'bg-orange-50 border border-orange-300 shadow-xs'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={food.name}
                            className="w-11 h-11 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shrink-0 text-xl">
                            🍽️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive ? 'text-orange-700 font-bold' : 'text-gray-800'
                            }`}
                          >
                            {food.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {realCount > 0 ? (
                              <>
                                <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
                                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    {starIcon}
                                  </svg>
                                  {realAvg.toFixed(1)}
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  {realCount} đánh giá
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Chưa có đánh giá</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL: Reviews Content */}
      <div className="flex-1 min-w-0">
        {/* Header summary banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          {selectedFood === null ? (
            // All Reviews View Header
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-2">
                    <span>🌟</span> Đang xem toàn bộ đánh giá thực tế
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Tất cả đánh giá từ người dùng</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Danh sách tổng hợp đánh giá thực tế của khách hàng sau khi nhận món ăn
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">Tổng đánh giá</p>
                    <p className="text-2xl font-extrabold text-orange-600">{reviews.length}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">Điểm trung bình</p>
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        {starIcon}
                      </svg>
                      <span className="text-2xl font-extrabold text-amber-600">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Star distribution */}
              {reviews.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {starDist.map(({ star, count }) => (
                    <button
                      key={star}
                      onClick={() => setStarFilter(starFilter === star ? 0 : star)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        starFilter === star
                          ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          {star} <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg>
                        </span>
                        <span className="text-xs font-semibold text-gray-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Specific Food Header
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {foodImage(selectedFood.image) ? (
                  <img
                    src={foodImage(selectedFood.image)}
                    alt={selectedFood.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-4xl shadow-sm">
                    🍽️
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800">
                      Món ăn
                    </span>
                    {selectedFood.price && (
                      <span className="text-xs font-bold text-gray-500">
                        {Number(selectedFood.price).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{selectedFood.name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1.5 font-bold text-gray-800">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        {starIcon}
                      </svg>
                      {averageRating.toFixed(1)} / 5.0
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>
                      <strong className="text-gray-800">{reviews.length}</strong> đánh giá thực tế
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-red-500 font-medium">
                      {reviews.filter((r) => r.isHidden).length} đã ẩn
                    </span>
                  </div>
                </div>

                {/* Back to All button */}
                <button
                  onClick={() => {
                    setSelectedFood(null);
                    setStarFilter(0);
                    setShowHiddenOnly(false);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  ← Xem tất cả món
                </button>
              </div>

              {/* Star distribution */}
              {reviews.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {starDist.map(({ star, count }) => (
                    <button
                      key={star}
                      onClick={() => setStarFilter(starFilter === star ? 0 : star)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        starFilter === star
                          ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          {star} <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg>
                        </span>
                        <span className="text-xs font-semibold text-gray-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3.5 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-400 mr-1 uppercase tracking-wider">Lọc sao:</span>
            {[0, 5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setStarFilter(s)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  starFilter === s
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 0 ? (
                  'Tất cả'
                ) : (
                  <>
                    {s}
                    <svg className="w-3.5 h-3.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                      {starIcon}
                    </svg>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowHiddenOnly((v) => !v)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                showHiddenOnly
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showHiddenOnly ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </>
                )}
              </svg>
              {showHiddenOnly ? 'Đang lọc đánh giá ẩn' : 'Đánh giá ẩn'}
            </button>
            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              {displayedReviews.length} kết quả
            </span>
          </div>
        </div>

        {/* Reviews List */}
        {loadingReviews ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-36" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-3.5 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="font-bold text-gray-600 text-base">Không có đánh giá nào</p>
            <p className="text-xs text-gray-400 max-w-sm text-center">
              {starFilter > 0 || showHiddenOnly
                ? 'Không tìm thấy đánh giá phù hợp với bộ lọc hiện tại.'
                : selectedFood
                ? `Món "${selectedFood.name}" chưa nhận được đánh giá nào từ khách hàng.`
                : 'Hiện tại chưa có đánh giá nào từ người dùng.'}
            </p>
            {(starFilter > 0 || showHiddenOnly) && (
              <button
                onClick={() => {
                  setStarFilter(0);
                  setShowHiddenOnly(false);
                }}
                className="mt-2 text-xs font-semibold text-orange-600 hover:underline bg-orange-50 px-3 py-1.5 rounded-lg"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedReviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                isActing={actionId === review._id}
                onToggleHide={() => handleToggleHide(review)}
                onDelete={() => setConfirmDelete(review)}
                onSelectFood={(foodItem) => {
                  if (foodItem) {
                    setSelectedFood(foodItem);
                    setStarFilter(0);
                    setShowHiddenOnly(false);
                  }
                }}
                starIcon={starIcon}
                isAllMode={selectedFood === null}
                foods={foods}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ReviewCard Subcomponent ──────────────────────────── */
function ReviewCard({ review, isActing, onToggleHide, onDelete, onSelectFood, starIcon, isAllMode, foods }) {
  const user = review.user || {};
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  // Get food info if populated or resolve from food list
  const foodInfo = useMemo(() => {
    if (review.food && typeof review.food === 'object' && review.food.name) {
      return review.food;
    }
    const foodId = typeof review.food === 'string' ? review.food : review.food?._id;
    return foods.find((f) => f._id === foodId) || null;
  }, [review.food, foods]);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 p-5 ${
        review.isHidden
          ? 'border-gray-200 bg-gray-50/50 opacity-75'
          : 'border-gray-100 hover:shadow-md hover:border-orange-200'
      }`}
    >
      {/* Food Badge in All Mode */}
      {foodInfo && (
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {foodImage(foodInfo.image) ? (
              <img
                src={foodImage(foodInfo.image)}
                alt={foodInfo.name}
                className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm shrink-0">
                🍽️
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs text-gray-400 block font-normal leading-tight">Món ăn:</span>
              <span className="text-xs font-bold text-gray-900 truncate block leading-tight hover:text-orange-600 transition-colors">
                {foodInfo.name}
              </span>
            </div>
          </div>

          {isAllMode && (
            <button
              onClick={() => onSelectFood(foodInfo)}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2.5 py-1 rounded-lg transition-colors shrink-0"
              title="Lọc xem chỉ món này"
            >
              Xem món này →
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3.5">
        <Avatar src={user.avatar} name={user.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-gray-900 text-sm">{user.name || 'Người dùng ẩn danh'}</p>
              <p className="text-xs text-gray-400 font-normal">{user.email || 'Không có email'}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {review.isHidden && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  Đã ẩn
                </span>
              )}
              {date && <span className="text-xs text-gray-400">{date}</span>}
            </div>
          </div>

          {/* Star Rating Display */}
          <div className="mt-2 mb-2 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {starIcon}
                </svg>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              {review.rating}/5
            </span>
          </div>

          {/* User Comment */}
          {review.comment ? (
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100">
              {review.comment}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">Khách hàng không để lại nhận xét bằng chữ</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 shrink-0 ml-2">
          <button
            onClick={onToggleHide}
            disabled={isActing}
            title={review.isHidden ? 'Hiển thị công khai đánh giá' : 'Ẩn đánh giá khỏi trang món'}
            className={`p-2.5 rounded-xl transition-all duration-150 disabled:opacity-50 border ${
              review.isHidden
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
            }`}
          >
            {isActing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : review.isHidden ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>

          <button
            onClick={onDelete}
            disabled={isActing}
            title="Xóa đánh giá này"
            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
