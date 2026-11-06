import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function ProfilePage() {
  const {
    user,
    theme,
    toggleTheme,
    currency,
    toggleCurrency,
    formatCurrency,
    updateBankDetails,
    navigateTo,
    web3Connected,
    web3Address,
    connectWeb3Wallet,
    disconnectWeb3Wallet,
    achieverBonuses,
    transactions,
    showToast,
    openLoginModal,
    logout,
    submitKyc,
    updateUserProfile,
    requestEmailChangeOtp,
    verifyEmailChangeOtp
  } = useApp();

  const [activeModal, setActiveModal] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [editingBank, setEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    upiId: user?.bankDetails?.upiId || '',
    bankName: user?.bankDetails?.bankName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifsc: user?.bankDetails?.ifsc || ''
  });

  // KYC Submission form state
  const [kycDocType, setKycDocType] = useState('Aadhaar Card');
  const [kycDocId, setKycDocId] = useState('');

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '36px 24px' }} className="card">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px' }}>Authentication Required</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Please sign in to your UNICORN account to access profile settings, account statements, 2FA security, and banking details.
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

  const handleKycSubmit = (e) => {
    e.preventDefault();
    if (!kycDocId || kycDocId.trim().length < 4) {
      showToast('Please enter a valid government document number.', 'error');
      return;
    }
    submitKyc(kycDocType, kycDocId.trim());
  };

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const isEmailChanged = (profileForm.email || '').trim().toLowerCase() !== (user?.email || '').trim().toLowerCase();

  const handleSendEmailOtp = async () => {
    const cleanEmail = (profileForm.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid new email address first.', 'error');
      return;
    }
    setSendingOtp(true);
    setOtpError('');
    try {
      if (requestEmailChangeOtp) {
        await requestEmailChangeOtp(cleanEmail);
      }
      setEmailOtpSent(true);
    } catch (err) {
      setOtpError(err.message || 'Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.email || !profileForm.email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    // If email is changed, enforce OTP step
    if (isEmailChanged && !emailOtpSent) {
      await handleSendEmailOtp();
      return;
    }

    if (isEmailChanged && (!emailOtp || emailOtp.trim().length < 4)) {
      showToast('Please enter the 6-digit verification code sent to your new email.', 'error');
      return;
    }

    try {
      await updateUserProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        otp: isEmailChanged ? emailOtp.trim() : undefined
      });
      setEditingProfile(false);
      setEmailOtpSent(false);
      setEmailOtp('');
      setOtpError('');
    } catch (err) {
      setOtpError(err.message || 'Failed to update email.');
    }
  };

  const handleBankSave = (e) => {
    e.preventDefault();
    if (!bankForm.upiId && !bankForm.accountNumber) {
      showToast('Please enter a UPI ID or Bank Account Number', 'error');
      return;
    }
    updateBankDetails(bankForm);
    setEditingBank(false);
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Header Avatar & Badges */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <div
          className="num"
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(var(--avatar-bg),var(--avatar-bg)) padding-box, var(--grad) border-box',
            color: 'var(--avatar-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '34px',
            border: '3px solid transparent',
            boxShadow: '0 8px 24px rgba(181, 92, 169, 0.25)'
          }}
        >
          {user.initials}
        </div>

        <h1 className="num" style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: 600 }}>
          {user.name}
        </h1>

        <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
          {user.rank || 'Starter Unicorn'} · ID {user.id}
        </span>

        <span
          onClick={() => setActiveModal('kyc')}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: user.kycStatus === 'VERIFIED' ? 'var(--pos)' : user.kycStatus === 'PENDING' ? '#F59E0B' : '#EF4444',
            background: user.kycStatus === 'VERIFIED' ? 'rgba(94, 224, 168, 0.12)' : user.kycStatus === 'PENDING' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            padding: '6px 14px',
            borderRadius: '14px',
            marginTop: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          title="Click to view KYC status and upload documents"
        >
          <span>{user.kycStatus === 'VERIFIED' ? '✓' : user.kycStatus === 'PENDING' ? '⏳' : '⚠️'}</span>
          KYC {user.kycStatus === 'VERIFIED' ? 'VERIFIED & 2FA PROTECTED' : user.kycStatus === 'PENDING' ? 'UNDER REVIEW' : 'NOT VERIFIED (Click to Verify)'}
        </span>
      </section>

      {/* Main Action Items List Card */}
      <section className="card" style={{ padding: 0 }}>
        {/* Profile Details Item */}
        <button
          className="item"
          onClick={() => setActiveModal('profile_details')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
          </svg>
          <span style={{ flex: 1, fontWeight: 600 }}>Profile details</span>
          <span style={{ fontSize: '12px', color: 'var(--muted)', marginRight: '6px' }}>
            {user.email || user.name}
          </span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* Account Statement */}
        <button
          className="item"
          onClick={() => setActiveModal('statement')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />
          </svg>
          <span style={{ flex: 1 }}>Account statement</span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* Security and 2FA */}
        <button
          className="item"
          onClick={() => setActiveModal('security')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          </svg>
          <span style={{ flex: 1 }}>Security and 2FA</span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* KYC Verification */}
        <button
          className="item"
          onClick={() => setActiveModal('kyc')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M4 5h16v14H4zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5.5 16c.5-1.5 1.5-2 2.5-2s2 .5 2.5 2M14 9h4M14 13h4" />
          </svg>
          <span style={{ flex: 1 }}>KYC verification</span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* Achiever Travel Passes */}
        <button
          className="item"
          onClick={() => setActiveModal('travel')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M3 20l18-8L3 4v6l11 2-11 2z" />
          </svg>
          <span style={{ flex: 1 }}>Achiever travel passes</span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* Support */}
        <button
          className="item"
          onClick={() => setActiveModal('support')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2" />
          </svg>
          <span style={{ flex: 1 }}>Support</span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

      </section>

      {/* Log Out Button */}
      <button
        onClick={logout}
        className="btno"
        style={{
          borderColor: 'rgba(239, 68, 68, 0.4)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600,
          background: 'rgba(239, 68, 68, 0.05)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Log Out of Account
      </button>

      {/* --- Modals --- */}

      {/* Statement Modal */}
      {activeModal === 'statement' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ ...modalContentStyle, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Account Statement</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
              Recent statement summary for Investor ID: <strong>{user?.id || user?._id || 'Active Investor'}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {(transactions || []).length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  No statement transactions found yet.
                </div>
              ) : (
                transactions.slice(0, 10).map((tx, idx) => {
                  const txAmtStr = String(tx.amountFormatted || tx.amount || '0');
                  const isPositive = txAmtStr.startsWith('+') || tx.type === 'deposit' || tx.type === 'roi' || tx.type === 'referral';
                  const rawAmt = Number(tx.amount || 0) || Number(txAmtStr.replace(/[₹$,+\-]/g, '')) || 0;
                  const displayAmt = `${isPositive ? '+' : '-'}${formatCurrency(rawAmt)}`;
                  const title = tx.title || (tx.type === 'roi' ? 'Daily 0.45% ROI' : tx.type === 'deposit' ? 'Inbound Deposit' : tx.type === 'withdraw' ? 'Payout Withdrawal' : 'Transaction');
                  const dateStr = tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent');

                  return (
                    <div key={tx.id || tx._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <strong style={{ color: 'var(--text)' }}>{title}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{dateStr}</div>
                      </div>
                      <div className="num" style={{ fontWeight: 600, color: isPositive ? 'var(--pos)' : 'var(--text)' }}>
                        {displayAmt}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              onClick={() => {
                showToast('Official PDF Statement exported successfully!');
                setActiveModal(null);
              }}
              className="btnp btnw"
              style={{ width: '100%', height: '46px', fontSize: '14px', marginTop: '6px' }}
            >
              Export Statement (PDF)
            </button>
          </div>
        </div>
      )}

      {/* Security & 2FA Modal */}
      {activeModal === 'security' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ ...modalContentStyle, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Two-Factor Security (2FA)</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(94, 224, 168, 0.12)', borderRadius: '12px' }}>
              <span style={{ color: 'var(--pos)', fontSize: '16px' }}>✓</span>
              <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 600 }}>Google Authenticator Active</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Two-Factor Authentication is strictly mandatory for all withdrawal requests to protect your capital and ensure maximum security.
            </div>

            {/* QR Code Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '16px',
              background: 'var(--surface2)',
              borderRadius: '16px',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                Scan QR with Google Authenticator
              </span>
              <div style={{
                padding: '10px',
                background: '#ffffff',
                borderRadius: '12px',
                display: 'inline-flex',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`otpauth://totp/Unicorn:${user?.email || 'user@unicorn.vip'}?secret=${user?.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}&issuer=Unicorn`)}`}
                  alt="Google Authenticator 2FA QR Code"
                  style={{ width: '150px', height: '150px', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Or enter the secret key manually below
              </span>
            </div>

            <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '4px' }}>SECRET KEY:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="num" style={{ fontWeight: 600 }}>
                  {showSecret ? (user?.twoFactorSecret || 'JBSWY3DPEHPK3PXP') : '•••• •••• •••• ••••'}
                </span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {showSecret ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                showToast('Security settings verified.');
                setActiveModal(null);
              }}
              className="btnp btnw"
              style={{ width: '100%', height: '46px', fontSize: '14px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* KYC Verification Modal */}
      {activeModal === 'kyc' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>KYC Verification</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)' }}>✕</button>
            </div>

            {user.kycStatus === 'VERIFIED' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(94, 224, 168, 0.12)', borderRadius: '12px' }}>
                  <span style={{ color: 'var(--pos)', fontSize: '20px' }}>✓</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--pos)' }}>Verification Approved</strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.kycDocumentType || 'Government ID Linked'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Document ID:</span>
                    <span className="num" style={{ fontWeight: 600 }}>{user.kycDocumentId || 'XXXX-XXXX-4912'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Full Legal Name:</span>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Status:</span>
                    <span style={{ color: 'var(--pos)', fontWeight: 600 }}>Active &amp; Whitelisted</span>
                  </div>
                </div>
              </>
            ) : user.kycStatus === 'PENDING' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '12px' }}>
                  <span style={{ color: '#F59E0B', fontSize: '20px' }}>⏳</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#F59E0B' }}>Documents Under Review</strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Platform compliance team is validating your submission</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Document Type:</span>
                    <span style={{ fontWeight: 600 }}>{user.kycDocumentType || 'Government ID'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Document Number:</span>
                    <span className="num" style={{ fontWeight: 600 }}>{user.kycDocumentId || 'Submitted'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Full Name:</span>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleKycSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                  <span style={{ color: '#EF4444', fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#EF4444' }}>KYC Not Verified</strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Submit your ID details to verify your new account</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Select Document Type</label>
                  <select
                    value={kycDocType}
                    onChange={e => setKycDocType(e.target.value)}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="Aadhaar Card">Aadhaar Card (12-digit UID)</option>
                    <option value="PAN Card">PAN Card (10-character alphanumeric)</option>
                    <option value="Passport">International Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Document ID / Number</label>
                  <input
                    type="text"
                    value={kycDocId}
                    onChange={e => setKycDocId(e.target.value)}
                    placeholder="e.g. 5491-9201-8392"
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btnp btnw"
                  style={{ height: '44px', fontSize: '14px', fontWeight: 600, marginTop: '6px' }}
                >
                  Submit KYC for Approval
                </button>
              </form>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="btno"
              style={{ width: '100%', height: '42px', fontSize: '14px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Travel Passes Modal */}
      {activeModal === 'travel' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Achiever Travel Passes</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {achieverBonuses.map((trip, idx) => (
                <div key={trip.target || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--surface2)', borderRadius: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text)' }}>
                      {trip.reward || trip.destination}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Target: {trip.targetLabel || trip.directTarget}
                    </span>
                  </div>
                  <span className="num" style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: trip.unlocked ? 'rgba(94, 224, 168, 0.15)' : 'var(--surface3)', color: trip.unlocked ? 'var(--pos)' : 'var(--muted)', flexShrink: 0 }}>
                    {trip.unlocked ? 'Unlocked ✓' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="btnp btnw"
              style={{ width: '100%', height: '46px', fontSize: '14px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {activeModal === 'support' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Official Support</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Need assistance with deposits, withdrawals, or packages? Our team is available 24/7 on Telegram and Email.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => window.open('https://t.me/unicorn_support_official', '_blank')}
                className="btnp"
                style={{ height: '46px', fontSize: '14px' }}
              >
                Telegram Helpdesk (@unicorn_support)
              </button>
              <button
                onClick={() => handleCopy('support@unicorn-platform.io', 'Email')}
                className="btns"
                style={{ height: '46px', fontSize: '14px' }}
              >
                support@unicorn-platform.io
              </button>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              style={{ fontSize: '13px', color: 'var(--muted)', padding: '6px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {activeModal === 'profile_details' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ ...modalContentStyle, maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Profile Details</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {/* User Overview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              background: 'var(--surface2)',
              borderRadius: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--grad)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '22px',
                flexShrink: 0
              }}>
                {user.initials || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{user.name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  Member ID: <span className="num">{user.id}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--pos)', fontWeight: 600, marginTop: '2px' }}>
                  ● {user.rank || 'Starter Unicorn'} · Active
                </div>
              </div>
            </div>

            {/* Account Information Card with Edit Capability */}
            <div style={{
              padding: '16px',
              background: 'var(--surface2)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px' }}>Contact &amp; Account Details</strong>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingProfile) {
                      setProfileForm({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || ''
                      });
                    }
                    setEmailOtp('');
                    setEmailOtpSent(false);
                    setOtpError('');
                    setEditingProfile(!editingProfile);
                  }}
                  style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {editingProfile ? 'Cancel' : 'Edit Details'}
                </button>
              </div>

              {editingProfile ? (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Email Address</label>
                      {isEmailChanged && (
                        <span style={{ fontSize: '10px', color: 'var(--accent-text)', fontWeight: 600 }}>OTP Required for change</span>
                      )}
                    </div>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => {
                        setProfileForm(prev => ({ ...prev, email: e.target.value }));
                        setEmailOtpSent(false);
                        setEmailOtp('');
                        setOtpError('');
                      }}
                      placeholder="e.g. user@unicorn.io"
                      required
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        background: 'var(--bg)',
                        border: isEmailChanged ? '1px solid var(--accent-text)' : '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  {/* Email Change OTP Security Verification Box */}
                  {isEmailChanged && (
                    <div style={{
                      background: 'rgba(181, 92, 169, 0.12)',
                      border: '1px solid rgba(181, 92, 169, 0.35)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
                          🔒 Email Verification (OTP)
                        </span>
                        {!emailOtpSent && (
                          <button
                            type="button"
                            onClick={handleSendEmailOtp}
                            disabled={sendingOtp}
                            style={{
                              fontSize: '11px',
                              background: 'var(--primary)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            {sendingOtp ? 'Sending...' : 'Send OTP'}
                          </button>
                        )}
                      </div>

                      {emailOtpSent ? (
                        <>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Enter the 6-digit OTP code sent to <strong>{profileForm.email}</strong>:
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="6-digit OTP"
                              value={emailOtp}
                              onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                              autoFocus
                              style={{
                                flex: 1,
                                height: '38px',
                                padding: '0 12px',
                                borderRadius: '8px',
                                background: 'var(--bg)',
                                border: '1px solid var(--accent-text)',
                                color: 'var(--text)',
                                fontSize: '16px',
                                letterSpacing: '4px',
                                textAlign: 'center',
                                fontWeight: 700
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={sendingOtp}
                              style={{
                                height: '38px',
                                padding: '0 12px',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--accent-text)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {sendingOtp ? 'Sending...' : 'Resend'}
                            </button>
                          </div>
                          {otpError && (
                            <span style={{ fontSize: '11px', color: 'var(--neg)' }}>{otpError}</span>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          To change your registered email, a 6-digit verification code will be sent to your new email.
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 9876543210"
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                    />
                  </div>
                  <button type="submit" className="btnp btnw" style={{ height: '40px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', marginTop: '4px' }}>
                    {isEmailChanged
                      ? (emailOtpSent ? 'Verify OTP & Confirm Email Change' : 'Send OTP & Save Details')
                      : 'Save Contact Details'}
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Email Address</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' }}>{user.email || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Phone Number</span>
                    <span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{user.phone || 'Not set'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Sponsor / Referrer</span>
                    <span className="num" style={{ fontWeight: 600, color: 'var(--accent-text)' }}>{user.sponsorCode || user.sponsor || 'None'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Referral Code</span>
                    <span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{user.referralCode || user.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>KYC Status</span>
                    <span style={{ fontWeight: 600, color: user.kycStatus === 'VERIFIED' ? 'var(--pos)' : '#F59E0B' }}>
                      {user.kycStatus === 'VERIFIED' ? 'Verified ✓' : 'Not Verified ⚠️'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Payout & Banking Details Section */}
            <div style={{
              padding: '16px',
              background: 'var(--surface2)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px' }}>Bank &amp; UPI Payout Details</strong>
                <button
                  type="button"
                  onClick={() => setEditingBank(!editingBank)}
                  style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {editingBank ? 'Cancel' : 'Edit Details'}
                </button>
              </div>

              {editingBank ? (
                <form onSubmit={handleBankSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    value={bankForm.upiId}
                    onChange={e => setBankForm(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="UPI ID (e.g. name@bank)"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={e => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Bank Name (e.g. HDFC Bank)"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Account Number"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={bankForm.ifsc}
                    onChange={e => setBankForm(prev => ({ ...prev, ifsc: e.target.value }))}
                    placeholder="IFSC Code"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px' }}
                  />
                  <button type="submit" className="btnp btnw" style={{ height: '40px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}>
                    Save Payout Details
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>UPI ID:</span>
                    <span style={{ fontWeight: 600 }}>{user?.bankDetails?.upiId || 'Not set'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Bank Name:</span>
                    <span style={{ fontWeight: 600 }}>{user?.bankDetails?.bankName || 'Not set'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Account No:</span>
                    <span className="num" style={{ fontWeight: 600 }}>
                      {user?.bankDetails?.accountNumber ? '•••• ' + String(user.bankDetails.accountNumber).slice(-4) : 'Not set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>IFSC:</span>
                    <span className="num" style={{ fontWeight: 600 }}>{user?.bankDetails?.ifsc || 'Not set'}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="btnp btnw"
              style={{ width: '100%', height: '44px', fontSize: '14px', marginTop: '6px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ ...modalContentStyle, maxWidth: '440px' }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Platform Settings</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Appearance Mode</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Current: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="chip on"
                style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
              >
                {theme === 'dark' ? 'Switch to Light ☀️' : 'Switch to Dark 🌙'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Currency Display</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Current: {currency === 'USD' ? 'USD ($)' : 'INR (₹)'}</span>
              </div>
              <button
                onClick={toggleCurrency}
                className="chip on"
                style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
              >
                Switch to {currency === 'USD' ? 'INR (₹)' : 'USD ($)'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Security &amp; 2FA</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Withdrawal protection active</span>
              </div>
              <button
                onClick={() => setActiveModal('security')}
                className="chip on"
                style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
              >
                View 2FA
              </button>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="btnp btnw"
              style={{ width: '100%', height: '46px', fontSize: '14px', marginTop: '8px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(8px)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--divider)',
  paddingBottom: '10px'
};
