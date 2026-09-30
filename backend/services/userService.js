const User = require('../models/User');
const Order = require('../models/Order');
const { USER_ROLE } = require('../constants/userRole');

/**
 * Lấy danh sách users với filter/sort/pagination (Admin)
 */
const getAllUsers = async ({ role, search, page = 1, limit = 20, sort = 'newest' }) => {
  const query = {};

  if (role && role !== 'all') query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [users, total, totalAllUsers, totalCustomers, totalAdmins] = await Promise.all([
    User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query),
    User.countDocuments(),
    User.countDocuments({ role: USER_ROLE.CUSTOMER }),
    User.countDocuments({ role: USER_ROLE.ADMIN }),
  ]);

  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [orderCount, totalSpentResult] = await Promise.all([
        Order.countDocuments({ user: user._id }),
        Order.aggregate([
          { $match: { user: user._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
      ]);
      return { ...user.toObject(), orderCount, totalSpent: totalSpentResult[0]?.total || 0 };
    })
  );

  return {
    users: usersWithStats,
    stats: { totalAllUsers, totalCustomers, totalAdmins },
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

/**
 * Lấy chi tiết 1 user kèm order stats (Admin)
 */
const getUserById = async (id) => {
  const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires');
  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }

  const [orders, orderStats, totalOrders, totalSpentResult] = await Promise.all([
    Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id totalPrice status paymentMethod createdAt items'),
    Order.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ user: user._id }),
    Order.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);

  return {
    user,
    statistics: { totalOrders, totalSpent: totalSpentResult[0]?.total || 0, orderStats },
    recentOrders: orders,
  };
};

/**
 * Tạo user mới (Admin)
 */
const createUser = async ({ name, email, password, phone, address, role, gender }) => {
  const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
  if (emailExists) {
    const err = new Error('Email này đã được sử dụng bởi người dùng khác');
    err.statusCode = 400;
    throw err;
  }

  const userRole = role && [USER_ROLE.CUSTOMER, USER_ROLE.ADMIN].includes(role) ? role : USER_ROLE.CUSTOMER;

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: (phone || '').trim(),
    address: (address || '').trim(),
    role: userRole,
    gender: gender || 'male',
  });

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Cập nhật user (Admin)
 */
const updateUser = async (id, { name, email, phone, address, role, gender, password }) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      const err = new Error('Email đã tồn tại');
      err.statusCode = 400;
      throw err;
    }
    user.email = email.toLowerCase().trim();
  }

  if (role) {
    if (![USER_ROLE.CUSTOMER, USER_ROLE.ADMIN].includes(role)) {
      const err = new Error('Vai trò không hợp lệ. Phải là "customer" hoặc "admin"');
      err.statusCode = 400;
      throw err;
    }
    user.role = role;
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();
  if (gender) user.gender = gender;
  if (password && password.trim().length >= 6) user.password = password.trim();

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Xóa user (Admin)
 */
const deleteUser = async (id, requestingUserId) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }

  if (user._id.toString() === requestingUserId.toString()) {
    const err = new Error('Bạn không thể xóa tài khoản của chính mình');
    err.statusCode = 400;
    throw err;
  }

  const orderCount = await Order.countDocuments({ user: user._id });
  if (orderCount > 0) {
    const err = new Error(`Không thể xóa người dùng có ${orderCount} đơn hàng để bảo toàn lịch sử dữ liệu.`);
    err.statusCode = 400;
    throw err;
  }

  await user.deleteOne();
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
