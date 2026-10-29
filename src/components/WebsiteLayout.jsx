import React from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { TwoFactorModal } from './TwoFactorModal';
import { Toast } from './Toast';

export function WebsiteLayout({ children }) {
  const { theme } = useApp();

  return (
    <div className="website-wrapper" data-theme={theme}>
      {/* Official Sticky Web3 Top Navbar */}
      <Navbar />

      {/* Main Full-Width Content Container */}
      <main className="website-main-container">
        {children}
      </main>

      {/* Official Web3 Platform Footer */}
      <Footer />

      {/* Responsive Mobile Bottom Navigation Bar (Phone Screens <= 768px) */}
      <BottomNav />

      {/* Global Modals & Notifications */}
      <TwoFactorModal />
      <Toast />
    </div>
  );
}
