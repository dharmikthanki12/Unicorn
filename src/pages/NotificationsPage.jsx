import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function NotificationsPage() {
  const { notifications, setUser, showToast } = useApp();
  const [filter, setFilter] = useState('all');

  const getIcon = (type) => {
    switch (type) {
      case 'deposit': return ICONS.deposit;
      case 'roi': return ICONS.invest;
      case 'referral': return ICONS.referral;
      case 'bonus': return ICONS.trip;
      case 'security': return ICONS.security;
      default: return ICONS.bell;
    }
  };

  const markAllRead = () => {
    notifications.forEach(n => { n.unread = false; });
    setUser(prev => ({ ...prev }));
    showToast('All notifications marked as read');
  };

  const toggleSingleRead = (id) => {
    const item = notifications.find(n => n.id === id);
    if (item) {
      item.unread = !item.unread;
      setUser(prev => ({ ...prev }));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread;
    return n.type === filter;
  });

  const unreadTotal = notifications.filter(n => n.unread).length;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>
          Notifications
        </h1>

        {unreadTotal > 0 && (
          <button
            onClick={markAllRead}
            className="chip on"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Mark all as read ({unreadTotal})
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${unreadTotal})` },
          { id: 'roi', label: 'Daily ROI' },
          { id: 'referral', label: 'Referrals' },
          { id: 'deposit', label: 'Deposits' },
          { id: 'security', label: 'Security' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`chip ${filter === item.id ? 'on' : ''}`}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications Card matching screen_Notifications_desktop.html */}
      <section className="card" style={{ padding: '8px 24px' }}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n, idx) => (
            <div
              key={n.id || idx}
              onClick={() => toggleSingleRead(n.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '18px 0',
                borderTop: idx === 0 ? 'none' : '1px solid var(--divider)',
                cursor: 'pointer'
              }}
            >
              {/* 44px Icon Container */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--icon-bg)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none'
                }}
              >
                <Icon d={getIcon(n.type)} size={20} />
              </div>

              {/* Text content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{n.title}</span>
                <span style={{ fontSize: '14px', lineHeight: 1.45, color: 'var(--text2)' }}>{n.body}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{n.time}</span>
              </div>

              {/* Unread indicator purple gradient dot */}
              {n.unread && (
                <span
                  aria-label="Unread"
                  role="img"
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--grad)',
                    marginTop: '6px',
                    flex: 'none'
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>No notifications found in this filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}
