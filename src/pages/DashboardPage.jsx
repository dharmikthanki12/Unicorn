import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function DashboardPage() {
  const {
    user,
    transactions,
    navigateTo,
    transferFunds,
    showToast,
    openLoginModal,
    openRegisterModal,
    web3Connected,
    web3Address,
    connectWeb3Wallet,
    disconnectWeb3Wallet
  } = useApp();

  const isWalletConnected = Boolean(user?.web3Connected || web3Connected);
  const currentWalletAddress = user?.web3Address || web3Address || '';
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState('roi');
  const [transferAmount, setTransferAmount] = useState('');

  const mainWalletBalance = user?.mainWalletBalance ?? 0;
  const roiWalletBalance = user?.roiWalletBalance ?? 0;
  const referralWalletBalance = user?.referralWalletBalance ?? 0;
  const todayRoiIncome = user?.todayRoiIncome ?? 0;
  const todayReferralIncome = user?.todayReferralIncome ?? 0;
  const activeInvestedAmount = user?.activeInvestedAmount ?? 0;

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      openLoginModal();
      return;
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      showToast('Enter valid transfer amount', 'error');
      return;
    }
    transferFunds(transferFrom, 'main', transferAmount);
    setTransferAmount('');
    setShowTransferModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {!user && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(181,92,169,0.18), rgba(76,140,245,0.18))',
            border: '1px solid rgba(181,92,169,0.3)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderRadius: '16px'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Welcome to UNICORN Platform</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
              Earn 0.45% daily yields on active packages, build your multi-level referral network, and qualify for Achiever trips.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={openLoginModal} className="btnp" style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}>
              Log In
            </button>
            <button onClick={openRegisterModal} className="btno" style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}>
              Register
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Home Layout matching Unicorn_Mobile_App.html Screen 13 */}
      <div className="website-grid-2col" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
        {/* Left Column: Wallet Balance Hero, Buttons & Income Cards */}
        <div className="website-col-left" style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Wallet Balance Hero */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '16px' }}>
            <span style={{ fontSize: '16px', color: 'var(--muted)' }}>Wallet balance</span>
            <span
              className="num"
              style={{
                fontSize: 'clamp(52px, 7vw, 80px)',
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: '-0.03em'
              }}
            >
              ₹{mainWalletBalance.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
              Main deposit wallet · ready to invest
            </span>
          </section>

          {/* Action Buttons (.btnp .btnw matching file) */}
          <div className="hero-action-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigateTo('invest')}
              className="btnp btnw"
              style={{ cursor: 'pointer', padding: '12px 28px', fontSize: '15px', fontWeight: 600 }}
            >
              <span className="gt">Invest</span>
            </button>

            <button
              onClick={() => setShowTransferModal(true)}
              className="btnp"
              style={{ cursor: 'pointer', padding: '12px 28px', fontSize: '15px', fontWeight: 600 }}
            >
              Transfer
            </button>
          </div>

          {/* Income Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Income</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '14px' }}>
              {/* ROI Income Card */}
              <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-text)' }}>
                  <Icon d={ICONS.invest} size={20} />
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--muted)' }}>ROI income</span>
                </div>
                <span className="num" style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                  ₹{roiWalletBalance.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 500 }}>
                  Today +₹{todayRoiIncome.toLocaleString('en-IN')} (0.45%)
                </span>
              </div>

              {/* Referral Income Card */}
              <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-text)' }}>
                  <Icon d={ICONS.referral} size={20} />
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--muted)' }}>Referral income</span>
                </div>
                <span className="num" style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                  ₹{referralWalletBalance.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 500 }}>
                  Today +₹{todayReferralIncome.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </section>


        </div>

        {/* Right Column: Top Earners Leaderboard Card */}
        <section className="card" style={{ flex: '1 1 440px', minWidth: 0, padding: '8px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Top Earners</h2>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-text)',
              background: 'var(--icon-bg)',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              Leaderboard
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { rank: 1, name: 'Vikram Patel', initials: 'VP', tier: 'Crown Unicorn · Tier 7', totalEarned: 1850000, dailyYield: '+₹22,500/day' },
              { rank: 2, name: 'Kabir Nair', initials: 'KN', tier: 'Diamond Whale · Tier 6', totalEarned: 1240000, dailyYield: '+₹11,250/day' },
              { rank: 3, name: 'Aarav Sharma', initials: 'AS', tier: 'Elite Portfolio · Tier 5', totalEarned: 780000, dailyYield: '+₹4,500/day' },
              { rank: 4, name: 'Meera Iyer', initials: 'MI', tier: 'Premium Wealth · Tier 4', totalEarned: 510000, dailyYield: '+₹2,250/day' },
              { rank: 5, name: user?.name || 'Rutajeet Mukherjee', initials: user?.initials || 'RM', tier: 'Gold Unicorn · Pro Trader', totalEarned: (user?.roiWalletBalance || 54000) + (user?.referralWalletBalance || 38750) + 250000, dailyYield: '+₹2,250/day', isUser: true }
            ].map((earner) => (
              <div
                key={earner.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 0',
                  borderTop: '1px solid var(--divider)',
                  minHeight: '70px'
                }}
              >
                {/* Rank number / medal */}
                <div style={{
                  width: '28px',
                  fontSize: earner.rank <= 3 ? '18px' : '13px',
                  fontWeight: 700,
                  color: earner.rank === 1 ? '#F59E0B' : earner.rank === 2 ? '#94A3B8' : earner.rank === 3 ? '#B45309' : 'var(--muted)',
                  textAlign: 'center',
                  flex: 'none'
                }}>
                  {earner.rank === 1 ? '🥇' : earner.rank === 2 ? '🥈' : earner.rank === 3 ? '🥉' : `#${earner.rank}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: earner.isUser ? 'var(--grad)' : 'linear-gradient(135deg, rgba(127, 92, 166, 0.25), rgba(181, 92, 169, 0.25))',
                  color: earner.isUser ? '#ffffff' : 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flex: 'none',
                  border: earner.isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)'
                }}>
                  {earner.initials}
                </div>

                {/* Name & Tier */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {earner.name}
                    </span>
                    {earner.isUser && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: 'var(--grad)',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        You
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {earner.tier}
                  </span>
                </div>

                {/* Total Earnings & Daily Yield */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                  <span
                    className="num"
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--pos)'
                    }}
                  >
                    ₹{earner.totalEarned.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {earner.dailyYield}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Internal Wallet Transfer Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Internal Wallet Transfer</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
              Transfer your earned ROI or Referral income directly to your Main Deposit wallet to reinvest in packages.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setTransferFrom('roi')}
                className={`wal ${transferFrom === 'roi' ? 'on' : ''}`}
                style={{ padding: '14px' }}
              >
                <span style={{ fontSize: '12px' }}>From ROI Wallet</span>
                <span className="num" style={{ fontSize: '16px', fontWeight: 700 }}>
                  ₹{roiWalletBalance.toLocaleString('en-IN')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTransferFrom('ref')}
                className={`wal ${transferFrom === 'ref' ? 'on' : ''}`}
                style={{ padding: '14px' }}
              >
                <span style={{ fontSize: '12px' }}>From Referral Wallet</span>
                <span className="num" style={{ fontSize: '16px', fontWeight: 700 }}>
                  ₹{referralWalletBalance.toLocaleString('en-IN')}
                </span>
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--muted)' }}>Transfer Amount</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: '12px',
                  padding: '4px 14px'
                }}>
                  <span className="num" style={{ fontSize: '18px', color: 'var(--muted)', marginRight: '6px' }}>₹</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="num"
                    required
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '18px',
                      color: 'var(--text)',
                      padding: '8px 0'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btns"
                  style={{ flex: 1, height: '48px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btnp btnw"
                  style={{ flex: 1, height: '48px' }}
                >
                  <span className="gt">Confirm Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
