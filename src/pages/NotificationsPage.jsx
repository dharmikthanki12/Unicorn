import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function NotificationsPage() {
  const {
    notifications,
    adminNotifications,
    setNotifications,
    setAdminNotifications,
    user,
    setUser,
    showToast,
    navigateTo
  } = useApp();

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN'));
  const activeList = isAdmin ? (adminNotifications || []) : (notifications || []);
  const setActiveList = isAdmin ? setAdminNotifications : setNotifications;

  const getIcon = (type) => {
    switch (type) {
      case 'deposit': return ICONS.deposit;
      case 'roi': return ICONS.invest;
      case 'referral': return ICONS.referral;
      case 'bonus': return ICONS.trip;
      case 'security':
      case 'admin': return ICONS.security;
      case 'wallet':
      case 'withdraw': return ICONS.wallet;
      default: return ICONS.bell;
    }
  };

  const markAllRead = () => {
    if (setActiveList) {
      setActiveList(prev => prev.map(n => ({ ...n, unread: false })));
    } else {
      activeList.forEach(n => { n.unread = false; });
      setUser(prev => ({ ...prev }));
    }
    showToast('All notifications marked as read');
  };

  const toggleSingleRead = (id) => {
    if (setActiveList) {
      setActiveList(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
    } else {
      const item = activeList.find(n => n.id === id);
      if (item) {
        item.unread = !item.unread;
        setUser(prev => ({ ...prev }));
      }
    }
  };

  const unreadTotal = activeList.filter(n => n.unread).length;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => (navigateTo ? navigateTo('home') : window.history.back())}
            aria-label="Back to dashboard"
            className="header-back-btn"
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #B55CA9 0%, #8A70D6 50%, #4C8CF5 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(181, 92, 169, 0.35)',
              flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
          </button>
          <div>
            <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>
              {isAdmin ? 'Admin Operations Alerts' : 'Notifications'}
            </h1>
            {isAdmin && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                Live verification queue requests, daily ROI cycle events, and platform security alerts.
              </p>
            )}
          </div>
        </div>

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

      {/* Notifications Card matching screen_Notifications_desktop.html */}
      <section className="card" style={{ padding: '8px 24px' }}>
        {activeList.length > 0 ? (
          activeList.map((n, idx) => (
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
