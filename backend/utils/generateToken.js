const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'user') => {
  const secret = process.env.JWT_SECRET || 'unicorn_super_secret_web3_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ userId, role }, secret, { expiresIn });
};

module.exports = generateToken;
