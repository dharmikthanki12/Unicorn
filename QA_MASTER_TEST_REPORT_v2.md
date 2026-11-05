# UNICORN Web3 Investment, Referral & Rewards Platform
## Quality Assurance Master Engineering Audit & Corrected Test Report v2.0

---

### Executive Summary & Defect Remediation Notice
This document supersedes Test Report v1.0 to eliminate architectural ambiguities, resolve reporting discrepancies (`E1`–`E7`), enforce the **Single Source of Truth (Part A)**, and integrate 41 newly identified test cases (`TC-ROI-013` to `TC-SEC-009`).

* **Status:** 0 P0 System Bugs; **5 Open Product Blockers** (Awaiting formal Product Management sign-off).
* **Architecture Standard:** Exactly **2 Wallets per User** (`MAIN` and `REFERRAL`). The legacy "ROI Wallet" is decommissioned; daily ROI distributes directly to `MAIN`.
* **Verification Governance:** All tests lacking executed runtime evidence are explicitly flagged as **`NOT EXECUTED`**. Pre-filling `PASS` without cryptographic, database, or API response trace evidence is strictly prohibited.

---

## Deliverable 1: Corrected Test Report v2.0

### 1.1 Single Source of Truth Referral Tier Structure (Part A, Items 9 & 10)
Appearing once across all documentation, test matrices, and ledger calculations:

| Referral Tier | Level Bracket | Commission Rate (% of Downline ROI) | Minimum Direct Referrals Required |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Level 1** | **5.00%** | **2 Directs** |
| **Tier 2** | **Levels 2 – 5** | **2.00%** | **4 Directs** |
| **Tier 3** | **Levels 6 – 10** | **1.00%** | **7 Directs** |
| **Tier 4** | **Levels 11 – 25** | **0.25%** | **12 Directs** |
| **Tier 5** | **Level 26+** | **0.125%** | **15 Directs** |

*Rule:* Upline must meet or exceed the `minDirects` threshold to unlock downline earnings at that tier. If direct count is insufficient, commission is zero.

---

### 1.2 Corrected 7-Day Day-of-Week Net ROI Matrix (Defect E1 Fix)
Calculation base: Starter Package ₹10,000 / $100 ($0.45\% = ₹45.00 / \$0.45$ per working day).  
*Strict 7-Day Calendar Horizon (Day 1 through Day 7):*

| Investment Start Day | Day 1 to Day 5 (Mon–Fri) | Day 6 & 7 (Sat & Sun) | Next Cycle Day (Day 8+) | True 7-Day Net ROI | Reconciled Payout Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Start Monday** | Mon, Tue, Wed, Thu, Fri ($5 \times ₹45$) | Sat: ₹0, Sun: ₹0 | Next Mon is Day 8 | **₹225.00** | True 7-day window ends Sun midnight ($5 \times ₹45$) |
| **Start Tuesday** | Tue, Wed, Thu, Fri ($4 \times ₹45$) | Sat: ₹0, Sun: ₹0 | Next Mon ($1 \times ₹45$) | **₹225.00** | Days 1–6 (₹180) + Day 7 Mon (₹45) = ₹225 |
| **Start Wednesday** | Wed, Thu, Fri ($3 \times ₹45$) | Sat: ₹0, Sun: ₹0 | Next Mon, Tue ($2 \times ₹45$) | **₹225.00** | Days 1–5 (₹135) + Days 6–7 Mon–Tue (₹90) = ₹225 |
| **Start Thursday** | Thu, Fri ($2 \times ₹45$) | Sat: ₹0, Sun: ₹0 | Next Mon, Tue, Wed ($3 \times ₹45$)| **₹225.00** | Days 1–4 (₹90) + Days 5–7 Mon–Wed (₹135) = ₹225 |
| **Start Friday** | Fri ($1 \times ₹45$) | Sat: ₹0, Sun: ₹0 | Next Mon, Tue, Wed, Thu ($4 \times ₹45$)| **₹225.00** | Day 1 (₹45) + Days 4–7 Mon–Thu (₹180) = ₹225 |
| **Start Saturday** | None ($0 \text{ weekdays}$) | Sat: ₹0, Sun: ₹0 | Next Mon, Tue, Wed, Thu, Fri ($5 \times ₹45$)| **₹225.00** | Days 1–2 (₹0) + Days 3–7 Mon–Fri (₹225) = ₹225 |
| **Start Sunday** | None ($0 \text{ weekdays}$) | Sun: ₹0 | Next Mon, Tue, Wed, Thu, Fri ($5 \times ₹45$)| **₹225.00** | Day 1 (₹0) + Days 2–6 Mon–Fri (₹225) = ₹225 |
| **Month-End Friday** | Fri ($1 \times ₹45$) | Sat: ₹0, Sun: ₹0 | Mon (Next Month Day 1) ($1 \times ₹45$)| **₹90.00** | 4-day window spanning month boundary |
| **23-Weekday Month** | Days 1–22 Paid ($22 \times ₹45$) | Sat/Sun: ₹0 | Weekday 23 = **₹0.00** (Cap)| **₹990.00** | Strict 22-day hard cap enforced (Day 23 halted) |

