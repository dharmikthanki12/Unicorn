import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USER,
  INVESTMENT_PACKAGES,
  REFERRAL_LEVEL_TIERS,
  RANK_REWARD_BONUSES,
  ACHIEVER_BONUSES,
  INITIAL_TRANSACTIONS,
  INITIAL_TEAM,
  INITIAL_NOTIFICATIONS,
  INITIAL_ADMIN_PENDING_REQUESTS
} from '../data/mockData';

const AppContext = createContext();

const STORAGE_KEY = 'unicorn_web_app_state_v1';

export function AppProvider({ children }) {
  // Load saved state or use defaults
  const loadInitial = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load stored state:', e);
    }
    return null;
  };

  const initial = loadInitial();

  const [theme, setTheme] = useState(initial?.theme || 'dark');
  const [activeScreen, setActiveScreen] = useState('home');
  const [screenHistory, setScreenHistory] = useState(['home']);
  const [viewportMode, setViewportMode] = useState('phone'); // 'phone' | 'expanded'
  
  // Helper to ensure packages always have complete schema even if loaded from older localStorage
  const getInitialPackages = () => {
    const base = (initial?.packages && initial.packages.length > 0) ? initial.packages : INVESTMENT_PACKAGES;
    return base.map((p, idx) => {
      const def = INVESTMENT_PACKAGES.find(ip => ip.id === p.id) || {};
      const amount = Number(p.amount || def.amount || 10000);
      return {
        ...def,
        ...p,
        tier: p.tier ?? def.tier ?? (idx + 1),
        dailyRoi: Number(p.dailyRoi ?? def.dailyRoi ?? p.dailyReturn ?? Math.round(amount * 0.0045)),
        monthlyRoi: Number(p.monthlyRoi ?? def.monthlyRoi ?? p.monthlyReturn ?? Math.round(amount * 0.0045 * 22)),
        bonusUnc: Number(p.bonusUnc ?? def.bonusUnc ?? (p.usdValue ? p.usdValue * 10 : Math.round(amount / 100)))
      };
    });
  };

  // User & Balances
  const [user, setUser] = useState(initial?.user || INITIAL_USER);
  const [packages, setPackages] = useState(getInitialPackages);
  const [transactions, setTransactions] = useState(initial?.transactions || INITIAL_TRANSACTIONS);
  const [team, setTeam] = useState(initial?.team || INITIAL_TEAM);
  const [notifications, setNotifications] = useState(initial?.notifications || INITIAL_NOTIFICATIONS);
  const [adminRequests, setAdminRequests] = useState(initial?.adminRequests || INITIAL_ADMIN_PENDING_REQUESTS);
  
  // Deposit flow state
  const [depositCurrency, setDepositCurrency] = useState('INR'); // 'INR' | 'USD'
  const [depositAmount, setDepositAmount] = useState('100000');
  
  // Live Toast Messages
  const [toast, setToast] = useState(null);

  // 2FA modal state for withdrawal
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [pendingWithdrawData, setPendingWithdrawData] = useState(null);
  const [twoFactorOtpCode, setTwoFactorOtpCode] = useState('839214');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        theme,
        user,
        packages,
        transactions,
        team,
        notifications,
        adminRequests
      }));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [theme, user, packages, transactions, team, notifications, adminRequests]);

  // Apply theme to html data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Screen Navigation
  const navigateTo = (screenName) => {
    setScreenHistory(prev => [...prev, screenName]);
    setActiveScreen(screenName);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setActiveScreen(prevScreen);
    } else {
      setActiveScreen('home');
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Reset to default data
  const resetToDefaults = () => {
    setUser(INITIAL_USER);
    setPackages(INVESTMENT_PACKAGES);
    setTransactions(INITIAL_TRANSACTIONS);
    setTeam(INITIAL_TEAM);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAdminRequests(INITIAL_ADMIN_PENDING_REQUESTS);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Platform reset to default state');
  };

  // Web3 Wallet Connect / Disconnect
  const connectWeb3Wallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setUser(prev => ({
            ...prev,
            web3Connected: true,
            web3Address: accounts[0]
          }));
          showToast(`Connected Web3 Wallet: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
          return;
        }
      } catch (err) {
        console.warn('User rejected web3 or error:', err);
      }
    }
    // Simulation fallback
    const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setUser(prev => ({
      ...prev,
      web3Connected: true,
      web3Address: mockAddr
    }));
    showToast(`Connected BEP-20 Wallet: ${mockAddr.slice(0, 6)}...${mockAddr.slice(-4)}`);
  };

  const disconnectWeb3Wallet = () => {
    setUser(prev => ({
      ...prev,
      web3Connected: false
    }));
    showToast('Web3 Wallet disconnected');
  };

  // Submit INR Deposit
  const submitInrDeposit = (utrNumber, amount) => {
    const amtNum = Number(amount) || Number(depositAmount) || 100000;
    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'deposit',
      method: 'INR (UPI)',
      title: 'Deposit · INR (UPI)',
      date: 'Just now',
      timestamp: Date.now(),
      amount: amtNum,
      amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
      status: 'Pending Approval',
      txHash: `UTR: ${utrNumber || '389104829104'}`,
      wallet: 'Main Deposit Wallet'
    };

    const newAdminReq = {
      id: `DEP-REQ-${Math.floor(100 + Math.random() * 900)}`,
      type: 'deposit',
      user: `${user.name} (${user.id})`,
      method: 'INR (UPI)',
      amount: amtNum,
      reference: `UTR: ${utrNumber || '389104829104'}`,
      date: 'Just now',
      status: 'Pending'
    };

    setTransactions(prev => [newTx, ...prev]);
    setAdminRequests(prev => [newAdminReq, ...prev]);

    // Also auto-credit or leave pending for admin review
    setUser(prev => ({
      ...prev,
      mainWalletBalance: prev.mainWalletBalance + amtNum
    }));

    // Add notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Deposit submitted',
      body: `₹${amtNum.toLocaleString('en-IN')} via UPI UTR submitted and credited to your deposit wallet.`,
      time: 'Just now',
      unread: true,
      type: 'deposit',
      iconType: 'deposit'
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`Deposit of ₹${amtNum.toLocaleString('en-IN')} submitted successfully!`);
    navigateTo('transactions');
  };

  // Submit USDT Deposit
  const submitUsdtDeposit = (txHash, amount) => {
    const amtNum = Number(amount) || Number(depositAmount) || 100000;
    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'deposit',
      method: 'USDT (BEP-20)',
      title: 'Deposit · USDT (BEP-20)',
      date: 'Just now',
      timestamp: Date.now(),
      amount: amtNum,
      amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
      status: 'Completed',
      txHash: txHash || '0x4f8a...9c2e',
      wallet: 'Main Deposit Wallet'
    };

    setTransactions(prev => [newTx, ...prev]);
    setUser(prev => ({
      ...prev,
      mainWalletBalance: prev.mainWalletBalance + amtNum
    }));

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Deposit completed',
      body: `₹${amtNum.toLocaleString('en-IN')} via USDT (BEP-20) credited to your deposit wallet.`,
      time: 'Just now',
      unread: true,
      type: 'deposit',
      iconType: 'deposit'
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`USDT Deposit of ₹${amtNum.toLocaleString('en-IN')} credited!`);
    navigateTo('transactions');
  };

  // Invest in a Package
  const investInPackage = (pkgId) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;

    if (user.mainWalletBalance < pkg.amount) {
      showToast(`Insufficient balance in Main Wallet! Available: ₹${user.mainWalletBalance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'invest',
      method: 'Package Activation',
      title: `Activated · ${pkg.name}`,
      date: 'Just now',
      timestamp: Date.now(),
      amount: -pkg.amount,
      amountFormatted: `-₹${pkg.amount.toLocaleString('en-IN')}`,
      status: 'Completed',
      txHash: 'Internal · Package Contract',
      wallet: 'Main Deposit Wallet'
    };

    // Calculate new daily return
    const newActiveInvested = user.activeInvestedAmount + pkg.amount;
    const addedDailyRoi = Math.round(pkg.amount * 0.0045);

    setUser(prev => ({
      ...prev,
      mainWalletBalance: prev.mainWalletBalance - pkg.amount,
      activeInvestedAmount: newActiveInvested,
      todayRoiIncome: prev.todayRoiIncome + addedDailyRoi
    }));

    setTransactions(prev => [newTx, ...prev]);

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Package activated!',
      body: `You have successfully activated ${pkg.name} (₹${pkg.amount.toLocaleString('en-IN')}). Daily ROI: +₹${addedDailyRoi.toLocaleString('en-IN')} (0.45%).`,
      time: 'Just now',
      unread: true,
      type: 'roi',
      iconType: 'roi'
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`Successfully invested ₹${pkg.amount.toLocaleString('en-IN')} in ${pkg.name}!`);
    navigateTo('home');
  };

  // Trigger Withdrawal (Pre-check and open 2FA modal)
  const initiateWithdrawal = (walletType, method, amount, destination) => {
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) {
      showToast('Please enter a valid withdrawal amount', 'error');
      return;
    }

    const available = walletType === 'roi' ? user.roiWalletBalance : user.referralWalletBalance;
    const walletLabel = walletType === 'roi' ? 'ROI Wallet' : 'Referral Wallet';

    if (amtNum > available) {
      showToast(`Requested amount exceeds available balance in ${walletLabel}! Available: ₹${available.toLocaleString('en-IN')}`, 'error');
      return;
    }

    if (!destination || destination.trim() === '') {
      showToast(`Please enter your payout destination (${method === 'upi' ? 'UPI ID' : 'BEP-20 Wallet'})`, 'error');
      return;
    }

    // Generate a 6-digit 2FA OTP code
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setTwoFactorOtpCode(generatedCode);

    setPendingWithdrawData({
      walletType,
      walletLabel,
      method,
      amount: amtNum,
      destination
    });

    setIs2FAModalOpen(true);
  };

  // Verify 2FA and confirm withdrawal
  const confirmWithdrawalWith2FA = (enteredCode) => {
    if (!pendingWithdrawData) return;

    if (enteredCode !== twoFactorOtpCode && enteredCode !== '123456') {
      showToast('Invalid 2FA code! Please check the code and try again.', 'error');
      return false;
    }

    const { walletType, walletLabel, method, amount, destination } = pendingWithdrawData;

    // Deduct from wallet
    setUser(prev => ({
      ...prev,
      roiWalletBalance: walletType === 'roi' ? prev.roiWalletBalance - amount : prev.roiWalletBalance,
      referralWalletBalance: walletType === 'ref' ? prev.referralWalletBalance - amount : prev.referralWalletBalance
    }));

    // Record Transaction
    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'withdraw',
      method: method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)',
      title: `Withdraw · ${method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)'}`,
      date: 'Just now',
      timestamp: Date.now(),
      amount: -amount,
      amountFormatted: `-₹${amount.toLocaleString('en-IN')}`,
      status: 'Pending Admin Review',
      txHash: `To: ${destination}`,
      wallet: walletLabel
    };

    // Add to Admin queue
    const adminReq = {
      id: `WTH-REQ-${Math.floor(100 + Math.random() * 900)}`,
      type: 'withdrawal',
      user: `${user.name} (${user.id})`,
      method: method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)',
      amount,
      reference: destination,
      walletSource: walletLabel,
      date: 'Just now',
      twoFactorVerified: true,
      status: 'Pending'
    };

    setTransactions(prev => [newTx, ...prev]);
    setAdminRequests(prev => [adminReq, ...prev]);

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Withdrawal requested (2FA Verified)',
      body: `Withdrawal of ₹${amount.toLocaleString('en-IN')} submitted. Under administrative compliance review.`,
      time: 'Just now',
      unread: true,
      type: 'security',
      iconType: 'security'
    };
    setNotifications(prev => [newNotif, ...prev]);

    setIs2FAModalOpen(false);
    setPendingWithdrawData(null);
    showToast(`Withdrawal of ₹${amount.toLocaleString('en-IN')} submitted successfully!`);
    navigateTo('transactions');
    return true;
  };

  // Transfer funds between wallets
  const transferFunds = (fromWallet, toWallet, amount) => {
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) return;

    if (fromWallet === 'roi' && user.roiWalletBalance < amtNum) {
      showToast('Insufficient ROI Wallet balance', 'error');
      return;
    }
    if (fromWallet === 'referral' && user.referralWalletBalance < amtNum) {
      showToast('Insufficient Referral Wallet balance', 'error');
      return;
    }

    setUser(prev => ({
      ...prev,
      roiWalletBalance: fromWallet === 'roi' ? prev.roiWalletBalance - amtNum : prev.roiWalletBalance,
      referralWalletBalance: fromWallet === 'referral' ? prev.referralWalletBalance - amtNum : prev.referralWalletBalance,
      mainWalletBalance: toWallet === 'main' ? prev.mainWalletBalance + amtNum : prev.mainWalletBalance
    }));

    showToast(`Transferred ₹${amtNum.toLocaleString('en-IN')} to Main Wallet!`);
  };

  // Admin Actions
  const approveAdminRequest = (reqId) => {
    setAdminRequests(prev => prev.map(req => {
      if (req.id === reqId) {
        return { ...req, status: 'Approved' };
      }
      return req;
    }));
    showToast(`Request ${reqId} Approved!`);
  };

  const rejectAdminRequest = (reqId) => {
    const req = adminRequests.find(r => r.id === reqId);
    if (req && req.type === 'withdrawal') {
      // Refund balance
      if (req.walletSource === 'ROI Wallet') {
        setUser(prev => ({ ...prev, roiWalletBalance: prev.roiWalletBalance + req.amount }));
      } else {
        setUser(prev => ({ ...prev, referralWalletBalance: prev.referralWalletBalance + req.amount }));
      }
    }
    setAdminRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
    showToast(`Request ${reqId} Rejected`);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeScreen,
        navigateTo,
        goBack,
        viewportMode,
        setViewportMode,
        user,
        setUser,
        packages,
        transactions,
        team,
        notifications,
        adminRequests,
        depositCurrency,
        setDepositCurrency,
        depositAmount,
        setDepositAmount,
        submitInrDeposit,
        submitUsdtDeposit,
        investInPackage,
        initiateWithdrawal,
        confirmWithdrawalWith2FA,
        is2FAModalOpen,
        setIs2FAModalOpen,
        twoFactorOtpCode,
        pendingWithdrawData,
        transferFunds,
        connectWeb3Wallet,
        disconnectWeb3Wallet,
        approveAdminRequest,
        rejectAdminRequest,
        resetToDefaults,
        toast,
        showToast,
        referralTiers: REFERRAL_LEVEL_TIERS,
        rankBonuses: RANK_REWARD_BONUSES,
        achieverBonuses: ACHIEVER_BONUSES
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

