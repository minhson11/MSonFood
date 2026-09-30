const mongoose = require('mongoose');
const Topping = require('../models/Topping');

/**
 * Tính giá 1 item dựa vào basePrice + variant + size + toppings
 * Logic chiết xuất từ orderController.createOrder
 *
 * @param {Object} food   - Food document từ MongoDB
 * @param {Object} item   - Item từ request body { selectedVariant, selectedSize, selectedToppings }
 * @returns {Object} { variantPrice, sizePrice, toppingsPrice, unitPrice, validSelectedVariant, validSelectedSize, validSelectedToppings }
 */
const computeItemPricing = async (food, item) => {
  const basePrice = food.price;
  let variantPrice = 0;
  let validSelectedVariant = null;
  let sizePrice = 0;
  let validSelectedSize = null;
  let toppingsPrice = 0;
  let validSelectedToppings = [];

  // --- Variant ---
  if (item.selectedVariant) {
    const variantName =
      typeof item.selectedVariant === 'string'
        ? item.selectedVariant
        : item.selectedVariant.name;

    let foundInDb = false;
    if (food.variants && food.variants.length > 0) {
      const dbVariant = food.variants.find((v) => v.name === variantName);
      if (dbVariant) {
        foundInDb = true;
        if (!dbVariant.isAvailable) {
          const err = new Error(
            `Lựa chọn "${dbVariant.name}" của món ${food.name} hiện đã hết hàng`
          );
          err.statusCode = 400;
          throw err;
        }
        variantPrice = Number(dbVariant.price) || 0;
        validSelectedVariant = { name: dbVariant.name, price: variantPrice };
      }
    }
    if (!foundInDb && typeof item.selectedVariant === 'object') {
      variantPrice = Number(item.selectedVariant.price) || 0;
      validSelectedVariant = {
        name: item.selectedVariant.name || variantName,
        price: variantPrice,
      };
    }
  }

  // --- Size ---
  if (item.selectedSize) {
    const sizeName =
      typeof item.selectedSize === 'string'
        ? item.selectedSize
        : item.selectedSize.name;

    let foundInDb = false;
    if (food.sizes && food.sizes.length > 0) {
      const dbSize = food.sizes.find((s) => s.name === sizeName);
      if (dbSize) {
        foundInDb = true;
        if (!dbSize.isAvailable) {
          const err = new Error(
            `Kích thước "${dbSize.name}" của món ${food.name} hiện đã hết hàng`
          );
          err.statusCode = 400;
          throw err;
        }
        sizePrice = Number(dbSize.price) || 0;
        validSelectedSize = { name: dbSize.name, price: sizePrice };
      }
    }
    if (!foundInDb && typeof item.selectedSize === 'object') {
      sizePrice = Number(item.selectedSize.price) || 0;
      validSelectedSize = {
        name: item.selectedSize.name || sizeName,
        price: sizePrice,
      };
    }
  }

  // --- Toppings ---
  if (
    item.selectedToppings &&
    Array.isArray(item.selectedToppings) &&
    item.selectedToppings.length > 0
  ) {
    const validMongoIds = item.selectedToppings
      .map((t) => t._id || t.id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    let dbToppings = [];
    if (validMongoIds.length > 0) {
      dbToppings = await Topping.find({ _id: { $in: validMongoIds } });
    }

    for (const topItem of item.selectedToppings) {
      const topId = (topItem._id || topItem.id)?.toString();
      const dbMatch = dbToppings.find((t) => t._id.toString() === topId);
      if (dbMatch) {
        if (dbMatch.isActive !== false) {
          const price = Number(dbMatch.price) || 0;
          toppingsPrice += price;
          validSelectedToppings.push({ _id: dbMatch._id, name: dbMatch.name, price });
        }
      } else {
        const price = Number(topItem.price) || 0;
        toppingsPrice += price;
        validSelectedToppings.push({ name: topItem.name, price });
      }
    }
  }

  const unitPrice = basePrice + variantPrice + sizePrice + toppingsPrice;

  return {
    variantPrice,
    sizePrice,
    toppingsPrice,
    unitPrice,
    validSelectedVariant,
    validSelectedSize,
    validSelectedToppings,
  };
};

/**
 * Tính discount từ coupon dựa vào subtotal
 *
 * @param {Object} coupon   - Coupon document
 * @param {Number} subtotal - Tổng tiền hàng (chưa tính ship, chưa giảm giá)
 * @returns {Number} discount
 */
const computeDiscount = (coupon, subtotal) => {
  let discount = 0;

  if (coupon.discountType === 'percent') {
    discount = Math.floor((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discount = coupon.discountValue;
  }

  // Discount không được vượt subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return discount;
};

/**
 * Tính tổng đơn hàng
 *
 * @param {Number} subtotal
 * @param {Number} shippingFee
 * @param {Number} discount
 * @returns {Number} totalPrice
 */
const computeTotal = (subtotal, shippingFee, discount) => {
  return subtotal + shippingFee - discount;
};

module.exports = { computeItemPricing, computeDiscount, computeTotal };
