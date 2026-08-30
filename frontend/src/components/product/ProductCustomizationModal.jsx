import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAddToCartAnimation from '../../hooks/useAddToCartAnimation';
import ProductHeader from './ProductHeader';
import ProductVariantSelector from './ProductVariantSelector';
import ProductSizeSelector from './ProductSizeSelector';
import ProductToppingSelector from './ProductToppingSelector';
import ProductSpecialRequest from './ProductSpecialRequest';
import ProductQuantitySelector from './ProductQuantitySelector';
import ProductPurchaseFooter from './ProductPurchaseFooter';

const ProductCustomizationModal = ({
  product,
  isOpen,
  onClose,
  initialMode = 'cart',
}) => {
  const navigate = useNavigate();
  const [addToCartWithAnimation] = useAddToCartAnimation();

  // Configuration States
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState(false);

  const modalRef = useRef(null);

  // Initialize or reset state when product or isOpen changes
  useEffect(() => {
    if (isOpen && product) {
      // Default Variant
      if (product.variants && product.variants.length > 0) {
        const defaultVar =
          product.variants.find((v) => v.isDefault && v.isAvailable !== false) ||
          product.variants.find((v) => v.isAvailable !== false) ||
          product.variants[0];
        setSelectedVariant(defaultVar);
      } else {
        setSelectedVariant(null);
      }

      // Default Size
      if (product.sizes && product.sizes.length > 0) {
        const defaultSize =
          product.sizes.find((s) => s.isAvailable !== false) || product.sizes[0];
        setSelectedSize(defaultSize);
      } else {
        setSelectedSize(null);
      }

      setSelectedToppings([]);
      setQuantity(1);
      setNote('');
      setErrors({});
    }
  }, [isOpen, product]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Topping Toggle
  const handleToppingToggle = (topping) => {
    const toppingId = topping._id || topping.id || topping.name;
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => (t._id || t.id || t.name) === toppingId);
      if (exists) {
        return prev.filter((t) => (t._id || t.id || t.name) !== toppingId);
      }
      return [...prev, topping];
    });
  };

  // Realtime Price Computation
  const basePrice = Number(product?.price) || 0;
  const variantPrice = Number(selectedVariant?.price) || 0;
  const sizePrice = Number(selectedSize?.price) || 0;
  const toppingsTotal = selectedToppings.reduce(
    (sum, t) => sum + (Number(t.price) || 0),
    0
  );

  const unitPrice = basePrice + variantPrice + sizePrice + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      newErrors.variant = true;
    }

    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      newErrors.size = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to error section
      const errorElem = document.getElementById(
        newErrors.variant ? 'section-variant' : 'section-size'
      );
      if (errorElem) {
        errorElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  // Build Configured Item
  const buildConfiguredItem = () => {
    return {
      ...product,
      selectedVariant: selectedVariant
        ? { name: selectedVariant.name, price: variantPrice }
        : null,
      selectedSize: selectedSize
        ? { name: selectedSize.name, price: sizePrice }
        : null,
      selectedToppings: selectedToppings.map((t) => ({
        _id: t._id || t.id,
        name: t.name,
        price: Number(t.price) || 0,
      })),
      toppingsPrice: toppingsTotal,
      note: note.trim(),
      unitPrice,
      finalPrice: unitPrice,
      totalPrice,
    };
  };

  // Handle Add To Cart
  const handleAddToCart = (e) => {
    if (!validate()) return;

    const configuredItem = buildConfiguredItem();
    const btn = e?.currentTarget || document.querySelector('.add-to-cart-modal-btn');
    addToCartWithAnimation(configuredItem, quantity, btn);
    onClose();
  };

  // Handle Buy Now
  const handleBuyNow = () => {
    if (!validate()) return;

    const configuredItem = buildConfiguredItem();
    onClose();

    navigate('/checkout', {
      state: {
        buyNowItem: {
          food: configuredItem,
          quantity,
          itemKey: `buynow-${product._id}-${Date.now()}`,
        },
      },
    });
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl z-[110] animate-slide-in-right flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold text-sm">Đã thêm món vào giỏ hàng!</span>
        </div>
      )}

      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in-overlay"
        onClick={(e) => {
          if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
          }
        }}
      >
        {/* Modal / Bottom Sheet Window */}
        <div
          ref={modalRef}
          className="bg-white w-full sm:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[85vh] rounded-t-[24px] sm:rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-bottom-sheet sm:animate-modal-scale relative z-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customization-modal-title"
        >
          {/* Mobile Drag Indicator Bar */}
          <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {/* 1. Header Information */}
            <ProductHeader product={product} onClose={onClose} />

            {/* 2. Options Sections Container */}
            <div className="p-5 sm:p-7 space-y-5 bg-gray-50/40">
              {/* Variants Selector */}
              {product?.variants && product.variants.length > 0 && (
                <ProductVariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onChange={(v) => {
                    setSelectedVariant(v);
                    setErrors((prev) => ({ ...prev, variant: false }));
                  }}
                  required={true}
                  hasError={errors.variant}
                />
              )}

              {/* Sizes Selector */}
              {product?.sizes && product.sizes.length > 0 && (
                <ProductSizeSelector
                  sizes={product.sizes}
                  selectedSize={selectedSize}
                  onChange={(s) => {
                    setSelectedSize(s);
                    setErrors((prev) => ({ ...prev, size: false }));
                  }}
                  required={true}
                  hasError={errors.size}
                />
              )}

              {/* Toppings Selector */}
              {product?.toppings && product.toppings.length > 0 && (
                <ProductToppingSelector
                  toppings={product.toppings}
                  selectedToppings={selectedToppings}
                  onToggle={handleToppingToggle}
                />
              )}

              {/* Special Request */}
              <ProductSpecialRequest note={note} onChange={setNote} />

              {/* Quantity Selector */}
              <ProductQuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                maxStock={product?.stock}
              />
            </div>
          </div>

          {/* 3. Sticky Purchase Footer */}
          <ProductPurchaseFooter
            basePrice={basePrice}
            variantPrice={variantPrice}
            sizePrice={sizePrice}
            toppingsTotal={toppingsTotal}
            quantity={quantity}
            unitPrice={unitPrice}
            totalPrice={totalPrice}
            isAvailable={product?.isAvailable}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>
      </div>
    </>
  );
};

export default ProductCustomizationModal;
