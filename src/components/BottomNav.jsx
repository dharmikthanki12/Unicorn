import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function BottomNav() {
  const { activeScreen, navigateTo, user } = useApp();

  if (activeScreen === 'landing' || !user) return null;

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'ADMIN'));

  const tabs = isAdmin
    ? [
        { id: 'admin', label: 'Admin', icon: ICONS.settings },
        { id: 'home', label: 'User View', icon: ICONS.home },
        { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
        { id: 'invest', label: 'Invest', icon: ICONS.invest },
        { id: 'transactions', label: 'Txns', icon: ICONS.history }
      ]
    : [
        { id: 'home', label: 'Home', icon: ICONS.home },
        { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
        { id: 'invest', label: 'Invest', icon: ICONS.invest },
        { id: 'transactions', label: 'Transactions', icon: ICONS.history },
        { id: 'referral', label: 'Referral', icon: ICONS.referral }
      ];

  const isTabActive = (tabId) => {
    if (tabId === 'admin') return activeScreen === 'admin';
    if (tabId === 'home') return activeScreen === 'home';
    if (tabId === 'deposit') {
      return ['deposit', 'deposit-amount', 'deposit-method', 'deposit-inr', 'deposit-usdt'].includes(activeScreen);
    }
    if (tabId === 'invest') return activeScreen === 'invest';
    if (tabId === 'transactions') return activeScreen === 'transactions';
    if (tabId === 'referral') return activeScreen === 'referral';
    return false;
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Main Mobile Navigation"
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab.id);
        return (
          <button
            key={tab.id}
            onClick={() => navigateTo(tab.id)}
            className={`tab ${active ? 'on' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon d={tab.icon} size={22} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
