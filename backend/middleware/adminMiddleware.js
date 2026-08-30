const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Truy cập bị từ chối. Chỉ dành cho quản trị viên.'
    });
  }
};

module.exports = adminMiddleware;
