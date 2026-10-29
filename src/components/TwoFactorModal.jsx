import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function TwoFactorModal() {
  const {
    is2FAModalOpen,
    setIs2FAModalOpen,
    twoFactorOtpCode,
    pendingWithdrawData,
    confirmWithdrawalWith2FA
  } = useApp();

  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!is2FAModalOpen || !pendingWithdrawData) return null;

  const handleVerify = (e) => {
    e.preventDefault();
    if (otpInput.length < 6) {
      setErrorMsg('Please enter a complete 6-digit code');
      return;
    }
    const success = confirmWithdrawalWith2FA(otpInput);
    if (!success) {
      setErrorMsg('Invalid code. Use the mock code shown below.');
    }
  };

  const handleAutoFill = () => {
    setOtpInput(twoFactorOtpCode);
    setErrorMsg('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '350px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--icon-bg)',
            color: 'var(--accent-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon d={ICONS.security} size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            2FA Security Verification
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
            Enter your 6-digit authenticator code to authorize this withdrawal of 
            <strong style={{ color: 'var(--text)' }}> ₹{pendingWithdrawData.amount.toLocaleString('en-IN')}</strong>.
          </span>
        </div>

        {/* Withdrawal destination summary */}
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
            <span>Source:</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{pendingWithdrawData.walletLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
            <span>Destination:</span>
            <span style={{ color: 'var(--accent-text)', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pendingWithdrawData.destination}
            </span>
          </div>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="••••••"
              autoFocus
              className="num"
              style={{
                width: '180px',
                height: '50px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '10px',
                background: 'var(--surface2)',
                border: errorMsg ? '2px solid #ff5c77' : '2px solid var(--border2)',
                borderRadius: '14px',
                color: 'var(--text)',
                outline: 'none'
              }}
            />
            {errorMsg && (
              <span style={{ fontSize: '12px', color: '#ff5c77', textAlign: 'center' }}>
                {errorMsg}
              </span>
            )}
          </div>

          {/* Test Code auto-fill helper */}
          <div style={{
            background: 'var(--icon-bg)',
            border: '1px dashed var(--accent-text)',
            borderRadius: '10px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--muted)' }}>
              Authenticator Code: <strong className="num" style={{ color: 'var(--accent-text)' }}>{twoFactorOtpCode}</strong>
            </span>
            <button
              type="button"
              onClick={handleAutoFill}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-text)',
                background: 'var(--surface)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border2)'
              }}
            >
              Fill Code
            </button>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIs2FAModalOpen(false)}
              className="btns"
              style={{ flex: 1, height: '46px', fontSize: '14px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btnp btnw"
              style={{ flex: 1, height: '46px', fontSize: '14px' }}
            >
              Confirm 2FA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

