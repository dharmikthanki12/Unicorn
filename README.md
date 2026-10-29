# Unicorn - Web3 Investment, Referral & Rewards Website

A modern, high-performance **Web3 Website** built in React (JSX) with full responsiveness:
- **Desktop Website View**: Modern full-screen Web3 platform layout featuring floating sticky pill navigation, multi-column analytics, package split-views, comprehensive transaction ledgers, and dedicated admin controls.
- **Mobile Phone View**: Automatically and seamlessly transforms into the exact mobile layout from `Unicorn_Mobile_App.html` when viewed on a phone or screen width $\le 768\text{px}$.
- **Brand Identity**: Features the official 3D Unicorn Logo from `3D Unicorn Logo with Smooth Gradients_20251111_204800_0000.png`.
- **Compensation & Business Rules**: Faithfully implements all specifications from `UNICORN_Project_Requirements_Summary.pdf`.

---

## 🌟 Key Architecture & Highlights

### 1. Website Layout (Desktop & Mobile Responsive)
- **Desktop View**:
  - Floating sticky top navbar with 3D logo, navigation pills (`Home`, `Deposit`, `Invest`, `Transactions`, `Referral`, `Admin Panel`), notification bell, Web3 wallet connect button, theme switcher (Dark / Light), and user profile.
  - Multi-column responsive layout for dashboard, investment packages, referral network, and transaction records.
- **Phone View ($\le 768\text{px}$)**:
  - Top compact header and fixed bottom 5-tab navigation bar (`Home`, `Deposit`, `Invest`, `History`, `Referral`).
  - Identical pixel-for-pixel fidelity to the mobile design files.

### 2. Investment Packages (Section 2)
- Reference Conversion: $\$1 = ₹100$
- Fixed **0.45% Daily ROI**:
  - **Starter Package**: ₹10,000 ($100) — Daily ROI: ₹45
  - **Basic Growth**: ₹50,000 ($500) — Daily ROI: ₹225
  - **Pro Trader**: ₹2,50,000 ($2,500) — Daily ROI: ₹1,125
  - **Premium Wealth**: ₹5,00,000 ($5,000) — Daily ROI: ₹2,250
  - **Elite Portfolio**: ₹10,00,000 ($10,000) — Daily ROI: ₹4,500
  - **Diamond Whale**: ₹25,00,000 ($25,000) — Daily ROI: ₹11,250
  - **Crown Unicorn**: ₹50,00,000 ($50,000) — Daily ROI: ₹22,500

### 3. ROI & Referral Income (ROI on ROI, Section 3)
- Daily ROI: 0.45%
- Referral income calculated as a percentage of downline's daily ROI:
  - **Level 1**: 5% (Min 2 direct referrals)
  - **Levels 2–5**: 2% (Min 4 direct referrals)
  - **Levels 5–10**: 1% (Min 7 direct referrals)
  - **Levels 10–25**: 0.25% (Min 12 direct referrals)
  - **Level 25+**: 0.125% (Min 15 direct referrals)

### 4. Rank Reward Bonus (Section 4)
- Personal + Team business targets:
  - ₹2,50,000 Target $\rightarrow$ ₹5,000 Bonus
  - ₹5,00,000 Target $\rightarrow$ ₹11,000 Bonus
  - ₹10,00,000 Target $\rightarrow$ ₹20,000 Bonus
  - ₹25,00,000 Target $\rightarrow$ ₹45,000 Bonus
  - ₹50,00,000 Target $\rightarrow$ ₹1,00,000 Bonus
  - ₹1,00,00,000 Target $\rightarrow$ 3% Bonus

### 5. Achiever Bonus Travel Passes (Section 5)
- Direct-referred business milestones within 4 months:
  - ₹5,00,000 $\rightarrow$ **Goa Trip** (Pass unlocked)
  - ₹15,00,000 $\rightarrow$ **Andaman Trip**
  - ₹30,00,000 $\rightarrow$ **Thailand Trip**
  - ₹50,00,000 $\rightarrow$ **Dubai Trip**
  - ₹1,00,00,000 $\rightarrow$ **Europe Trip**

### 6. Wallets, Security & 2FA (Section 6 & 7)
- **Wallets**: Main Deposit Wallet, Daily ROI Wallet, Referral Wallet.
- **Two-Factor Authentication (2FA)**: Enforced strictly at withdrawal with an interactive 6-digit verification code.
- **Web3 Wallet Connection**: Connect BEP-20 MetaMask / TrustWallet / BNB Smart Chain.
- **Token**: Unicorn (UNC), BEP-20, Total Supply: 100,000,000 UNC (100M).

### 7. Admin Panel (Section 8)
- Review and Approve/Reject pending deposit requests (INR UTR / USDT).
- Review and Approve/Reject pending withdrawal requests (2FA authenticated).
- Monitor platform liquidity and configure protocol parameters.

---

## 💻 How to Run

In the project folder `c:\Users\ISHA THANKI1\Desktop\unicorn`:

```bash
# Start development server
npm run dev

# Or build and preview production release
npm run build
npm run preview
```