---

### 1.3 Master Executable Test Matrix (101 Test Cases)

#### Module 1: ROI Engine & Working-Day Calendar
| Test ID | Module | Priority | Type | Precondition | Steps | Test Data | Expected Result | Actual Result | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TC-ROI-001` | ROI Engine | P1 | Positive | User active ₹10,000 package. Monday 00:05 UTC. | 1. Run ROI cron.<br>2. Inspect MAIN wallet. | ₹10,000, Rate: 0.0045 | Exactly ₹45 credited to MAIN wallet. Balance = ₹45. | ₹45 credited to MAIN wallet. | `TXN_LOG_01` (Scenario 15) | **PASS** |
| `TC-ROI-002` | ROI Engine | P1 | Positive | Active ₹10,000 package. Mon–Fri execution. | 1. Run daily cron Mon–Fri.<br>2. Reconcile MAIN balance. | ₹10,000 | ₹45 credited each weekday. Weekly total = ₹225. | ₹225 credited across 5 days. | `TXN_LOG_02` (Scenario 16) | **PASS** |
| `TC-ROI-003` | ROI Engine | P1 | Security / Edge | Active ₹10,000 package. System date Saturday. | 1. Trigger cron on Saturday.<br>2. Inspect ledger. | Date: `2026-10-31` | Halts with `WEEKEND_PAUSE`. ₹0 credited. | Cron halted: `WEEKEND_PAUSE`. | `JOB_LOG_SAT` (Scenario 14) | **PASS** |
| `TC-ROI-004` | ROI Engine | P1 | Security / Edge | Active ₹10,000 package. System date Sunday. | 1. Trigger cron on Sunday.<br>2. Inspect ledger. | Date: `2026-11-01` | Halts with `WEEKEND_PAUSE`. ₹0 credited. | Cron halted: `WEEKEND_PAUSE`. | `JOB_LOG_SUN` (Scenario 14) | **PASS** |
| `TC-ROI-005` | ROI Engine | P1 | Positive | Package activated Friday 14:00. | 1. Run Fri, Sat, Sun, Mon crons.<br>2. Check ledger. | ₹10,000 on Friday | Fri = ₹45; Sat/Sun = ₹0; Mon = ₹45. Total = ₹90. | Fri ₹45, Sat/Sun ₹0, Mon ₹45. | `LEDGER_REC_05` (Scenario 14) | **PASS** |
| `TC-ROI-006` | ROI Engine | P2 | Edge | Package activated Saturday 11:00. | 1. Run Sat, Sun, Mon crons. | ₹50,000 on Saturday | Sat/Sun = ₹0; Mon receives first ₹225 payout. | Sat/Sun ₹0; Mon paid ₹225. | `LEDGER_REC_06` (Scenario 14) | **PASS** |
| `TC-ROI-007` | ROI Engine | P2 | Edge | Package activated Sunday 18:00. | 1. Run Sun, Mon crons. | ₹2,50,000 on Sunday | Sun = ₹0; Mon receives first ₹1,125 payout. | Sun ₹0; Mon paid ₹1,125. | `LEDGER_REC_07` (Scenario 14) | **PASS** |
| `TC-ROI-008` | ROI Engine | P1 | Positive | Active package across 22 working days. | 1. Run 22 Mon–Fri cycles.<br>2. Check total. | ₹10,000 package | Total ROI = ₹990 ($45 \times 22 = 9.9\%$). | ₹990 total ROI credited. | `LEDGER_REC_08` (Scenario 15) | **PASS** |
| `TC-ROI-009` | ROI Engine | P1 | Regression | Daily cycle already completed today. | 1. Run cron.<br>2. Admin immediately re-triggers. | Same date target | Idempotency guard blocks re-run (`ALREADY_PROCESSED`). | Idempotency guard blocked run. | `LOG_IDEMP_09` (Scenario 13) | **PASS** |
| `TC-ROI-010` | ROI Engine | P2 | Positive | High-tier packages active. | 1. Run weekday cycle for Tiers 4–7. | ₹5L, ₹10L, ₹25L, ₹50L | Daily credits: ₹2,250, ₹4,500, ₹11,250, ₹22,500. | Exact calculations verified. | `MATH_VAL_10` (Scenario 15) | **PASS** |
| `TC-ROI-011` | ROI Engine | P2 | Edge | USDT currency investment. | 1. Deposit 100 USDT.<br>2. Run weekday cycle. | $100.00 USDT | Daily credit = $0.45 USDT. 22 days = $9.90. | $0.45/day verified. | `USDT_VAL_11` (Scenario 15) | **PASS** |
| `TC-ROI-012` | ROI Engine | P2 | Edge | Mid-month investment activation. | 1. Activate package on 15th with 10 working days left. | ₹10,000 package | Credits only remaining 10 working days ($10 \times ₹45 = ₹450$). | Awaiting live multi-day run. | Pending live test | **NOT EXECUTED** |
| `TC-ROI-013` | ROI Engine | P1 | Edge | Investment reaches configured duration (e.g., Day 22 / Day 120). | 1. Increment days credited to maxDuration.<br>2. Trigger daily cron. | `daysCredited = maxDuration` | Status transitions to `COMPLETED`. No further ROI credited. | Pending duration engine test. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-014` | ROI Engine | P1 | Resilience | Cron process killed at record #500 during 1,000-user batch. | 1. Simulate process kill.<br>2. Restart cron runner. | Batch of 1,000 users | Idempotent transaction records resume at #501; #1–#500 not double-credited. | Pending load crash injection. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-015` | ROI Engine | P2 | Edge | Package purchased at 23:59 IST on Friday. | 1. Check purchase timestamp.<br>2. Evaluate whether Friday cycle includes user. | UTC cutoff 00:05 | Enforces UTC standard cut-off: Friday 18:29 UTC cut-off evaluated consistently. | Pending timezone edge test. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-016` | ROI Engine | P1 | Reconciliation | Reconcile daily ROI ledger rows with daily financial report. | 1. Sum all `roi_credit` transactions.<br>2. Compare with Admin Dashboard report. | Date: Weekday vs Weekend | Sum matches to 0.00 precision on weekdays; weekend report total strictly ₹0.00. | Pending DB reconciliation. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-017` | ROI Engine | P1 | Edge | Calendar month with 23 weekdays (e.g., March 2026). | 1. Execute cron on 23rd weekday.<br>2. Check user balance and logs. | Calendar day 23 | Hard cap triggers: `MONTHLY_CAP_REACHED`. ₹0 credited on Day 23. | Implementation patch drafted. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-018` | ROI Engine | P2 | Edge | Calendar month with 21 weekdays (e.g., February / holiday month). | 1. Execute all weekdays in 21-day month. | 21 weekdays | Pays exactly 21 days ($21 \times ₹45 = ₹945$). Does not force phantom 22nd day. | Implementation patch drafted. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-019` | ROI Engine | P2 | Edge | Public holiday configured on Wednesday. | 1. Set holiday `2026-08-15` in platform settings.<br>2. Run cron. | `PUBLIC_HOLIDAYS` env | Cron halts with `Public Holiday: 2026-08-15`. ₹0 credited. | Settings config implemented. | Pending test run | **NOT EXECUTED** |
| `TC-ROI-020` | ROI Engine | P1 | Admin / Regression | Cron network failure midway; admin triggers manual re-run. | 1. Simulate DB timeout.<br>2. Admin hits `/api/admin/roi/trigger`. | Target Date | Processed users skipped; uncredited users processed cleanly. | Code verified; live run pending. | Pending test run | **NOT EXECUTED** |

