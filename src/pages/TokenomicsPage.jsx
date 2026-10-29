import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function TokenomicsPage() {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const contractAddress = '0x71CA9528f06a2340E7D2361B86F2aA9b3B08C91a7';

  const handleCopy = () => {
    navigator.clipboard?.writeText(contractAddress);
    setCopied(true);
    showToast('Contract address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToMetaMask = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: contractAddress,
              symbol: 'UNC',
              decimals: 18,
              image: `${window.location.origin}/unicorn-logo.png`
            }
          }
        });
        showToast('UNC Token added to your wallet!');
      } catch (e) {
        showToast('Request dismissed or unsupported browser', 'error');
      }
    } else {
      showToast('MetaMask not detected. Install MetaMask extension to add token.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>Unicorn Token (UNC)</h1>
        <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
          Official BEP-20 governance, utility, and liquidity token fueling the Unicorn investment and rewards ecosystem.
        </p>
      </div>

      {/* Hero Overview Card */}
      <section className="card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'var(--surface3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(181, 92, 169, 0.4)',
              border: '1px solid var(--border2)'
            }}>
              <img src="/unicorn-logo.png" alt="Unicorn UNC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="num" style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Unicorn</h2>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-text)' }}>UNC</span>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                BNB Smart Chain (BEP-20) · Total Supply: 100,000,000 UNC
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToMetaMask}
            className="btnp btnw"
            style={{ height: '48px', padding: '0 24px', fontSize: '14px' }}
          >
            🦊 Add UNC to MetaMask
          </button>
        </div>

        {/* Contract Address Box */}
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
              VERIFIED BEP-20 SMART CONTRACT
            </span>
            <span className="num" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              {contractAddress}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopy} className="copy" style={{ fontSize: '13px', padding: '8px 16px' }}>
              <Icon d={copied ? ICONS.check : ICONS.copy} size={15} />
              {copied ? 'Copied' : 'Copy Address'}
            </button>
            <a
              href={`https://bscscan.com/token/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="copy"
              style={{ fontSize: '13px', padding: '8px 16px', textDecoration: 'none' }}
            >
              View on BscScan ↗
            </a>
          </div>
        </div>

        {/* Token Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--surface2)', padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Token Supply</span>
            <span className="num" style={{ fontSize: '26px', fontWeight: 800 }}>100,000,000 UNC</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Strict hard cap (100M)</span>
          </div>

          <div style={{ background: 'var(--surface2)', padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Decimals</span>
            <span className="num" style={{ fontSize: '26px', fontWeight: 800 }}>18</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Standard BEP-20 standard</span>
          </div>

          <div style={{ background: 'var(--surface2)', padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Daily ROI Liquidity</span>
            <span className="num" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--pos)' }}>45% Reserved</span>
            <span style={{ fontSize: '11px', color: 'var(--pos)' }}>Automated contract yield</span>
          </div>

          <div style={{ background: 'var(--surface2)', padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Reference Peg</span>
            <span className="num" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-text)' }}>$1 = ₹100</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Guaranteed settlement base</span>
          </div>
        </div>
      </section>

      {/* Allocation Breakdown */}
      <section className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Token Allocation & Distribution</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Platform Liquidity & Daily ROI Yield Pool', pct: '45%', amount: '45,000,000 UNC', color: 'var(--pos)' },
            { label: 'Generational Referral Rewards & Bonuses', pct: '25%', amount: '25,000,000 UNC', color: 'var(--accent-text)' },
            { label: 'Ecosystem Staking & Travel Pass Rewards', pct: '15%', amount: '15,000,000 UNC', color: '#ff9800' },
            { label: 'Technology, Audit & Security Infrastructure', pct: '10%', amount: '10,000,000 UNC', color: '#29b6f6' },
            { label: 'Core Team & Advisory (Vested 24 Months)', pct: '5%', amount: '5,000,000 UNC', color: '#ab47bc' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>{item.label}</span>
                <span className="num" style={{ fontWeight: 700, color: item.color }}>{item.pct} ({item.amount})</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--surface2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: item.pct, height: '100%', background: item.color, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

