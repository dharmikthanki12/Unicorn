import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    login,
    register
  } = useApp();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        if (!email || !password) {
          setErrorMsg('Please enter both email and password.');
          setLoading(false);
          return;
        }
        await login(email, password);
      } else {
        if (!name || !email || !password) {
          setErrorMsg('Please provide your name, email, and password.');
          setLoading(false);
          return;
        }
        await register(name, email, password, referralCode);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: '20px',
            color: 'var(--muted)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '4px'
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'var(--icon-bg)',
            color: 'var(--accent-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🦄
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700 }}>
            {authMode === 'login' ? 'Sign In to UNICORN' : 'Create an Account'}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {authMode === 'login' ? 'Web3-enabled Investment & Yield Protocol' : 'Join and earn 0.45% daily ROI + team rewards'}
          </span>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--input-bg)',
          borderRadius: '12px',
          padding: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: authMode === 'login' ? 'var(--surface)' : 'transparent',
              color: authMode === 'login' ? 'var(--text)' : 'var(--muted)',
              boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: authMode === 'register' ? 'var(--surface)' : 'transparent',
              color: authMode === 'register' ? 'var(--text)' : 'var(--muted)',
              boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {authMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vikram Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '14px',
                  color: 'var(--text)'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. user@unicorn.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                height: '44px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0 14px',
                fontSize: '14px',
                color: 'var(--text)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: '44px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0 14px',
                fontSize: '14px',
                color: 'var(--text)'
              }}
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                Sponsor Referral Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UNC88294 or UNCADMIN"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '14px',
                  color: 'var(--text)',
                  textTransform: 'uppercase'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btnp btnw"
            style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 600, marginTop: '6px', cursor: 'pointer' }}
          >
            {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

