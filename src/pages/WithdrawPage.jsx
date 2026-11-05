import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function WithdrawPage() {
  const { user, web3Address, submitDirectWithdraw, navigateTo, showToast, openLoginModal, currency, currencySymbol, formatCurrency } = useApp();

  const [wallet, setWallet] = useState('roi'); // 'roi' | 'referral'
  const [method, setMethod] = useState('upi'); // 'upi' | 'usdt'
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState(user?.bankDetails?.upiId || '');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '36px 24px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', color: 'var(--text)' }}>Authentication Required</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Please log in to your UNICORN account to initiate payouts from your ROI Wallet or Referral Wallet with 2FA protection.
        </p>
        <button
          onClick={openLoginModal}
          className="btnp btnw"
          style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 600, borderRadius: '12px', cursor: 'pointer' }}
        >
          Log In / Register
        </button>
      </div>
    );
  }

  const activeBalance = wallet === 'roi' ? (user.roiWalletBalance || 0) : (user.referralWalletBalance || 0);

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
    if (numAmt > activeBalance) {
      showToast('Insufficient wallet balance', 'error');
      return;
    }
    if (wallet === 'roi' && (!destination || destination.trim().length === 0)) {
      showToast(method === 'upi' ? 'Please enter your UPI ID' : 'Please enter your BEP-20 address', 'error');
      return;
    }
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      showToast('Please enter your 6-digit Google Authenticator code', 'error');
      return;
    }

    submitDirectWithdraw({
      walletType: wallet,
      method: wallet === 'referral' ? 'roi' : method,
      amount: numAmt,
      destination: wallet === 'referral' ? 'ROI Wallet' : destination.trim(),
      otp: twoFactorCode.trim()
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {/* Main Withdraw Card matching Image 1 */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow)'
        }}
      >
        {/* Prominent Header with Back Button matching reference */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            aria-label="Back to dashboard"
            className="header-back-btn"
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #B55CA9 0%, #8A70D6 50%, #4C8CF5 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(181, 92, 169, 0.35)',
              flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
            Withdraw
          </h1>
        </div>

        {/* Section 1: Withdraw from */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            Withdraw from
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* ROI Wallet Card */}
            <button
              type="button"
              onClick={() => setWallet('roi')}
              style={{
                borderRadius: '16px',
                padding: '16px 18px',
                background: wallet === 'roi' ? 'var(--grad)' : 'var(--surface2)',
                border: wallet === 'roi' ? '1px solid transparent' : '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                color: wallet === 'roi' ? '#ffffff' : 'var(--text)',
                transition: 'all 0.15s ease',
                boxShadow: wallet === 'roi' ? '0 6px 18px rgba(181, 92, 169, 0.35)' : 'none'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, display: 'block', color: wallet === 'roi' ? '#ffffff' : 'var(--muted)' }}>
                ROI wallet
              </span>
              <span className="num" style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                {formatCurrency(user.roiWalletBalance)}
              </span>
            </button>

            {/* Referral Wallet Card */}
            <button
              type="button"
              onClick={() => setWallet('referral')}
              style={{
                borderRadius: '16px',
                padding: '16px 18px',
                background: wallet === 'referral' ? 'var(--grad)' : 'var(--surface2)',
                border: wallet === 'referral' ? '1px solid transparent' : '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                color: wallet === 'referral' ? '#ffffff' : 'var(--text)',
                transition: 'all 0.15s ease',
                boxShadow: wallet === 'referral' ? '0 6px 18px rgba(181, 92, 169, 0.35)' : 'none'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, display: 'block', color: wallet === 'referral' ? '#ffffff' : 'var(--muted)' }}>
                Referral wallet
              </span>
              <span className="num" style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                {formatCurrency(user.referralWalletBalance)}
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: Receive in */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            Receive in
          </span>
          {wallet === 'referral' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--grad)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(181, 92, 169, 0.28)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>💼</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>ROI wallet</span>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Referral wallet funds can only be withdrawn in ROI wallet.
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                padding: '4px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => handleMethodChange('upi')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: method === 'upi' ? 'var(--grad)' : 'transparent',
                  color: method === 'upi' ? '#ffffff' : 'var(--muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                INR (UPI)
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('usdt')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: method === 'usdt' ? 'var(--grad)' : 'transparent',
                  color: method === 'usdt' ? '#ffffff' : 'var(--muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                USDT (BEP-20)
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            Amount ({wallet === 'referral' || method === 'upi' ? (currency === 'USD' ? 'USD' : 'INR') : 'USDT'})
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`${currencySymbol}0`}
            style={{
              height: '48px',
              borderRadius: '12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '16px',
              fontWeight: 600,
              padding: '0 16px',
              outline: 'none',
              width: '100%',
              fontFamily: 'Space Grotesk, monospace',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Section 4: Destination */}
        {wallet === 'referral' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
              Destination Account
            </span>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💼</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    Your ROI Wallet
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Current balance: {formatCurrency(user.roiWalletBalance || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                {method === 'upi' ? 'UPI ID' : 'USDT Receiving Address'}
              </span>
              {method === 'usdt' && (
                <span style={{ fontSize: '11.5px', color: 'var(--accent-text)', fontWeight: 600, background: 'var(--surface2)', padding: '2px 8px', borderRadius: '6px' }}>
                  Network: BEP-20
                </span>
              )}
            </div>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={method === 'upi' ? 'name@bank' : '0x... BEP-20 address'}
              style={{
                height: '48px',
                borderRadius: '12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '14px',
                padding: '0 16px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            {method === 'usdt' && (
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Please provide a valid <strong>BEP-20 (BNB Smart Chain)</strong> address for USDT payout.
              </span>
            )}
          </div>
        )}

        {/* Section 5: 2FA Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            2FA code
          </span>
          <input
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="6-digit code from your authenticator"
            maxLength={6}
            style={{
              height: '48px',
              borderRadius: '12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '14px',
              padding: '0 16px',
              outline: 'none',
              width: '100%',
              letterSpacing: '0.04em',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Section 6: Action Button */}
        <div style={{ marginTop: '6px' }}>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btnp btnw"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="gt">
              {wallet === 'referral' ? 'Withdraw to ROI Wallet' : 'Withdraw'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
