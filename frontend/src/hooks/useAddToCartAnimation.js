import { useState, useCallback } from 'react';
import useCartStore from '../store/cartStore';

/**
 * Custom hook for TikTok-style parabolic add-to-cart flying animation.
 * Features:
 * 1. Circular glowing food item pops up at the click/button position.
 * 2. Flies along a curved parabolic path into the cart icon.
 * 3. Spins & scales down as it enters the cart.
 * 4. Cart icon triggers an elastic TikTok spring bounce.
 * 5. Spawns floating +1 (or +quantity) badge directly above cart icon.
 * 6. Shows a toast notification.
 */
const useAddToCartAnimation = () => {
  const addItem = useCartStore((state) => state.addItem);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const addToCartWithAnimation = useCallback((food, quantity = 1, source = null) => {
    if (!food || !food.isAvailable) return;

    // 1. Determine start coordinates (center of button, element or cursor event)
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (source) {
      if (typeof source.getBoundingClientRect === 'function') {
        const rect = source.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      } else if (typeof source.clientX === 'number' && typeof source.clientY === 'number') {
        startX = source.clientX;
        startY = source.clientY;
      }
    } else {
      const activeEl = document.activeElement;
      if (activeEl && typeof activeEl.getBoundingClientRect === 'function') {
        const rect = activeEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        }
      }
    }

    // 2. Locate Cart icon target in DOM
    const cartIcon =
      document.querySelector('.cart-icon-target') ||
      document.querySelector('a[href="/cart"]') ||
      document.querySelector('#cart-button');

    let targetX = window.innerWidth - 50;
    let targetY = 32;

    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      targetX = cartRect.left + cartRect.width / 2;
      targetY = cartRect.top + cartRect.height / 2;
    }

    // 3. Create TikTok-style flying element
    const flyer = document.createElement('div');
    flyer.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: 72px;
      height: 72px;
      margin-left: -36px;
      margin-top: -36px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid #ffffff;
      box-shadow: 0 10px 30px rgba(234, 88, 12, 0.45), 0 0 0 3px rgba(234, 88, 12, 0.3);
      background-color: #ffffff;
      z-index: 99999;
      pointer-events: none;
      transform: scale(0.6);
      opacity: 1;
      will-change: transform, left, top, opacity;
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    const imgUrl = food.image || food.food?.image;
    if (imgUrl) {
      flyer.innerHTML = `<img src="${imgUrl}" alt="${food.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      flyer.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#ea580c,#f97316);display:flex;align-items:center;justify-content:center;color:white;font-size:28px;border-radius:50%;">🍔</div>`;
    }

    document.body.appendChild(flyer);

    // Initial pop effect
    requestAnimationFrame(() => {
      flyer.style.transform = 'scale(1.15)';
    });

    // 4. Parabolic Flight Curve Animation using requestAnimationFrame
    const duration = 650; // ms
    const startTime = performance.now();
    // Arc apex: pull upward by up to 180px above the start/target line
    const arcHeight = Math.max(120, Math.abs(startX - targetX) * 0.35);

    const animateFlight = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in-out progress for horizontal movement
      const easeX = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Current X and Y (with parabolic arc)
      const curX = startX + (targetX - startX) * easeX;
      // Linear Y plus inverted parabola for the jump arc: 4 * h * p * (1 - p)
      const linearY = startY + (targetY - startY) * progress;
      const arcOffset = -4 * arcHeight * progress * (1 - progress);
      const curY = linearY + arcOffset;

      // Scale down from 1.15 to 0.15 as it nears the cart
      const curScale = 1.15 - 0.95 * Math.pow(progress, 1.5);
      const curRotate = progress * 420; // 420deg spin
      const curOpacity = progress > 0.85 ? (1 - progress) / 0.15 : 1;

      flyer.style.left = `${curX}px`;
      flyer.style.top = `${curY}px`;
      flyer.style.transform = `scale(${Math.max(0.1, curScale)}) rotate(${curRotate}deg)`;
      flyer.style.opacity = `${curOpacity}`;

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
      } else {
        // Flight finished! Remove flyer
        if (flyer.parentNode) {
          flyer.parentNode.removeChild(flyer);
        }

        // 5. Trigger Cart spring bounce & Badge pop
        if (cartIcon) {
          cartIcon.classList.remove('cart-bounce');
          void cartIcon.offsetWidth; // Force reflow
          cartIcon.classList.add('cart-bounce');

          const badge = cartIcon.querySelector('.cart-badge');
          if (badge) {
            badge.classList.remove('cart-badge-pop');
            void badge.offsetWidth;
            badge.classList.add('cart-badge-pop');
          }

          // 6. Floating "+1" pill directly above cart icon (TikTok style)
          const plusBadge = document.createElement('div');
          plusBadge.className = 'tiktok-plus-badge';
          plusBadge.style.cssText = `
            position: fixed;
            left: ${targetX}px;
            top: ${targetY - 14}px;
            background: linear-gradient(135deg, #ea580c, #dc2626);
            color: #ffffff;
            font-size: 13px;
            font-weight: 900;
            padding: 2px 8px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(234, 88, 12, 0.5);
            z-index: 99999;
            pointer-events: none;
          `;
          plusBadge.innerText = `+${quantity}`;
          document.body.appendChild(plusBadge);

          setTimeout(() => {
            if (plusBadge.parentNode) {
              plusBadge.parentNode.removeChild(plusBadge);
            }
          }, 900);
        }
      }
    };

    setTimeout(() => {
      requestAnimationFrame(animateFlight);
    }, 40);

    // 7. Add item to cart store
    addItem(food, quantity);

    // 8. Show Toast notification
    setToastMessage(`Đã thêm ${quantity} "${food.name}" vào giỏ hàng!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  }, [addItem]);

  return [addToCartWithAnimation, showToast, toastMessage];
};

export default useAddToCartAnimation;
