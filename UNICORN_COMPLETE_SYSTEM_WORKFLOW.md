# UNICORN Web3 Platform — Complete End-to-End System Workflow

## 1. Executive Architectural Blueprint

The UNICORN ecosystem is built upon an isolated **Three-Wallet Ledger Architecture**, an automated **0.45% Daily ROI Yield Engine (Mon–Fri)**, a **Dual-Rail Deposit System (INR UPI + BEP-20 USDT)**, a **Multi-Tier Community Override Matrix**, and a **Mandatory 2FA Withdrawal Pipeline**.

```mermaid
flowchart TD
    subgraph Inbound["1. Inbound Capital Dual-Rail"]
        A1["UPI (INR Fiat Rail)"]
        A2["USDT (BEP-20 Web3 Rail)"]
    end

    subgraph CoreWallets["2. Three-Wallet Isolated Ledger"]
        W1["Main Deposit Wallet<br/>(Ready to Invest)"]
        W2["ROI Wallet<br/>(Daily Trading Returns)"]
        W3["Referral Wallet<br/>(Commissions & Rewards)"]
    end

    subgraph Engines["3. Earning & Staking Engines"]
        E1["Active Investment Contract<br/>(Locked Capital · 200 Days)"]
        E2["0.45% Daily ROI Yield Engine<br/>(Mon–Fri · 22 Days/Mo = 9.9%)"]
        E3["Multi-Tier Referral Engine<br/>(5% L1, 2% L2-5, 1% L6-10...)"]
        E4["Achiever Club Travel Milestones<br/>(Goa, Andaman, Thailand, Dubai, Europe)"]
    end

    subgraph Outbound["4. Outbound Withdrawal Pipeline"]
        WD["Withdrawal Engine<br/>(Mandatory 6-Digit TOTP 2FA)"]
        O1["Bank NEFT / UPI (INR)"]
        O2["USDT BEP-20 (BSC Address)"]
    end

    A1 -->|12-Digit UTR Verification| W1
    A2 -->|On-Chain BEP-20 Confirmation| W1
    W1 -->|Package Staking Purchase| E1
    E1 -->|0.45% Daily Accrual| E2
    E2 -->|Direct Credit| W2
    E2 -->|ROI-on-ROI Override| E3
    E3 -->|Direct Credit| W3
    E1 -->|Volume Accumulation| E4
    W2 -->|Source 1| WD
    W3 -->|Source 2| WD
    WD -->|Fiat Settlement| O1
    WD -->|Crypto Settlement| O2
```

---

## 2. Inbound Capital & Dual-Rail Deposit Workflow

### Detailed Rail Logic
1. **Currency & Rail Selection**:
   - The user selects currency: **INR (₹)** or **USD / USDT ($)** (Standard platform peg: $1\text{ USDT} = ₹100\text{ INR}$).
2. **Rail A: INR UPI Dynamic Verification**:
   - The interface generates a dynamic UPI payment QR code and provides the platform VPA (`unicorn@okaxis`).
   - The user completes payment using PhonePe, Google Pay, Paytm, or BHIM.
   - The user enters their 12-digit **UTR / Reference Number**.
   - Submits `POST /api/wallet/deposit` $\rightarrow$ Created in Atlas `deposits` collection with status `PENDING`.
   - Admin approves transaction in Admin Console $\rightarrow$ Credits `MAIN` wallet balance and writes an immutable double-entry record to `financialledgers`.
3. **Rail B: USDT (BEP-20) Smart Contract Rail**:
   - Displays dedicated platform BNB Smart Chain deposit address (`0xAf057...`) and QR code.
   - User transfers USDT from MetaMask, Trust Wallet, or Binance.
   - Submits transaction hash $\rightarrow$ Verified via blockchain scanner $\rightarrow$ Main Deposit Wallet auto-credited.

