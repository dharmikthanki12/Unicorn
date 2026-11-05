const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');
const ApiError = require('./utils/ApiError');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const packageRoutes = require('./routes/packageRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const referralRoutes = require('./routes/referralRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Trust reverse proxies (Vite dev proxy, Vercel, Nginx, cloud load balancers)
app.set('trust proxy', 1);

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., curl, Postman, same-origin Vercel SSR)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain automatically
    if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: origin not allowed: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiter (Protects against brute force and DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // High capacity
  skip: (req) => true, // Completely disable rate-limiting in development/local environments
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// 4. Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Health Check Endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'online',
    protocol: 'UNICORN Web3 Protocol',
    network: 'BNB Smart Chain (BEP-20)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 5.1 Ensure Database is connected before executing any API endpoint
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/health') return next();
  try {
    const { connectDB } = require('./config/database');
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection error: ' + err.message
    });
  }
});

// 6. Mount API Routes (Supports both /api/* and direct /* paths for all cloud rewrites)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/user', '/user'], userRoutes);
app.use(['/api/packages', '/packages'], packageRoutes);
app.use(['/api/investments', '/investments'], investmentRoutes);
app.use(['/api/invest', '/invest'], investmentRoutes);
app.use(['/api/wallet', '/wallet'], walletRoutes);
app.use(['/api/wallets', '/wallets'], walletRoutes);
app.use(['/api/deposit', '/deposit'], depositRoutes);
app.use(['/api/deposits', '/deposits'], depositRoutes);
app.use(['/api/withdrawal', '/withdrawal'], withdrawalRoutes);
app.use(['/api/withdrawals', '/withdrawals'], withdrawalRoutes);
app.use(['/api/referrals', '/referrals'], referralRoutes);
app.use(['/api/referral', '/referral'], referralRoutes);
app.use(['/api/rewards', '/rewards'], rewardRoutes);
app.use(['/api/transactions', '/transactions'], transactionRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);

// 7. Handle Unmatched Routes
app.use((req, res, next) => {
  next(new ApiError(404, `API route not found: ${req.method} ${req.originalUrl}`));
});

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;

