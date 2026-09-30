import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import orderApi from '../../services/orderApi';
import Loading from '../../components/common/Loading';
import OrderMap from '../../components/order/OrderMap';
import ReviewSection from '../../components/order/ReviewSection';

/* ── constants ── */
const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'shipping', 'completed'];

const STATUS_META = {
  pending:   { label: 'Chờ xác nhận',  heroText: 'Chờ xác nhận',   heroSub: 'Đơn hàng của bạn đang chờ nhà hàng xác nhận.',                       heroColor: '#e67e22', dot: '#e67e22' },
  confirmed: { label: 'Đã xác nhận',   heroText: 'Đã xác nhận',    heroSub: 'Đơn hàng đã được xác nhận, chuẩn bị nấu ngay!',                       heroColor: '#2980b9', dot: '#2980b9' },
  preparing: { label: 'Đang chuẩn bị', heroText: 'Đang chuẩn bị',  heroSub: 'Nhà hàng đang chuẩn bị món ăn cho bạn.',                              heroColor: '#8e44ad', dot: '#8e44ad' },
  shipping:  { label: 'Đang giao hàng',heroText: 'Đang giao hàng', heroSub: 'Tài xế đang trên đường đến. Dự kiến đến trong vài phút.',              heroColor: '#c0392b', dot: '#c0392b' },
  completed: { label: 'Đã hoàn thành', heroText: 'Đã hoàn thành',  heroSub: 'Đơn hàng đã giao thành công. Chúc bạn ngon miệng!',                   heroColor: '#27ae60', dot: '#27ae60' },
  cancelled: { label: 'Đã hủy',        heroText: 'Đã hủy',         heroSub: 'Đơn hàng này đã bị hủy.',                                              heroColor: '#e74c3c', dot: '#e74c3c' },
};

const STEP_LABELS = ['Đã đặt hàng', 'Đã xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Hoàn thành'];

