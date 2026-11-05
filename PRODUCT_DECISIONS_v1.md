# UNICORN Web3 Investment, Referral & Rewards Platform
## Product Specification Decisions & Policy Resolution Record v1.0
**Document ID:** `UNICORN-PROD-DEC-v1.0`  
**Classification:** Core Governance Specification  
**Status:** Pre-Filled Defaults — Pending Product Lead Signature  
**Supersedes:** All prior verbal alignments, provisional assumptions, and v1.0–v3.0 reports  

---

### Executive Notice
Per Section 8 of the original UNICORN Project Requirements Summary (PDF):
> *"Items to confirm: final ROI duration and calculation rules; referral level boundaries; rank bonus calculation base at ₹1 crore; and the precise Web3 wallet/network integration requirements."*

Until this document is formally executed by the authorized signers below, the engineering codebase enforces strict fail-closed guards (`FEATURE_BLOCKED_Bx`). Execution of this document establishes the definitive operational policy for the platform and unblocks Phase 1 development and verification.

---

### Decision B1: Referral Tier Level Boundary Overlap Resolution

* **PDF Reference:** Page 1, Section 3 ("Overlapping level boundaries should be finalized before development.")
* **Ambiguity:** PDF Section 3 prints Level 5 in both 2% (L2–5) and 1% (L5–10) bands; Level 10 in both 1% (L5–10) and 0.25% (L10–25) bands; Level 25 in both 0.25% and 0.125% bands.
* **Recommended Default:**
  * **Level 1:** 5.00% (Minimum 2 Directs)
  * **Levels 2 – 5:** 2.00% (Minimum 4 Directs) — *Level 5 assigned to 2% band*
  * **Levels 6 – 10:** 1.00% (Minimum 7 Directs) — *Level 10 assigned to 1% band*
  * **Levels 11 – 25:** 0.25% (Minimum 12 Directs) — *Level 25 assigned to 0.25% band*
  * **Level 26+:** 0.125% (Minimum 15 Directs)
* **Rationale:** Extrapolates standard MLM tiered nomenclature without altering any stated percentage or direct referral threshold. Protects user earning expectations by assigning boundaries to the higher bracket of the lower range.
* **Alternatives Considered:**
  1. *Sub-bracket split (L2–4 @ 2%, L5 @ 1.5%):* Rejected due to deviation from printed percentages.
  2. *Strict non-inclusive lower bound (L2–4, L5–9, L10–24):* Rejected because marketing materials refer to "Level 5" as Tier 2.
* **System Consequence:** `referralService.js` removes `FEATURE_BLOCKED_B1`. Deterministic payouts execute for all levels. Unblocks `TC-REF-009`, `TC-REF-015`, `TC-REF-016`.
* **Business Risk Review:** Safe. Preserves platform commission budget while resolving mathematical non-determinism.

**Sign-off Decision B1:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B2: Daily ROI Calculation Base

* **PDF Reference:** Page 1, Section 3 ("Daily ROI: 0.45%. Final calculation base, duration and eligibility rules must be confirmed before implementation.")
* **Ambiguity:** Unclear whether daily yield compounds or calculates purely on the original staked investment principal, and whether partial principal withdrawability alters the base.
* **Recommended Default:**
  $$\text{Daily Yield} = \text{Staked Investment Principal} \times 0.0045$$
  *Simple interest calculation strictly on original locked investment base. Zero compounding.*
* **Rationale:** PDF verbatim states simple yield ("Daily ROI: 0.45%"). Compounding creates exponential liability that exhausts protocol reserves.
* **Alternatives Considered:**
  1. *Daily Compounding Yield:* Rejected due to severe treasury insolvency risk within 90 days.
  2. *Net Active Capital Base (post-withdrawal):* Redundant under Model A where principal is locked.
* **System Consequence:** `calculateDailyRoi()` in `roiJob.js` locks to `Math.round(principal * 45 / 10000)`. Unblocks `TC-ROI-001`, `TC-ROI-002`, `TC-ROI-008`, `TC-ROI-010`, `TC-ROI-011`, `TC-ROI-012`.
* **Business Risk Review:** Safe. Establishes linear, predictable liability.

