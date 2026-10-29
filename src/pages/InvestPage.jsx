import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function InvestPage() {
  const { packages, user, investInPackage, navigateTo } = useApp();
  const [selectedPkgId, setSelectedPkgId] = useState(packages[3]?.id || 'gold');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const sel = packages.find(p => p.id === selectedPkgId) || packages[0] || {};
  const amount = Number(sel.amount) || 10000;
  const canAfford = (user?.mainWalletBalance || 0) >= amount;
  const dailyRoi = Number(sel.dailyRoi ?? sel.dailyReturn ?? Math.round(amount * 0.0045));
  const monthlyRoi = Number(sel.monthlyRoi ?? sel.monthlyReturn ?? Math.round(amount * 0.0045 * 22));
  const bonusUnc = Number(sel.bonusUnc ?? (sel.usdValue ? sel.usdValue * 10 : Math.round(amount / 100)));

  const handleInvest = () => {
    investInPackage(sel.id || 'starter');
    setConfirmModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Subtitle matching Unicorn_Mobile_App.html Screen 15 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>Invest</h1>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--muted)' }}>
          Every package earns 0.45% daily ROI, paid Monday to Friday across 22 working days a month.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: 7 Packages as .wal buttons */}
        <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {packages.map((pkg) => {
            const isSelected = pkg.id === selectedPkgId;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`wal ${isSelected ? 'on' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{pkg.name}</span>
                  <span style={{ fontSize: '12px', opacity: 0.85 }}>Tier {pkg.tier || 1} · USD Ref: ${(pkg.usdValue || Math.round((pkg.amount || 10000) / 100)).toLocaleString()}</span>
                </div>
                <span
                  className="num"
                  style={{
                    color: isSelected ? '#fff' : 'var(--accent-text)',
                    fontWeight: 600,
                    fontSize: '18px'
                  }}
                >
                  ₹{(pkg.amount || 0).toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Detailed Selected Package Card */}
        <section className="card" style={{ flex: '1 1 420px', minWidth: 0, padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '15px', color: 'var(--muted)' }}>{sel.name || 'Investment Package'}</span>
            <span className="num" style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              ₹{amount.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--divider)', fontSize: '16px' }}>
              <span style={{ color: 'var(--muted)' }}>Daily ROI (0.45%)</span>
              <span className="num" style={{ fontWeight: 600, color: 'var(--pos)' }}>
                +₹{dailyRoi.toLocaleString('en-IN')} / day
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--divider)', fontSize: '16px' }}>
              <span style={{ color: 'var(--muted)' }}>Per month (22 days, 9.9%)</span>
              <span className="num" style={{ fontWeight: 600, color: 'var(--pos)' }}>
                ₹{monthlyRoi.toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--divider)', fontSize: '16px' }}>
              <span style={{ color: 'var(--muted)' }}>Payout schedule</span>
              <span style={{ fontWeight: 600 }}>Mon – Fri (00:00 UTC)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--divider)', fontSize: '16px' }}>
              <span style={{ color: 'var(--muted)' }}>Bonus UNC Tokens</span>
              <span className="num" style={{ fontWeight: 600, color: 'var(--accent-text)' }}>
                +{bonusUnc.toLocaleString('en-IN')} UNC (BEP-20)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--divider)', fontSize: '16px' }}>
              <span style={{ color: 'var(--muted)' }}>Your Available Balance</span>
              <span className="num" style={{ fontWeight: 600, color: canAfford ? 'var(--pos)' : '#ef5350' }}>
                ₹{(user?.mainWalletBalance || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {canAfford ? (
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="btnp btnw"
              style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
            >
              <span className="gt">Invest ₹{amount.toLocaleString('en-IN')}</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => navigateTo('deposit')}
                className="btnp btnw"
                style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
              >
                <span className="gt">+ Deposit Funds (Need ₹{Math.max(0, amount - (user?.mainWalletBalance || 0)).toLocaleString('en-IN')})</span>
              </button>
              <span style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                Insufficient main wallet balance. Add funds via UPI or BEP-20 USDT.
              </span>
            </div>
          )}
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
                <strong className="num" style={{ color: 'var(--pos)' }}>+₹{dailyRoi.toLocaleString('en-IN')}/day</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Bonus Tokens:</span>
                <strong className="num">{bonusUnc.toLocaleString('en-IN')} UNC</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="btns"
                style={{ flex: 1, height: '48px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                className="btnp btnw"
                style={{ flex: 1, height: '48px' }}
              >
                <span className="gt">Confirm & Start Earning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
