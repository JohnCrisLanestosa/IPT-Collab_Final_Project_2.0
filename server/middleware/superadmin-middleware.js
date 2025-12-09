// Middleware to check if user is a superadmin
const checkSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super Admin privileges required.",
    });
  }
};

// Middleware to check if user is admin or superadmin
const checkAdminOrSuperAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};

module.exports = { checkSuperAdmin, checkAdminOrSuperAdmin };

