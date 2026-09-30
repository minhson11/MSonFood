const authService = require('../services/authService');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} = require('../validators/authValidator');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { name, email, password, phone } = req.body;
    const data = await authService.register({ name, email, password, phone });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { email, password } = req.body;
    const data = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar, gender, birthday, location } = req.body;
    const user = await authService.updateProfile(req.user._id, {
      name, phone, address, avatar, gender, birthday, location,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const validation = validateChangePassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, { currentPassword, newPassword });

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const validation = validateForgotPassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const successMessage =
      'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu';

    const clientUrl = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')[0].trim()
      : 'http://localhost:5173';

    await authService.forgotPassword(req.body.email, clientUrl);

    res.status(200).json({ success: true, message: successMessage });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const validation = validateResetPassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { token, newPassword } = req.body;
    await authService.resetPassword({ token, newPassword });

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
