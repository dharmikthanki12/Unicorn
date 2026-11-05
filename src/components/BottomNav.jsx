import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function BottomNav() {
  const {
    activeScreen,
    navigateTo,
    user,
    adminTab,
    setAdminTab,
    adminRequests
  } = useApp();

  if (activeScreen === 'landing' || !user) return null;

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN'));
  const inAdminMode = isAdmin && activeScreen === 'admin';

  const pendingCount = adminRequests?.filter(r => r.status === 'PENDING' || r.status === 'pending').length || 0;

  const tabs = inAdminMode
    ? [
        { id: 'requests', label: `Queue${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: ICONS.security, isTab: true },
        { id: 'users', label: 'Users', icon: ICONS.user, isTab: true },
        { id: 'packages', label: 'Packages', icon: ICONS.invest, isTab: true },
        { id: 'settings', label: 'Config', icon: ICONS.settings, isTab: true },
        { id: 'home', label: 'User View', icon: ICONS.home, isTab: false }
      ]
    : isAdmin
    ? [
        { id: 'home', label: 'Home', icon: ICONS.home },
        { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
        { id: 'invest', label: 'Invest', icon: ICONS.invest },
        { id: 'transactions', label: 'Txns', icon: ICONS.history },
        { id: 'admin', label: 'Admin 👑', icon: ICONS.settings }
      ]
    : [
        { id: 'home', label: 'Home', icon: ICONS.home },
        { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
        { id: 'invest', label: 'Invest', icon: ICONS.invest },
        { id: 'transactions', label: 'Txns', icon: ICONS.history },
        { id: 'referral', label: 'Referral', icon: ICONS.referral }
      ];

  const handleTabClick = (tab) => {
    if (inAdminMode && tab.isTab) {
      if (setAdminTab) setAdminTab(tab.id);
      return;
    }
    navigateTo(tab.id);
  };

  const isTabActive = (tab) => {
    if (inAdminMode && tab.isTab) {
      return (adminTab || 'requests') === tab.id;
    }
    if (tab.id === 'admin') return activeScreen === 'admin';
    if (tab.id === 'home') return activeScreen === 'home';
    if (tab.id === 'deposit') {
      return ['deposit', 'deposit-amount', 'deposit-method', 'deposit-inr', 'deposit-usdt'].includes(activeScreen);
    }
    if (tab.id === 'invest') return activeScreen === 'invest';
    if (tab.id === 'transactions') return activeScreen === 'transactions';
    if (tab.id === 'referral') return activeScreen === 'referral';
    return false;
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Main Mobile Navigation"
    >
      {/* SVG linear gradient definitions for active bottom nav icons */}
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <linearGradient id="bottom-nav-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B55CA9" />
            <stop offset="50%" stopColor="#8A70D6" />
            <stop offset="100%" stopColor="#4C8CF5" />
          </linearGradient>
        </defs>
      </svg>

      {tabs.map((tab) => {
        const active = isTabActive(tab);
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`tab ${active ? 'on' : ''}`}
            aria-current={active ? 'page' : undefined}
            style={{
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: active ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <Icon
                d={tab.icon}
                size={23}
                style={active ? { stroke: 'url(#bottom-nav-gradient)', strokeWidth: 2.2 } : {}}
              />
            </div>
            <span
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, #B55CA9 0%, #8A70D6 50%, #4C8CF5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 700
                    }
                  : undefined
              }
            >
              {tab.label}
            </span>
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  width: '14px',
                  height: '3px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #B55CA9, #8A70D6)',
                  boxShadow: '0 2px 6px rgba(181, 92, 169, 0.5)'
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
