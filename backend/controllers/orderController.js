const mongoose = require('mongoose');
const Order = require('../models/Order');
const Food = require('../models/Food');
const Coupon = require('../models/Coupon');
const Topping = require('../models/Topping');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách món ăn'
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng (họ tên, số điện thoại, địa chỉ)'
      });
    }

    // Process order items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Validate item structure
      if (!item.food || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi món ăn phải có ID và số lượng'
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng phải lớn hơn 0'
        });
      }

      // 1. Get food from database
      const food = await Food.findById(item.food);

      // 2. Check if food exists
      if (!food) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy món ăn với ID ${item.food}`
        });
      }

      // 3. Check if food is available
      if (!food.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${food.name} hiện không khả dụng`
        });
      }

      // 4. Check stock
      if (food.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Không đủ hàng cho ${food.name}. Còn lại: ${food.stock}`
        });
      }

      // 5. Get current price from database
      const basePrice = food.price;
      let variantPrice = 0;
      let validSelectedVariant = null;
      let sizePrice = 0;
      let validSelectedSize = null;
      let toppingsPrice = 0;
      let validSelectedToppings = [];

      // Validate & compute Variant price from DB if provided
      if (item.selectedVariant) {
        const variantName = typeof item.selectedVariant === 'string' 
          ? item.selectedVariant 
          : item.selectedVariant.name;
        
        let foundInDb = false;
        if (food.variants && food.variants.length > 0) {
          const dbVariant = food.variants.find(v => v.name === variantName);
          if (dbVariant) {
            foundInDb = true;
            if (!dbVariant.isAvailable) {
              return res.status(400).json({
                success: false,
                message: `Lựa chọn "${dbVariant.name}" của món ${food.name} hiện đã hết hàng`
              });
            }
            variantPrice = Number(dbVariant.price) || 0;
            validSelectedVariant = {
              name: dbVariant.name,
              price: variantPrice
            };
          }
        }
        if (!foundInDb && typeof item.selectedVariant === 'object') {
          variantPrice = Number(item.selectedVariant.price) || 0;
          validSelectedVariant = {
            name: item.selectedVariant.name || variantName,
            price: variantPrice
          };
        }
      }

      // Validate & compute Size price from DB if provided
      if (item.selectedSize) {
        const sizeName = typeof item.selectedSize === 'string'
          ? item.selectedSize
          : item.selectedSize.name;

        let foundInDb = false;
        if (food.sizes && food.sizes.length > 0) {
          const dbSize = food.sizes.find(s => s.name === sizeName);
          if (dbSize) {
            foundInDb = true;
            if (!dbSize.isAvailable) {
              return res.status(400).json({
                success: false,
                message: `Kích thước "${dbSize.name}" của món ${food.name} hiện đã hết hàng`
              });
            }
            sizePrice = Number(dbSize.price) || 0;
            validSelectedSize = {
              name: dbSize.name,
              price: sizePrice
            };
          }
        }
        if (!foundInDb && typeof item.selectedSize === 'object') {
          sizePrice = Number(item.selectedSize.price) || 0;
          validSelectedSize = {
            name: item.selectedSize.name || sizeName,
            price: sizePrice
          };
        }
      }

      // Validate & compute Toppings price from DB if provided
      if (item.selectedToppings && Array.isArray(item.selectedToppings) && item.selectedToppings.length > 0) {
        const validMongoIds = item.selectedToppings
          .map(t => t._id || t.id)
          .filter(id => id && mongoose.Types.ObjectId.isValid(id));
        
        let dbToppings = [];
        if (validMongoIds.length > 0) {
          dbToppings = await Topping.find({ _id: { $in: validMongoIds } });
        }

        for (const topItem of item.selectedToppings) {
          const topId = (topItem._id || topItem.id)?.toString();
          const dbMatch = dbToppings.find(t => t._id.toString() === topId);
          if (dbMatch) {
            if (dbMatch.isActive !== false) {
              const price = Number(dbMatch.price) || 0;
              toppingsPrice += price;
              validSelectedToppings.push({
                _id: dbMatch._id,
                name: dbMatch.name,
                price
              });
            }
          } else {
            const price = Number(topItem.price) || 0;
            toppingsPrice += price;
            validSelectedToppings.push({
              name: topItem.name,
              price
            });
          }
        }
      }

      const itemUnitPrice = basePrice + variantPrice + sizePrice + toppingsPrice;

      // 6. Calculate item subtotal
      const itemSubtotal = itemUnitPrice * item.quantity;

      // Add to processed items
      processedItems.push({
        food: food._id,
        name: food.name,
        price: itemUnitPrice,
        basePrice: basePrice,
        selectedVariant: validSelectedVariant,
        selectedSize: validSelectedSize,
        selectedToppings: validSelectedToppings,
        toppingsPrice: toppingsPrice,
        note: (item.note || '').slice(0, 200),
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      // Add to order subtotal
      subtotal += itemSubtotal;
    }

    // 7. Calculate shipping fee
    let shippingFee = 15000;
    if (req.body.shippingFee !== undefined && Number(req.body.shippingFee) >= 0) {
      shippingFee = Number(req.body.shippingFee);
    }

    // 8. Check and apply coupon if provided
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mã giảm giá'
        });
      }

      // Validate coupon
      if (!coupon.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không hoạt động'
        });
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã hết hạn hoặc chưa có hiệu lực'
        });
      }

      if (coupon.quantity <= coupon.usedCount) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã hết lượt sử dụng'
        });
      }

      if (subtotal < coupon.minOrderValue) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng phải đạt tối thiểu ${coupon.minOrderValue}đ để sử dụng mã này`
        });
      }

      // 9. Calculate discount
      if (coupon.discountType === 'percent') {
        discount = Math.floor((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
      }

      // Discount cannot exceed subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }

      appliedCoupon = coupon._id;

      // Increment coupon usage
      coupon.usedCount += 1;
      await coupon.save();
    }

    // 10. Calculate total price
    const totalPrice = subtotal + shippingFee - discount;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: processedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        note: shippingAddress.note || ''
      },
      paymentMethod: paymentMethod || 'COD',
      subtotal,
      shippingFee,
      distanceKm: Number(req.body.distanceKm) || 0,
      discount,
      totalPrice,
      coupon: appliedCoupon,
      status: 'pending'
    });

    // 11. Deduct stock from foods and increment soldCount
    for (const item of processedItems) {
      await Food.findByIdAndUpdate(item.food, {
        $inc: { stock: -item.quantity, soldCount: item.quantity }
      });
    }

    // Populate order
    await order.populate('items.food', 'name image');
    await order.populate('user', 'name email phone');
    if (appliedCoupon) {
      await order.populate('coupon', 'code discountType discountValue');
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.food', 'name image')
      .populate('coupon', 'code discountType discountValue')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.food', 'name image category')
      .populate('user', 'name email phone')
      .populate('coupon', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // User can only view their own orders (unless admin)
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // User can only cancel their own orders
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này'
      });
    }

    // Can only cancel orders in pending or confirmed status
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng ở trạng thái ${order.status}`
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Food.findByIdAndUpdate(item.food, {
        $inc: { stock: item.quantity }
      });
    }

    // Restore coupon usage if coupon was used
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon, {
        $inc: { usedCount: -1 }
      });
    }

    // Restore stock and decrement soldCount
    for (const item of order.items) {
      if (item.food) {
        await Food.findByIdAndUpdate(item.food, {
          $inc: { stock: item.quantity, soldCount: -item.quantity }
        });
      }
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.food', 'name image')
      .populate('coupon', 'code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Validate status flow
    const statusFlow = {
      pending: ['confirmed', 'preparing', 'shipping', 'completed', 'cancelled'],
      confirmed: ['pending', 'preparing', 'shipping', 'completed', 'cancelled'],
      preparing: ['confirmed', 'shipping', 'completed', 'cancelled'],
      shipping: ['preparing', 'completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (statusFlow[order.status] && statusFlow[order.status].length > 0 && !statusFlow[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể thay đổi trạng thái từ ${order.status} sang ${status}. Các trạng thái hợp lệ: ${statusFlow[order.status].join(', ')}`
      });
    }

    // If admin cancels order, restore stock and coupon
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Food.findByIdAndUpdate(item.food, {
          $inc: { stock: item.quantity, soldCount: -item.quantity }
        });
      }

      if (order.coupon) {
        await Coupon.findByIdAndUpdate(order.coupon, {
          $inc: { usedCount: -1 }
        });
      }
    }

    // Update status
    order.status = status;
    await order.save();

    await order.populate('user', 'name email phone');
    await order.populate('items.food', 'name image');

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng thành ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
