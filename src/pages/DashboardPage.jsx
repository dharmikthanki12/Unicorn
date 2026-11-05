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
    disconnectWeb3Wallet,
    currency,
    currencySymbol,
    formatCurrency
  } = useApp();

  const isWalletConnected = Boolean(user?.web3Connected || web3Connected);
  const currentWalletAddress = user?.web3Address || web3Address || '';
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState('roi');
  const [transferAmount, setTransferAmount] = useState('');

  const mainWalletBalance = user?.mainWalletBalance ?? 0;
  const roiWalletBalance = user?.roiWalletBalance ?? 0;
  const referralWalletBalance = user?.referralWalletBalance ?? 0;

  // Leaderboard Border Style Switcher (Gradient Purple by default, Golden, Green, Grey)
  const [leaderboardTheme, setLeaderboardTheme] = useState(() => {
    try {
      return localStorage.getItem('unicorn_leaderboard_border_theme') || 'gradient';
    } catch (e) {
      return 'gradient';
    }
  });

  const LEADERBOARD_THEMES = {
    gradient: {
      cardStyle: {
        border: '2px solid transparent',
        background: 'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, #B55CA9 0%, #8A70D6 50%, #4C8CF5 100%) border-box',
        boxShadow: '0 8px 30px rgba(181, 92, 169, 0.18)'
      },
      badgeBg: 'linear-gradient(135deg, rgba(181, 92, 169, 0.15), rgba(76, 140, 245, 0.15))',
      badgeBorder: '1px solid rgba(181, 92, 169, 0.35)',
      badgeColor: 'var(--accent-text)'
    },
    golden: {
      cardStyle: {
        border: '2px solid transparent',
        background: 'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%) border-box',
        boxShadow: '0 8px 30px rgba(245, 158, 11, 0.2)'
      },
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: '1px solid rgba(245, 158, 11, 0.4)',
      badgeColor: '#D97706'
    },
    green: {
      cardStyle: {
        border: '2px solid transparent',
        background: 'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, #10B981 0%, #34D399 50%, #059669 100%) border-box',
        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)'
      },
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: '1px solid rgba(16, 185, 129, 0.4)',
      badgeColor: '#059669'
    },
    grey: {
      cardStyle: {
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: 'none'
      },
      badgeBg: 'var(--icon-bg)',
      badgeBorder: 'none',
      badgeColor: 'var(--accent-text)'
    }
  };

  const activeThemeConfig = LEADERBOARD_THEMES[leaderboardTheme] || LEADERBOARD_THEMES.gradient;
  const todayRoiIncome = user?.todayRoiIncome ?? 0;

  // Calculate today's referral income dynamically from transactions if available
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dynamicTodayReferral = (transactions || [])
    .filter(t => {
      const isRef = t.type === 'referral_bonus' || t.type === 'referral' || t.type === 'REFERRAL';
      if (!isRef) return false;
      const txDate = t.timestamp ? new Date(t.timestamp) : (t.createdAt ? new Date(t.createdAt) : null);
      return txDate && txDate >= todayStart;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const todayReferralIncome = user?.todayReferralIncome || dynamicTodayReferral;
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
          <section style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '6px',
            paddingTop: '16px'
          }}>
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
              {formatCurrency(mainWalletBalance)}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-text)' }}>
                    <Icon d={ICONS.invest} size={20} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--muted)' }}>ROI income</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--accent-text)',
                    background: 'var(--icon-bg)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <span className="num" style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {formatCurrency(roiWalletBalance)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 500 }}>
                    Today ({new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}) +{formatCurrency(todayRoiIncome)} (0.45%)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Next Cycle: {(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      // Advance through weekends (Saturday/Sunday -> Monday)
                      if (d.getDay() === 6) d.setDate(d.getDate() + 2);
                      else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
                      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    })()} at 12:00 AM (Midnight) (Mon–Fri)
                  </span>
                </div>
              </div>

              {/* Referral Income Card */}
              <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-text)' }}>
                    <Icon d={ICONS.referral} size={20} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--muted)' }}>Referral income</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--accent-text)',
                    background: 'var(--icon-bg)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <span className="num" style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {formatCurrency(referralWalletBalance)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 500 }}>
                    Today ({new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}) +{formatCurrency(todayReferralIncome)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {user?.totalDirects > 0 ? (
                      <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
                        👥 {user.totalDirects} Direct Member{user.totalDirects > 1 ? 's' : ''} ·
                      </span>
                    ) : null}
                    Level 1–25+ Multi-Level ROI Sharing
                  </span>
                </div>
              </div>
            </div>
          </section>


        </div>

        {/* Right Column: Top Earners Leaderboard Card */}
        <section
          className="card website-col-right"
          style={{
            flex: '1 1 440px',
            minWidth: 0,
            padding: 'clamp(12px, 3vw, 20px)',
            borderRadius: '18px',
            transition: 'all 0.25s ease',
            ...activeThemeConfig.cardStyle
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Top Earners</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Interactive Theme Comparison Selector */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--surface2)',
                  borderRadius: '20px',
                  padding: '2px',
                  border: '1px solid var(--border)'
                }}
              >
                {[
                  { id: 'gradient', label: 'Gradient', dot: 'linear-gradient(135deg, #B55CA9, #4C8CF5)' },
                  { id: 'golden', label: 'Golden', dot: 'linear-gradient(135deg, #F59E0B, #D97706)' },
                  { id: 'green', label: 'Green', dot: 'linear-gradient(135deg, #10B981, #059669)' },
                  { id: 'grey', label: 'Grey', dot: 'var(--muted)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setLeaderboardTheme(opt.id);
                      try { localStorage.setItem('unicorn_leaderboard_border_theme', opt.id); } catch(e) {}
                    }}
                    title={`Preview ${opt.label} border`}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: leaderboardTheme === opt.id ? 'var(--surface)' : 'transparent',
                      color: leaderboardTheme === opt.id ? 'var(--text)' : 'var(--muted)',
                      boxShadow: leaderboardTheme === opt.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: opt.dot,
                      display: 'inline-block'
                    }} />
                    {opt.label}
                  </button>
                ))}
              </div>

              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: activeThemeConfig.badgeColor,
                background: activeThemeConfig.badgeBg,
                border: activeThemeConfig.badgeBorder || 'none',
                padding: '4px 12px',
                borderRadius: '20px',
                transition: 'all 0.2s ease'
              }}>
                Leaderboard
              </span>
            </div>
          </div>

          {/* Scrollable Leaderboard Container with Smooth Scrolling Effect */}
          <div
            className="leaderboard-scroll-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '340px',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingRight: '4px'
            }}
          >
            {[
              { rank: 1, name: 'Vikram Patel', initials: 'VP', tier: 'Crown Unicorn · Tier 7', totalEarned: 1850000, dailyYieldVal: 22500 },
              { rank: 2, name: 'Kabir Nair', initials: 'KN', tier: 'Diamond Whale · Tier 6', totalEarned: 1240000, dailyYieldVal: 11250 },
              { rank: 3, name: 'Aarav Sharma', initials: 'AS', tier: 'Elite Portfolio · Tier 5', totalEarned: 780000, dailyYieldVal: 4500 },
              { rank: 4, name: 'Meera Iyer', initials: 'MI', tier: 'Premium Wealth · Tier 4', totalEarned: 510000, dailyYieldVal: 2250 },
              { rank: 5, name: user?.name || 'Rutajeet Mukherjee', initials: user?.initials || 'RM', tier: 'Gold Unicorn · Pro Trader', totalEarned: (user?.roiWalletBalance || 54000) + (user?.referralWalletBalance || 38750) + 250000, dailyYieldVal: 2250, isUser: true },
              { rank: 6, name: 'Rohan Mehta', initials: 'RM', tier: 'Apex Growth · Tier 4', totalEarned: 445000, dailyYieldVal: 1800 },
              { rank: 7, name: 'Ananya Sen', initials: 'AS', tier: 'Alpha Venture · Tier 3', totalEarned: 390000, dailyYieldVal: 1500 },
              { rank: 8, name: 'Devendra Rao', initials: 'DR', tier: 'Capital Club · Tier 3', totalEarned: 320000, dailyYieldVal: 1350 },
              { rank: 9, name: 'Priya Deshmukh', initials: 'PD', tier: 'Velocity Trader · Tier 2', totalEarned: 260000, dailyYieldVal: 900 },
              { rank: 10, name: 'Siddharth Roy', initials: 'SR', tier: 'Growth Pioneer · Tier 2', totalEarned: 210000, dailyYieldVal: 675 }
            ].map((earner) => (
              <div
                key={earner.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 0',
                  borderTop: '1px solid var(--divider)',
                  minHeight: '66px',
                  transition: 'background 0.15s ease'
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
                    {formatCurrency(earner.totalEarned)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    +{formatCurrency(earner.dailyYieldVal)}/day
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Guidance Indicator with Touch-Friendly Scroll Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            marginTop: '4px',
            borderTop: '1px solid var(--divider)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--muted)',
            letterSpacing: '0.2px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px' }}>↕</span> Scroll to view all 10 rankings
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('.leaderboard-scroll-container');
                  if (el) el.scrollBy({ top: -140, behavior: 'smooth' });
                }}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--text)'
                }}
                aria-label="Scroll Up"
                title="Scroll Up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('.leaderboard-scroll-container');
                  if (el) el.scrollBy({ top: 140, behavior: 'smooth' });
                }}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--text)'
                }}
                aria-label="Scroll Down"
                title="Scroll Down"
              >
                ▼
              </button>
            </div>
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
            maxHeight: '90vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 28px)',
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
                  {formatCurrency(roiWalletBalance)}
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
                  {formatCurrency(referralWalletBalance)}
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
                  <span className="num" style={{ fontSize: '18px', color: 'var(--muted)', marginRight: '6px' }}>{currencySymbol}</span>
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
