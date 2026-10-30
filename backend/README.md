# 🦄 UNICORN Web3 Investment, Referral & Rewards Protocol — Backend

Enterprise-grade Node.js/Express backend powering the UNICORN Web3 decentralized investment, multi-level referral network, and reward distribution platform.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (Modular MVC architecture)
- **Database**: MongoDB with Mongoose (Dual Wallets with compound indexes)
- **Authentication**: JWT access tokens + rotating refresh tokens + bcrypt password hashing
- **Security & 2FA**: TOTP 2FA (`otplib`) required strictly at withdrawal, Helmet security headers, CORS origin protection, rate limiting
- **Blockchain**: BNB Smart Chain (BEP-20) via `ethers.js` (Chain ID 97 Testnet & 56 Mainnet)
- **Tokens**: Unicorn UNC Token (100M supply) & USDT (BEP-20)
- **Ledger**: Double-entry immutable financial ledger with idempotency keys
- **Background Jobs**: Automated daily 0.45% ROI distribution, referral commissions, rank rewards, achiever trip qualifications, and deposit confirmations

---

## 📂 Architecture & Directory Structure

```
backend/
├── config/
│   └── database.js               # MongoDB connection manager with resilient offline fallback
├── controllers/
│   ├── adminController.js         # Role-based admin console endpoints
│   ├── authController.js          # Auth, JWT refresh rotation, Web3 nonce & signatures
│   ├── dashboardController.js     # User dashboard metrics & live statistics
│   ├── depositController.js       # INR & on-chain USDT deposit handling
│   ├── investmentController.js    # Package activation and yield management
│   ├── packageController.js       # Tier 1-7 package catalog
│   ├── referralController.js      # Referral team downline & multi-level tree
│   ├── rewardController.js        # Rank rewards & Achiever trip milestone tracking
│   ├── transactionController.js   # Immutable ledger transactions
│   ├── userController.js          # Profile, password, and wallet management
│   ├── walletController.js        # Balances, internal transfers, and summary
│   └── withdrawalController.js    # TOTP 2FA verification & withdrawal processing
├── docs/
│   └── openapi.json               # OpenAPI 3.0 API Specification
├── jobs/
│   ├── index.js                   # Master scheduler for background cron jobs
│   ├── roiJob.js                  # Idempotent 0.45% Daily ROI distribution (Mon-Fri)
│   ├── rankJob.js                 # Automatic Rank Reward bonus qualification engine
│   ├── achieverJob.js             # 4-Month Achiever Trip qualification engine
│   ├── depositConfirmJob.js       # BSC on-chain deposit confirmation scanner
│   └── withdrawalReconciliationJob.js # Withdrawal status auditor
├── middleware/
│   ├── adminMiddleware.js        # Strict role-based access control (Admin / Super Admin)
│   ├── authMiddleware.js         # JWT verification & request context hydration
│   ├── errorMiddleware.js        # Centralized ApiError handler
│   └── validationMiddleware.js   # Express-validator schema enforcement
├── models/
│   ├── index.js                  # Unified export of all 12 platform models
│   ├── User.js                   # User identity, KYC status, Web3 address, TOTP secret
│   ├── InvestmentPackage.js      # Package definition (alias of Package.js)
│   ├── UserInvestment.js         # Active stakes and yield tracking (alias of Investment.js)
│   ├── Wallet.js                 # MAIN & REFERRAL dual wallet records with unique index
│   ├── WalletTransaction.js      # Immutable double-entry ledger (alias of Transaction.js)
│   ├── DepositRequest.js         # Deposit records with on-chain txHash (alias of Deposit.js)
│   ├── WithdrawalRequest.js      # Payout requests with TOTP verification (alias of Withdrawal.js)
│   ├── ReferralIncome.js         # Level 1-25+ ROI-on-ROI commission distribution logs
│   ├── RankReward.js             # One-time team volume milestone rewards (alias of Reward.js)
│   ├── AchieverBonus.js          # 4-month direct business luxury trips
│   ├── PlatformSettings.js       # Configurable repository for all business rules
│   └── AuditLog.js               # Immutable administrative audit trail
├── routes/                       # Express router modules
├── scripts/
│   └── seed.js                   # Database seeding script (Admin, 7 Packages, Settings)
├── services/
│   ├── blockchainService.js      # ethers.js BSC RPC & BEP-20 verification
│   ├── emailService.js           # Nodemailer transactional emails
│   ├── ledgerService.js          # Double-entry ledger with balance reservation
│   ├── referralService.js        # Multi-level referral ROI-on-ROI calculation engine
│   └── rewardService.js          # Team volume aggregation & trip eligibility logic
├── test/
│   └── suite.test.js             # Comprehensive unit & integration test suite (65 tests)
├── utils/
│   ├── ApiError.js               # Structured HTTP operational error class
│   └── generateToken.js          # Access & refresh token generation
├── app.js                        # Express application instance with security middleware
├── package.json
└── server.js                     # HTTP server entry point
```

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in `backend/` (or use the root `.env`):

