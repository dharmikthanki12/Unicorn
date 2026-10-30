# Unicorn - Web3 Investment, Referral & Rewards Platform

A full-stack, enterprise-grade **Web3 Investment Platform & DApp** built with **React (JSX)**, **Node.js / Express**, **MongoDB / Mongoose**, and **Solidity BEP-20 Smart Contract**.

---

## 🚀 Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance DApp & Web responsive UI (Desktop + Mobile) |
| **Backend** | Node.js, Express | RESTful API, JWT Auth, Multi-level Referral & ROI distribution engine |
| **Database** | MongoDB / Mongoose | Scalable document DB with resilient local persistence fallback |
| **Smart Contract**| Solidity (^0.8.20) | BEP-20 Unicorn Token (UNC) with 100,000,000 UNC Total Supply |
| **Styling** | Custom CSS variables | Responsive glassmorphism tokens, Space Grotesk tabular figures |

---

## 🌟 Business Logic Implementation (PDF Requirements Summary)

### 1. Investment Packages (Section 2)
Reference conversion: **$1 USD = ₹100 INR**
* **Starter Package**: ₹10,000 ($100) — Daily ROI: ₹45 (0.45%), +1,000 UNC Tokens
* **Basic Growth**: ₹50,000 ($500) — Daily ROI: ₹225 (0.45%), +5,000 UNC Tokens
* **Pro Trader**: ₹2,50,000 ($2,500) — Daily ROI: ₹1,125 (0.45%), +25,000 UNC Tokens
* **Premium Wealth**: ₹5,00,000 ($5,000) — Daily ROI: ₹2,250 (0.45%), +50,000 UNC Tokens
* **Elite Portfolio**: ₹10,00,000 ($10,000) — Daily ROI: ₹4,500 (0.45%), +100,000 UNC Tokens
* **Platinum Staking**: ₹25,00,000 ($25,000) — Daily ROI: ₹11,250 (0.45%), +250,000 UNC Tokens
* **VIP Unicorn**: ₹50,00,000 ($50,000) — Daily ROI: ₹22,500 (0.45%), +500,000 UNC Tokens

### 2. ROI & Referral Income (ROI on ROI, Section 3)
* **Daily ROI**: 0.45% of active package amount.
* **Referral Income**: Calculated strictly as a percentage of the downline's **ROI amount** (ROI on ROI), NOT principal:
  * **Level 1**: 5% (Requires min 2 direct referrals)
  * **Levels 2–5**: 2% (Requires min 4 direct referrals)
  * **Levels 6–10**: 1% (Requires min 7 direct referrals)
  * **Levels 11–25**: 0.25% (Requires min 12 direct referrals)
  * **Level 25+**: 0.125% (Requires min 15 direct referrals)

### 3. Rank Reward Bonus (One-Time, Section 4)
Based on cumulative volume (personal investment + team business):
* ₹2,50,000 Target $\rightarrow$ **₹5,000 Bonus**
* ₹5,00,000 Target $\rightarrow$ **₹11,000 Bonus**
* ₹10,00,000 Target $\rightarrow$ **₹20,000 Bonus**
* ₹25,00,000 Target $\rightarrow$ **₹45,000 Bonus**
* ₹50,00,000 Target $\rightarrow$ **₹1,00,000 Bonus**
* ₹1,00,00,000 Target $\rightarrow$ **3% Bonus (₹3,00,000)**

### 4. Achiever Bonus Trips (Section 5)
Direct-referred business achieved within 4 months:
* ₹5,00,000 $\rightarrow$ **Goa Trip**
* ₹15,00,000 $\rightarrow$ **Andaman Trip**
* ₹30,00,000 $\rightarrow$ **Thailand Trip**
* ₹50,00,000 $\rightarrow$ **Dubai Trip**
* ₹1,00,00,000 $\rightarrow$ **Europe Trip**

### 5. Wallets, Security & 2FA (Section 6)
* **Wallets**: Main Deposit Wallet, Daily ROI Wallet, Referral Wallet.
* **Two-Factor Authentication (2FA)**: Required strictly at withdrawal with 6-digit OTP verification.
* **Forgot Password**: Password reset with verification code through registered email.
* **Web3 Integration**: Connect MetaMask / Trust Wallet (BEP-20 address).

### 6. Smart Contract (Section 7)
* Located at: `contracts/UnicornToken.sol`
* Token: Unicorn (UNC), BEP-20
* Total Supply: 100,000,000 UNC (100M)
* Decimals: 18

---

## 🛠️ How to Run Locally

### 1. Start the Backend API Server
```powershell
# In terminal 1:
npm run server
```
* Server runs on `http://localhost:5000`
* Automatically connects to MongoDB (or uses local embedded persistence if MongoDB is not running locally).
* Pre-seeds initial admin (`admin@unicorn.io` / `admin123`) and member (`dharmik@unicorn.io` / `user123`).

### 2. Start the Frontend Website
```powershell
# In terminal 2:
npm run dev
```
* Frontend runs on `http://localhost:5173`
* Opens responsive desktop & mobile interface.

---

## 📡 Backend API Endpoints

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Create account with sponsor referral code
* `POST /api/auth/login` - Authenticate & return JWT
* `GET /api/auth/profile` - Fetch current user profile & balances
* `POST /api/auth/forgot-password` - Request password recovery OTP
* `POST /api/auth/reset-password` - Reset password using OTP
* `POST /api/auth/web3-wallet` - Link BEP-20 wallet address

### Wallets & Transactions (`/api/wallet`)
* `GET /api/wallet/data` - Balances and ledger transactions
* `POST /api/wallet/deposit` - Submit deposit with UPI UTR or BEP-20 TxHash
* `POST /api/wallet/withdraw/request-2fa` - Generate withdrawal 2FA OTP
* `POST /api/wallet/withdraw` - Submit withdrawal with 2FA verification
* `POST /api/wallet/transfer` - Transfer ROI/Referral balance to Main Wallet

### Investment (`/api/invest`)
* `GET /api/invest/packages` - List 7 official investment packages
* `POST /api/invest/invest` - Activate package from Main Wallet balance
* `GET /api/invest/my-investments` - Active user packages

### Referral Network (`/api/referral`)
* `GET /api/referral/overview` - Directs list, volume, Rank Rewards, and Achiever Trips countdown

### Admin Console (`/api/admin`)
* `GET /api/admin/metrics` - Total TVL, deposits, withdrawals, pending requests
* `GET /api/admin/users` - All registered members & balances
* `GET /api/admin/deposits` - Pending deposit requests
* `POST /api/admin/deposits/:id/approve` - Approve & credit deposit
* `POST /api/admin/deposits/:id/reject` - Reject deposit
* `GET /api/admin/withdrawals` - Pending withdrawal tickets
* `POST /api/admin/withdrawals/:id/approve` - Approve & disburse payout
* `POST /api/admin/withdrawals/:id/reject` - Reject & refund funds
* `POST /api/admin/roi/trigger` - Manually execute 0.45% Daily ROI & Multi-level Referral cycle