```mermaid
sequenceDiagram
    autonumber
    actor User as Investor
    participant UI as Unicorn Web App
    participant API as Express API (:5000)
    participant DB as MongoDB Atlas
    actor Admin as Protocol Admin

    User->>UI: Enter Amount & Choose Method (UPI or USDT)
    alt Method = INR UPI
        UI->>User: Display UPI ID & Dynamic QR Code
        User->>UI: Submits 12-Digit UTR Number
        UI->>API: POST /api/wallet/deposit (amount, UTR, method='UPI')
        API->>DB: Save to 'deposits' (status: 'PENDING')
        Admin->>UI: Reviews Deposit in Admin Console
        Admin->>API: PUT /api/admin/deposits/:id/approve
        API->>DB: Update Deposit (status: 'APPROVED')
        API->>DB: Atomic $inc on Main Wallet (+₹Amount)
        API->>DB: Write LED-DEP to 'financialledgers'
        API-->>UI: Real-time Main Balance Updated
    else Method = USDT (BEP-20)
        UI->>User: Display BSC Wallet Address & QR
        User->>UI: Submits BEP-20 Transaction Hash
        UI->>API: POST /api/wallet/deposit (amount, txHash, method='USDT')
        API->>DB: Save to 'deposits' (status: 'APPROVED')
        API->>DB: Atomic $inc on Main Wallet (+₹Amount)
        API-->>UI: Main Balance Credited Immediately
    end
```

---

## 3. Package Staking & Daily ROI Engine (0.45% Mon–Fri)

### Mathematical Formulas & Rules
$$\text{Daily Yield Rate } r = 0.45\% = 0.0045$$
$$\text{Daily Return } = \text{Principal} \times 0.0045$$
$$\text{Monthly Yield (22 Trading Days)} = \text{Principal} \times 0.0045 \times 22 = \text{Principal} \times 9.9\%$$

> [!IMPORTANT]
> **Weekend Exclusion Rule**: Trading days strictly operate **Monday through Friday**. Saturday and Sunday are zero-earning pause days. Each contract runs for **200 trading days** (approximately 9 calendar months), reaching $200 \times 0.45\% = 90\%$ total ROI yield + native UNC utility token airdrop.

### Package Tier Matrix

| Package Tier | Investment Amount | Daily Return (0.45%) | Monthly Yield (22 Days, 9.9%) | Native UNC Bonus |
| :--- | :---: | :---: | :---: | :---: |
| **Starter Package** | ₹10,000 ($100) | ₹45 | ₹990 | 1,000 UNC |
| **Basic Growth** | ₹50,000 ($500) | ₹225 | ₹4,950 | 5,000 UNC |
| **Pro Trader** | ₹2,50,000 ($2,500) | ₹1,125 | ₹24,750 | 25,000 UNC |
| **Premium Wealth** | ₹5,00,000 ($5,000) | ₹2,250 | ₹49,500 | 50,000 UNC |
| **Elite Portfolio** | ₹10,00,000 ($10,000) | ₹4,500 | ₹99,000 | 100,000 UNC |
| **Diamond Whale** | ₹25,00,000 ($25,000) | ₹11,250 | ₹2,47,500 | 250,000 UNC |
| **Crown Unicorn** | ₹50,00,000 ($50,000) | ₹22,500 | ₹4,95,000 | 500,000 UNC |

---

## 4. Multi-Level Referral & Achiever Club Incentive Matrix

Referral commissions are calculated on **ROI-on-ROI** (daily earnings of downline members), ensuring zero principal dilution and sustainable tokenomics:

```mermaid
graph TD
    User["Your Account"]
    L1["Level 1 (Directs)<br/>5% Override<br/>Req: ≥2 Directs"]
    L2["Levels 2–5<br/>2% Override<br/>Req: ≥4 Directs"]
    L3["Levels 6–10<br/>1% Override<br/>Req: ≥7 Directs"]
    L4["Levels 11–25<br/>0.25% Override<br/>Req: ≥12 Directs"]
    L5["Level 26+ (Infinity)<br/>0.125% Override<br/>Req: ≥15 Directs"]

    User --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
```

