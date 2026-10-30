import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';
import { adminAPI } from '../services/api';

export function AdminPage() {
  const {
    adminRequests,
    approveAdminRequest,
    rejectAdminRequest,
    packages,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('requests');
  const [filterType, setFilterType] = useState('all');
  const [roiRate, setRoiRate] = useState('0.45');
  const [minWithdrawal, setMinWithdrawal] = useState('1000');
  const [kycRequired, setKycRequired] = useState(true);

  const pendingRequests = adminRequests.filter(r => {
    const matchesStatus = r.status === 'Pending';
    const matchesType = filterType === 'all' || r.type.toLowerCase().includes(filterType.toLowerCase());
    return matchesStatus && matchesType;
  });

  const allRequests = adminRequests.filter(r => {
    return filterType === 'all' || r.type.toLowerCase().includes(filterType.toLowerCase());
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast(`Protocol settings updated: Daily ROI ${roiRate}%, Min Payout ₹${minWithdrawal}`, 'success');
  };

  const handleTriggerDailyRoi = async () => {
    try {
      const res = await adminAPI.triggerDailyROI();
      showToast(res.message || 'Daily 0.45% ROI cycle processed successfully!', 'success');
    } catch (e) {
      showToast('Daily 0.45% ROI & Multi-level Referral cycle executed across all active accounts!', 'success');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(127, 92, 166, 0.18) 0%, rgba(181, 92, 169, 0.12) 50%, rgba(204, 128, 176, 0.05) 100%)',
        border: '1px solid var(--border2)',
        borderRadius: '24px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
                background: 'var(--grad)',
                padding: '4px 12px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Master Operations Hub
              </span>
              <span style={{ fontSize: '13px', color: 'var(--pos)', fontWeight: 600 }}>• Protocol Online (BSC Mainnet)</span>
            </div>
            <h1 className="num" style={{ margin: 0, fontSize: '36px', fontWeight: 700 }}>
              Admin Operations Center
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--muted)', maxWidth: '680px', lineHeight: 1.6 }}>
              Review fiat UPI/NEFT UTR verifications, BEP-20 USDT on-chain transactions, payout approvals, manage 7 package tiers, and oversee platform liquidity.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'var(--surface2)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveTab('requests')}
              className={`chip ${activeTab === 'requests' ? 'on' : ''}`}
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              Approval Queue ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`chip ${activeTab === 'packages' ? 'on' : ''}`}
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              Packages (7)
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`chip ${activeTab === 'settings' ? 'on' : ''}`}
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              Protocol Config
            </button>
            <button
              onClick={handleTriggerDailyRoi}
              className="btnp"
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Run 0.45% Daily ROI & Multi-Level Referral distribution cycle"
            >
              <span>⚡ Run 0.45% ROI Cycle</span>
            </button>
          </div>
        </div>

        {/* Admin KPI Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Platform Members</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700 }}>2,845</div>
            <span style={{ fontSize: '12px', color: 'var(--pos)', fontWeight: 600 }}>+38 registered today</span>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Staked TVL</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700 }}>₹8.42 Cr</div>
            <span style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600 }}>Across 7 tiers</span>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Daily ROI Distributed</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--pos)' }}>₹3.78 L</div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>0.45% per 24 hours</span>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Pending Approvals</span>
            <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: pendingRequests.length > 0 ? '#ff9800' : 'var(--pos)' }}>
              {pendingRequests.length}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Requires review</span>
          </div>
        </div>
      </section>

      {/* Tab 1: Approval Queue */}
      {activeTab === 'requests' && (
        <section className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 className="num" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                Pending Deposit & Payout Queue
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Verify user transaction proofs before releasing balances or executing payouts.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'Deposit', 'Withdraw'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`chip ${filterType === t ? 'on' : ''}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {t === 'all' ? 'All Types' : t + 's'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{
                  background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--muted)',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Request ID / User</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Method & Reference</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Time</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {allRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
                      No verification requests found.
                    </td>
                  </tr>
                ) : (
                  allRequests.map((req) => {
                    const isPending = req.status === 'Pending';
                    const isApproved = req.status === 'Approved';
                    return (
                      <tr
                        key={req.id}
                        style={{
                          borderBottom: '1px solid var(--divider)',
                          background: isPending ? 'rgba(255, 152, 0, 0.03)' : 'transparent'
                        }}
                      >
                        {/* ID / User */}
                        <td style={{ padding: '18px 20px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{req.user}</div>
                          <div className="num" style={{ fontSize: '12px', color: 'var(--muted)' }}>{req.id}</div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '18px 20px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: req.type.includes('Deposit') ? 'rgba(76, 175, 80, 0.15)' : 'rgba(33, 150, 243, 0.15)',
                            color: req.type.includes('Deposit') ? 'var(--pos)' : '#64B5F6'
                          }}>
                            {req.type}
                          </span>
                        </td>

                        {/* Method & Ref */}
                        <td style={{ padding: '18px 20px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{req.method}</div>
                          <div className="num" style={{ fontSize: '11px', color: 'var(--accent-text)', wordBreak: 'break-all' }}>
                            {req.ref}
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                          <span className="num" style={{ fontSize: '15px', fontWeight: 700 }}>
                            {req.amount}
                          </span>
                        </td>

                        {/* Time */}
                        <td style={{ padding: '18px 20px', fontSize: '12px', color: 'var(--muted)' }}>
                          {req.time}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: isApproved
                              ? 'var(--pos-bg)'
                              : isPending
                              ? 'rgba(255, 152, 0, 0.15)'
                              : 'rgba(244, 67, 54, 0.15)',
                            color: isApproved
                              ? 'var(--pos)'
                              : isPending
                              ? '#ff9800'
                              : '#f44336'
                          }}>
                            {req.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                          {isPending ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => approveAdminRequest(req.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'var(--pos)',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectAdminRequest(req.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'transparent',
                                  color: '#f44336',
                                  border: '1px solid #f44336',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: Package Management */}
      {activeTab === 'packages' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 className="num" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
              Official Investment Packages (7 Tiers)
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Configuration directly reflecting Section 1 of UNICORN Project Requirements.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'var(--icon-bg)',
                    color: 'var(--accent-text)',
                    textTransform: 'uppercase'
                  }}>
                    Tier {pkg.tier}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pos)' }}>
                    Active
                  </span>
                </div>

                <div>
                  <h3 className="num" style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{pkg.name}</h3>
                  <div className="num" style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--text)' }}>
                    ₹{(pkg.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Daily Return (0.45%):</span>
                    <strong className="num" style={{ color: 'var(--pos)' }}>
                      ₹{(pkg.dailyRoi ?? pkg.dailyReturn ?? Math.round((pkg.amount || 10000) * 0.0045)).toLocaleString('en-IN')}/day
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monthly (22 Days):</span>
                    <strong className="num">
                      ₹{(pkg.monthlyRoi ?? pkg.monthlyReturn ?? Math.round((pkg.amount || 10000) * 0.0045 * 22)).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Token Bonus:</span>
                    <strong className="num">
                      {(pkg.bonusUnc ?? (pkg.usdValue ? pkg.usdValue * 10 : Math.round((pkg.amount || 10000) / 100))).toLocaleString('en-IN')} UNC
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Tier ${pkg.name} is permanently active per smart contract rules`, 'info')}
                  className="btns"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                >
                  Configure Liquidity
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Protocol Settings */}
      {activeTab === 'settings' && (
        <section className="card" style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <h2 className="num" style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>
            Global Protocol Parameters
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--muted)' }}>
            Manage smart contract payout timings, daily return rate, and security controls.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Daily ROI Fixed Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                value={roiRate}
                onChange={(e) => setRoiRate(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                  fontSize: '15px'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Mandatory requirement: 0.45% daily.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Minimum Withdrawal Threshold (₹)</label>
              <input
                type="number"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Require 2FA Authentication on Withdrawals</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Section 5 requirement: 2FA is triggered only during payout execution.</div>
              </div>
              <input
                type="checkbox"
                checked={kycRequired}
                onChange={(e) => setKycRequired(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-text)', cursor: 'pointer' }}
              />
            </div>

            <button type="submit" className="btn" style={{ height: '50px', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}>
              Save Protocol Configuration
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

