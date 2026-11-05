import React, { useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { WebsiteLayout } from './components/WebsiteLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InvestPage } from './pages/InvestPage';
import { DepositPage } from './pages/DepositPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { ReferralPage } from './pages/ReferralPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TokenomicsPage } from './pages/TokenomicsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LandingPage } from './pages/LandingPage';

// Screens that require an authenticated session
const PROTECTED_SCREENS = new Set([
  'home', 'invest', 'deposit', 'deposit-amount', 'deposit-method',
  'deposit-inr', 'deposit-usdt', 'withdraw', 'referral',
  'transactions', 'profile', 'notifications', 'admin'
]);

export function App() {
  const { activeScreen, user, openLoginModal, navigateTo, isAuthModalOpen } = useApp();

  // When a guest hits a protected screen, redirect to landing ONCE.
  // Do NOT re-open the modal after the user manually closes it.
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (!user && PROTECTED_SCREENS.has(activeScreen)) {
      // Navigate away from the protected screen so closing the modal
      // doesn't re-trigger this effect on every render.
      navigateTo('landing');
      if (!hasPromptedRef.current) {
        hasPromptedRef.current = true;
        openLoginModal();
      }
    } else if (user) {
      // Reset when user logs in so future logouts work correctly
      hasPromptedRef.current = false;
    }
  }, [activeScreen, user]);

  // Reset the prompt flag whenever the modal is fully closed by the user
  useEffect(() => {
    if (!isAuthModalOpen) {
      hasPromptedRef.current = false;
    }
  }, [isAuthModalOpen]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'landing':
        return <LandingPage />;
      case 'home':
        return <DashboardPage />;
      case 'invest':
        return <InvestPage />;
      case 'deposit':
      case 'deposit-amount':
      case 'deposit-method':
      case 'deposit-inr':
      case 'deposit-usdt':
        return <DepositPage />;
      case 'withdraw':
        return <WithdrawPage />;
      case 'referral':
        return <ReferralPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'tokenomics':
        return <TokenomicsPage />;
      case 'admin':
        return <AdminPage />;
      case 'profile':
        return <ProfilePage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return user ? <DashboardPage /> : <LandingPage />;
    }
  };

  return (
    <WebsiteLayout>
      {renderScreen()}
    </WebsiteLayout>
  );
}

export default App;
