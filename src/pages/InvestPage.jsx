import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function InvestPage() {
  const { packages, user, investInPackage, navigateTo, formatCurrency, setDepositAmount } = useApp();
  // Default selected to Starter Package (packages[0]) matching the reference design
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id || 'starter');
  const [customAmounts, setCustomAmounts] = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalPkg, setModalPkg] = useState(null);
  const [modalAmount, setModalAmount] = useState(0);

  const sel = packages.find(p => p.id === selectedPkgId) || packages[0] || {};
  const selMin = Number(sel.amount) || 10000;
  const rawEntered = customAmounts[sel.id] !== undefined ? customAmounts[sel.id] : selMin;
  const activeAmount = Math.max(selMin, Number(rawEntered) || selMin);
  const canAfford = (user?.mainWalletBalance || 0) >= activeAmount;
  const currentModalPkg = modalPkg || sel;
  const currentModalAmount = modalAmount || activeAmount;
  const dailyRoi = Math.round(currentModalAmount * 0.0045);
  const monthlyRoi = Math.round(currentModalAmount * 0.0045 * 22);

  const handleInvest = async () => {
    const targetPkg = modalPkg || sel;
    const targetAmount = modalAmount || activeAmount;
    setConfirmModalOpen(false);
    const ok = await investInPackage(targetPkg.id || 'starter', targetAmount);
    if (ok !== false) {
      if (navigateTo) navigateTo('home');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Subtitle matching reference design */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: 'var(--text)' }}>
          Invest
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
          Every package earns 0.45% daily ROI, paid Monday to Friday across 22 working days a month. You can invest the package minimum or any custom amount above it.
        </p>
      </div>

      {/* Accordion List: Dropdown opens directly below clicked package */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '640px', width: '100%' }}>
        {packages.map((pkg) => {
          const isSelected = pkg.id === selectedPkgId;
          const pkgMin = Number(pkg.amount) || 10000;
          const userVal = customAmounts[pkg.id] !== undefined ? customAmounts[pkg.id] : pkgMin;
          const currentAmount = Number(userVal) || 0;
          const isAboveMin = currentAmount >= pkgMin;
          const pkgCanAfford = (user?.mainWalletBalance || 0) >= currentAmount && isAboveMin;
          const calcAmount = currentAmount > 0 ? currentAmount : pkgMin;
          const pkgDailyRoi = Math.round(calcAmount * 0.0045);
          const pkgMonthlyRoi = Math.round(calcAmount * 0.0045 * 22);

          return (
            <div
              key={pkg.id}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: isSelected ? '1px solid rgba(181, 92, 169, 0.45)' : '1px solid var(--border)',
                background: 'var(--surface2)',
                boxShadow: isSelected ? '0 8px 24px rgba(181, 92, 169, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Package Header Row */}
              <button
                type="button"
                onClick={() => setSelectedPkgId(isSelected ? null : pkg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 20px',
                  background: isSelected ? 'var(--grad)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isSelected ? '#ffffff' : 'var(--text)',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text)' }}>
                    {pkg.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className="num"
                    style={{
                      color: isSelected ? '#ffffff' : 'var(--text)',
                      fontWeight: 700,
                      fontSize: '17px'
                    }}
                  >
                    {formatCurrency(pkgMin)}+
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: isSelected ? '#ffffff' : 'var(--muted)',
                      transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      display: 'inline-block'
                    }}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Dropdown details open below package name */}
              {isSelected && (
                <div
                  style={{
                    padding: '22px 20px',
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                  }}
                >
                  {/* Custom Staking Amount Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        Staking Amount (Min: {formatCurrency(pkgMin)})
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Wallet Balance: <strong style={{ color: 'var(--accent-text)' }}>{formatCurrency(user?.mainWalletBalance || 0)}</strong>
                      </span>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="number"
                        min={pkgMin}
                        step="1000"
                        value={userVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomAmounts(prev => ({ ...prev, [pkg.id]: val }));
                        }}
                        placeholder={`Enter amount (min ${pkgMin})`}
                        style={{
                          width: '100%',
                          height: '50px',
                          padding: '0 80px 0 16px',
                          borderRadius: '12px',
                          background: 'var(--input-bg)',
                          border: !isAboveMin ? '1.5px solid #ef4444' : '1px solid var(--border)',
                          color: 'var(--text)',
                          fontSize: '18px',
                          fontWeight: 700
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const maxVal = Math.max(pkgMin, Number(user?.mainWalletBalance || 0));
                          setCustomAmounts(prev => ({ ...prev, [pkg.id]: maxVal }));
                        }}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--accent-text)',
                          cursor: 'pointer'
                        }}
                      >
                        Max
                      </button>
                    </div>

                    {/* Quick increment pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {[5000, 10000, 25000, 50000].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const cur = Number(userVal) || pkgMin;
                            setCustomAmounts(prev => ({ ...prev, [pkg.id]: cur + inc }));
                          }}
                          className="chip"
                          style={{ fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          +{formatCurrency(inc)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCustomAmounts(prev => ({ ...prev, [pkg.id]: pkgMin }))}
                        className="chip"
                        style={{ fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}
                      >
                        Reset Min
                      </button>
                    </div>

                    {!isAboveMin && (
                      <span style={{ fontSize: '12px', color: '#ef4444' }}>
                        Minimum amount for {pkg.name} is {formatCurrency(pkgMin)}.
                      </span>
                    )}
                  </div>

                  {/* 3 Detail Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface2)', padding: '14px 16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ color: 'var(--muted)' }}>Daily ROI (0.45%)</span>
                      <strong className="num" style={{ color: 'var(--pos)', fontSize: '15px' }}>
                        +{formatCurrency(pkgDailyRoi)} / day
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ color: 'var(--muted)' }}>Monthly yield (22 working days, 9.9%)</span>
                      <strong className="num" style={{ color: 'var(--pos)', fontSize: '15px' }}>
                        {formatCurrency(pkgMonthlyRoi)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ color: 'var(--muted)' }}>Payout schedule</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                        Monday – Friday (22 Days)
                      </span>
                    </div>
                  </div>

                  {/* Invest Button */}
                  <button
                    type="button"
                    disabled={!isAboveMin}
                    onClick={() => {
                      if (!isAboveMin) return;
                      setSelectedPkgId(pkg.id);
                      setModalPkg(pkg);
                      setModalAmount(calcAmount);
                      if (pkgCanAfford) {
                        setConfirmModalOpen(true);
                      } else {
                        if (setDepositAmount) setDepositAmount(String(calcAmount));
                        navigateTo('deposit');
                      }
                    }}
                    className="btnp btnw"
                    style={{
                      width: '100%',
                      height: '48px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: !isAboveMin ? 'not-allowed' : 'pointer',
                      opacity: !isAboveMin ? 0.6 : 1,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="gt">
                      {`Investment Amount ${formatCurrency(calcAmount)}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
            maxHeight: '90vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            padding: 'clamp(20px, 4vw, 28px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Confirm Package Activation</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
              You are activating <strong>{currentModalPkg.name || 'Package'}</strong> for <strong style={{ color: 'var(--text)', fontSize: '16px' }}>{formatCurrency(currentModalAmount)}</strong>. This will deduct from your Main Deposit wallet.
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
                <span style={{ color: 'var(--muted)' }}>Staking Amount:</span>
                <strong className="num" style={{ color: 'var(--text)', fontSize: '16px' }}>{formatCurrency(currentModalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Daily Return (0.45%):</span>
                <strong className="num" style={{ color: 'var(--pos)' }}>+{formatCurrency(dailyRoi)} / day</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Monthly Return (22 days):</span>
                <strong className="num" style={{ color: 'var(--pos)' }}>{formatCurrency(monthlyRoi)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--divider)' }}>
                <span style={{ color: 'var(--muted)' }}>Remaining Wallet Balance:</span>
                <span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {formatCurrency((user?.mainWalletBalance || 0) - currentModalAmount)}
                </span>
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
