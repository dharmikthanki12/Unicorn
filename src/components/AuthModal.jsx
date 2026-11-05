import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authAPI } from '../services/api';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
    theme
  } = useApp();

  // Registration step states: 1 = Email OTP verification, 2 = Complete User Details (including Phone Number)
  const [regStep, setRegStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const switchMode = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    if (mode === 'register') {
      setRegStep(1);
      setOtpSent(false);
      setOtp('');
      setVerificationToken('');
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.sendEmailOtp(email.trim().toLowerCase());
      setOtpSent(true);
      setSuccessMsg(res.message || 'OTP verification code sent to your email!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!otp || otp.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyEmailOtp(email.trim().toLowerCase(), otp.trim());
      setVerificationToken(res.verificationToken || 'verified');
      setSuccessMsg('Email verified successfully! Opening details form...');
      setTimeout(() => {
        setRegStep(2);
        setSuccessMsg('');
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please provide your full name.');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!phone.trim() || digitsOnly.length < 8) {
      setErrorMsg('Please provide a valid mobile phone number (at least 8 digits).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    setLoading(true);
    try {
      await register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
        referralCode.trim(),
        phone.trim(),
        verificationToken,
        'email'
      );
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const idVal = loginIdentifier.trim() || email.trim();
    if (!idVal || !password) {
      setErrorMsg('Please enter your email or phone number and password.');
      return;
    }
    setLoading(true);
    try {
      const ok = await login(idVal, password);
      if (!ok) {
        setErrorMsg('Invalid email, phone number, or password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '430px',
        maxHeight: '90vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: 'clamp(20px, 4vw, 28px) clamp(16px, 4vw, 24px)',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img
            src={theme === 'dark' ? '/uc-fincorp-two-weight-on-dark.png' : '/uc-fincorp-two-weight-on-light.png'}
            alt="Unicorn"
            style={{
              height: '42px',
              width: 'auto',
              maxWidth: '220px',
              objectFit: 'contain',
              display: 'block',
              marginBottom: '4px'
            }}
          />
          <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700 }}>
            {authMode === 'login'
              ? 'Sign In to UNICORN'
              : regStep === 1
              ? 'Verify Email with OTP'
              : 'Complete Your Account'}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {authMode === 'login'
              ? 'Fintech Investment & Yield Platform'
              : regStep === 1
              ? 'Step 1 of 2: Get verified via 6-digit email OTP'
              : 'Step 2 of 2: Enter your details & mobile phone number'}
          </span>
        </div>

        {/* Mode Tabs (Sign In / Register) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--input-bg)',
          borderRadius: '12px',
          padding: '4px'
        }}>
          <button
            type="button"
            onClick={() => switchMode('login')}
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
            onClick={() => switchMode('register')}
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

        {/* Alerts */}
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

        {successMsg && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.12)',
            border: '1px solid rgba(76, 175, 80, 0.4)',
            color: 'var(--pos)',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        {/* ======================================================== */}
        {/* CASE 1: LOGIN (EMAIL OR PHONE NUMBER)                    */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                Email Address or Phone Number
              </label>
              <input
                type="text"
                placeholder="Enter email or phone number"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
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
                placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={loading}
              className="btnp btnw"
              style={{ width: '100%', height: '46px', fontSize: '15px', fontWeight: 600, marginTop: '4px', cursor: 'pointer' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* CASE 2: REGISTRATION STEP 1 - EMAIL OTP VERIFICATION     */}
        {/* ======================================================== */}
        {authMode === 'register' && regStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                Your Email Address *
              </label>
              <input
                type="email"
                placeholder="Enter email to receive 6-digit OTP"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent && loading}
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

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !email}
                className="btnp btnw"
                style={{ width: '100%', height: '46px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      6-Digit Verification Code (OTP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-text)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Change email
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border2)',
                      borderRadius: '10px',
                      padding: '0 14px',
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '6px',
                      textAlign: 'center',
                      color: 'var(--text)'
                    }}
                  />
                </div>

                <div style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  textAlign: 'center',
                  background: 'var(--surface2)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  lineHeight: 1.5
                }}>
                  📩 A 6-digit verification code has been sent to <strong style={{ color: 'var(--text)' }}>{email}</strong> from <strong style={{ color: 'var(--accent-text)' }}>dharmikthanki5050@gmail.com</strong>.<br />
                  Please check your Gmail inbox (and Spam folder) to enter the code.
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="btnp btnw"
                  style={{ width: '100%', height: '46px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* CASE 3: REGISTRATION STEP 2 - USER DETAILS & PHONE NUMBER */}
        {/* ======================================================== */}
        {authMode === 'register' && regStep === 2 && (
          <form onSubmit={handleCompleteSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Verified Email Banner */}
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Verified Email</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{email}</div>
              </div>
              <span style={{
                background: 'var(--pos)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                ✓ Verified
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '5px' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Vikram Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '42px',
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '5px' }}>
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '42px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0 14px',
                  fontSize: '14px',
                  color: 'var(--text)'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '5px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '5px' }}>
                  Confirm *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '0 14px',
                    fontSize: '14px',
                    color: 'var(--text)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '5px' }}>
                Sponsor Referral Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UNC88294 or UNCADMIN"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  height: '42px',
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

            <button
              type="submit"
              disabled={loading}
              className="btnp btnw"
              style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 600, marginTop: '6px', cursor: 'pointer' }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
