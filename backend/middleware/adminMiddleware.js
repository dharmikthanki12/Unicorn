const ApiError = require('../utils/ApiError');

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden. Administrator privileges required.'));
  }
  next();
};

module.exports = {
  adminOnly
};