/* step SVG icons – cleaner, outline style matching reference image */
const StepIcon = ({ stepKey, size = 20 }) => {
  const icons = {
    pending: (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    confirmed: (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    preparing: (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    shipping: (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
        <path d="M15 6h2l3 5v4h-5V6z"/>
        <path d="M3 6h12v11H3z"/>
      </svg>
    ),
    completed: (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  };
  return icons[stepKey] || null;
};

const CheckIcon = () => (
  <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const fmt = (d) => d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + fmt(d) : '';
const payLabel = (m) => ({ COD: 'Tiền mặt (COD)', ONLINE: 'Thẻ/Ví điện tử', MOMO: 'Momo', VNPAY: 'VNPAY' }[m] || m || 'Tiền mặt (COD)');



/* ══════════════════ MAIN COMPONENT ══════════════════ */
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrder(true);
    const iv = setInterval(() => fetchOrder(false), 5000);
    return () => clearInterval(iv);
  }, [id]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrder = async (spinner = false) => {
    try {
      if (spinner) setLoading(true);
      const res = await orderApi.getOrderById(id);
      const data = res.data?.order || res.data?.data || res.data || res;
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      if (spinner) setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(id);
      showToast('Đã hủy đơn hàng thành công');
      fetchOrder(false);
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancelling(false);
    }
  };

  /* ── render states ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 16px' }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <p style={{ color: '#888', fontSize: 14 }}>{error || 'Không tìm thấy đơn hàng'}</p>
        <Link to="/orders" style={{ padding: '10px 24px', background: '#c0392b', color: '#fff', borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          ← Quay lại đơn hàng
        </Link>
      </div>
    );
  }

  /* ── derived ── */
  const meta         = STATUS_META[order.status] || STATUS_META.pending;
  const currentIdx   = STATUS_ORDER.indexOf(order.status);
  const isCancelled  = order.status === 'cancelled';
  const isShipping   = order.status === 'shipping';
  const isCompleted  = order.status === 'completed';
  const canCancel    = order.status === 'pending' || order.status === 'confirmed';

  const orderCode = order.orderNumber
    ? `#${order.orderNumber}`
    : `#MSON-${order._id.slice(-6).toUpperCase()}`;

  const items    = order.items || [];
  const subtotal = Number(order.subtotal)    || items.reduce((s, i) => s + (Number(i.subtotal) || Number(i.price) * Number(i.quantity) || 0), 0);
  const shipping = Number(order.shippingFee) || 0;
  const discount = Number(order.discount)    || 0;
  const total    = Number(order.totalPrice)  || Math.max(0, subtotal + shipping - discount);
  const estMin   = 30;

  const progressPct = isCancelled ? 0
    : currentIdx >= 0 ? Math.round((currentIdx / (STATUS_ORDER.length - 1)) * 100)
    : 0;

  /* ─────────────────────────────────── JSX ─────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'inherit' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '12px 20px', borderRadius: 16,
          background: toast.type === 'error' ? '#c0392b' : '#27ae60',
          color: '#fff', fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      {/* ══ MAP HERO ══ */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        {/* Real Leaflet map – geocodes the delivery address via Nominatim */}
        {order && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <OrderMap address={order.shippingAddress?.address} height={300} />
          </div>
        )}

        {/* Floating Status Card */}
        <div style={{
          position: 'absolute',
          top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          minWidth: 340, maxWidth: 'calc(100vw - 32px)',
          border: '1px solid rgba(255,255,255,0.8)',
        }}>
          {/* Icon circle */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: `${meta.heroColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {isCancelled ? (
              <span style={{ fontSize: 26 }}>✕</span>
            ) : isCompleted ? (
              <span style={{ fontSize: 26 }}>🎉</span>
            ) : isShipping ? (
              <span style={{ fontSize: 28 }}>🛵</span>
            ) : order.status === 'preparing' ? (
              <span style={{ fontSize: 26 }}>👨‍🍳</span>
            ) : (
              <span style={{ fontSize: 26 }}>⏱️</span>
            )}
            {/* pulse ring for active */}
            {!isCancelled && !isCompleted && (
              <span style={{
                position: 'absolute', inset: -4, borderRadius: 20,
                border: `2px solid ${meta.heroColor}`,
                opacity: 0.35,
                animation: 'pulse-ring 2s infinite',
              }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: meta.dot, flexShrink: 0,
                boxShadow: `0 0 0 3px ${meta.dot}30`,
                animation: !isCancelled && !isCompleted ? 'pulse-dot 1.5s infinite' : 'none',
              }} />
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999' }}>
                Trạng thái trực tiếp
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: meta.heroColor, lineHeight: 1.2 }}>
              {meta.heroText}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888', lineHeight: 1.4 }}>
              {meta.heroSub.replace('vài phút', `${estMin} phút`)}
            </p>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#bbb', fontWeight: 600 }}>Mã đơn hàng</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a2e', letterSpacing: '0.02em' }}>{orderCode}</div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 60px', position: 'relative', zIndex: 10, marginTop: -20 }}>

        <style>{`
          @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(1.12);opacity:.15} }
          @keyframes pulse-dot  { 0%,100%{opacity:1} 50%{opacity:.4} }
          .od-step-circle {transition: all .3s;}
        `}</style>

        {/* Breadcrumb */}
        <nav style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, color:'#999', fontWeight:600, paddingTop:16, paddingBottom:16 }}>
          <Link to="/" style={{ color:'#999', textDecoration:'none' }} onMouseOver={e=>e.target.style.color='#c0392b'} onMouseOut={e=>e.target.style.color='#999'}>Trang chủ</Link>
          <span>/</span>
          <Link to="/orders" style={{ color:'#999', textDecoration:'none' }} onMouseOver={e=>e.target.style.color='#c0392b'} onMouseOut={e=>e.target.style.color='#999'}>Đơn hàng</Link>
          <span>/</span>
          <span style={{ color:'#1a1a2e' }}>{orderCode}</span>
        </nav>

        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>

          {/* ── RESPONSIVE 2-COL wrapper ── */}
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,400px)', gap:20, alignItems:'start' }}>

            {/* ──────────── LEFT ──────────── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Progress Card */}
              <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #f0f0f5', padding:'24px 28px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                  <h2 style={{ margin:0, fontSize:16, fontWeight:900, color:'#1a1a2e', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>↔</span> Tiến trình đơn hàng
                  </h2>
                  {canCancel && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      style={{
                        fontSize:12, fontWeight:700, color:'#c0392b', background:'transparent',
                        border:'1.5px solid #c0392b', borderRadius:12, padding:'6px 14px',
                        cursor:'pointer', opacity: cancelling ? 0.5 : 1, transition:'background .2s',
                      }}
                      onMouseOver={e=>e.currentTarget.style.background='#fff5f5'}
                      onMouseOut={e=>e.currentTarget.style.background='transparent'}
                    >
                      {cancelling ? '...' : 'Hủy đơn'}
                    </button>
                  )}
                </div>

                {isCancelled ? (
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff5f5', borderRadius:14, border:'1.5px solid #fecaca', color:'#c0392b', fontSize:13, fontWeight:700 }}>
                    <span style={{ fontSize:18 }}>✕</span>
                    Đơn hàng này đã bị hủy.
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    {/* Track line BG */}
                    <div style={{
                      position:'absolute', top:20, left:'10%', right:'10%', height:4,
                      background:'#f0f0f5', borderRadius:4, zIndex:0,
                    }}>
                      <div style={{
                        height:'100%', borderRadius:4,
                        background:'linear-gradient(90deg,#c0392b,#e74c3c)',
                        width: `${progressPct}%`,
                        transition:'width .8s ease',
                      }}/>
                    </div>

                    {/* Steps */}
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', zIndex:1 }}>
                      {STATUS_ORDER.map((key, idx) => {
                        const done    = idx < currentIdx;
                        const current = idx === currentIdx;
                        const future  = idx > currentIdx;

                        let circleStyle = {};
                        let iconColor   = '#fff';
                        if (done) {
                          circleStyle = { background:'#c0392b', border:'2.5px solid #c0392b' };
                        } else if (current) {
                          circleStyle = { background:'#fff', border:'3px solid #c0392b', boxShadow:'0 0 0 4px rgba(192,57,43,0.15)' };
                          iconColor = '#c0392b';
                        } else {
                          circleStyle = { background:'#fff', border:'2px solid #e0e0e0' };
                          iconColor = '#ccc';
                        }

                        const timeLabel = idx === 0
                          ? fmt(order.createdAt)
                          : current
                          ? fmt(order.updatedAt)
                          : future && idx === STATUS_ORDER.length - 1
                          ? `Dự kiến ${estMin} ph`
                          : '';

                        return (
                          <div key={key} style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                            <div className="od-step-circle" style={{
                              width:40, height:40, borderRadius:'50%',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              marginBottom:8, position:'relative',
                              ...circleStyle,
                            }}>
                              {done ? (
                                <span style={{ color:'#fff', lineHeight:1 }}><CheckIcon/></span>
                              ) : (
                                <span style={{ color: iconColor, lineHeight:1 }}>
                                  <StepIcon stepKey={key} size={18}/>
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize:11, fontWeight:700, textAlign:'center',
                              color: done || current ? '#1a1a2e' : '#bbb',
                              lineHeight:1.3, maxWidth:72,
                            }}>
                              {STEP_LABELS[idx]}
                            </span>
                            <span style={{ fontSize:10, fontWeight:600, color: current ? '#c0392b' : '#bbb', marginTop:2 }}>
                              {timeLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #f0f0f5', overflow:'hidden' }}>
                <div style={{ padding:'20px 24px', borderBottom:'1px solid #f5f5f8' }}>
                  <h2 style={{ margin:0, fontSize:15, fontWeight:900, color:'#1a1a2e' }}>Chi tiết đơn hàng</h2>
                </div>

                <div>
                  {items.map((item, idx) => {
                    const img     = item.food?.image || item.image;
                    const name    = item.name || item.food?.name || 'Món ăn';
                    const price   = Number(item.price) || 0;
                    const qty     = Number(item.quantity) || 1;
                    const iTotal  = Number(item.subtotal) || price * qty;
                    return (
                      <div key={item._id || idx} style={{
                        display:'flex', alignItems:'center', gap:14,
                        padding:'16px 24px',
                        borderBottom: idx < items.length - 1 ? '1px solid #f8f8fb' : 'none',
                      }}>
                        {/* image */}
                        <div style={{ position:'relative', flexShrink:0 }}>
                          {img
                            ? <img src={img} alt={name} referrerPolicy="no-referrer" style={{ width:60, height:60, objectFit:'cover', borderRadius:12, border:'1px solid #f0f0f5' }}/>
                            : <div style={{ width:60, height:60, background:'#f5f5f5', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🍽️</div>
                          }
                          <span style={{
                            position:'absolute', top:-6, right:-6, width:20, height:20,
                            background:'#c0392b', color:'#fff', borderRadius:'50%',
                            fontSize:10, fontWeight:900,
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>{qty}</span>
                        </div>
                        {/* info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#1a1a2e', marginBottom:2 }}>{name}</div>
                          {item.selectedToppings?.length > 0 && (
                            <div style={{ fontSize:11, color:'#e67e22', marginBottom:2 }}>
                              {item.selectedToppings.map(t => t.name).join(', ')}
                            </div>
                          )}
                          <div style={{ fontSize:12, color:'#aaa' }}>{price.toLocaleString()}đ × {qty}</div>
                        </div>
                        <div style={{ fontWeight:900, color:'#c0392b', fontSize:15, whiteSpace:'nowrap' }}>
                          {iTotal.toLocaleString()}đ
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing */}
                <div style={{ padding:'16px 24px', background:'#fafafa', borderTop:'1px solid #f0f0f5' }}>
                  {[
                    { label:'Tạm tính',     val: `${subtotal.toLocaleString()}đ`, color:'#555' },
                    { label:'Phí giao hàng', val: `${shipping.toLocaleString()}đ`, color:'#555' },
                    ...(discount > 0 ? [{ label:`Khuyến mãi${order.coupon?.code ? ` (Mã: ${order.coupon.code})` : ''}`, val:`-${discount.toLocaleString()}đ`, color:'#c0392b' }] : []),
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, fontSize:13 }}>
                      <span style={{ color: r.color === '#c0392b' ? '#c0392b' : '#666' }}>{r.label}</span>
                      <span style={{ fontWeight:600, color: r.color }}>{r.val}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1.5px solid #ebebeb', paddingTop:14, marginTop:6 }}>
                    <span style={{ fontSize:16, fontWeight:900, color:'#1a1a2e' }}>Tổng cộng</span>
                    <span style={{ fontSize:20, fontWeight:900, color:'#c0392b' }}>{total.toLocaleString()}đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Review Section – visible when completed ── */}
            {isCompleted && <ReviewSection order={order} />}

            {/* ──────────── RIGHT ──────────── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Driver Card – only while shipping */}
              {isShipping && (
                <div style={{
                  borderRadius:20, padding:'22px 20px',
                  background:'linear-gradient(135deg,#c0392b 0%,#e74c3c 100%)',
                  color:'#fff', boxShadow:'0 8px 32px rgba(192,57,43,0.35)',
                }}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(255,255,255,0.65)', marginBottom:16 }}>
                    Tài xế của bạn
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                    <div style={{
                      width:56, height:56, borderRadius:'50%', flexShrink:0,
                      background:'rgba(255,255,255,0.2)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                      boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
                    }}>🧑</div>
                    <div>
                      <div style={{ fontSize:18, fontWeight:900, lineHeight:1.2 }}>Nguyễn Văn A</div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                        <span style={{ color:'#fbbf24' }}>★</span>
                        <span style={{ fontWeight:700, fontSize:13 }}>4.9</span>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>(2k+ chuyến)</span>
                      </div>
                    </div>
                  </div>

                  {/* License */}
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    background:'rgba(255,255,255,0.15)', borderRadius:14, padding:'12px 16px', marginBottom:16,
                  }}>
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'rgba(255,255,255,0.6)', letterSpacing:'0.1em' }}>Biển số xe</div>
                      <div style={{ fontSize:17, fontWeight:900, letterSpacing:'0.08em', marginTop:2 }}>59-A1 123.45</div>
                    </div>
                    <span style={{ fontSize:28 }}>🛵</span>
                  </div>

                  {/* Action btns */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <a href={`tel:${order.shippingAddress?.phone}`} style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      background:'#fff', color:'#c0392b', fontWeight:700, fontSize:13,
                      padding:'11px 0', borderRadius:12, textDecoration:'none', transition:'opacity .2s',
                    }} onMouseOver={e=>e.currentTarget.style.opacity='0.9'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                      📞 Gọi điện
                    </a>
                    <button style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      background:'rgba(255,255,255,0.15)', color:'#fff', fontWeight:700, fontSize:13,
                      padding:'11px 0', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.3)', cursor:'pointer',
                    }}>
                      💬 Nhắn tin
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #f0f0f5', padding:'20px' }}>
                <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:900, color:'#1a1a2e', display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'#c0392b' }}>📍</span> Địa chỉ giao hàng
                </h3>
                <div style={{ display:'flex', gap:12, background:'#f8f9fb', borderRadius:14, padding:'14px' }}>
                  <div style={{ width:40, height:40, background:'#fff7f0', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏠</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:'#1a1a2e' }}>
                      {order.shippingAddress?.fullName}
                      {order.shippingAddress?.phone && (
                        <span style={{ fontWeight:500, color:'#999', fontSize:12, marginLeft:6 }}>· {order.shippingAddress.phone}</span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:'#888', marginTop:4, lineHeight:1.5 }}>
                      {order.shippingAddress?.address}
                    </div>
                    {order.shippingAddress?.note && (
                      <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>📝 {order.shippingAddress.note}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #f0f0f5', padding:'20px' }}>
                <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:900, color:'#1a1a2e' }}>Thông tin đơn hàng</h3>
                {[
                  { label:'Mã đơn',          val: orderCode,                      mono:true  },
                  { label:'Ngày đặt',         val: fmtDate(order.createdAt)                  },
                  { label:'Thanh toán',        val: payLabel(order.paymentMethod)              },
                  { label:'Trạng thái',        val: meta.label, chip:true                     },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f8f8fb', fontSize:12 }}>
                    <span style={{ color:'#888', fontWeight:600 }}>{r.label}</span>
                    {r.chip ? (
                      <span style={{
                        padding:'3px 10px', borderRadius:50,
                        background:`${meta.dot}18`, color:meta.dot,
                        fontWeight:800, fontSize:11, border:`1px solid ${meta.dot}40`,
                      }}>{r.val}</span>
                    ) : (
                      <span style={{ fontWeight:r.mono ? 900 : 700, color:'#1a1a2e', fontFamily: r.mono ? 'monospace,monospace' : 'inherit', fontSize: r.mono ? 13 : 12 }}>{r.val}</span>
                    )}
                  </div>
                ))}

                {/* Payment Status Badge */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', fontSize:12 }}>
                  <span style={{ color:'#888', fontWeight:600 }}>Trạng thái thanh toán</span>
                  {order.paymentStatus === 'paid' ? (
                    <span style={{
                      padding:'3px 10px', borderRadius:50,
                      background:'#d1fae5', color:'#065f46',
                      fontWeight:800, fontSize:11, border:'1px solid #6ee7b7',
                      display:'inline-flex', alignItems:'center', gap:4,
                    }}>
                      ✓ Đã thanh toán
                    </span>
                  ) : order.paymentMethod === 'COD' ? (
                    <span style={{
                      padding:'3px 10px', borderRadius:50,
                      background:'#f3f4f6', color:'#6b7280',
                      fontWeight:700, fontSize:11, border:'1px solid #e5e7eb',
                    }}>
                      Thanh toán khi nhận hàng
                    </span>
                  ) : (
                    <span style={{
                      padding:'3px 10px', borderRadius:50,
                      background:'#fef3c7', color:'#92400e',
                      fontWeight:800, fontSize:11, border:'1px solid #fde68a',
                      display:'inline-flex', alignItems:'center', gap:4,
                    }}>
                      ⏳ Chờ thanh toán
                    </span>
                  )}
                </div>

                {/* Pay Now Button for unpaid online orders */}
                {order.paymentStatus !== 'paid' && order.paymentMethod !== 'COD' && !isCancelled && !isCompleted && (
                  <button
                    onClick={() => navigate(`/payment/${order._id}`)}
                    style={{
                      marginTop:12, width:'100%', padding:'11px 0',
                      background:'linear-gradient(135deg,#a83210,#c0392b)',
                      color:'#fff', fontWeight:800, fontSize:13,
                      borderRadius:14, border:'none', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      boxShadow:'0 4px 16px rgba(168,50,16,0.3)',
                      transition:'opacity .2s',
                    }}
                    onMouseOver={e=>e.currentTarget.style.opacity='0.9'}
                    onMouseOut={e=>e.currentTarget.style.opacity='1'}
                  >
                    <span>💳</span> Thanh toán ngay
                  </button>
                )}
              </div>

              {/* Help & Navigation */}
              <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #f0f0f5', padding:'16px 20px', display:'flex', flexDirection:'column', gap:8 }}>
                <button style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', background:'none', border:'none', cursor:'pointer',
                  padding:'8px 12px', borderRadius:12, color:'#c0392b', fontWeight:700, fontSize:13,
                  transition:'background .2s',
                }}
                  onMouseOver={e=>e.currentTarget.style.background='#fff5f5'}
                  onMouseOut={e=>e.currentTarget.style.background='none'}
                >
                  <span>❓ Cần hỗ trợ về đơn hàng?</span>
                  <span>›</span>
                </button>

                <Link to="/orders" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  background:'#f5f6fa', color:'#555', fontWeight:700, fontSize:13,
                  padding:'11px 0', borderRadius:12, textDecoration:'none', transition:'background .2s',
                }}
                  onMouseOver={e=>e.currentTarget.style.background='#ebebeb'}
                  onMouseOut={e=>e.currentTarget.style.background='#f5f6fa'}
                >
                  ← Xem tất cả đơn hàng
                </Link>

                {isCompleted && (
                  <Link to="/menu" style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    background:'linear-gradient(135deg,#c0392b,#e74c3c)', color:'#fff', fontWeight:700, fontSize:13,
                    padding:'12px 0', borderRadius:12, textDecoration:'none',
                    boxShadow:'0 4px 16px rgba(192,57,43,0.3)',
                  }}>
                    🍽️ Đặt lại ngay
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