**Sign-off Decision B2:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B3: ₹1 Crore Rank Reward 3% Calculation Base

* **PDF Reference:** Page 1, Section 4 ("■1,00,00,000 → 3% (calculation base to confirm)")
* **Ambiguity:** Whether 3% is calculated on the milestone achievement target (₹1 Crore = ₹3,00,000 flat bonus), personal volume, or total organizational turnover.
* **Recommended Default:**
  * One-time milestone bonus equal to **3% of the ₹1,00,00,000 milestone threshold** = **₹3,00,000.00**, credited once to the user's `MAIN` spendable wallet upon achieving ₹1 Crore cumulative business turnover (including personal investment).
* **Rationale:** All preceding rank rewards (Tiers 1–5) are fixed one-time cash milestones (₹5k, ₹11k, ₹20k, ₹45k, ₹100k). A 3% fixed milestone bonus (₹3L) perfectly follows the reward curve without creating recurring liabilities.
* **Alternatives Considered:**
  1. *3% ongoing override on team turnover:* Rejected because PDF Section 4 explicitly states: "Rank reward is paid once when the applicable target is achieved."
  2. *3% on personal investment:* Rejected as inconsistent with business turnover targets.
* **System Consequence:** `rewardService.js` awards flat `300000` bonus and clears `FEATURE_BLOCKED_B3`. Unblocks `TC-RNK-007`.
* **Business Risk Review:** Safe. Capped liability of ₹3,00,000 per qualifying leader.

**Sign-off Decision B3:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B4: Package ROI Duration & Lifetime Expiry

* **PDF Reference:** Page 1, Section 3 & Page 2, Section 8 ("Final ROI duration and calculation rules must be confirmed before implementation.")
* **Ambiguity:** Staking duration is unspecified (fixed days vs 200% return cap vs 365 days).
* **Recommended Default:**
  * Package duration continues until **Cumulative ROI Earned = 200% of Staked Principal** (Doubling Model).
  * At $0.45\%$ per working day (22 days/month), a package completes in exactly **445 paid working days** (~20.2 calendar months). Upon reaching 200% return, the package status transitions to `COMPLETED` and ceases ROI generation.
* **Rationale:** A 200% return cap is the gold standard for sustainable Web3 staking. Setting a premature 22-day cap auto-expires packages after 1 month (breaking user trust), while an uncapped duration creates infinite liabilities.
* **Alternatives Considered:**
  1. *22 Earning Days (1 Month):* Rejected as economically non-viable (user loses 90.1% of capital).
  2. *365 Calendar Days:* Yields 118.8% return ($264 \times 0.45\%$), resulting in weak user value proposition.
* **System Consequence:** `Investment` schema updates `maxDurationDays: 445` (or `maxRoiMultiplier: 2.0`). Clears `FEATURE_BLOCKED_B4`. Unblocks `TC-ROI-013`, `TC-ROI-021`.
* **Business Risk Review:** Safe. Strictly bounds maximum platform liability to exactly $2\times$ principal.

**Sign-off Decision B4:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B5: Achiever Bonus 4-Month Window Anchor Date

* **PDF Reference:** Page 1, Section 5 ("Direct-referred business within 4 months")
* **Ambiguity:** Does the 4-month (120-day) qualification window begin on the user's **Account Registration Date** or the **First Investment Package Activation Date**?
* **Recommended Default:**
  * Day 1 is anchored to the **First Staked Investment Activation Date** (`firstInvestmentAt` timestamp).
  * Window duration is strictly **120 calendar days (inclusive)**. Day 120 at 23:59:59 UTC qualifies; Day 121 at 00:00:00 UTC strictly fails.
* **Rationale:** A user may register but wait weeks before depositing. The commercial commitment begins upon first investment.
* **Alternatives Considered:**
  1. *Registration Date (`createdAt`):* Unfairly penalizes users who research or complete KYC before investing.
  2. *Monthly Rolling Window:* Violates the strict 4-month rule.