### Achiever Travel Club Milestones
Tracks cumulative 4-month direct business volume:
1. **Goa Trip (3D/2N)**: ₹5,00,000 direct business volume
2. **Andaman Trip (4D/3N)**: ₹15,00,000 direct business volume
3. **Thailand Trip (5D/4N)**: ₹30,00,000 direct business volume
4. **Dubai Grand Tour (5D/4N)**: ₹50,00,000 direct business volume
5. **Europe Luxury Tour (7D/6N)**: ₹1,00,00,000 direct business volume

---

## 5. Mandatory 2FA Withdrawal Pipeline

To ensure absolute capital protection:
- **Source Separation**: Withdrawals are strictly permitted only from **ROI Wallet** or **Referral Wallet**. Staked principal in `MAIN` wallet is locked during contract maturity.
- **Minimum Payout**: ₹500 ($5 USDT).
- **Atomic Balance Reservation**: The requested payout amount is immediately quarantined (`reservedWithdrawal += amount`), blocking concurrent double-spending attempts.
- **Mandatory TOTP 2FA**: The backend rejects any withdrawal request without a verified 6-digit TOTP code generated by Google Authenticator.

```mermaid
stateDiagram-v2
    [*] --> BalanceCheck
    BalanceCheck --> Available: Balance >= Min Payout (₹500)
    BalanceCheck --> Rejected: Insufficient Available Balance
    Available --> Enter2FA: User inputs 2FA TOTP code
    Enter2FA --> TOTPVerified: otplib verifies 6-digit code
    Enter2FA --> TOTPFailed: Code invalid or expired
    TOTPFailed --> Enter2FA
    TOTPVerified --> BalanceReserved: balance -= amount, reserved += amount
    BalanceReserved --> PendingReview: Stored in Atlas 'withdrawals'
    PendingReview --> Completed: Admin / Auto-Settler dispatches funds
    Completed --> [*]
```

---

## 6. Web3 MetaMask Connection Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant App as React DApp
    participant MM as MetaMask Wallet
    participant API as Backend Auth Controller
    participant DB as MongoDB Atlas

    User->>App: Clicks 'Connect Wallet'
    alt Mobile Browser
        App->>MM: Redirect via metamask.app.link/dapp/
    else Desktop Browser
        App->>MM: eth_requestAccounts
        MM-->>App: Returns Account Address (0x...)
        App->>MM: wallet_switchEthereumChain (BSC 0x38)
        App->>API: POST /api/users/wallet-address (address, web3Connected: true)
        API->>DB: Atomic update user.walletAddress
        API-->>App: Confirmed & Linked to Profile
    end
```

---

## 7. MongoDB Atlas Persistence Model

The live Atlas cluster operates with the following collections:

```mermaid
erDiagram
    USERS ||--o{ WALLETS : owns
    USERS ||--o{ INVESTMENTS : stakes
    USERS ||--o{ DEPOSITS : submits
    USERS ||--o{ WITHDRAWALS : requests
    USERS ||--o{ FINANCIALLEDGERS : tracks

    USERS {
        ObjectId _id PK
        string email UK
        string referralCode UK
        string walletAddress UK "sparse"
        string role "user | admin"
        string kycStatus "VERIFIED | UNVERIFIED"
    }

    WALLETS {
        ObjectId _id PK
        ObjectId userId FK
        string type "MAIN | ROI | REFERRAL"
        number balance
        number reservedWithdrawal
    }

    DEPOSITS {
        ObjectId _id PK
        ObjectId userId FK
        number amount
        string currency "INR | USDT"
        string paymentMethod "UPI | USDT (BEP-20)"
        string transactionReference
        string status "PENDING | APPROVED | REJECTED"
    }

    INVESTMENTS {
        ObjectId _id PK
        ObjectId userId FK
        string packageName
        number amount
        number dailyRoiRate "0.0045"
        number dailyRoiAmount
        string status "ACTIVE | COMPLETED"
    }

    WITHDRAWALS {
        ObjectId _id PK
        ObjectId userId FK
        number amount
        string walletSource "roi | referral"
        string payoutMethod "upi | crypto"
        string destinationAddress
        string status "PENDING | APPROVED"
    }
```

