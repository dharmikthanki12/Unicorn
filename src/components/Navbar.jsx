import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function Navbar() {
  const {
    activeScreen,
    navigateTo,
    theme,
    toggleTheme,
    user,
    connectWeb3Wallet,
    disconnectWeb3Wallet,
    notifications
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Exact 8 navigation items in exact order matching media_1793268197280_a5eddc20.png
  const navLinks = [
    { id: 'home', label: 'Dashboard', icon: ICONS.home, isMulti: false },
    { id: 'invest', label: 'Invest', subLabel: 'Packages', icon: ICONS.invest, isMulti: true },
    { id: 'deposit', label: 'Deposit', icon: ICONS.deposit, isMulti: false },
    { id: 'withdraw', label: 'Withdraw', icon: ICONS.wallet, isMulti: false },
    { id: 'referral', label: 'Referral', subLabel: 'Network', icon: ICONS.referral, isMulti: true },
    { id: 'transactions', label: 'Ledger', icon: ICONS.history, isMulti: false },
    { id: 'tokenomics', label: 'UNC', subLabel: 'Token', icon: ICONS.trip, isMulti: true },
    { id: 'admin', label: 'Admin', icon: ICONS.settings, isMulti: false }
  ];

  const handleNav = (id) => {
    navigateTo(id);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const isNavActive = (id) => {
    if (id === 'deposit') {
      return ['deposit', 'deposit-amount', 'deposit-method', 'deposit-inr', 'deposit-usdt'].includes(activeScreen);
    }
    return activeScreen === id;
  };

  return (
    <header className="website-header">
      <div className="website-nav-container">
        {/* Left: Brand Logo + UNICORN [BEP-20] + Subtitle */}
        <div
          onClick={() => handleNav('home')}
          className="navbar-brand-btn"
          title="Go to Dashboard"
        >
          {/* Logo Card with white rounded box & smooth shadow */}
          <div className="navbar-logo-card">
            <img
              src="/unicorn-logo.png"
              alt="Unicorn Logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '🦄';
              }}
            />
          </div>

          {/* Brand Titles */}
          <div className="navbar-brand-text">
            <div className="navbar-title-row">
              <span className="navbar-title">UNICORN</span>
              <span className="navbar-bep-badge">BEP-20</span>
            </div>
            <span className="navbar-subtitle">
              0.45% Daily ROI · Web3 Rewards
            </span>
          </div>
        </div>

        {/* Center: Main Nav Links matching media_1793268197280_a5eddc20.png */}
        <nav className="desktop-nav-links" aria-label="Main Navigation">
          {navLinks.map((item) => {
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`nav-tab-btn ${active ? 'on' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon d={item.icon} size={18} />
                {item.isMulti ? (
                  <div className="nav-tab-multiline">
                    <span className="t-main">{item.label}</span>
                    <span className="t-sub">{item.subLabel}</span>
                  </div>
                ) : (
                  <span>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Bell + Web3 Wallet + Theme Switcher + Profile Avatar + Hamburger */}
        <div className="navbar-right-actions">
          {/* Notifications Bell Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="navbar-icon-btn"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Icon d={ICONS.bell} size={19} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '9px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#9A8CFF',
                    border: '2px solid var(--surface)'
                  }}
                />
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <>
                <div
                  onClick={() => setNotifDropdownOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 1045 }}
                />
                <div className="navbar-dropdown-menu navbar-notif-menu">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Notifications</span>
                    <button
                      onClick={() => { handleNav('notifications'); setNotifDropdownOpen(false); }}
                      style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View All ({notifications.length})
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {notifications.slice(0, 3).map(n => (
                      <div key={n.id} style={{ display: 'flex', gap: '10px', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
                        <span style={{ color: 'var(--pos)' }}>●</span>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text)' }}>{n.title}</strong>
                          <span style={{ color: 'var(--muted)' }}>{n.body}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Web3 Connected Wallet Pill */}
          <button
            onClick={user.web3Connected ? disconnectWeb3Wallet : connectWeb3Wallet}
            className="navbar-wallet-btn"
            title={user.web3Connected ? 'Click to Disconnect' : 'Connect BEP-20 Wallet'}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: user.web3Connected ? 'var(--pos)' : '#8F94AB'
              }}
            />
            {user.web3Connected
              ? `${user.web3Address.slice(0, 6)}...${user.web3Address.slice(-4)}`
              : 'Connect Wallet'}
          </button>

          {/* Theme Switcher Button (Desktop & Tablet only; inside drawer on mobile) */}
          <button
            onClick={toggleTheme}
            className="navbar-icon-btn navbar-theme-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <Icon d={theme === 'dark' ? ICONS.sun : ICONS.moon} size={18} />
          </button>

          {/* Profile User Avatar Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="navbar-avatar-btn"
              aria-label="Open user settings"
            >
              {user.initials}
            </button>

            {profileDropdownOpen && (
              <>
                <div
                  onClick={() => setProfileDropdownOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 1045 }}
                />
                <div className="navbar-dropdown-menu navbar-profile-menu">
                  <div style={{ borderBottom: '1px solid var(--divider)', paddingBottom: '10px' }}>
                    <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text)' }}>{user.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.rank} · ID {user.id}</span>
                    <div style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--pos)',
                      background: 'rgba(94, 224, 168, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      width: 'fit-content'
                    }}>
                      ✓ KYC {user.kycStatus}
                    </div>
                  </div>

                  <button
                    onClick={() => handleNav('profile')}
                    className="item"
                    style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Icon d={ICONS.user} size={16} /> Profile &amp; Settings
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="item"
                    style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon d={theme === 'dark' ? ICONS.sun : ICONS.moon} size={16} /> Mode
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleNav('withdraw')}
                    className="item"
                    style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Icon d={ICONS.wallet} size={16} /> Withdraw (2FA)
                  </button>
                  <button
                    onClick={() => handleNav('admin')}
                    className="item"
                    style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', color: '#E072D0', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Icon d={ICONS.settings} size={16} /> Admin Console
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="navbar-icon-btn mobile-hamburger-btn"
            aria-label="Toggle navigation drawer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu on Tablets & Phones */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 998
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: 0,
              right: 0,
              background: 'var(--bar-bg)',
              borderBottom: '1px solid var(--border2)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: 'var(--shadow)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 999,
              animation: 'slideDown 0.2s ease-out'
            }}
          >
          {/* Web3 Wallet Pill in Drawer */}
          <button
            onClick={user.web3Connected ? disconnectWeb3Wallet : connectWeb3Wallet}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              fontSize: '14px',
              fontWeight: 600,
              color: user.web3Connected ? 'var(--pos)' : 'var(--text)',
              cursor: 'pointer',
              marginBottom: '4px'
            }}
          >
            <span>{user.web3Connected ? 'Connected Wallet' : 'Connect Web3 Wallet'}</span>
            <span className="num" style={{ fontSize: '13px' }}>
              {user.web3Connected ? `${user.web3Address.slice(0, 6)}...${user.web3Address.slice(-4)}` : '🦊 MetaMask'}
            </span>
          </button>

          {/* Theme Switcher in Drawer */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer',
              marginBottom: '6px'
            }}
          >
            <span>Appearance Mode</span>
            <span>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          </button>

          {/* Nav links in drawer */}
          {navLinks.map((item) => {
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: active ? 'var(--grad)' : 'transparent',
                  color: active ? '#fff' : 'var(--text)',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon d={item.icon} size={18} />
                <span>{item.label} {item.subLabel ? item.subLabel : ''}</span>
              </button>
            );
          })}
        </div>
        </>
      )}
    </header>
  );
}
