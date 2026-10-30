import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function BottomNav() {
  const { activeScreen, navigateTo, user } = useApp();

  if (activeScreen === 'landing' || !user) return null;

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: ICONS.home },
    { id: 'invest', label: 'Invest', icon: ICONS.invest },
    { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
    { id: 'withdraw', label: 'Withdraw', icon: ICONS.wallet },
    { id: 'referral', label: 'Referral', icon: ICONS.referral }
  ];

  const isTabActive = (tabId) => {
    if (tabId === 'home') return activeScreen === 'home';
    if (tabId === 'deposit') {
      return ['deposit', 'deposit-amount', 'deposit-method', 'deposit-inr', 'deposit-usdt'].includes(activeScreen);
    }
    if (tabId === 'invest') return activeScreen === 'invest';
    if (tabId === 'withdraw') return activeScreen === 'withdraw';
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
