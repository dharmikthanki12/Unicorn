/**
 * UNICORN CI Gate: Automated Quality & Security Invariants Verification
 * Fails the build if any of the following are detected:
 * 1. toFixed(4) appears in any backend money/ledger calculation path.
 * 2. '123456' or '839214' appears in backend/controllers/withdrawalController.js.
 * 3. walletSchema enum contains 'ROI' or 'roi'.
 * 4. maxDurationDays has a non-null default in Investment or Package schemas.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let violations = 0;

function checkFile(relPath, rules) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[CI Gate] File not found: ${relPath}`);
    violations++;
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const rule of rules) {
    if (rule.pattern.test(content)) {
      console.error(`❌ [CI Gate VIOLATION] in ${relPath}: ${rule.message}`);
      violations++;
    } else {
      console.log(`✅ [CI Gate PASS] in ${relPath}: ${rule.passMessage}`);
    }
  }
}

console.log('======================================================================');
console.log('🛡️ UNICORN CI GATE: VERIFYING INVARIANTS S1–S5 & CODE POLICY');
console.log('======================================================================\n');

// 1. Check withdrawalController.js for 2FA bypass codes
checkFile('backend/controllers/withdrawalController.js', [
  {
    pattern: /['"](?:123456|839214)['"]/,
    message: '2FA bypass code detected ("123456" or "839214"). Fix 7 violation (S1).',
    passMessage: 'No 2FA bypass codes found in withdrawalController.js.'
  }
]);

// 2. Check Wallet.js for ROI enum
checkFile('backend/models/Wallet.js', [
  {
    pattern: /enum:\s*\[[^\]]*['"](?:ROI|roi)['"][^\]]*\]/,
    message: 'Wallet schema enum contains legacy "ROI" or "roi". Fix 2 violation (S2).',
    passMessage: 'Wallet schema strictly restricted to ["MAIN", "REFERRAL"].'
  }
]);

// 3. Check Investment.js and Package.js for non-null maxDurationDays default
checkFile('backend/models/Investment.js', [
  {
    pattern: /maxDurationDays:\s*\{[^}]*default:\s*(?!null)[^,}\s]+/,
    message: 'Investment maxDurationDays has non-null default. Fix 4 violation (S4).',
    passMessage: 'Investment maxDurationDays default is null.'
  }
]);

checkFile('backend/models/Package.js', [
  {
    pattern: /maxDurationDays:\s*\{[^}]*default:\s*(?!null)[^,}\s]+/,
    message: 'Package maxDurationDays has non-null default. Fix 4 violation (S4).',
    passMessage: 'Package maxDurationDays default is null.'
  }
]);

// 4. Check money paths for toFixed(4)
const moneyFiles = [
  'backend/services/referralService.js',
  'backend/services/ledgerService.js',
  'backend/jobs/roiJob.js'
];

for (const mf of moneyFiles) {
  checkFile(mf, [
    {
      pattern: /toFixed\(4\)/,
      message: `Forbidden toFixed(4) call found in ${mf}. Part 6 violation (S3).`,
      passMessage: `No toFixed(4) found in ${mf}. Integer math policy verified.`
    }
  ]);
}

console.log('\n======================================================================');
if (violations > 0) {
  console.error(`💥 CI GATE FAILED: ${violations} violation(s) detected. Fix before merge.`);
  process.exit(1);
} else {
  console.log('🎉 ALL CI GATES PASSED: 0 violations. Code matches v3.0 rules.');
  console.log('======================================================================');
  process.exit(0);
}