* **System Consequence:** `achieverJob.js` evaluates from `user.firstInvestmentAt`. Clears `FEATURE_BLOCKED_B5`. Unblocks `TC-RNK-010`, `TC-RNK-011`, `TC-RNK-012`.
* **Business Risk Review:** Safe. Encourages immediate team building post-activation.

**Sign-off Decision B5:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B6: Precise Web3 Network & Contract Specification

* **PDF Reference:** Page 2, Section 7 & 8 ("Items to confirm: the precise Web3 wallet/network integration requirements.")
* **Ambiguity:** Target blockchain network and official USDT contract addresses unconfirmed in specification text.
* **Recommended Default:**
  * **Production Network:** BNB Smart Chain (BSC Mainnet) — Chain ID `56` (`0x38`).
  * **Staking / Test Network:** BSC Testnet — Chain ID `97` (`0x61`).
  * **Canonical USDT Contract (Mainnet):** `0x55d398326f99059fF775485246999027B3197955` (Binance-Peg BSC-USD, 18 Decimals).
  * **Canonical USDT Contract (Testnet):** `0x337610d27c682E347C9cD60BE4B3b107C9d34dDd` (Official BSC Testnet Faucet USDT, 18 Decimals).
  * Rejects all other chains (Ethereum, Polygon, Arbitrum).
* **Rationale:** BSC provides low transaction fees ($< \$0.10$) and 3-second block finality.
* **System Consequence:** `blockchainService.js` enforces strict chain ID and approved token contract lists. Clears `FEATURE_BLOCKED_B6`. Unblocks `TC-SEC-001`, `TC-SEC-002`, `TC-SEC-003`.
* **Business Risk Review:** Safe. Prevents counterfeit token deposits.

**Sign-off Decision B6:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B7: MAIN Wallet Currency Model (Dual-Currency Accounting)

* **PDF Reference:** Page 1, Section 2 ("Reference conversion used: $1 = ₹100.") & Page 2, Section 6 ("Main Wallet and Referral Wallet with transaction history.")
* **Ambiguity:** Does the MAIN wallet convert all deposits into a single currency (INR), or maintain segregated multi-currency sub-ledgers?
* **Recommended Default:**
  * **Multi-Currency Segregated Ledger:** The `MAIN` wallet internally tracks separate spendable balances: `balanceINR` (for fiat UPI/NEFT) and `balanceUSDT` (for BEP-20 on-chain).
  * The $\$1 = ₹100$ parity is applied as an **investment valuation parity**, not an automatic balance conversion. Packages can be purchased using either ₹10,000 INR or $100.00 USDT.
* **Rationale:** Automatic currency conversion introduces foreign exchange liability and banking reconciliation discrepancies.
* **System Consequence:** `Wallet` model maintains `balanceINR` and `balanceUSDT` independently under `MAIN`. Clears `FEATURE_BLOCKED_B7`. Unblocks `TC-ROI-011`.
* **Business Risk Review:** Safe. Eliminates platform FX risk.

**Sign-off Decision B7:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B8: ₹1 Crore Rank Reward Payout Destination Wallet

* **PDF Reference:** Page 2, Section 6 (Two wallets: Main and Referral)
* **Ambiguity:** Should rank rewards credit the `MAIN` wallet or the `REFERRAL` wallet?
* **Recommended Default:**
  * **All Rank Rewards (including the ₹1 Crore Tier 6 bonus) credit the `MAIN` wallet's available spendable balance.**
* **Rationale:** Rank rewards represent executive business leadership bonuses, distinct from daily referral lineage commissions. Placing them in `MAIN` enables immediate re-staking or withdrawal without transfer friction.
* **System Consequence:** `rewardService.js` routes all rank bonuses to `walletType: 'main'`. Clears `FEATURE_BLOCKED_B8`. Unblocks `TC-RNK-006`, `TC-RNK-007`.
* **Business Risk Review:** Safe. Consistent with user incentive alignment.

