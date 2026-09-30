import { useState, useEffect, useCallback } from 'react';
import reviewApi from '../../services/reviewApi';

/* ── Star Rating Input ── */
const StarInput = ({ value, onChange, disabled }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onClick={() => !disabled && onChange(star)}
            style={{
              background: 'none', border: 'none', padding: 2,
              cursor: disabled ? 'default' : 'pointer',
              fontSize: 28, lineHeight: 1,
              color: filled ? '#f59e0b' : '#d1d5db',
              transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform .15s, color .15s',
              filter: filled ? 'drop-shadow(0 1px 4px rgba(245,158,11,0.4))' : 'none',
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};

/* ── Star Display (read-only) ── */
const StarDisplay = ({ value, size = 14 }) => (
  <span style={{ color: '#f59e0b', fontSize: size, letterSpacing: -1 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ opacity: s <= Math.round(value) ? 1 : 0.25 }}>★</span>
    ))}
  </span>
);

const RATING_LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời! 🎉'];

/* ══════════════ ReviewSection ══════════════ */
const ReviewSection = ({ order }) => {
  const [submittedMap, setSubmittedMap]   = useState({}); // { foodId: reviewObj }
  const [activeItem, setActiveItem]       = useState(null); // foodId being reviewed
  const [ratings, setRatings]             = useState({}); // { foodId: number }
  const [comments, setComments]           = useState({}); // { foodId: string }
  const [loading, setLoading]             = useState(false);
  const [fetchingDone, setFetchingDone]   = useState(false);
  const [toast, setToast]                 = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Load existing reviews for this order ── */
  const loadOrderReviews = useCallback(async () => {
    try {
      const res = await reviewApi.getOrderReviews(order._id);
      const map = {};
      (res.data || []).forEach((r) => {
        const fid = r.food?._id || r.food;
        if (fid) map[fid] = r;
      });
      setSubmittedMap(map);
    } catch {
      // silent – not critical
    } finally {
      setFetchingDone(true);
    }
  }, [order._id]);

  useEffect(() => {
    if (order?.status === 'completed') loadOrderReviews();
  }, [order, loadOrderReviews]);

  if (order?.status !== 'completed') return null;

  const items = order.items || [];

  /* ── Submit a review ── */
  const handleSubmit = async (foodId, foodName) => {
    const rating = ratings[foodId];
    if (!rating) {
      showToast('Vui lòng chọn số sao đánh giá!', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await reviewApi.createReview({
        food: foodId,
        rating,
        comment: comments[foodId] || '',
        orderId: order._id,
      });

      setSubmittedMap((prev) => ({ ...prev, [foodId]: res.data }));
      setActiveItem(null);
      showToast(`Đã gửi đánh giá "${foodName}" thành công! 🎉`);
    } catch (err) {
      const msg = err?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const allReviewed = items.every((item) => {
    const fid = item.food?._id || item.food;
    return submittedMap[fid];
  });

  return (
    <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0f0f5', overflow: 'hidden', marginTop: 16 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '12px 20px', borderRadius: 16,
          background: toast.type === 'error' ? '#c0392b' : '#27ae60',
          color: '#fff', fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn .25s ease',
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f5f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⭐ Đánh giá món ăn
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
            {allReviewed
              ? 'Cảm ơn bạn đã đánh giá tất cả các món!'
              : 'Chia sẻ cảm nhận của bạn về các món đã thưởng thức'}
          </p>
        </div>
        {allReviewed && (
          <div style={{ fontSize: 11, fontWeight: 800, color: '#27ae60', background: '#f0fdf4', padding: '5px 12px', borderRadius: 50, border: '1.5px solid #bbf7d0' }}>
            ✓ Đã đánh giá hết
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '8px 0' }}>
        {items.map((item, idx) => {
          const foodId   = item.food?._id || item.food;
          const name     = item.name || item.food?.name || 'Món ăn';
          const img      = item.food?.image || item.image;
          const reviewed = submittedMap[foodId];
          const isActive = activeItem === foodId;
          const curRating = ratings[foodId] || 0;

          return (
            <div key={foodId || idx} style={{
              borderBottom: idx < items.length - 1 ? '1px solid #f8f8fb' : 'none',
            }}>
              {/* Item row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px' }}>
                {/* Food image */}
                {img
                  ? <img src={img} alt={name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #f0f0f5' }}/>
                  : <div style={{ width: 52, height: 52, background: '#f5f5f5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🍽️</div>
                }

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{name}</div>
                  {reviewed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <StarDisplay value={reviewed.rating} />
                      <span style={{ fontSize: 11, color: '#888' }}>{RATING_LABELS[reviewed.rating]}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>Chưa đánh giá</div>
                  )}
                </div>

                {/* Action button */}
                {reviewed ? (
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: '#27ae60',
                    background: '#f0fdf4', padding: '5px 12px', borderRadius: 50,
                    border: '1.5px solid #bbf7d0', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    ✓ Đã đánh giá
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveItem(isActive ? null : foodId)}
                    style={{
                      fontSize: 12, fontWeight: 700,
                      padding: '7px 16px', borderRadius: 50, whiteSpace: 'nowrap', flexShrink: 0,
                      cursor: 'pointer', transition: 'all .2s',
                      background: isActive ? '#fff5f5' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
                      color: isActive ? '#c0392b' : '#fff',
                      border: isActive ? '1.5px solid #fecaca' : 'none',
                      boxShadow: isActive ? 'none' : '0 3px 10px rgba(192,57,43,0.25)',
                    }}
                  >
                    {isActive ? '✕ Đóng' : '✍ Đánh giá'}
                  </button>
                )}
              </div>

              {/* Expand: review form */}
              {isActive && !reviewed && (
                <div style={{
                  margin: '0 16px 16px',
                  background: '#fafafa',
                  borderRadius: 16,
                  padding: '20px',
                  border: '1.5px solid #f0f0f5',
                }}>
                  {/* Stars */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Mức độ hài lòng *</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <StarInput
                        value={curRating}
                        onChange={(v) => setRatings((p) => ({ ...p, [foodId]: v }))}
                        disabled={loading}
                      />
                      {curRating > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                          {RATING_LABELS[curRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Nhận xét (tuỳ chọn)</div>
                    <textarea
                      value={comments[foodId] || ''}
                      onChange={(e) => setComments((p) => ({ ...p, [foodId]: e.target.value }))}
                      placeholder={`Chia sẻ cảm nhận của bạn về ${name}...`}
                      rows={3}
                      maxLength={500}
                      disabled={loading}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        border: '1.5px solid #e5e7eb', borderRadius: 12,
                        padding: '10px 14px', fontSize: 13, color: '#1a1a2e',
                        resize: 'vertical', outline: 'none',
                        fontFamily: 'inherit', background: '#fff',
                        transition: 'border-color .2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#c0392b'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <div style={{ textAlign: 'right', fontSize: 10, color: '#bbb', marginTop: 3 }}>
                      {(comments[foodId] || '').length}/500
                    </div>
                  </div>

                  {/* Submit */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleSubmit(foodId, name)}
                      disabled={loading || !curRating}
                      style={{
                        flex: 1, padding: '11px 0', borderRadius: 12,
                        background: !curRating ? '#e5e7eb' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
                        color: !curRating ? '#aaa' : '#fff',
                        border: 'none', fontWeight: 800, fontSize: 14,
                        cursor: loading || !curRating ? 'not-allowed' : 'pointer',
                        boxShadow: curRating ? '0 4px 16px rgba(192,57,43,0.3)' : 'none',
                        transition: 'all .2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {loading ? (
                        <>
                          <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }}/>
                          Đang gửi...
                        </>
                      ) : '🚀 Gửi đánh giá'}
                    </button>
                    <button
                      onClick={() => setActiveItem(null)}
                      disabled={loading}
                      style={{
                        padding: '11px 18px', borderRadius: 12,
                        background: '#f5f6fa', color: '#666',
                        border: 'none', fontWeight: 700, fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              )}

              {/* Submitted review content preview */}
              {reviewed?.comment && (
                <div style={{
                  margin: '0 24px 16px',
                  padding: '12px 16px',
                  background: '#fdf9f0',
                  borderRadius: 12,
                  borderLeft: '3px solid #f59e0b',
                  fontSize: 13,
                  color: '#555',
                  fontStyle: 'italic',
                }}>
                  "{reviewed.comment}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default ReviewSection;
