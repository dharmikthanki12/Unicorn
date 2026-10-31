import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function WithdrawPage() {
  const { user, web3Address, submitDirectWithdraw, navigateTo, showToast, openLoginModal } = useApp();

  const [wallet, setWallet] = useState('roi'); // 'roi' | 'referral'
  const [method, setMethod] = useState('upi'); // 'upi' | 'usdt'
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState(user?.bankDetails?.upiId || '');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '36px 24px', background: '#11131c', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#ffffff' }}>Authentication Required</h2>
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
    if (!destination || destination.trim().length === 0) {
      showToast(method === 'upi' ? 'Please enter your UPI ID' : 'Please enter your BEP-20 address', 'error');
      return;
    }
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      showToast('Please enter your 6-digit Google Authenticator code', 'error');
      return;
    }

    submitDirectWithdraw({
      walletType: wallet,
      method,
      amount: numAmt,
      destination: destination.trim(),
      otp: twoFactorCode.trim()
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {/* Back button matching reference design */}
      <button
        onClick={() => navigateTo('home')}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#9499ad',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '0 0 16px 4px'
        }}
      >
        <Icon d={ICONS.arrowBack} size={16} />
        <span>Back</span>
      </button>

      {/* Main Withdraw Card matching Image 1 */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#11131c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Title */}
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
          Withdraw
        </h1>

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
                background: wallet === 'roi' ? 'var(--grad)' : 'rgba(255, 255, 255, 0.03)',
                border: wallet === 'roi' ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#ffffff',
                transition: 'all 0.15s ease',
                boxShadow: wallet === 'roi' ? '0 6px 18px rgba(181, 92, 169, 0.35)' : 'none'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, display: 'block', color: wallet === 'roi' ? '#ffffff' : 'var(--muted)' }}>
                ROI wallet
              </span>
              <span className="num" style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                ₹{user.roiWalletBalance.toLocaleString('en-IN')}
              </span>
            </button>

            {/* Referral Wallet Card */}
            <button
              type="button"
              onClick={() => setWallet('referral')}
              style={{
                borderRadius: '16px',
                padding: '16px 18px',
                background: wallet === 'referral' ? 'var(--grad)' : 'rgba(255, 255, 255, 0.03)',
                border: wallet === 'referral' ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#ffffff',
                transition: 'all 0.15s ease',
                boxShadow: wallet === 'referral' ? '0 6px 18px rgba(181, 92, 169, 0.35)' : 'none'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, display: 'block', color: wallet === 'referral' ? '#ffffff' : 'var(--muted)' }}>
                Referral wallet
              </span>
              <span className="num" style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                ₹{user.referralWalletBalance.toLocaleString('en-IN')}
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: Receive in */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            Receive in
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
        </div>

        {/* Section 3: Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            Amount ({method === 'upi' ? 'INR' : 'USDT'})
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹0"
            style={{
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
            {method === 'upi' ? 'UPI ID' : 'BEP-20 Address'}
          </span>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={method === 'upi' ? 'name@bank' : '0x... BEP-20 address'}
            style={{
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '14px',
              padding: '0 16px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>

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
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
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
            className="btnp"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              background: 'transparent'
            }}
          >
            Withdraw
          </button>
        </div>
      </form>
    </div>
  );
}
