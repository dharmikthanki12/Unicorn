import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function WithdrawPage() {
  const { user, web3Address, initiateWithdrawal, navigateTo, showToast, openLoginModal } = useApp();

  const [wallet, setWallet] = useState('roi');
  const [method, setMethod] = useState('upi');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState(user?.bankDetails?.upiId || '');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '36px 24px' }} className="card">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px' }}>Authentication Required</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Please log in to your UNICORN account to initiate payouts from your ROI Wallet or Referral Wallet with 2FA protection.
        </p>
        <button
          onClick={openLoginModal}
          className="btnp btnw"
          style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 600 }}
        >
          Log In / Register
        </button>
      </div>
    );
  }

  const activeBalance = wallet === 'roi' ? (user.roiWalletBalance || 0) : (user.referralWalletBalance || 0);

  const handlePercentage = (pct) => {
    const val = Math.floor((activeBalance * pct) / 100);
    setAmount(String(val));
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    if (newMethod === 'upi') {
      setDestination(user?.bankDetails?.upiId || '');
    } else {
      setDestination(user?.web3Address || web3Address || '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!amount || isNaN(numAmt) || numAmt <= 0) {
      showToast('Enter valid withdrawal amount', 'error');
      return;
    }
    if (numAmt < 1000) {
      showToast('Minimum payout is ₹1,000 ($10)', 'error');
      return;
    }
    if (numAmt > activeBalance) {
      showToast('Insufficient wallet balance', 'error');
      return;
    }
    initiateWithdrawal(wallet, method, amount, destination);
  };

  return (
    <div style={{ width: '100%', maxWidth: '560px', margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back Button matching Unicorn_Mobile_App.html Screen 20 */}
      <button
        onClick={() => navigateTo('home')}
        style={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '44px',
          padding: '0 12px 0 4px',
          background: 'transparent',
          border: 0,
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--text2)',
          cursor: 'pointer'
        }}
      >
        <Icon d={ICONS.back} size={20} />
        <span>Back</span>
      </button>

      {/* Main Card matching file */}
      <section className="card" style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Withdraw</h1>

        {/* Withdraw from (Wallets) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>Withdraw from</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setWallet('roi')}
              className={`wal ${wallet === 'roi' ? 'on' : ''}`}
              style={{ flex: '1 1 200px', minWidth: 0, padding: '14px 16px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600 }}>ROI wallet</span>
              <span className="num" style={{ fontSize: '20px', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                ₹{user.roiWalletBalance.toLocaleString('en-IN')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWallet('ref')}
              className={`wal ${wallet === 'ref' ? 'on' : ''}`}
              style={{ flex: '1 1 200px', minWidth: 0, padding: '14px 16px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Referral wallet</span>
              <span className="num" style={{ fontSize: '20px', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                ₹{user.referralWalletBalance.toLocaleString('en-IN')}
              </span>
            </button>
          </div>
        </div>

        {/* Receive in (Methods) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>Receive in</h2>
          <div role="group" aria-label="Payout method" style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <button
              type="button"
              onClick={() => handleMethodChange('upi')}
              className={`seg ${method === 'upi' ? 'on' : ''}`}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
            >
              INR (UPI / Bank)
            </button>
            <button
              type="button"
              onClick={() => handleMethodChange('usdt')}
              className={`seg ${method === 'usdt' ? 'on' : ''}`}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
            >
              USDT (BEP-20)
            </button>
          </div>
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="amt" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>Amount (INR)</label>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Max: <strong className="num" style={{ color: 'var(--pos)' }}>₹{activeBalance.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <input
            id="amt"
            className="field"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹0"
            style={{
              height: '52px',
              borderRadius: '14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              fontSize: '18px',
              fontWeight: 600,
              padding: '0 16px',
              outline: 'none'
            }}
          />

          {/* Presets */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentage(pct)}
                className="chip"
                style={{ flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="dest" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>
            {method === 'upi' ? 'UPI ID / VPA' : 'BEP-20 USDT Wallet Address'}
          </label>
          <input
            id="dest"
            className="field"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={method === 'upi' ? 'name@bank' : '0x... BEP-20 address'}
            style={{
              height: '52px',
              borderRadius: '14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              fontSize: '15px',
              padding: '0 16px',
              outline: 'none'
            }}
          />
        </div>

        {/* 2FA Prompt Note */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(181, 92, 169, 0.08)',
          border: '1px solid rgba(181, 92, 169, 0.2)',
          fontSize: '12px',
          color: 'var(--accent-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon d={ICONS.security} size={18} />
          <span>Section 5 Security: 2FA Google Authenticator verification will open upon submitting.</span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="btnp btnw"
          style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
        >
          <span className="gt">Withdraw ₹{Number(amount || 0).toLocaleString('en-IN')}</span>
        </button>
      </section>
    </div>
  );
}