**Sign-off Decision B8:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Decision B9: Principal Withdrawability During Active Staking

* **PDF Reference:** Page 1, Section 3 & Page 2, Section 6
* **Ambiguity:** Can a user withdraw their staked investment principal before the package completes, or is principal locked?
* **Recommended Default:**
  * **Principal is strictly LOCKED for the entire package lifetime (`MAIN.lockedPrincipal`).**
  * Only daily ROI earnings and approved deposits residing in `MAIN.available` can be withdrawn. Staked principal cannot be prematurely withdrawn.
* **Rationale:** Premature principal withdrawal enables arbitrage (collecting daily yields and immediately withdrawing principal). Staking yields are economically supported only by locked liquidity.
* **System Consequence:** `withdrawalController.js` validates against `MAIN.available` (excluding `lockedPrincipal`). Enforces Model A invariants.
* **Business Risk Review:** Safe. Critical for liquidity preservation.

**Sign-off Decision B9:**  
[ ] APPROVED AS RECOMMENDED  
[ ] MODIFIED: ________________________________________________  
**Signer Initials:** `_______` | **Date:** `___________`

---

### Appendix: Decisions-to-Code Mapping & Tests Unblocked

| Decision ID | Code Module Affected | Exact Logic Change Required | Tests Unblocked |
| :--- | :--- | :--- | :--- |
| **B1** | `backend/services/referralService.js` | Assign L5 to 2%, L10 to 1%, L25 to 0.25%. Remove `FEATURE_BLOCKED_B1`. | `TC-REF-009`, `TC-REF-015`, `TC-REF-016` |
| **B2** | `backend/jobs/roiJob.js` | Calculate 0.45% simple yield on original principal. Remove `FEATURE_BLOCKED_B2`. | `TC-ROI-001`, `TC-ROI-002`, `TC-ROI-012` |
| **B3** | `backend/services/rewardService.js` | Award ₹3,00,000 one-time flat bonus on ₹1Cr turnover. Remove `FEATURE_BLOCKED_B3`. | `TC-RNK-007` |
| **B4** | `backend/models/Investment.js` | Set package duration to 445 working days (200% ROI cap). Remove `FEATURE_BLOCKED_B4`. | `TC-ROI-013`, `TC-ROI-021` |
| **B5** | `backend/services/rewardService.js` | Anchor 120-day Achiever window to `firstInvestmentAt`. Remove `FEATURE_BLOCKED_B5`. | `TC-RNK-010`, `TC-RNK-011`, `TC-RNK-012` |
| **B6** | `backend/services/blockchainService.js`| Enforce BSC Mainnet (`0x38`) / Testnet (`0x61`). Remove `FEATURE_BLOCKED_B6`. | `TC-SEC-001`, `TC-SEC-002`, `TC-SEC-003` |
| **B7** | `backend/models/Wallet.js` | Maintain independent `balanceINR` and `balanceUSDT` ledgers. Remove `FEATURE_BLOCKED_B7`. | `TC-ROI-011` |
| **B8** | `backend/services/rewardService.js` | Route rank reward payouts to `walletType: 'main'`. Remove `FEATURE_BLOCKED_B8`. | `TC-RNK-006` |
| **B9** | `backend/controllers/withdrawalController.js`| Debit from `MAIN.available` only. Preserve `lockedPrincipal`. | `TC-WAL-002`, `TC-WTH-002`, `TC-WTH-005` |

---

### Formal Executive Sign-off Block

By signing below, the authorized executive stakeholders formally approve Decisions B1 through B9 as the definitive business and engineering specification for the UNICORN platform.

```
__________________________________              __________________________________
Product Management Lead                         Chief Technology Officer / Tech Lead
Date: ____________________________              Date: ____________________________

__________________________________              __________________________________
Financial Controller / Compliance Lead          Head of Quality Assurance
Date: ____________________________              Date: ____________________________
```

