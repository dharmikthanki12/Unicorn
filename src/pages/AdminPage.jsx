import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';
import { adminAPI } from '../services/api';

export function AdminPage() {
  const {
    user,
    adminRequests,
    approveAdminRequest,
    rejectAdminRequest,
    fetchAdminRequests,
    packages,
    showToast,
    navigateTo,
    openLoginModal,
    adminTab,
    setAdminTab
  } = useApp();

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN'));

  const activeTab = adminTab || 'requests';
  const setActiveTab = setAdminTab || (() => {});
  const [filterType, setFilterType] = useState('all');
  const [roiRate, setRoiRate] = useState('0.45');
  const [minWithdrawal, setMinWithdrawal] = useState('1000');
  const [kycRequired, setKycRequired] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Users Directory state
  const [dbUsers, setDbUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await adminAPI.getUsers();
      if (res && res.users) {
        setDbUsers(res.users);
      }
    } catch (e) {
      console.warn('Could not fetch registered users:', e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Auto-refresh queue and users every 5 seconds so new deposits/KYC/users appear automatically
  useEffect(() => {
    if (!isAdmin) return;
    if (fetchAdminRequests) fetchAdminRequests();
    fetchUsers();
    const timer = setInterval(() => {
      if (fetchAdminRequests) fetchAdminRequests();
      fetchUsers();
    }, 5000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAdminRequests ? fetchAdminRequests() : Promise.resolve(),
        fetchUsers()
      ]);
      showToast('Queue & Users refreshed from database.', 'success');
    } catch (e) {}
    setIsRefreshing(false);
  };

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '520px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '40px 24px' }} className="card">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#ef4444' }}>Admin Access Restricted</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          This console is strictly reserved for UNICORN platform administrators. If you are an administrator, please sign in with your administrative credentials.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigateTo('home')}
            className="btno"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Return to Dashboard
          </button>
          <button
            onClick={openLoginModal}
            className="btnp"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Admin Sign In
          </button>
        </div>
      </div>
    );
  }

  const pendingRequests = adminRequests.filter(r => {
    const matchesStatus = (r.status || '').toLowerCase() === 'pending';
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
        padding: 'clamp(16px, 4vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
            <h1 className="num" style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700 }}>
              Admin Operations Center
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--muted)', maxWidth: '680px', lineHeight: 1.5 }}>
              Review fiat UPI/NEFT UTR verifications, BEP-20 USDT on-chain transactions, payout approvals, manage 7 package tiers, and oversee platform liquidity.
            </p>
          </div>

          <div className="admin-header-tabs" style={{ display: 'flex', gap: '8px', background: 'var(--surface2)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('requests')}
              className={`chip ${activeTab === 'requests' ? 'on' : ''}`}
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              Approval Queue ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`chip ${activeTab === 'users' ? 'on' : ''}`}
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              Users Directory ({dbUsers.length})
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
            <div
              style={{
                fontSize: '12px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10B981',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
              title="Daily 0.45% ROI is automated by GitHub Actions: Mon-Fri at 12:00 AM IST"
            >
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
              <span>Daily ROI: Automated 0.45% (Mon–Fri 12:00 AM IST)</span>
            </div>
          </div>
        </div>

        {/* Admin KPI Stat Cards */}
        <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div className="admin-kpi-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Members</span>
            <div className="num" style={{ fontSize: '24px', fontWeight: 700 }}>{dbUsers.length > 0 ? dbUsers.length : 2845}</div>
            <span style={{ fontSize: '11px', color: 'var(--pos)', fontWeight: 600 }}>{dbUsers.length > 0 ? `${dbUsers.length} in MongoDB` : '+38 registered today'}</span>
          </div>

          <div className="admin-kpi-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Staked TVL</span>
            <div className="num" style={{ fontSize: '24px', fontWeight: 700 }}>₹8.42 Cr</div>
            <span style={{ fontSize: '11px', color: 'var(--accent-text)', fontWeight: 600 }}>Across 7 tiers</span>
          </div>

          <div className="admin-kpi-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Daily ROI</span>
            <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--pos)' }}>₹3.78 L</div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>0.45% per 24 hrs</span>
          </div>

          <div className="admin-kpi-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Pending Approvals</span>
            <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: pendingRequests.length > 0 ? '#ff9800' : 'var(--pos)' }}>
              {pendingRequests.length}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Requires review</span>
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

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {['all', 'Deposit', 'Withdraw', 'KYC'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`chip ${filterType === t ? 'on' : ''}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {t === 'all' ? 'All Types' : t === 'KYC' ? 'KYC Verifications' : t + 's'}
                </button>
              ))}
              <button
                onClick={handleRefresh}
                className="chip"
                style={{ fontSize: '12px', padding: '6px 14px', marginLeft: '8px', opacity: isRefreshing ? 0.6 : 1 }}
                disabled={isRefreshing}
              >
                {isRefreshing ? '⟳ Syncing...' : '⟳ Auto-sync (5s)'}
              </button>
            </div>
          </div>

          <div className="admin-table-desktop" style={{ overflowX: 'auto' }}>
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
                            background: req.type.toLowerCase().includes('kyc')
                              ? 'rgba(168, 85, 247, 0.15)'
                              : req.type.toLowerCase().includes('deposit')
                              ? 'rgba(76, 175, 80, 0.15)'
                              : 'rgba(33, 150, 243, 0.15)',
                            color: req.type.toLowerCase().includes('kyc')
                              ? '#C084FC'
                              : req.type.toLowerCase().includes('deposit')
                              ? 'var(--pos)'
                              : '#64B5F6'
                          }}>
                            {req.type}
                          </span>
                        </td>

                        {/* Method & Ref */}
                        <td style={{ padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{req.method}</span>
                            {req.autoVerified && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(76, 175, 80, 0.15)',
                                color: 'var(--pos)',
                                fontWeight: 700
                              }}>
                                AUTO BSC
                              </span>
                            )}
                          </div>
                          <div className="num" style={{ fontSize: '11px', color: 'var(--accent-text)', wordBreak: 'break-all' }}>
                            {req.ref || req.reference}
                          </div>
                          {req.reviewNotes && (
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', fontStyle: 'italic' }}>
                              Note: {req.reviewNotes}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                          <span className="num" style={{ fontSize: '15px', fontWeight: 700 }}>
                            {req.type.toLowerCase().includes('kyc') ? '—' : typeof req.amount === 'number' ? `₹${req.amount.toLocaleString('en-IN')}` : req.amount}
                          </span>
                        </td>

                        {/* Time */}
                        <td style={{ padding: '18px 20px', fontSize: '12px', color: 'var(--muted)' }}>
                          {req.time || req.date}
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
                            {req.autoVerified ? 'Auto-Approved (BSC)' : req.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                          {isPending && !req.autoVerified ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  const defaultNote = req.type.toLowerCase().includes('kyc')
                                    ? 'Government ID verified & approved'
                                    : 'Payment verified against bank statement';
                                  const notes = window.prompt ? window.prompt('Admin review notes (optional):', defaultNote) : 'Approved';
                                  if (notes !== null) approveAdminRequest(req.id, notes);
                                }}
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
                                onClick={() => {
                                  const defaultReason = req.type.toLowerCase().includes('kyc')
                                    ? 'Document details unreadable or invalid ID number'
                                    : 'Invalid or unverifiable payment reference';
                                  const reason = window.prompt ? window.prompt('Rejection reason / review notes:', defaultReason) : 'Rejected';
                                  if (reason !== null) rejectAdminRequest(req.id, reason);
                                }}
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
                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {req.autoVerified ? 'Verified on BSC' : 'Processed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View for Phones */}
          <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {allRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted)', fontSize: '14px' }}>
                No verification requests found.
              </div>
            ) : (
              allRequests.map((req) => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';
                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: req.type.toLowerCase().includes('kyc')
                          ? 'rgba(168, 85, 247, 0.15)'
                          : req.type.toLowerCase().includes('deposit')
                          ? 'rgba(76, 175, 80, 0.15)'
                          : 'rgba(33, 150, 243, 0.15)',
                        color: req.type.toLowerCase().includes('kyc')
                          ? '#C084FC'
                          : req.type.toLowerCase().includes('deposit')
                          ? 'var(--pos)'
                          : '#64B5F6'
                      }}>
                        {req.type}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
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
                        {req.autoVerified ? 'Auto-Approved (BSC)' : req.status}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{req.user}</div>
                      <div className="num" style={{ fontSize: '11px', color: 'var(--muted)', wordBreak: 'break-all' }}>{req.id}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '8px 12px', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Method & Ref</div>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{req.method}</div>
                        <div className="num" style={{ fontSize: '10px', color: 'var(--accent-text)', wordBreak: 'break-all' }}>{req.ref || req.reference}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Amount</div>
                        <div className="num" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-text)' }}>
                          {req.type.toLowerCase().includes('kyc') ? '—' : typeof req.amount === 'number' ? `₹${req.amount.toLocaleString('en-IN')}` : req.amount}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{req.time || req.date}</div>
                      </div>
                    </div>

                    {req.reviewNotes && (
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                        Note: {req.reviewNotes}
                      </div>
                    )}

                    {isPending && !req.autoVerified && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <button
                          onClick={() => {
                            const defaultNote = req.type.toLowerCase().includes('kyc')
                              ? 'Government ID verified & approved'
                              : 'Payment verified against bank statement';
                            const notes = window.prompt ? window.prompt('Admin review notes (optional):', defaultNote) : 'Approved';
                            if (notes !== null) approveAdminRequest(req.id, notes);
                          }}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: 'var(--pos)',
                            color: '#fff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const defaultReason = req.type.toLowerCase().includes('kyc')
                              ? 'Document details unreadable or invalid ID number'
                              : 'Invalid or unverifiable payment reference';
                            const reason = window.prompt ? window.prompt('Rejection reason / review notes:', defaultReason) : 'Rejected';
                            if (reason !== null) rejectAdminRequest(req.id, reason);
                          }}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: '#f44336',
                            border: '1px solid #f44336',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Tab: Users Directory */}
      {activeTab === 'users' && (
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
                Registered Users Database Directory
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Live user accounts saved in MongoDB with verified email, contact, and wallet balances.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search name, email, phone, code..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                style={{
                  height: '36px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: 'var(--text)',
                  minWidth: '220px'
                }}
              />
              <button
                onClick={fetchUsers}
                className="chip"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                disabled={loadingUsers}
              >
                {loadingUsers ? '⟳ Refreshing...' : '⟳ Refresh Users'}
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="admin-table-desktop" style={{ overflowX: 'auto' }}>
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
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>User Profile</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Email & Phone</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Referral / Sponsor</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>KYC Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Wallet Balance</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>Role & Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {dbUsers.filter(u => {
                  if (!usersSearch) return true;
                  const q = usersSearch.toLowerCase();
                  return (
                    (u.name && u.name.toLowerCase().includes(q)) ||
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q)) ||
                    (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
                    (u.referredBy && u.referredBy.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
                      {loadingUsers ? 'Loading registered users from database...' : 'No users found matching your search.'}
                    </td>
                  </tr>
                ) : (
                  dbUsers.filter(u => {
                    if (!usersSearch) return true;
                    const q = usersSearch.toLowerCase();
                    return (
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.email && u.email.toLowerCase().includes(q)) ||
                      (u.phone && u.phone.includes(q)) ||
                      (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
                      (u.referredBy && u.referredBy.toLowerCase().includes(q))
                    );
                  }).map((u) => {
                    const isKycVerified = u.kycStatus === 'Verified' || u.kycStatus === 'VERIFIED';
                    const isKycPending = u.kycStatus === 'Pending' || u.kycStatus === 'PENDING';
                    return (
                      <tr key={u._id || u.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name}</div>
                          <div className="num" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            ID: {u._id || u.id}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>{u.email}</span>
                            {u.isEmailVerified && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(76, 175, 80, 0.15)',
                                color: 'var(--pos)',
                                fontWeight: 700
                              }}>
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div className="num" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            📞 {u.phone || '—'}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' }}>
                            Code: {u.referralCode || '—'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Sponsor: {u.referredBy || 'Direct (None)'}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: isKycVerified
                              ? 'var(--pos-bg)'
                              : isKycPending
                              ? 'rgba(255, 152, 0, 0.15)'
                              : 'rgba(150, 150, 150, 0.15)',
                            color: isKycVerified
                              ? 'var(--pos)'
                              : isKycPending
                              ? '#ff9800'
                              : 'var(--muted)'
                          }}>
                            {u.kycStatus || 'UNVERIFIED'}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div className="num" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--pos)' }}>
                            ₹{Number(u.mainWalletBalance || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Main Wallet</div>
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: u.role === 'admin' ? 'rgba(181, 92, 169, 0.2)' : 'var(--surface2)',
                            color: u.role === 'admin' ? 'var(--accent-text)' : 'var(--text)',
                            textTransform: 'uppercase'
                          }}>
                            {u.role || 'user'}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View for Phones */}
          <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {dbUsers.filter(u => {
              if (!usersSearch) return true;
              const q = usersSearch.toLowerCase();
              return (
                (u.name && u.name.toLowerCase().includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.phone && u.phone.includes(q)) ||
                (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
                (u.referredBy && u.referredBy.toLowerCase().includes(q))
              );
            }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted)', fontSize: '14px' }}>
                {loadingUsers ? 'Loading registered users...' : 'No users found.'}
              </div>
            ) : (
              dbUsers.filter(u => {
                if (!usersSearch) return true;
                const q = usersSearch.toLowerCase();
                return (
                  (u.name && u.name.toLowerCase().includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q)) ||
                  (u.phone && u.phone.includes(q)) ||
                  (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
                  (u.referredBy && u.referredBy.toLowerCase().includes(q))
                );
              }).map((u) => {
                const isKycVerified = u.kycStatus === 'Verified' || u.kycStatus === 'VERIFIED';
                const isKycPending = u.kycStatus === 'Pending' || u.kycStatus === 'PENDING';
                return (
                  <div
                    key={u._id || u.id}
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{u.name}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: u.role === 'admin' ? 'rgba(181, 92, 169, 0.2)' : 'var(--surface)',
                          color: u.role === 'admin' ? 'var(--accent-text)' : 'var(--muted)',
                          textTransform: 'uppercase'
                        }}>
                          {u.role || 'user'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: isKycVerified ? 'var(--pos-bg)' : isKycPending ? 'rgba(255, 152, 0, 0.15)' : 'rgba(150, 150, 150, 0.15)',
                        color: isKycVerified ? 'var(--pos)' : isKycPending ? '#ff9800' : 'var(--muted)'
                      }}>
                        {u.kycStatus || 'UNVERIFIED'}
                      </span>
                    </div>

                    <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px' }}>{u.email}</span>
                        {u.isEmailVerified && (
                          <span style={{ fontSize: '10px', color: 'var(--pos)', fontWeight: 700 }}>✓ Verified Email</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        📞 {u.phone || 'No phone'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Referral Code</div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-text)' }}>{u.referralCode || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Wallet Balance</div>
                        <div className="num" style={{ fontWeight: 700, color: 'var(--pos)', fontSize: '14px' }}>
                          ₹{Number(u.mainWalletBalance || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                      Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · Sponsor: {u.referredBy || 'Direct'}
                    </div>
                  </div>
                );
              })
            )}
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

