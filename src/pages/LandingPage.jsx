import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function LandingPage() {
  const {
    openLoginModal,
    openRegisterModal,
    login,
    packages,
    navigateTo,
    connectWeb3Wallet,
    user
  } = useApp();

  const [selectedCalcPkg, setSelectedCalcPkg] = useState(packages[2] || packages[0]);
  const [activeFaq, setActiveFaq] = useState(null);

  const calcAmount = Number(selectedCalcPkg.amount || 250000);
  const calcDaily = Math.floor((calcAmount * 45) / 10000);
  const calcMonthly = calcDaily * 22;
  const calcBonusUnc = Math.round(calcAmount / 100);

  const faqs = [
    {
      q: 'How does the 0.45% Daily ROI yield work?',
      a: 'Every active investment package accrues a fixed 0.45% daily return calculated on business trading days (Monday through Friday, 22 days per calendar month = 9.9% monthly return). Weekends (Saturday and Sunday) are non-trading pause days to protect platform liquidity.'
    },
    {
      q: 'What is the Isolated Three-Wallet system?',
      a: 'To guarantee institutional-grade auditability and prevent capital co-mingling, UNICORN separates funds into three ledger accounts: (1) Main Deposit Wallet for uncommitted deposits ready to invest, (2) ROI Wallet for daily yields, and (3) Referral Wallet for commissions and milestone rewards.'
    },
    {
      q: 'How do deposits work across fiat (INR) and crypto (USDT)?',
      a: 'We support dual-rail inbound capital: instant Indian Rupee (INR) deposits via dynamic UPI QR code with 12-digit UTR reconciliation, and BNB Smart Chain USDT (BEP-20) with automated on-chain verification at a 1 USDT = ₹100 platform reference rate.'
    },
    {
      q: 'When is Two-Factor Authentication (2FA) required?',
      a: 'In accordance with our user-friendly security policy, 2FA is not required for daily browsing or deposits; it is strictly and mandatorily enforced at the moment of withdrawal to safeguard your accumulated funds.'
    },
    {
      q: 'How are referral commissions structured?',
      a: 'Referral rewards are calculated as an override on the daily ROI earned by your team members (ROI-on-ROI), not an unsustainable percentage of principal: 5% on Level 1 (requires 2 directs), 2% on Levels 2–5 (requires 4 directs), 1% on Levels 6–10, 0.25% on Levels 11–25, and 0.125% for Level 26+.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', maxWidth: '1180px', margin: '0 auto', width: '100%', padding: '20px 0 60px' }}>
      
      {/* 1. Hero Section */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '24px',
        padding: 'clamp(32px, 6vw, 64px) 20px',
        background: 'linear-gradient(180deg, rgba(181, 92, 169, 0.12) 0%, rgba(18, 20, 31, 0) 100%)',
        borderRadius: '32px',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(181, 92, 169, 0.15)',
          border: '1px solid rgba(181, 92, 169, 0.3)',
          color: 'var(--accent-text)',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <span>🦄</span>
          <span>UNICORN PROTOCOL · BEP-20 WEB3 ENGINE</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          maxWidth: '900px',
          margin: 0
        }}>
          Decentralized Wealth &amp; Yields with{' '}
          <span className="gt" style={{
            background: 'var(--grad)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            0.45% Daily ROI
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--muted)',
          maxWidth: '740px',
          lineHeight: 1.6,
          margin: 0
        }}>
          The next-generation Web3 rewards platform powered by BNB Smart Chain. Isolated 3-wallet ledgers, dual-rail INR &amp; USDT deposits, 22 monthly trading days, and multi-tier community rewards.
        </p>

        {/* Hero CTA Action Group */}
        <div style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '8px'
        }}>
          {user ? (
            <button
              onClick={() => navigateTo('home')}
              className="btnp btnw"
              style={{
                padding: '0 32px',
                height: '52px',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '14px',
                cursor: 'pointer'
              }}
            >
              Go to Your Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={openRegisterModal}
                className="btnp btnw"
                style={{
                  padding: '0 32px',
                  height: '52px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '14px',
                  cursor: 'pointer'
                }}
              >
                Create Free Account
              </button>

              <button
                onClick={openLoginModal}
                className="btno"
                style={{
                  padding: '0 28px',
                  height: '52px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '14px',
                  cursor: 'pointer'
                }}
              >
                Sign In to Dashboard
              </button>
            </>
          )}
        </div>

        {/* 1-Click Quick Demo Sign In bar for testing */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '12px',
          background: 'var(--surface2)',
          padding: '8px 16px',
          borderRadius: '14px',
          border: '1px solid var(--border2)',
          fontSize: '13px'
        }}>
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>⚡ Try Instant Demo:</span>
          <button
            onClick={() => login('rutajeet@unicorn.io', 'UserPassword2026!')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-text)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            👤 Investor View
          </button>
          <span style={{ color: 'var(--border2)' }}>|</span>
          <button
            onClick={() => login('admin@unicorn.vip', 'AdminPassword2026!')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E072D0',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            🛡️ Admin View
          </button>
        </div>

        {/* Platform Stat Highlights Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          width: '100%',
          marginTop: '24px'
        }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Daily Fixed Yield</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--pos)', marginTop: '4px' }}>0.45%</div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Mon – Fri (22 Days/Mo)</span>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Yield</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>9.90%</div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Guaranteed trading schedule</span>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Minimum Investment</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>₹10,000</div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Starting from $100</span>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Native Token</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-text)', marginTop: '4px' }}>100M UNC</div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>BEP-20 BNB Smart Chain</span>
          </div>
        </div>
      </section>

      {/* 2. Interactive ROI Yield Calculator */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0' }}>Interactive Yield Calculator</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
            Choose an investment tier to calculate your exact projected daily returns, monthly earnings, and UNC bonus tokens.
          </p>
        </div>

        {/* Tier Selector Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => setSelectedCalcPkg(pkg)}
              className={`chip ${selectedCalcPkg.id === pkg.id ? 'on' : ''}`}
              style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              {pkg.name} (₹{(pkg.amount / 1000).toLocaleString()}k)
            </button>
          ))}
        </div>

        {/* Calculator Display Card */}
        <div className="card" style={{
          padding: 'clamp(24px, 4vw, 40px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(181, 92, 169, 0.08) 100%)',
          border: '1px solid var(--border)'
        }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Package Tier
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: 700, margin: '4px 0 12px 0' }}>
              {selectedCalcPkg.name}
            </h3>
            <div className="num" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)' }}>
              ₹{calcAmount.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
              Reference Value: ${(calcAmount / 100).toLocaleString()} USDT
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            borderLeft: '1px solid var(--divider)',
            paddingLeft: 'clamp(16px, 3vw, 32px)'
          }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Daily Return (0.45% Mon–Fri)</span>
              <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--pos)' }}>
                +₹{calcDaily.toLocaleString('en-IN')} / day
              </div>
            </div>

            <div>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Monthly Return (22 Working Days)</span>
              <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                ₹{calcMonthly.toLocaleString('en-IN')} / mo
              </div>
            </div>

            <div>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>UNC Token Incentive Bonus</span>
              <div className="num" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-text)' }}>
                +{calcBonusUnc.toLocaleString('en-IN')} UNC
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={openRegisterModal}
              className="btnp btnw"
              style={{ height: '48px', fontSize: '15px', fontWeight: 600, borderRadius: '12px', cursor: 'pointer' }}
            >
              Deploy ₹{calcAmount.toLocaleString('en-IN')}
            </button>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
              Instant activation upon deposit confirmation
            </span>
          </div>
        </div>
      </section>

      {/* 3. The Isolated Three-Wallet System */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0' }}>Isolated 3-Wallet Ledger</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
            Guaranteed capital protection and mathematical transparency through isolated balance accounts.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Main Deposit Wallet */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(76, 140, 245, 0.15)',
              color: '#4C8CF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🏦
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>1. Main Deposit Wallet</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Holds fresh fiat (UPI INR) and crypto (USDT BEP-20) inbound capital. Ready to be deployed into investment packages. Cannot be withdrawn prior to plan deployment (anti-money laundering buffer).
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '12px', fontWeight: 600, color: '#4C8CF5' }}>
              ✓ Dual-Rail Inbound Verification
            </div>
          </div>

          {/* ROI Wallet */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(94, 224, 168, 0.15)',
              color: 'var(--pos)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              📈
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>2. ROI Yield Wallet</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Receives daily trading profits (0.45% Mon–Fri) every night at 00:05 IST via automated background cron. Funds are available for immediate withdrawal or reinvestment into larger package tiers.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--pos)' }}>
              ✓ 22 Working Days Per Month
            </div>
          </div>

          {/* Referral Wallet */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(181, 92, 169, 0.15)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🤝
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>3. Referral Rewards Wallet</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Holds multi-tier generation overrides (up to 5% daily ROI-on-ROI), one-time rank achievement cash bonuses, and direct volume qualifications for all-expenses-paid international trips.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
              ✓ Up to 5 Generations + Infinite Pool
            </div>
          </div>
        </div>
      </section>

      {/* 4. Referral Matrix & Achiever Travel Passes */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {/* Left: Referral Matrix */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Referral Network (ROI on ROI)</h3>
            <span style={{ fontSize: '12px', color: 'var(--pos)', fontWeight: 600, background: 'rgba(94, 224, 168, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
              Daily Overrides
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            Commissions are calculated as an override on daily ROI earned by your downline, not principal.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <strong>Level 1 (Direct Referrals)</strong>
              <span className="num" style={{ color: 'var(--pos)', fontWeight: 700 }}>5% Daily (≥2 Directs)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <strong>Levels 2–5 (Team Generations)</strong>
              <span className="num" style={{ color: 'var(--pos)', fontWeight: 700 }}>2% Daily (≥4 Directs)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <strong>Levels 6–10 (Expansion Tier)</strong>
              <span className="num" style={{ color: 'var(--pos)', fontWeight: 700 }}>1% Daily (≥7 Directs)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <strong>Levels 11–25 (Leadership Tier)</strong>
              <span className="num" style={{ color: 'var(--pos)', fontWeight: 700 }}>0.25% Daily (≥12 Directs)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <strong>Level 26+ (Infinite Community)</strong>
              <span className="num" style={{ color: 'var(--pos)', fontWeight: 700 }}>0.125% Daily (≥15 Directs)</span>
            </div>
          </div>
        </div>

        {/* Right: Achiever Travel Club */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Achiever Travel Club Passes</h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, background: 'rgba(181, 92, 169, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
              Direct Volume
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            Unlock all-expenses-paid national and international luxury tour tickets within 4 months.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <span>🌴 <strong>Goa Trip (3D/2N)</strong></span>
              <span className="num" style={{ fontWeight: 600 }}>₹5,00,000 Direct</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <span>🌊 <strong>Andaman Trip (4D/3N)</strong></span>
              <span className="num" style={{ fontWeight: 600 }}>₹15,00,000 Direct</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <span>✈️ <strong>Thailand Trip (5D/4N)</strong></span>
              <span className="num" style={{ fontWeight: 600 }}>₹30,00,000 Direct</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <span>🏙️ <strong>Dubai Grand Tour (5D/4N)</strong></span>
              <span className="num" style={{ fontWeight: 600 }}>₹50,00,000 Direct</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '10px', fontSize: '13px' }}>
              <span>🏰 <strong>Europe Luxury Tour (7D/6N)</strong></span>
              <span className="num" style={{ fontWeight: 600 }}>₹1,00,00,000 Direct</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions (FAQ) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, margin: '0 0 8px 0' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
            Everything you need to know about deposits, daily returns, wallets, and security.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="card"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                style={{
                  padding: '18px 22px',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  border: isOpen ? '1px solid var(--accent-text)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{faq.q}</span>
                  <span style={{ fontSize: '18px', color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    ▼
                  </span>
                </div>
                {isOpen && (
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '12px 0 0 0', borderTop: '1px solid var(--divider)', paddingTop: '10px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Bottom Banner CTA */}
      <section style={{
        textAlign: 'center',
        padding: 'clamp(36px, 5vw, 60px) 24px',
        borderRadius: '28px',
        background: 'linear-gradient(135deg, rgba(181, 92, 169, 0.2) 0%, rgba(76, 140, 245, 0.2) 100%)',
        border: '1px solid rgba(181, 92, 169, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px'
      }}>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 700, margin: 0 }}>
          Start Earning 0.45% Daily Today
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '600px', margin: 0 }}>
          Join thousands of investors generating automated yields on the UNICORN Web3 protocol. Create your account in under 60 seconds.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={openRegisterModal}
            className="btnp btnw"
            style={{ padding: '0 32px', height: '50px', fontSize: '16px', fontWeight: 600, borderRadius: '12px', cursor: 'pointer' }}
          >
            Create Your Account
          </button>
          <button
            onClick={openLoginModal}
            className="btno"
            style={{ padding: '0 24px', height: '50px', fontSize: '16px', fontWeight: 600, borderRadius: '12px', cursor: 'pointer' }}
          >
            Sign In
          </button>
        </div>
      </section>
    </div>
  );
}

