// Role-based access control middleware

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires ${roles.join(' or ')} role.`
      });
    }

    next();
  };
};

// Check if user is authenticated (any role)
const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to access this resource'
    });
  }
  next();
};

// Check if user is a doctor and approved
const isApprovedDoctor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (req.user.role === 'doctor') {
    // Doctor status check will be done in controller after populating doctor data
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Doctor role required.'
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  next();
};

// Check if user is user (patient)
const isUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User role required.'
    });
  }

  next();
};

module.exports = {
  restrictTo,
  isAuthenticated,
  isApprovedDoctor,
  isAdmin,
  isUser
};
