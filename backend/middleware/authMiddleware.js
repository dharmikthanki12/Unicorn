const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError(401, 'Authentication token required. Please log in.'));
    }

    const secret = process.env.JWT_SECRET || 'unicorn_super_secret_web3_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new ApiError(401, 'User associated with this token no longer exists.'));
    }

    if (user.status === 'suspended') {
      return next(new ApiError(403, 'Account is suspended. Contact compliance support.'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid authentication token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Authentication token has expired. Please log in again.'));
    }
    next(error);
  }
};

module.exports = {
  protect
};

