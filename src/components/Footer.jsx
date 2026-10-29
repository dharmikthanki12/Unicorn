import React from 'react';
import { useApp } from '../context/AppContext';

export function Footer() {
  const { navigateTo } = useApp();

  return (
    <footer style={{
      width: '100%',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
      padding: '48px 24px 32px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '36px'
      }}>
        {/* Top Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px'
        }}>
          {/* Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'var(--surface3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(181, 92, 169, 0.3)'
              }}>
                <img src="/unicorn-logo.png" alt="Unicorn" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span className="num" style={{ fontSize: '20px', fontWeight: 800 }}>UNICORN</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Next-generation Web3 investment and rewards platform powered by Binance Smart Chain (BEP-20). Earning 0.45% daily returns with a multi-tiered generational referral network.
            </p>
            <div style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600 }}>
              Token: UNC (BEP-20) · Total Supply: 100M
            </div>
          </div>

          {/* Column 1: Platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform
            </span>
            <button onClick={() => navigateTo('home')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Dashboard Overview</button>
            <button onClick={() => navigateTo('invest')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>7 Investment Packages</button>
            <button onClick={() => navigateTo('deposit')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Deposit INR & USDT</button>
            <button onClick={() => navigateTo('withdraw')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Withdrawals (2FA)</button>
            <button onClick={() => navigateTo('transactions')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Audit Ledger</button>
          </div>

          {/* Column 2: Rewards & Network */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rewards & Network
            </span>
            <button onClick={() => navigateTo('referral')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>25+ Levels Referral Plan</button>
            <button onClick={() => navigateTo('referral')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Rank Reward Bonuses</button>
            <button onClick={() => navigateTo('referral')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Achiever Travel Passes</button>
            <button onClick={() => navigateTo('tokenomics')} style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'left', cursor: 'pointer' }}>Unicorn Tokenomics (UNC)</button>
            <button onClick={() => navigateTo('admin')} style={{ color: '#E072D0', fontSize: '13px', textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>Admin Console</button>
          </div>

          {/* Column 3: Security & Compliance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Security & Compliance
            </span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>• Strict 2FA at Withdrawal</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>• KYC Verification Compliant</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>• BEP-20 Smart Contract Audited</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>• 24/7 Liquidity Settlement</span>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>• $1 = ₹100 Reference Valuation</span>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div style={{
          borderTop: '1px solid var(--divider)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '12px',
          color: 'var(--muted)'
        }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Disclaimer: Unicorn is a decentralized rewards platform. Daily ROI yields are distributed according to liquidity pool performance and package rules. Users must comply with applicable local regulations.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>© 2026 Unicorn Web3 Technologies. All rights reserved.</span>
            <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Unicorn Protocol · v2.4 Release</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

