import { useState, useEffect, useCallback } from 'react';
import { adminReviewApi, adminFoodApi } from '../../services/adminApi';

/* ─── helpers ─────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function foodImage(img) {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_BASE}/uploads/${img}`;
}

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'text-amber-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ src, name }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (src) {
    const url = src.startsWith('http') ? src : `${API_BASE}/uploads/${src}`;
    return <img src={url} alt={name} className="w-9 h-9 rounded-full object-cover" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white text-xs font-bold select-none">
      {initials}
    </div>
  );
}

/* ─── main component ───────────────────────────────────── */
export default function ReviewsManager() {
  const [foods, setFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);

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

  useEffect(() => {
    setLoadingFoods(true);
    adminFoodApi.getAllFoods({ limit: 999 })
      .then((res) => setFoods(res.data?.data || res.data || []))
      .catch(() => showToast('Không thể tải danh sách món ăn', 'error'))
      .finally(() => setLoadingFoods(false));
  }, []);

  const loadReviews = useCallback(async (food, star) => {
    if (!food) return;
    setLoadingReviews(true);
    try {
      const params = {};
      if (star) params.rating = star;
      const res = await adminReviewApi.getFoodReviews(food._id, params);
      setReviews(res.data?.data || []);
      setAverageRating(res.data?.averageRating || 0);
    } catch {
      showToast('Không thể tải đánh giá', 'error');
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFood) loadReviews(selectedFood, starFilter);
  }, [selectedFood, starFilter, loadReviews]);

  async function handleToggleHide(review) {
    setActionId(review._id);
    try {
      const res = await adminReviewApi.toggleHideReview(review._id);
      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, isHidden: res.data.data.isHidden } : r))
      );
      showToast(res.data.message);
    } catch {
      showToast('Thao tác thất bại', 'error');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(review) {
    setConfirmDelete(null);
    setActionId(review._id);
    try {
      await adminReviewApi.deleteReview(review._id);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
      showToast('Đã xóa đánh giá');
    } catch {
      showToast('Xóa thất bại', 'error');
    } finally {
      setActionId(null);
    }
  }

  const displayedReviews = showHiddenOnly ? reviews.filter((r) => r.isHidden) : reviews;

  const filteredFoods = foods.filter((f) =>
    f.name?.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const starDist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const starIcon = (
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  );

  return (
    <div className="flex gap-6 min-h-screen relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toast.type === 'error'
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-red-100">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Xóa đánh giá?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-72 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
          <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <h2 className="font-bold text-base">Danh sách món ăn</h2>
            <p className="text-orange-100 text-xs mt-0.5">Chọn để xem đánh giá</p>
          </div>
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm món ăn..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            {loadingFoods ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredFoods.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Không tìm thấy</p>
            ) : (
              <ul className="p-2 space-y-1">
                {filteredFoods.map((food) => {
                  const isActive = selectedFood?._id === food._id;
                  const imgUrl = foodImage(food.image);
                  return (
                    <li key={food._id}>
                      <button
                        onClick={() => { setSelectedFood(food); setStarFilter(0); setShowHiddenOnly(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${isActive ? 'bg-orange-50 border border-orange-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={food.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shrink-0 text-lg">🍽️</div>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-orange-700' : 'text-gray-800'}`}>{food.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg>
                            <span className="text-xs text-gray-500">{food.rating?.toFixed(1) || '0.0'}</span>
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

      {/* RIGHT PANEL */}
      <div className="flex-1 min-w-0">
        {!selectedFood ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-500">Chọn một món ăn</p>
              <p className="text-sm mt-1 text-gray-400">để xem và quản lý đánh giá</p>
            </div>
          </div>
        ) : (
          <>
            {/* Food header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
              <div className="flex items-center gap-4">
                {foodImage(selectedFood.image) ? (
                  <img src={foodImage(selectedFood.image)} alt={selectedFood.name} className="w-16 h-16 rounded-xl object-cover shadow" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-3xl">🍽️</div>
                )}
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">{selectedFood.name}</h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg>
                      <span className="font-semibold text-gray-800">{averageRating.toFixed(1)}</span> / 5.0
                    </span>
                    <span>{reviews.length} đánh giá</span>
                    <span className="text-red-500">{reviews.filter((r) => r.isHidden).length} đã ẩn</span>
                  </div>
                </div>
                {/* star distribution */}
                <div className="hidden lg:flex flex-col gap-1 min-w-[180px]">
                  {starDist.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3.5 mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStarFilter(s)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${starFilter === s ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {s === 0 ? 'Tất cả' : (
                      <>{s}<svg className="w-3.5 h-3.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg></>
                    )}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setShowHiddenOnly((v) => !v)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${showHiddenOnly ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showHiddenOnly
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                  </svg>
                  {showHiddenOnly ? 'Chỉ đánh giá ẩn' : 'Hiển thị tất cả'}
                </button>
                <span className="text-sm text-gray-400">{displayedReviews.length} kết quả</span>
              </div>
            </div>

            {/* Reviews */}
            {loadingReviews ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-100 rounded w-20" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedReviews.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center gap-3 text-gray-400">
                <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="font-medium">Không có đánh giá nào</p>
                {starFilter > 0 && (
                  <button onClick={() => setStarFilter(0)} className="text-sm text-orange-500 hover:underline">Xóa bộ lọc</button>
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
                    starIcon={starIcon}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, isActing, onToggleHide, onDelete, starIcon }) {
  const user = review.user || {};
  const date = new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 p-5 ${review.isHidden ? 'border-gray-200 opacity-60' : 'border-gray-100 hover:shadow-md hover:border-orange-100'}`}>
      <div className="flex gap-3">
        <Avatar src={user.avatar} name={user.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user.name || 'Ẩn danh'}</p>
              <p className="text-xs text-gray-400">{user.email || ''}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {review.isHidden && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  Đã ẩn
                </span>
              )}
              <span className="text-xs text-gray-400">{date}</span>
            </div>
          </div>
          <div className="mt-2 mb-2.5 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">{starIcon}</svg>
            ))}
          </div>
          {review.comment
            ? <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
            : <p className="text-sm text-gray-400 italic">Không có nhận xét</p>
          }
        </div>
        <div className="flex flex-col gap-2 shrink-0 ml-2">
          <button
            onClick={onToggleHide}
            disabled={isActing}
            title={review.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
            className={`p-2 rounded-lg transition-all duration-150 disabled:opacity-50 ${review.isHidden ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600'}`}
          >
            {isActing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : review.isHidden ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={isActing}
            title="Xóa đánh giá"
            className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
