import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function TransactionsPage() {
  const { transactions, showToast, fetchUserTransactions, currency, formatCurrency } = useApp();
  const [filter, setFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatTxAmount = (t, isPos) => {
    if (!t) return '';
    if (t.amount !== undefined && t.amount !== null && !isNaN(Number(t.amount))) {
      const formatted = formatCurrency(Math.abs(Number(t.amount)));
      return isPos ? `+${formatted}` : `-${formatted}`;
    }
    if (t.amountFormatted && typeof t.amountFormatted === 'string') {
      const rawNum = Number(t.amountFormatted.replace(/[₹$,+\-]/g, ''));
      if (!isNaN(rawNum) && rawNum > 0) {
        const formatted = formatCurrency(rawNum);
        return isPos ? `+${formatted}` : `-${formatted}`;
      }
    }
    return t.amountFormatted || String(t.amount || '');
  };

  // Auto-refresh user transactions every 5 seconds so approvals/rejections appear automatically
  useEffect(() => {
    if (!fetchUserTransactions) return;
    fetchUserTransactions();
    const timer = setInterval(() => {
      fetchUserTransactions();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fetchUserTransactions) await fetchUserTransactions();
      showToast('Transactions refreshed from database.');
    } catch (e) {}
    setIsRefreshing(false);
  };

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdraw', label: 'Withdrawals' },
    { id: 'roi', label: 'ROI' },
    { id: 'referral', label: 'Referral' }
  ];

  const filteredTxns = transactions.filter(t => {
    if (filter === 'all') return true;
    const tType = (t.type || '').toLowerCase();
    if (filter === 'withdraw') return tType.includes('withdraw') || tType.includes('payout');
    if (filter === 'deposit') return tType.includes('deposit');
    return tType === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Filter Chips Bar matching Unicorn_Mobile_App.html Screen 16 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: 'var(--text)' }}>Transactions</h1>
        <div role="group" aria-label="Filter by type" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`chip ${filter === opt.id ? 'on' : ''}`}
              style={{ padding: '8px 18px', borderRadius: '18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table Card (Exact .row structure from file) */}
      <section className="card desktop-table-wrapper" style={{ overflowX: 'auto', padding: 0 }}>
        <div style={{ minWidth: '760px' }}>
          {/* Table Header Row */}
          <div
            className="row"
            style={{
              borderTop: 0,
              minHeight: '52px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1fr',
              alignItems: 'center',
              gap: '16px',
              padding: '14px 24px',
              borderBottom: '1px solid var(--divider)'
            }}
          >
            <span>Transaction</span>
            <span>Method</span>
            <span>Date</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
            <span style={{ textAlign: 'right' }}>Status</span>
          </div>

          {/* Transaction Rows */}
          {filteredTxns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: '14px' }}>
              No transactions found for this filter.
            </div>
          ) : (
            filteredTxns.map((t) => {
              const iconD = t.type === 'deposit'
                ? ICONS.deposit
                : t.type === 'roi'
                ? ICONS.invest
                : t.type === 'referral'
                ? ICONS.referral
                : t.type === 'withdraw'
                ? ICONS.wallet
                : ICONS.invest;

              const isPositive = String(t.amountFormatted || t.amount || '').startsWith('+') || t.type === 'deposit' || t.type === 'roi' || t.type === 'referral';

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTx(t)}
                  className="row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1fr',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 24px',
                    borderTop: '1px solid var(--divider)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Col 1: Icon + Title + ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--icon-bg)',
                      color: 'var(--accent-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none'
                    }}>
                      <Icon d={iconD} size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 500 }}>{t.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.id}</span>
                    </div>
                  </div>

                  {/* Col 2: Method */}
                  <span style={{ fontSize: '14px', color: 'var(--text2)' }}>
                    {t.method || t.sub || (t.type === 'roi' ? 'Daily ROI (0.45%)' : t.type === 'referral' ? 'Referral Share' : 'Protocol')}
                  </span>

                  {/* Col 3: Date */}
                  <span style={{ fontSize: '14px', color: 'var(--text2)' }}>
                    {t.date || (t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))}
                  </span>

                  {/* Col 4: Amount */}
                  <span
                    className="num"
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isPositive ? 'var(--pos)' : 'var(--text)',
                      textAlign: 'right'
                    }}
                  >
                    {formatTxAmount(t, isPositive)}
                  </span>

                  {/* Col 5: Status */}
                  <span style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: t.status === 'Completed'
                        ? 'var(--pos-bg)'
                        : t.status === 'Rejected'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(255, 184, 0, 0.15)',
                      color: t.status === 'Completed'
                        ? 'var(--pos)'
                        : t.status === 'Rejected'
                        ? '#ef4444'
                        : '#ff9800'
                    }}>
                      {t.status}
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Mobile Card List View (Phones <= 768px) */}
      <section className="card mobile-tx-cards-wrapper" style={{ padding: '8px 16px' }}>
        {filteredTxns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)', fontSize: '14px' }}>
            No transactions found for this filter.
          </div>
        ) : (
          filteredTxns.map((t, idx) => {
            const iconD = t.type === 'deposit'
              ? ICONS.deposit
              : t.type === 'roi'
              ? ICONS.invest
              : t.type === 'referral'
              ? ICONS.referral
              : t.type === 'withdraw'
              ? ICONS.wallet
              : ICONS.invest;
            const isPositive = String(t.amountFormatted || t.amount || '').startsWith('+') || t.type === 'deposit' || t.type === 'roi' || t.type === 'referral';

            return (
              <div
                key={t.id || idx}
                onClick={() => setSelectedTx(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 0',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--divider)',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--icon-bg)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none'
                }}>
                  <Icon d={iconD} size={18} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {t.date || (t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today')} · {t.method || t.sub || (t.type === 'roi' ? 'Daily 0.45% ROI' : t.type)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                  <span className="num" style={{ fontSize: '15px', fontWeight: 600, color: isPositive ? 'var(--pos)' : 'var(--text)' }}>
                    {formatTxAmount(t, isPositive)}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: t.status === 'Completed' ? 'var(--pos)' : t.status === 'Rejected' ? '#ef4444' : '#FFB800',
                    background: t.status === 'Completed' ? 'rgba(94, 224, 168, 0.12)' : t.status === 'Rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 184, 0, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Transaction Receipt Modal */}
      {selectedTx && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
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
            maxWidth: '460px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Transaction Receipt</h3>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Amount</span>
              <div
                className="num"
                style={{
                  fontSize: '36px',
                  fontWeight: 600,
                  color: (String(selectedTx.amountFormatted || selectedTx.amount || '').startsWith('+') || selectedTx.type === 'deposit' || selectedTx.type === 'roi' || selectedTx.type === 'referral') ? 'var(--pos)' : 'var(--text)',
                  marginTop: '4px'
                }}
              >
                {formatTxAmount(selectedTx, (String(selectedTx.amountFormatted || selectedTx.amount || '').startsWith('+') || selectedTx.type === 'deposit' || selectedTx.type === 'roi' || selectedTx.type === 'referral'))}
              </div>
            </div>

            <div style={{
              background: 'var(--surface2)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Transaction:</span>
                <span style={{ fontWeight: 600 }}>{selectedTx.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Category:</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{selectedTx.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Timestamp:</span>
                <span>{selectedTx.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Status:</span>
                <span style={{
                  color: selectedTx.status === 'Completed' ? 'var(--pos)' : selectedTx.status === 'Rejected' ? '#ef4444' : '#FFB800',
                  fontWeight: 600
                }}>
                  {selectedTx.status}
                </span>
              </div>
              {selectedTx.reviewNotes && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span>Admin Note:</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '220px' }}>{selectedTx.reviewNotes}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="btnp btnw"
              style={{ height: '48px', fontSize: '15px' }}
            >
              <span className="gt">Close Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