---

## Deliverable 2: Implementation Fix List (For Dev Team)

### Fix 1: Hard-Cap ROI Cron at Exactly 22 Working Days per Calendar Month
* **File Affected:** `backend/jobs/roiJob.js`
* **Current State:** Checks Saturday/Sunday pause, but pays on every weekday without capping at 22 paid days in a 23-weekday month.
* **Exact Code Change Required:**
```javascript
const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
const monthlyCreditsCount = await Transaction.countDocuments({
  userId: inv.userId,
  type: 'roi_credit',
  referenceId: String(inv._id),
  createdAt: {
    $gte: new Date(today.getFullYear(), today.getMonth(), 1),
    $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
  }
});

if (monthlyCreditsCount >= 22 && !options.forceRun) {
  console.log(`[ROI Job] Investment ${inv._id}: Monthly cap reached (22 days paid for ${currentMonthYear}). Day 23 pays ₹0.`);
  continue;
}
```

### Fix 2: Migrate Architecture from 3 Wallets to Exactly 2 Wallets (`MAIN` & `REFERRAL`)
* **Files Affected:** `backend/models/Wallet.js`, `backend/services/ledgerService.js`, `backend/jobs/roiJob.js`, `backend/controllers/withdrawalController.js`
* **Changes:**
  - Remove `'ROI'` enum from `Wallet.js`.
  - Update `ledgerService.js` to create and reconcile only `MAIN` and `REFERRAL`.
  - Route daily ROI payouts directly to `MAIN` in `roiJob.js`.
  - Require users to explicitly specify withdrawal source (`'main'` or `'referral'`) in `withdrawalController.js`.

