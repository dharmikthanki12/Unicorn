import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function InvestPage() {
  const { packages, user, investInPackage, navigateTo } = useApp();
  // Default selected to Starter Package (packages[0]) matching the reference design
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id || 'starter');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const sel = packages.find(p => p.id === selectedPkgId) || packages[0] || {};
  const amount = Number(sel.amount) || 10000;
  const canAfford = (user?.mainWalletBalance || 0) >= amount;
  const dailyRoi = Number(sel.dailyRoi ?? sel.dailyReturn ?? Math.round(amount * 0.0045));
  const monthlyRoi = Number(sel.monthlyRoi ?? sel.monthlyReturn ?? Math.round(amount * 0.0045 * 22));

  const handleInvest = () => {
    investInPackage(sel.id || 'starter');
    setConfirmModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Subtitle matching reference design */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>
          Invest
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
          Every package earns 0.45% daily ROI, paid Monday to Friday across 22 working days a month.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: 7 Packages as sleek horizontal rows */}
        <div style={{ flex: '1 1 380px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {packages.map((pkg) => {
            const isSelected = pkg.id === selectedPkgId;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 22px',
                  borderRadius: '14px',
                  background: isSelected ? 'var(--grad)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  color: '#ffffff',
                  width: '100%',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 6px 18px rgba(181, 92, 169, 0.35)' : 'none'
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                  {pkg.name}
                </span>
                <span
                  className="num"
                  style={{
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  ₹{(pkg.amount || 0).toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Detailed Selected Package Card matching Image 1 */}
        <section
          className="card"
          style={{
            flex: '1 1 420px',
            minWidth: 0,
            padding: '32px 28px',
            borderRadius: '20px',
            background: '#11131c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* Header: Package Name & Big Amount */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
              {sel.name || 'Starter Package'}
            </span>
            <div
              className="num"
              style={{
                fontSize: 'clamp(44px, 5vw, 56px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                color: '#ffffff'
              }}
            >
              ₹{amount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 3 Detail Rows matching reference design */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Row 1: Daily ROI (0.45%) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
              <span style={{ color: 'var(--muted)' }}>Daily ROI (0.45%)</span>
              <span className="num" style={{ fontWeight: 600, color: 'var(--pos)', fontSize: '15px' }}>
                ₹{dailyRoi.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Row 2: Per month (22 days, 9.9%) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
              <span style={{ color: 'var(--muted)' }}>Per month (22 days, 9.9%)</span>
              <span className="num" style={{ fontWeight: 600, color: 'var(--pos)', fontSize: '15px' }}>
                ₹{monthlyRoi.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Row 3: Payout days */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
              <span style={{ color: 'var(--muted)' }}>Payout days</span>
              <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>
                Mon – Fri
              </span>
            </div>
          </div>

          {/* Outline Button: Invest ₹Amount */}
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => {
                if (canAfford) {
                  setConfirmModalOpen(true);
                } else {
                  navigateTo('deposit');
                }
              }}
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
              Invest ₹{amount.toLocaleString('en-IN')}
            </button>
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Confirm Package Activation</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
              You are activating the <strong>{sel.name || 'Package'}</strong> for <strong>₹{amount.toLocaleString('en-IN')}</strong>. This will deduct from your Main Deposit wallet.
            </p>

            <div style={{
              background: 'var(--surface2)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Daily Return (0.45%):</span>
                <strong className="num" style={{ color: 'var(--pos)' }}>₹{dailyRoi.toLocaleString('en-IN')} / day</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Monthly Return (22 days):</span>
                <strong className="num" style={{ color: 'var(--pos)' }}>₹{monthlyRoi.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="btns"
                style={{ flex: 1, height: '48px', borderRadius: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                className="btnp btnw"
                style={{ flex: 1, height: '48px', borderRadius: '12px', cursor: 'pointer' }}
              >
                <span className="gt">Confirm &amp; Start</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
