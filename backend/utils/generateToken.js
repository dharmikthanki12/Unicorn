const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role = 'user') => {
  const secret = process.env.JWT_SECRET || 'unicorn_super_secret_web3_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, role }, secret, { expiresIn });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'unicorn_super_secret') + '_refresh';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

const generateToken = generateAccessToken;
generateToken.generateAccessToken = generateAccessToken;
generateToken.generateRefreshToken = generateRefreshToken;

module.exports = generateToken;
