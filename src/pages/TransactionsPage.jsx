import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function TransactionsPage() {
  const { transactions, showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'roi', label: 'ROI' },
    { id: 'referral', label: 'Referral' },
    { id: 'withdraw', label: 'Withdrawals' }
  ];

  const filteredTxns = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Filter Chips Bar matching Unicorn_Mobile_App.html Screen 16 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>Transactions</h1>
        <div role="group" aria-label="Filter by type" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

              const isPositive = t.amountFormatted.startsWith('+');

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
                    {t.sub}
                  </span>

                  {/* Col 3: Date */}
                  <span style={{ fontSize: '14px', color: 'var(--text2)' }}>
                    {t.date}
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
                    {t.amountFormatted}
                  </span>

                  {/* Col 5: Status */}
                  <span style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'right' }}>
                    {t.status}
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
            const isPositive = t.amountFormatted.startsWith('+');

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
                    {t.date} · {t.sub || t.type}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                  <span className="num" style={{ fontSize: '15px', fontWeight: 600, color: isPositive ? 'var(--pos)' : 'var(--text)' }}>
                    {t.amountFormatted}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: t.status === 'Completed' ? 'var(--pos)' : t.status === 'Pending' ? '#FFB800' : 'var(--muted)',
                    background: t.status === 'Completed' ? 'rgba(94, 224, 168, 0.12)' : 'var(--surface2)',
                    padding: '2px 6px',
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
                  color: selectedTx.amountFormatted.startsWith('+') ? 'var(--pos)' : 'var(--text)',
                  marginTop: '4px'
                }}
              >
                {selectedTx.amountFormatted}
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
                <span style={{ color: 'var(--pos)', fontWeight: 600 }}>{selectedTx.status}</span>
              </div>
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
