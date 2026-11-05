import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function Navbar() {
  const {
    activeScreen,
    navigateTo,
    theme,
    toggleTheme,
    currency,
    toggleCurrency,
    user,
    web3Connected,
    web3Address,
    connectWeb3Wallet,
    disconnectWeb3Wallet,
    notifications,
    adminNotifications,
    openLoginModal,
    openRegisterModal,
    logout,
    adminTab,
    setAdminTab,
    adminRequests
  } = useApp();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN'));
  const inAdminMode = isAdmin && activeScreen === 'admin';
  const displayNotifications = isAdmin ? (adminNotifications || []) : (notifications || []);
  const unreadCount = displayNotifications.filter(n => n.unread).length;
  const isWalletConnected = Boolean(user?.web3Connected || web3Connected);
  const currentWalletAddress = user?.web3Address || web3Address || '';

  const pendingApprovalsCount = adminRequests?.filter(r => r.status === 'PENDING' || r.status === 'pending').length || 0;

  // Admin view tabs vs Normal User view navigation items
  const adminNavItems = [
    { id: 'requests', label: `Approval Queue${pendingApprovalsCount > 0 ? ` (${pendingApprovalsCount})` : ''}`, icon: ICONS.security },
    { id: 'users', label: 'Users Directory', icon: ICONS.user },
    { id: 'packages', label: 'Packages (7)', icon: ICONS.invest },
    { id: 'settings', label: 'Protocol Config', icon: ICONS.settings }
  ];

  const userNavLinks = [
    { id: 'home', label: 'Home', icon: ICONS.home },
    { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
    { id: 'invest', label: 'Invest', icon: ICONS.invest },
    { id: 'transactions', label: 'Transactions', icon: ICONS.history },
    { id: 'referral', label: 'Referral', icon: ICONS.referral }
  ];

  const navLinks = inAdminMode ? adminNavItems : userNavLinks;

  const handleNav = (id) => {
    if (inAdminMode) {
      if (['requests', 'users', 'packages', 'settings'].includes(id)) {
        if (setAdminTab) setAdminTab(id);
        return;
      }
    }
    navigateTo(id);
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const isNavActive = (id) => {
    if (inAdminMode) {
      return (adminTab || 'requests') === id;
    }
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
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                      {isAdmin ? 'Admin Alerts' : 'Notifications'}
                    </span>
                    <button
                      onClick={() => { handleNav('notifications'); setNotifDropdownOpen(false); }}
                      style={{ fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      View All ({displayNotifications.length})
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {displayNotifications.length > 0 ? (
                      displayNotifications.slice(0, 5).map(n => (
                        <div key={n.id} style={{ display: 'flex', gap: '10px', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
                          <span style={{ color: n.unread ? 'var(--pos)' : 'var(--muted)' }}>●</span>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--text)' }}>{n.title}</strong>
                            <span style={{ color: 'var(--muted)', display: 'block', marginTop: '2px', lineHeight: 1.4 }}>{n.body}</span>
                            <span style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '2px', display: 'block' }}>{n.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                        No alerts at this time.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Brand: Custom theme-aware logo */}
          <div
            onClick={() => handleNav(user ? (isAdmin ? 'admin' : 'home') : 'landing')}
            className="navbar-brand-pill"
            title="Unicorn Platform"
          >
            <img
              src={theme === 'dark' ? '/uc-fincorp-two-weight-on-dark.png' : '/uc-fincorp-two-weight-on-light.png'}
              alt="Unicorn"
              style={{
                height: '32px',
                width: 'auto',
                maxWidth: '160px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            {inAdminMode && (
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: '#fff',
                letterSpacing: '0.06em'
              }}>
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Center Section: Navigation Items */}
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

        {/* Right Section: Switch Button & Avatar Circle OR Sign In Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {inAdminMode && (
            <button
              onClick={() => navigateTo('home')}
              className="chip desktop-only"
              style={{
                fontSize: '12px',
                padding: '7px 13px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
              title="Switch to User Dashboard to view member interface"
            >
              <Icon d={ICONS.home} size={15} />
              <span>User View</span>
            </button>
          )}

          {isAdmin && !inAdminMode && (
            <button
              onClick={() => navigateTo('admin')}
              className="btnp desktop-only"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.35)'
              }}
              title="Return to Admin Operations Center"
            >
              <Icon d={ICONS.settings} size={15} />
              <span>Admin Console</span>
            </button>
          )}

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
                {isAdmin ? '👑' : userInitials}
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
                      <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
                        {user.email || user.phone}
                      </span>
                      {isAdmin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            letterSpacing: '0.05em'
                          }}>
                            SUPER ADMINISTRATOR
                          </span>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>

                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => handleNav('admin')}
                          className="item"
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 600 }}
                        >
                          <Icon d={ICONS.settings} size={16} /> Admin Operations Center
                        </button>
                        <button
                          onClick={() => {
                            if (setAdminTab) setAdminTab('requests');
                            handleNav('admin');
                          }}
                          className="item"
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Icon d={ICONS.security} size={16} /> Approval Queue ({pendingApprovalsCount})
                        </button>
                        <button
                          onClick={() => {
                            if (setAdminTab) setAdminTab('users');
                            handleNav('admin');
                          }}
                          className="item"
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Icon d={ICONS.user} size={16} /> Users Directory
                        </button>
                        <button
                          onClick={() => handleNav('home')}
                          className="item"
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Icon d={ICONS.home} size={16} /> View Member Interface
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleNav('profile')}
                          className="item"
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Icon d={ICONS.user} size={16} /> Profile &amp; Settings
                        </button>
                        <button
                          onClick={() => handleNav('withdraw')}
                          className="item"
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Icon d={ICONS.wallet} size={16} /> Withdraw (2FA)
                        </button>
                      </>
                    )}

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
                      onClick={toggleCurrency}
                      className="item"
                      style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '11px',
                          color: 'var(--text)',
                          lineHeight: 1
                        }}>
                          {currency === 'USD' ? '$' : '₹'}
                        </span>
                        Currency
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                        {currency === 'USD' ? 'USD ($)' : 'INR (₹)'}
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

                    {/* About — opens in new tab */}
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="item"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: 'var(--text)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      About
                    </a>

                    <div style={{ borderTop: '1px solid var(--divider)', margin: '4px 0' }} />

                    {/* Log Out CTA in profile menu */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="item"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.15s ease'
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
        </div>
      </div>
    </header>
  );
}
