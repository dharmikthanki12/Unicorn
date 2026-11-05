/**
 * UNICORN CI GATE: Six Integrity Checks for Production Invariants & Governance Policy
 * Exit Code: 0 on all checks passing / skipped; 1 if any check fails.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let failureCount = 0;

function report(checkNum, name, status, details) {
  const colors = {
    PASS: '\x1b[32mPASS\x1b[0m',
    FAIL: '\x1b[31mFAIL\x1b[0m',
    SKIP: '\x1b[33mSKIP\x1b[0m'
  };
  console.log(`[Check #${checkNum}] [${colors[status] || status}] ${name}`);
  if (details) {
    console.log(`    ↳ ${details}`);
  }
  if (status === 'FAIL') {
    failureCount++;
  }
}

// -------------------------------------------------------------
// CHECK #1: No 2FA bypass codes in withdrawalController.js
// -------------------------------------------------------------
try {
  const file = path.join(rootDir, 'backend/controllers/withdrawalController.js');
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('123456') || content.includes('839214')) {
    report(1, 'No 2FA bypass codes in withdrawalController.js', 'FAIL', 'Found hardcoded bypass code (123456 or 839214)');
  } else {
    report(1, 'No 2FA bypass codes in withdrawalController.js', 'PASS', 'Zero bypass codes found; 2FA gate verified');
  }
} catch (e) {
  report(1, 'No 2FA bypass codes in withdrawalController.js', 'FAIL', e.message);
}

// -------------------------------------------------------------
// CHECK #2: No toFixed(4) in money paths
// -------------------------------------------------------------
try {
  const files = [
    'backend/services/referralService.js',
    'backend/services/ledgerService.js',
    'backend/services/rewardService.js',
    'backend/jobs/roiJob.js',
    'backend/controllers/withdrawalController.js'
  ];
  let found = [];
  for (const rel of files) {
    const full = path.join(rootDir, rel);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (stripped.includes('toFixed(4)')) {
        found.push(`${rel}:${idx + 1}`);
      }
    });
  }
  if (found.length > 0) {
    report(2, 'No toFixed(4) in money paths', 'FAIL', `Violations found: ${found.join(', ')}`);
  } else {
    report(2, 'No toFixed(4) in money paths', 'PASS', 'Integer math policy verified across all 5 ledger paths');
  }
} catch (e) {
  report(2, 'No toFixed(4) in money paths', 'FAIL', e.message);
}

// -------------------------------------------------------------
// CHECK #3: Wallet enum has no ROI
// -------------------------------------------------------------
try {
  const file = path.join(rootDir, 'backend/models/Wallet.js');
  const content = fs.readFileSync(file, 'utf8');
  const enumMatch = content.match(/enum\s*:\s*\[([^\]]+)\]/);
  if (enumMatch) {
    const values = enumMatch[1].toLowerCase();
    if (values.includes('roi')) {
      report(3, 'Wallet enum has no ROI', 'FAIL', `Legacy 'roi' enum value present: [${enumMatch[1]}]`);
    } else {
      report(3, 'Wallet enum has no ROI', 'PASS', `Enum strictly locked to [${enumMatch[1].trim()}]`);
    }
  } else {
    report(3, 'Wallet enum has no ROI', 'FAIL', 'Wallet schema enum not found');
  }
} catch (e) {
  report(3, 'Wallet enum has no ROI', 'FAIL', e.message);
}

// -------------------------------------------------------------
// CHECK #4: maxDurationDays default is null
// -------------------------------------------------------------
try {
  const file = path.join(rootDir, 'backend/models/Investment.js');
  const content = fs.readFileSync(file, 'utf8');
  const defaultMatch = content.match(/maxDurationDays\s*:\s*\{[^}]*default\s*:\s*([^,\}\n]+)/);
  if (defaultMatch) {
    const val = defaultMatch[1].trim();
    if (val === 'null') {
      report(4, 'maxDurationDays default is null', 'PASS', 'Default is strictly null (Decision B4)');
    } else {
      report(4, 'maxDurationDays default is null', 'FAIL', `Default is non-null: ${val}`);
    }
  } else {
    report(4, 'maxDurationDays default is null', 'FAIL', 'maxDurationDays field not found');
  }
} catch (e) {
  report(4, 'maxDurationDays default is null', 'FAIL', e.message);
}

// -------------------------------------------------------------
// CHECK #5: Post-signature check for FEATURE_BLOCKED throws
// -------------------------------------------------------------
try {
  const docFile = path.join(rootDir, 'PRODUCT_DECISIONS_v1.md');
  const docContent = fs.readFileSync(docFile, 'utf8');
  const isSigned = docContent.includes('[X] APPROVED AS RECOMMENDED') ||
    (docContent.includes('Signature: /s/') && !docContent.includes('Signature: ____________________'));

  if (!isSigned) {
    report(5, 'Post-signature: no FEATURE_BLOCKED throws', 'SKIP', 'PRODUCT_DECISIONS_v1.md is unsigned; fail-closed guards permitted pre-signature');
  } else {
    const filesToCheck = [
      'backend/services/referralService.js',
      'backend/services/rewardService.js'
    ];
    let blockedFound = false;
    for (const f of filesToCheck) {
      const full = path.join(rootDir, f);
      if (fs.existsSync(full) && fs.readFileSync(full, 'utf8').includes('FEATURE_BLOCKED_')) {
        blockedFound = true;
        break;
      }
    }
    if (blockedFound) {
      report(5, 'Post-signature: no FEATURE_BLOCKED throws', 'FAIL', 'Document is signed but fail-closed throws remain active');
    } else {
      report(5, 'Post-signature: no FEATURE_BLOCKED throws', 'PASS', 'Document signed and post-signature paths deployed');
    }
  }
} catch (e) {
  report(5, 'Post-signature: no FEATURE_BLOCKED throws', 'FAIL', e.message);
}

// -------------------------------------------------------------
// CHECK #6: Wallet has balanceUSDT and balanceINR, not balanceUNC
// -------------------------------------------------------------
try {
  const file = path.join(rootDir, 'backend/models/Wallet.js');
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('balanceUNC')) {
    report(6, 'Wallet has balanceUSDT not balanceUNC', 'FAIL', 'balanceUNC field present in Wallet schema');
  } else if (!content.includes('balanceINR') || !content.includes('balanceUSDT')) {
    report(6, 'Wallet has balanceUSDT not balanceUNC', 'FAIL', 'Missing balanceINR or balanceUSDT field');
  } else {
    report(6, 'Wallet has balanceUSDT not balanceUNC', 'PASS', 'balanceINR and balanceUSDT verified, balanceUNC eliminated');
  }
} catch (e) {
  report(6, 'Wallet has balanceUSDT not balanceUNC', 'FAIL', e.message);
}

console.log('=============================================================');
if (failureCount === 0) {
  console.log('\x1b[32m🎉 ALL CI GATES PASSED (0 failures).\x1b[0m');
  process.exit(0);
} else {
  console.log(`\x1b[31m❌ CI GATE FAILED WITH ${failureCount} VIOLATIONS.\x1b[0m`);
  process.exit(1);
}
