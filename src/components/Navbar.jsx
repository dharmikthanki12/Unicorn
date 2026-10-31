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
    web3Connected,
    web3Address,
    connectWeb3Wallet,
    disconnectWeb3Wallet,
    notifications,
    openLoginModal,
    openRegisterModal,
    logout
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN'));
  const isWalletConnected = Boolean(user?.web3Connected || web3Connected);
  const currentWalletAddress = user?.web3Address || web3Address || '';

  // EXACT 5 navigation items matching reference design: Home, Deposit, Invest, Transactions, Referral
  const navLinks = [
    { id: 'home', label: 'Home', icon: ICONS.home },
    { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
    { id: 'invest', label: 'Invest', icon: ICONS.invest },
    { id: 'transactions', label: 'Transactions', icon: ICONS.history },
    { id: 'referral', label: 'Referral', icon: ICONS.referral }
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

  // User initials (defaults to 'RM' or user's initials)
  const userInitials = user?.initials || (user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'RM');

  return (
    <header className="website-header">
      <div className="website-nav-container">
        
        {/* Left Section: Notification Bell + Brand [U] Unicorn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Circular Bell Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="navbar-bell-btn"
              aria-label={`Notifications, ${unreadCount} unread`}
              title="Notifications"
            >
              <Icon d={ICONS.bell} size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ec4899',
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
                      style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
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

          {/* Brand: [U] Unicorn */}
          <div
            onClick={() => handleNav(user ? 'home' : 'landing')}
            className="navbar-brand-pill"
            title="Unicorn Platform"
          >
            <div className="navbar-brand-u-badge">
              U
            </div>
            <span className="navbar-brand-name">
              Unicorn
            </span>
          </div>
        </div>

        {/* Center Section: Exact 5 Navigation Items */}
        <nav className="desktop-nav-links" aria-label="Main Navigation">
          {navLinks.map((item) => {
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`floating-nav-pill ${active ? 'on' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon d={item.icon} size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: User Initials Avatar Circle OR Sign In Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="navbar-avatar-btn"
                aria-label="User settings menu"
                title={`${user.name} (${userInitials})`}
              >
                {userInitials}
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 1045 }}
                  />
                  <div className="navbar-dropdown-menu navbar-profile-menu">
                    <div style={{ borderBottom: '1px solid var(--divider)', paddingBottom: '10px' }}>
                      <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text)' }}>{user.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {user.rank || 'Gold Unicorn'} · ID {user.id}
                      </span>
                      <div style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: user.kycStatus === 'VERIFIED' ? 'var(--pos)' : user.kycStatus === 'PENDING' ? '#F59E0B' : '#EF4444',
                        background: user.kycStatus === 'VERIFIED' ? 'rgba(94, 224, 168, 0.12)' : user.kycStatus === 'PENDING' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        width: 'fit-content'
                      }}>
                        {user.kycStatus === 'VERIFIED' ? '✓ KYC VERIFIED' : user.kycStatus === 'PENDING' ? '⏳ KYC PENDING' : '⚠️ KYC UNVERIFIED'}
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

                    {/* Web3 Wallet Quick Connect / Info */}
                    <button
                      onClick={isWalletConnected ? disconnectWeb3Wallet : connectWeb3Wallet}
                      className="item"
                      style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isWalletConnected ? 'var(--pos)' : '#8F94AB' }} />
                        {isWalletConnected ? 'Web3 Connected' : 'Connect Wallet'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Space Grotesk, monospace' }}>
                        {isWalletConnected && currentWalletAddress ? `${currentWalletAddress.slice(0, 4)}...${currentWalletAddress.slice(-4)}` : 'MetaMask'}
                      </span>
                    </button>

                    {/* Admin Console ONLY visible for verified Admin role */}
                    {isAdmin && (
                      <button
                        onClick={() => handleNav('admin')}
                        className="item"
                        style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', color: '#E072D0', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Icon d={ICONS.settings} size={16} /> Admin Console
                      </button>
                    )}

                    <div style={{ borderTop: '1px solid var(--divider)', margin: '4px 0' }} />

                    {/* Log Out CTA in profile menu */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="item"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={openLoginModal}
                className="btno"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Log In
              </button>
              <button
                onClick={openRegisterModal}
                className="btnp btnw"
                style={{
                  height: '36px',
                  padding: '0 18px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button (Phones & Small Tablets) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="navbar-icon-btn mobile-hamburger-btn"
            aria-label="Toggle navigation menu"
            style={{ display: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 998
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '70px',
              left: '16px',
              right: '16px',
              maxWidth: '480px',
              margin: '0 auto',
              background: 'var(--bar-bg)',
              border: '1px solid var(--border2)',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: 'var(--shadow)',
              zIndex: 999
            }}
          >
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
                    textAlign: 'left',
                    border: 'none'
                  }}
                >
                  <Icon d={item.icon} size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div style={{ borderTop: '1px solid var(--divider)', margin: '6px 0' }} />

            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: 'none',
                  textAlign: 'left'
                }}
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="btnp btnw"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
}