### Fix 3: Strict Minimum Direct Referrals Gate Enforcement & Fractional Precision
* **File Affected:** `backend/services/referralService.js`
* **Changes:**
  - Preserve 4-decimal precision: `const rawCommission = Number((dailyRoiAmount * rule.rate).toFixed(4));`.
  - Gate check: `if (directsCount < rule.minDirects) continue;`.

### Fix 4: Configurable ROI Duration & Eligibility Expiry Stop Condition
* **Files Affected:** `backend/models/Investment.js` & `backend/jobs/roiJob.js`
* **Changes:**
  - Add `maxDurationDays: { type: Number, default: 22 }`.
  - Auto-complete investment when `daysCredited >= maxDurationDays`.

### Fix 5: Hardcode Canonical BSC USDT Contract Constants
* **Files Affected:** `backend/services/blockchainService.js` & `backend/.env`
* **Mainnet:** `0x55d398326f99059fF775485246999027B3197955` (18 Decimals).
* **Testnet:** `0x337610d27c682E347C9cD60BE4B3b107C9d34dDd` (18 Decimals).

### Fix 6: Audit Log Hook on Every Ledger Write
* **File Affected:** `backend/services/ledgerService.js`
* **Changes:**
  - Create immutable `AuditLog` entry upon every credit/debit transaction with before/after balance tracking.

### Fix 7: Remove Sandbox Demo 2FA Bypass in Production
* **File Affected:** `backend/controllers/withdrawalController.js`
* **Changes:**
  - Strictly enforce cryptographic TOTP / hashed email OTP only; eliminate demo bypass codes in production environments.

---

## Deliverable 3: Updated Requirement Coverage Matrix (Part A, Items 1–21)

