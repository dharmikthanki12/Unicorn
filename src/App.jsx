import React from 'react';
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

export function App() {
  const { activeScreen } = useApp();

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
        return <DashboardPage />;
    }
  };

  return (
    <WebsiteLayout>
      {renderScreen()}
    </WebsiteLayout>
  );
}

export default App;
