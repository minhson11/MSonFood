const userService = require('../services/userService');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page, limit, sort } = req.query;
    const result = await userService.getAllUsers({ role, search, page, limit, sort });

    res.status(200).json({
      success: true,
      count: result.users.length,
      data: result.users,
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Create new user (Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản người dùng thành công',
      data: user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