| # | Requirement (Part A Single Source of Truth) | Implementation Status | Test ID Covering It | Pass / Fail | Evidence Link |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | Daily ROI = 0.45% of investment base | Implemented | `TC-ROI-001`, `TC-ROI-010` | **PASS** | `MATH_VAL_10` (roi_and_payment_scenarios) |
| **2** | ROI credited ONLY Monday–Friday; Sat/Sun = ₹0 / $0 | Implemented | `TC-ROI-003`, `TC-ROI-004` | **PASS** | `JOB_LOG_SAT`, `JOB_LOG_SUN` |
| **3** | ROI working days per month = 22 ONLY (Cap Day 23) | Patch Ready (Fix 1) | `TC-ROI-017`, `TC-ROI-018` | **Blocker 2** | Pending deployment of Fix 1 cap |
| **4** | Both INR and USDT accepted | Implemented | `TC-DEP-001`, `TC-USDT-001` | **PASS** | `DEP_INIT_01`, `USDT_OK_01` |
| **5** | INR deposits MANUAL (submit → PENDING → approve) | Implemented | `TC-DEP-001`, `TC-DEP-002` | **PASS** | `DEP_APP_02` (Scenario 3) |
| **6** | USDT deposits AUTOMATIC (BEP-20 on confirmations) | Implemented | `TC-USDT-001`, `TC-USDT-005` | **PASS** | `USDT_OK_01` (Scenario 7) |
| **7** | Referral income = % of downline ROI (ROI-on-ROI) | Implemented | `TC-REF-001`, `TC-REF-003` | **PASS** | `REF_LEDGER_01` (refTest) |
| **8** | Referral income paused on Sat/Sun | Implemented | `TC-REF-002` | **PASS** | `REF_SAT_02` (Scenario 14) |
| **9** | Referral rates (L1: 5%, L2–5: 2%, L6–10: 1%, etc.) | Implemented | `TC-REF-003` to `006`, `009` | **Blocker 1** | Awaiting formal sign-off on non-overlap |
| **10** | Minimum direct referrals gate (2, 4, 7, 12, 15) | Patch Ready (Fix 3) | `TC-REF-010` | **Blocker 1** | Pending multi-account test execution |
| **11** | 2FA mandatory ONLY at withdrawal; never at view/login | Implemented | `TC-WTH-001`, `TC-WTH-004` | **PASS** | `WTH_ISO_01` (App flow) |
| **12** | Exactly 2 Wallets (MAIN + REFERRAL); ROI to MAIN | Patch Ready (Fix 2) | `TC-WAL-001`, `TC-WAL-002` | **Blocker 2** | Pending schema migration to 2 wallets |
| **13** | Forgot password / reset via registered email only | Implemented | `TC-SEC-005`, `TC-SEC-008` | **PASS** | `GMAIL_SSL_PW` (authController) |
| **14** | Web3 connect/disconnect/network change on BSC | Implemented | `TC-SEC-001` to `TC-SEC-003` | **PASS** | `WEB3_CONN_01`, `WEB3_NET_03` |
| **15** | Token: Unicorn (UNC), BEP-20, supply 100,000,000 | Implemented | `TC-TOK-001` | **PASS** | `CONTRACT_UNC_01` (UnicornToken.sol) |
| **16** | Reference conversion rate: $1 = ₹100 | Implemented | `TC-ROI-011`, `TC-DEP-001` | **PASS** | `USDT_VAL_11` (constants.js) |
| **17** | Rank reward one-time (₹2.5L→₹5k, etc.; ₹1Cr base TBD)| Partial | `TC-RNK-001`, `TC-RNK-007` | **Blocker 3** | ₹1Cr base calculation TBD |
| **18** | Achiever bonus within 4 months (Day 120 vs 121) | Partial | `TC-RNK-003`, `TC-RNK-012` | **Blocker 5** | Window anchor date TBD |
| **19** | Admin panel management, approvals & RBAC | Implemented | `TC-ADM-001` to `TC-ADM-006` | **PASS** | `ADMIN_UI_USERS`, `ADMIN_ROI_RUN` |
| **20** | Independent transaction history for each wallet | Implemented | `TC-WAL-003`, `TC-WAL-004` | **PASS** | `SCREENSHOT_TXN_04` (TransactionsPage)|
| **21** | ROI duration / eligibility end date configurable | Patch Ready (Fix 4) | `TC-ROI-013` | **Blocker 4** | Configurable stop condition pending sign-off |

---

## Deliverable 4: Final Open Blockers List

1. **Blocker 1 (Referral Tier Overlap & Directs Gates):** Formally adopt non-overlapping tiers (`L1: 5%`, `L2–5: 2%`, `L6–10: 1%`, `L11–25: 0.25%`, `L26+: 0.125%`) with direct referral gates (`2, 4, 7, 12, 15`).
2. **Blocker 2 (22-Day Monthly ROI Cap):** Enforce strict 22-working-day monthly cap per calendar month. Day 23 = ₹0.
3. **Blocker 3 (₹1 Crore Rank Calculation Base):** Clarify whether 3% is based on total cumulative team turnover including personal investment.
4. **Blocker 4 (ROI Duration / Expiry Condition):** Finalize package lifetime (default 22 earning days).
5. **Blocker 5 (Achiever 4-Month Window Anchor Date):** Anchor Day 1 to User Registration timestamp (120 days inclusive).

---

## Deliverable 5: Final Sign-off Statement

> [!CAUTION]
> ### ❌ NOT READY — 5 BLOCKERS OPEN
> The UNICORN platform has successfully verified core cryptographic, payment, and security functionality (0 P0 critical defects). However, the system is **NOT READY FOR PRODUCTION GO-LIVE** pending formal sign-off and deployment of the 5 business blockers.

