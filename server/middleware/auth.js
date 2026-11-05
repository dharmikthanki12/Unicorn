const jwt = require('jsonwebtoken');
const { DB } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'unicorn_super_secret_web3_key_2026';

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await DB.users.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session expired or not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

module.exports = {
  JWT_SECRET,
  authenticateUser,
  requireAdmin
};