```ini
PORT=5000
NODE_ENV=development

# Database Configuration (MongoDB Atlas URI)
MONGODB_URI=mongodb+srv://zarwebcoders:zarwebcoders@cluster0.lqgakzj.mongodb.net/unicorn?retryWrites=true&w=majority

# Security & Authentication
JWT_SECRET=unicorn_super_secret_jwt_key_2026_finance_bep20
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=unicorn_super_secret_jwt_key_2026_finance_bep20_refresh
JWT_REFRESH_EXPIRES_IN=30d

# Blockchain (BNB Smart Chain BEP-20)
BLOCKCHAIN_NETWORK=bsc_testnet
CHAIN_ID=97
RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
UNC_TOKEN_ADDRESS=0x82f9A1498C71e84C21a50B2026BEP20UNC
USDT_BEP20_ADDRESS=0x337610d27c682E347C9cD60BE4B3b107C9d34dDd

# Financial Rules
FIXED_USD_INR_RATE=100
DAILY_ROI_RATE=0.0045
WEEKEND_PAUSE_ENABLED=true
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Initial Platform Data
Seeds Super Admin (`admin@unicorn.vip`), Demo User (`demo@unicorn.vip`), 7 Investment Packages, and `PlatformSettings`:
```bash
npm run seed
```

### 3. Run the Comprehensive Test Suite
Executes all 65 automated tests verifying data models, Web3 signatures, token rotation, ROI math, referral levels, rank rewards, achiever trips, and TOTP 2FA:
```bash
npm run test:backend
```

### 4. Start the Backend Server
```bash
npm run backend
```
The server will start on `http://localhost:5000`. Health check is available at `http://localhost:5000/api/health`.

---

## 💎 Investment Packages Catalog

Reference conversion: **$1 = ₹100**

| Tier | Package | Investment (INR) | Reference (USD) | Daily ROI (0.45%) | Monthly Yield (22 Days) | Bonus UNC Tokens |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | Starter | ₹10,000 | $100 | ₹45 | ₹990 | 1,000 UNC |
| 2 | Basic Growth | ₹50,000 | $500 | ₹225 | ₹4,950 | 5,000 UNC |
| 3 | Pro Trader | ₹2,50,000 | $2,500 | ₹1,125 | ₹24,750 | 25,000 UNC |
| 4 | Premium Wealth | ₹5,00,000 | $5,000 | ₹2,250 | ₹49,500 | 50,000 UNC |
| 5 | Elite Portfolio | ₹10,00,000 | $10,000 | ₹4,500 | ₹99,000 | 100,000 UNC |
| 6 | Platinum Staking | ₹25,00,000 | $25,000 | ₹11,250 | ₹2,47,500 | 250,000 UNC |
| 7 | VIP Unicorn | ₹50,00,000 | $50,000 | ₹22,500 | ₹4,95,000 | 500,000 UNC |

---

## 📈 Multi-Level Referral Distribution (ROI on ROI)

Commissions are paid as a percentage of downline **daily ROI earnings**, not investment principal:

| Level | Rate | Min. Active Direct Referrals |
|:---|:---:|:---:|
| Level 1 | **5%** | 2 |
| Levels 2–5 | **2%** | 4 |
| Levels 6–10 | **1%** | 7 |
| Levels 11–25 | **0.25%** | 12 |
| Level 26+ | **0.125%** | 15 |

---

## 🏆 Rank Rewards & Achiever Trip Milestones

### One-Time Rank Rewards
- **₹2,50,000 Business**: ₹5,000 Bonus (Bronze Leader)
- **₹5,00,000 Business**: ₹11,000 Bonus (Silver Star)
- **₹10,00,000 Business**: ₹20,000 Bonus (Gold Executive)
- **₹25,00,000 Business**: ₹45,000 Bonus (Diamond Director)
- **₹50,00,000 Business**: ₹1,00,000 Bonus (Crown Ambassador)
- **₹1,00,00,000 Business**: 3% Bonus (₹3,00,000) (Unicorn Legend)

### 4-Month Achiever Trips (Direct-Referred Business)
- **₹5,00,000**: Goa Trip
- **₹15,00,000**: Andaman Trip
- **₹30,00,000**: Thailand Trip
- **₹50,00,000**: Dubai Trip
- **₹1,00,00,000**: Europe Trip

---

## 🔐 Security & Withdrawal TOTP Flow

1. **Dual Wallets**: Separate `MAIN` and `REFERRAL` wallet records prevent balance intermixing.
2. **Idempotent Financial Ledger**: Every credit, debit, and transfer creates an indexed ledger record preventing duplicate processing.
3. **Withdrawal 2FA**:
   - 2FA is **strictly required only at withdrawal**.
   - User generates/receives a 6-digit TOTP code via `POST /api/withdrawals/verify-2fa`.
   - Funds are atomically moved to `reservedWithdrawal` until approved by compliance or blockchain payout confirms.
   - Rejection atomically releases reserved balance back to withdrawable funds.

