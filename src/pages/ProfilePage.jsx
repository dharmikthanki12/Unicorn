import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function ProfilePage() {
  const {
    user,
    theme,
    toggleTheme,
    navigateTo,
    web3Connected,
    web3Address,
    connectWeb3Wallet,
    disconnectWeb3Wallet,
    resetToDefaults,
    achieverBonuses,
    transactions,
    showToast,
    openLoginModal,
    logout,
    submitKyc
  } = useApp();

  const [activeModal, setActiveModal] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

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
        {/* Withdraw Item */}
        <button
          className="item"
          onClick={() => navigateTo('withdraw')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M12 20V8m0 0l-4 4m4-4l4 4M5 4h14" />
          </svg>
          <span style={{ flex: 1 }}>Withdraw</span>
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

        {/* Settings */}
        <button
          className="item"
          onClick={() => setActiveModal('settings')}
        >
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--accent-text)' }}>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
          </svg>
          <span style={{ flex: 1 }}>Settings</span>
          <svg className="ic" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: '18px', height: '18px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </section>

      {/* Reset Demo Data Button */}
      <button
        onClick={() => {
          if (window.confirm('Reset all demo balances, transactions, and settings to default state?')) {
            resetToDefaults();
          }
        }}
        className="btno"
      >
        Reset Demo Data
      </button>

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
          <div onClick={e => e.stopPropagation()} className="card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Account Statement</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
              Recent statement summary for Investor ID: <strong>{user.id}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
                  <div>
                    <strong>{tx.title}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{tx.date}</div>
                  </div>
                  <div className="num" style={{ fontWeight: 600, color: tx.amount.startsWith('+') ? 'var(--pos)' : 'var(--text)' }}>
                    {tx.amount}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                showToast('Official PDF Statement exported successfully!');
                setActiveModal(null);
              }}
              className="btnp btnw"
              style={{ width: '100%', height: '46px', fontSize: '14px' }}
            >
              Export Statement (PDF)
            </button>
          </div>
        </div>
      )}

      {/* Security & 2FA Modal */}
      {activeModal === 'security' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Two-Factor Security (2FA)</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(94, 224, 168, 0.12)', borderRadius: '12px' }}>
              <span style={{ color: 'var(--pos)', fontSize: '16px' }}>✓</span>
              <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 600 }}>Google Authenticator Active</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
              Two-Factor Authentication is strictly mandatory for all withdrawal requests to protect your capital and ensure maximum security.
            </div>
            <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '4px' }}>SECRET KEY:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="num" style={{ fontWeight: 600 }}>
                  {showSecret ? 'JBSWY3DPEHPK3PXP' : '•••• •••• •••• ••••'}
                </span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600 }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {achieverBonuses.map(trip => (
                <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
                  <div>
                    <strong>{trip.destination}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Target: {trip.directTarget}</div>
                  </div>
                  <span className="num" style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: trip.unlocked ? 'rgba(94, 224, 168, 0.15)' : 'var(--surface3)', color: trip.unlocked ? 'var(--pos)' : 'var(--muted)' }}>
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

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <div onClick={() => setActiveModal(null)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Platform Settings</h3>
              <button onClick={() => setActiveModal(null)} style={{ fontSize: '20px', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--divider)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Appearance Mode</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Current: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="chip on"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                {theme === 'dark' ? 'Switch to Light ☀️' : 'Switch to Dark 🌙'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Currency Display</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>INR (₹) / USDT (BEP-20)</span>
              </div>
              <span className="num" style={{ fontWeight: 600, fontSize: '13px' }}>1 USDT = ₹92</span>
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
