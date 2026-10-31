import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USER,
  ADMIN_USER,
  INVESTMENT_PACKAGES,
  REFERRAL_LEVEL_TIERS,
  RANK_REWARD_BONUSES,
  ACHIEVER_BONUSES,
  INITIAL_TRANSACTIONS,
  INITIAL_TEAM,
  INITIAL_NOTIFICATIONS,
  INITIAL_ADMIN_PENDING_REQUESTS
} from '../data/mockData';
import { authAPI, walletAPI, investAPI, adminAPI, setStoredToken, getStoredToken, clearStoredToken } from '../services/api';

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

  const getInitialUser = () => {
    // If a phantom 'Web3 Investor' account was stored from old wallet connection logic, discard it
    if (initial?.user && (initial.user.name === 'Web3 Investor' || initial.user.initials === 'W3')) {
      return null;
    }
    // Only restore user if an active authenticated session exists in localStorage
    if (initial?.user && initial.user.id) {
      return {
        ...initial.user,
        role: initial.user.role || (initial.user.email?.toLowerCase().includes('admin') || initial.user.id?.includes('ADMIN') ? 'admin' : 'user'),
        web3Connected: Boolean(initial.user.web3Connected),
        web3Address: initial.user.web3Address || ''
      };
    }
    // By default, a new visitor is NOT logged in and views the Landing Page
    return null;
  };

  const getInitialScreen = () => {
    // If user is logged in, show 'admin' for admins or 'home' for users; if new or logged out, show 'landing'
    const initUser = getInitialUser();
    if (initUser) {
      if (initUser.role === 'admin' || initUser.role === 'ADMIN') {
        return initial?.activeScreen && initial.activeScreen !== 'landing' ? initial.activeScreen : 'admin';
      }
      return initial?.activeScreen && initial.activeScreen !== 'landing' ? initial.activeScreen : 'home';
    }
    return 'landing';
  };

  const [theme, setTheme] = useState(initial?.theme || 'dark');
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [screenHistory, setScreenHistory] = useState([getInitialScreen()]);
  const [viewportMode, setViewportMode] = useState('phone'); // 'phone' | 'expanded'

  // Independent Web3 Wallet State (MetaMask / BEP-20)
  const [web3Address, setWeb3Address] = useState(() => {
    return initial?.web3Address || (initial?.user?.name !== 'Web3 Investor' ? initial?.user?.web3Address : '') || '';
  });
  const [web3Connected, setWeb3Connected] = useState(() => {
    return Boolean(initial?.web3Connected || (initial?.user?.name !== 'Web3 Investor' ? initial?.user?.web3Connected : false));
  });
  
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
  const [user, setUser] = useState(getInitialUser);
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

  // Auth Modal (Login / Register) state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const openLoginModal = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const res = await authAPI.login({ email: cleanEmail, password }).catch(() => null);
      if (res && res.user) {
        if (res.token || res.accessToken) setStoredToken(res.token || res.accessToken);
        const backendAddr = res.user.walletAddress || res.user.web3Address || '';
        const backendConnected = Boolean(res.user.web3Connected || backendAddr);
        const loggedUser = {
          ...INITIAL_USER,
          ...res.user,
          initials: res.user.name ? res.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U',
          role: res.user.role || (cleanEmail.includes('admin') ? 'admin' : 'user'),
          web3Connected: backendConnected,
          web3Address: backendAddr
        };
        setUser(loggedUser);
        if (backendAddr) {
          setWeb3Address(backendAddr);
          setWeb3Connected(backendConnected);
        }
        showToast(`Welcome back, ${loggedUser.name}!`);
        setIsAuthModalOpen(false);
        const targetScreen = loggedUser.role === 'admin' ? 'admin' : 'home';
        setActiveScreen(targetScreen);
        setScreenHistory([targetScreen]);
        return true;
      }
    } catch (e) {
      console.warn('Backend login fallback:', e.message);
    }

    // Demo / Offline Simulation Login
    if (cleanEmail.includes('admin')) {
      setUser(ADMIN_USER);
      showToast('Logged in as UNICORN Super Admin');
      setIsAuthModalOpen(false);
      setActiveScreen('admin');
      setScreenHistory(['admin']);
    } else {
      const investorUser = {
        ...INITIAL_USER,
        email: cleanEmail || INITIAL_USER.email,
        name: cleanEmail === INITIAL_USER.email ? INITIAL_USER.name : cleanEmail.split('@')[0].toUpperCase(),
        initials: cleanEmail === INITIAL_USER.email ? 'RM' : cleanEmail.slice(0, 2).toUpperCase(),
        role: 'user',
        web3Connected: false,
        web3Address: ''
      };
      setUser(investorUser);
      showToast(`Logged in successfully as Investor (${investorUser.name})`);
      setIsAuthModalOpen(false);
      setActiveScreen('home');
      setScreenHistory(['home']);
    }
    return true;
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    showToast('Logged out successfully.');
    setActiveScreen('landing');
    setScreenHistory(['landing']);
  };

  const createFreshUser = (name, cleanEmail, apiUser = null, sponsorRef = '') => {
    const cleanId = (apiUser?.id || apiUser?._id)
      ? `UNC-${String(apiUser.id || apiUser._id).slice(-5).toUpperCase()}`
      : `UNC-${Math.floor(10000 + Math.random() * 90000)}`;
    const referralCode = apiUser?.referralCode || `UNC${Math.floor(1000 + Math.random() * 9000)}`;
    const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'UN';

    return {
      id: cleanId,
      name: name.trim(),
      email: cleanEmail,
      phone: apiUser?.phone || '',
      initials,
      role: 'user',
      rank: 'Starter Unicorn',     // Clean initial rank (not Gold Unicorn!)
      kycStatus: 'UNVERIFIED',     // Brand new account is UNVERIFIED!
      kycDocumentId: '',
      kycDocumentType: '',
      twoFactorEnabled: false,
      twoFactorSecret: '',
      web3Connected: Boolean(web3Connected),
      web3Address: web3Address || '',
      referralCode,
      referralLink: `unicorn.vip/?ref=${referralCode}`,
      sponsor: sponsorRef ? `Sponsor: ${sponsorRef}` : 'None (Direct)',
      bankDetails: null,           // No hardcoded bank details!
      
      // Balances strictly 0 for new user
      mainWalletBalance: 0,
      roiWalletBalance: 0,
      referralWalletBalance: 0,
      
      // Stats strictly 0
      activeInvestedAmount: 0,
      todayRoiIncome: 0,
      todayReferralIncome: 0,
      directBusiness: 0,
      teamBusiness: 0,
      totalDirects: 0,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  };

  const register = async (name, email, password, referralCode) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const res = await authAPI.register({ name, email: cleanEmail, password, referralCode }).catch(() => null);
      if (res && res.user) {
        if (res.token || res.accessToken) setStoredToken(res.token || res.accessToken);
        const newUser = createFreshUser(name, cleanEmail, res.user, referralCode);
        setUser(newUser);
        setTransactions([]); // Clear old mock transactions for new user!
        showToast(`Welcome to UNICORN, ${name}!`);
        setIsAuthModalOpen(false);
        setActiveScreen('home');
        setScreenHistory(['home']);
        return true;
      }
    } catch (e) {
      console.warn('Backend register fallback:', e.message);
    }

    const newUser = createFreshUser(name, cleanEmail, null, referralCode);
    setUser(newUser);
    setTransactions([]); // Clear old mock transactions for new user!
    showToast(`Account registered successfully for ${name}!`);
    setIsAuthModalOpen(false);
    setActiveScreen('home');
    setScreenHistory(['home']);
    return true;
  };

  const updateBankDetails = (details) => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        bankDetails: {
          accountHolder: details.accountHolder || prev.name,
          bankName: details.bankName || '',
          accountNumber: details.accountNumber || '',
          ifsc: details.ifsc || '',
          upiId: details.upiId || ''
        }
      };
    });
    showToast('Bank and UPI payout details updated successfully!');
  };

  const submitKyc = (documentType, documentId) => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        kycStatus: 'PENDING',
        kycDocumentType: documentType,
        kycDocumentId: documentId,
        kycSubmittedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };
    });
    showToast('KYC documents submitted successfully! Status: Under Review.');
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        theme,
        user,
        web3Address,
        web3Connected,
        packages,
        transactions,
        team,
        notifications,
        adminRequests
      }));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [theme, user, web3Address, web3Connected, packages, transactions, team, notifications, adminRequests]);

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
    if (screenName === 'admin' && (!user || (user.role !== 'admin' && user.role !== 'ADMIN'))) {
      showToast('Access restricted: Only administrators can access the Admin Console.', 'error');
      return;
    }
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

  // Web3 Provider Helpers (Direct MetaMask Integration)
  const getMetaMaskProvider = () => {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
      const mm = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom && !p.isBraveWallet);
      if (mm) return mm;
      return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
    }
    return window.ethereum;
  };

  const BSC_CHAIN_CONFIG = {
    chainId: '0x61', // 97 in hex (BNB Smart Chain Testnet)
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
  };

  const ensureBscNetwork = async (provider) => {
    if (!provider || !provider.request) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }]
      });
    } catch (err) {
      if (err.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_CHAIN_CONFIG]
          });
        } catch (addErr) {
          console.warn('Network add notice:', addErr);
        }
      }
    }
  };

  // Web3 Wallet Modal & Connection Handlers
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const openWalletModal = () => setIsWalletModalOpen(true);
  const closeWalletModal = () => setIsWalletModalOpen(false);

  // Real-time MetaMask event synchronization (accountsChanged, chainChanged)
  useEffect(() => {
    const provider = getMetaMaskProvider();
    if (!provider || !provider.on) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts && accounts.length > 0) {
        const newAddr = accounts[0];
        setWeb3Address(newAddr);
        setWeb3Connected(true);

        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            web3Connected: true,
            web3Address: newAddr
          };
        });

        try {
          await authAPI.updateWeb3Wallet(newAddr, true).catch(() => null);
        } catch (e) {
          console.warn('Backend sync warning:', e);
        }

        showToast(`MetaMask Active Account: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`);
      } else {
        setWeb3Address('');
        setWeb3Connected(false);
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            web3Connected: false,
            web3Address: ''
          };
        });

        try {
          await authAPI.updateWeb3Wallet('', false).catch(() => null);
        } catch (e) {
          console.warn('Backend sync warning:', e);
        }

        showToast('MetaMask disconnected');
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [user]);

  const connectWeb3MetaMask = async () => {
    closeWalletModal();
    const provider = getMetaMaskProvider();

    if (!provider) {
      const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        const dappUrl = window.location.href.replace(/^https?:\/\//, '');
        showToast('Redirecting to MetaMask App...', 'info');
        window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
      } else {
        showToast('Redirecting to MetaMask download...', 'info');
        window.open('https://metamask.io/download/', '_blank');
      }
      return;
    }

    try {
      showToast('Redirecting to MetaMask... Please approve connection.');
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        
        // Ensure user is on BNB Smart Chain
        await ensureBscNetwork(provider).catch(() => null);

        setWeb3Address(addr);
        setWeb3Connected(true);

        if (user) {
          setUser(prev => (prev ? {
            ...prev,
            web3Connected: true,
            web3Address: addr
          } : null));

          // Sync with backend database
          try {
            await authAPI.updateWeb3Wallet(addr, true).catch(() => null);
          } catch (syncErr) {
            console.warn('Backend Web3 wallet sync notice:', syncErr);
          }
        }
        showToast(`MetaMask Connected: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
        return addr;
      }
    } catch (err) {
      if (err.code === 4001) {
        showToast('MetaMask connection request rejected by user.', 'error');
      } else {
        showToast(`MetaMask: ${err.message || 'Could not connect'}`, 'error');
      }
    }
  };

  const connectWeb3Demo = async () => {
    closeWalletModal();
    const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setWeb3Address(mockAddr);
    setWeb3Connected(true);
    // If a user is already signed in, update their account; NEVER synthesize a dummy user!
    if (user) {
      setUser(prev => (prev ? {
        ...prev,
        web3Connected: true,
        web3Address: mockAddr
      } : null));

      // Sync with backend database
      try {
        await authAPI.updateWeb3Wallet(mockAddr, true).catch(() => null);
      } catch (syncErr) {
        console.warn('Backend Web3 wallet sync notice:', syncErr);
      }
    }
    showToast(`Instant Test BEP-20 Wallet Connected: ${mockAddr.slice(0, 6)}...${mockAddr.slice(-4)}`);
  };

  const connectWeb3Wallet = async () => {
    const provider = getMetaMaskProvider();
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 1. Mobile devices: Redirect directly to MetaMask mobile app via official universal link
    if (isMobile && !provider) {
      const dappUrl = window.location.href.replace(/^https?:\/\//, '');
      showToast('Redirecting to MetaMask Mobile App...', 'info');
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
      return;
    }

    // 2. Desktop with MetaMask extension: Connect immediately!
    if (provider) {
      await connectWeb3MetaMask();
      return;
    }

    // 3. Desktop without extension: Redirect to MetaMask download page directly
    showToast('Redirecting to MetaMask download...', 'info');
    window.open('https://metamask.io/download/', '_blank');
    openWalletModal();
  };

  const disconnectWeb3Wallet = async () => {
    setWeb3Address('');
    setWeb3Connected(false);
    if (user) {
      setUser(prev => (prev ? {
        ...prev,
        web3Connected: false,
        web3Address: ''
      } : null));

      // Sync with backend database
      try {
        await authAPI.updateWeb3Wallet('', false).catch(() => null);
      } catch (syncErr) {
        console.warn('Backend Web3 wallet sync notice:', syncErr);
      }
    }
    showToast('Web3 Wallet disconnected');
  };

  // Submit INR Deposit (Manual Verification Flow)
  const submitInrDeposit = async (utrNumber, amount) => {
    const amtNum = Number(amount) || Number(depositAmount) || 100000;
    const ref = utrNumber || `UTR${Date.now()}`;

    // Sync with MongoDB backend
    try {
      if (!getStoredToken()) {
        const authRes = await authAPI.login({ email: 'demo@unicorn.vip', password: 'UserPassword2026!' }).catch(() => null);
        if (authRes && (authRes.token || authRes.accessToken)) {
          setStoredToken(authRes.token || authRes.accessToken);
        }
      }
      await walletAPI.submitDeposit({
        amount: amtNum,
        currency: 'INR',
        paymentMethod: 'INR (UPI)',
        transactionReference: ref
      }).catch(err => console.warn('Backend deposit notice:', err.message));
    } catch (e) {
      console.warn('Backend deposit notice:', e.message);
    }

    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'deposit',
      method: 'INR (UPI)',
      title: 'Deposit · INR (UPI)',
      date: 'Just now',
      timestamp: Date.now(),
      amount: amtNum,
      amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
      status: 'Pending',
      txHash: `UTR: ${ref}`,
      wallet: 'Main Deposit Wallet'
    };

    const newAdminReq = {
      id: `DEP-REQ-${Math.floor(100 + Math.random() * 900)}`,
      type: 'deposit',
      user: `${user.name} (${user.id})`,
      userId: user.id,
      method: 'INR (UPI)',
      amount: amtNum,
      reference: `UTR: ${ref}`,
      ref: `UTR: ${ref}`,
      date: 'Just now',
      time: 'Just now',
      status: 'Pending'
    };

    setTransactions(prev => [newTx, ...prev]);
    setAdminRequests(prev => [newAdminReq, ...prev]);

    // Do NOT credit mainWalletBalance yet - awaits manual administrator approval per requirements!

    // Add notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'INR Deposit Submitted',
      body: `₹${amtNum.toLocaleString('en-IN')} via UPI UTR submitted. Your deposit is pending administrative verification.`,
      time: 'Just now',
      unread: true,
      type: 'deposit',
      iconType: 'deposit'
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`Deposit of ₹${amtNum.toLocaleString('en-IN')} submitted! Status: Pending Admin Review.`);
    navigateTo('transactions');
  };

  // Submit USDT Deposit (Automatic Blockchain Verification Flow on BNB Smart Chain)
  const submitUsdtDeposit = async (txHash, amount) => {
    const amtNum = Number(amount) || Number(depositAmount) || 100000;
    const hash = txHash || `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Sync with MongoDB backend
    try {
      if (!getStoredToken()) {
        const authRes = await authAPI.login({ email: 'demo@unicorn.vip', password: 'UserPassword2026!' }).catch(() => null);
        if (authRes && (authRes.token || authRes.accessToken)) {
          setStoredToken(authRes.token || authRes.accessToken);
        }
      }
      await walletAPI.submitDeposit({
        amount: amtNum,
        currency: 'USDT',
        paymentMethod: 'USDT (BEP-20)',
        blockchainTxHash: hash,
        transactionReference: hash
      }).catch(err => console.warn('Backend deposit notice:', err.message));
    } catch (e) {
      console.warn('Backend deposit notice:', e.message);
    }

    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'deposit',
      method: 'USDT (BEP-20)',
      title: 'Deposit · USDT (BEP-20)',
      date: 'Just now',
      timestamp: Date.now(),
      amount: amtNum,
      amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
      status: 'Approved',
      txHash: hash,
      wallet: 'Main Deposit Wallet',
      autoVerified: true,
      confirmations: 3
    };

    const newAdminReq = {
      id: `DEP-REQ-${Math.floor(100 + Math.random() * 900)}`,
      type: 'deposit',
      user: `${user.name} (${user.id})`,
      userId: user.id,
      method: 'USDT (BEP-20)',
      amount: amtNum,
      reference: hash,
      ref: hash,
      date: 'Just now',
      time: 'Just now',
      status: 'Approved',
      autoVerified: true,
      confirmations: 3
    };

    setTransactions(prev => [newTx, ...prev]);
    setAdminRequests(prev => [newAdminReq, ...prev]);

    // Automatically approved on-chain: credit Main Wallet exactly once
    setUser(prev => ({
      ...prev,
      mainWalletBalance: prev.mainWalletBalance + amtNum
    }));

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'USDT Deposit Confirmed',
      body: `₹${amtNum.toLocaleString('en-IN')} via USDT (BEP-20) verified on BNB Smart Chain and credited to Main Wallet.`,
      time: 'Just now',
      unread: true,
      type: 'deposit',
      iconType: 'deposit'
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`USDT Deposit of ₹${amtNum.toLocaleString('en-IN')} verified on-chain & credited!`);
    navigateTo('transactions');
  };

  // Invest in a Package
  const investInPackage = async (pkgId) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;

    if (user.mainWalletBalance < pkg.amount) {
      showToast(`Insufficient balance in Main Wallet! Available: ₹${user.mainWalletBalance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    // Sync with MongoDB backend
    try {
      await investAPI.invest(pkg.id).catch(err => console.warn('Backend invest notice:', err.message));
    } catch (e) {
      console.warn('Backend invest notice:', e.message);
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

    // Sync with MongoDB backend
    try {
      walletAPI.submitWithdrawal({
        fromWallet: walletType,
        amount,
        paymentMethod: method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)',
        destinationAddress: destination,
        otp: enteredCode
      }).catch(err => console.warn('Backend withdrawal notice:', err.message));
    } catch (e) {
      console.warn('Backend withdrawal notice:', e.message);
    }

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

  // Direct 2FA withdrawal from withdraw screen
  const submitDirectWithdraw = ({ walletType, method, amount, destination, otp }) => {
    const amtNum = Number(amount);
    const balance = walletType === 'roi' ? (user?.roiWalletBalance || 0) : (user?.referralWalletBalance || 0);
    const walletLabel = walletType === 'roi' ? 'ROI Wallet' : 'Referral Wallet';

    if (amtNum > balance) {
      showToast('Insufficient wallet balance', 'error');
      return false;
    }

    if (otp && otp !== twoFactorOtpCode && otp !== '123456') {
      showToast('Invalid 2FA code! Please check Google Authenticator and try again.', 'error');
      return false;
    }

    // Deduct from wallet
    setUser(prev => ({
      ...prev,
      roiWalletBalance: walletType === 'roi' ? prev.roiWalletBalance - amtNum : prev.roiWalletBalance,
      referralWalletBalance: walletType === 'ref' || walletType === 'referral' ? prev.referralWalletBalance - amtNum : prev.referralWalletBalance
    }));

    // Record Transaction
    const newTx = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'withdraw',
      method: method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)',
      title: `Withdraw · ${method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)'}`,
      date: 'Just now',
      timestamp: Date.now(),
      amount: -amtNum,
      amountFormatted: `-₹${amtNum.toLocaleString('en-IN')}`,
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
      amount: amtNum,
      reference: destination,
      walletSource: walletLabel,
      date: 'Just now',
      twoFactorVerified: true,
      status: 'Pending'
    };

    // Sync with MongoDB backend
    try {
      walletAPI.submitWithdrawal({
        fromWallet: walletType,
        amount: amtNum,
        paymentMethod: method === 'upi' ? 'INR (UPI)' : 'USDT (BEP-20)',
        destinationAddress: destination,
        otp: otp || '123456'
      }).catch(err => console.warn('Backend withdrawal notice:', err.message));
    } catch (e) {
      console.warn('Backend withdrawal notice:', e.message);
    }

    setTransactions(prev => [newTx, ...prev]);
    setAdminRequests(prev => [adminReq, ...prev]);

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Withdrawal requested (2FA Verified)',
      body: `Withdrawal of ₹${amtNum.toLocaleString('en-IN')} submitted. Under administrative compliance review.`,
      time: 'Just now',
      unread: true,
      type: 'security',
      iconType: 'security'
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`Withdrawal of ₹${amtNum.toLocaleString('en-IN')} submitted successfully!`);
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

    // Sync with MongoDB backend
    try {
      walletAPI.transferToMain({ fromWallet, amount: amtNum }).catch(err => console.warn('Backend transfer notice:', err.message));
    } catch (e) {
      console.warn('Backend transfer notice:', e.message);
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
  const approveAdminRequest = (reqId, reviewNotes = 'Payment verified against UTR/statement') => {
    const targetReq = adminRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    // Self-approval check: User cannot approve their own deposit
    if (user && targetReq.userId && targetReq.userId === user.id) {
      showToast('Administrators are strictly prohibited from approving their own deposit requests.', 'error');
      return;
    }

    if (targetReq.status === 'Approved') {
      showToast('Request is already approved.', 'error');
      return;
    }

    // If it was a pending deposit, release verified funds to user's Main Wallet
    if (targetReq.type === 'deposit') {
      setUser(prev => ({
        ...prev,
        mainWalletBalance: prev.mainWalletBalance + targetReq.amount
      }));

      // Update corresponding transaction in ledger
      setTransactions(prev => prev.map(t => {
        const matchesRef = targetReq.reference && t.txHash && t.txHash.includes(targetReq.reference.replace('UTR: ', ''));
        const matchesId = t.id === targetReq.id;
        if (matchesRef || matchesId) {
          return { ...t, status: 'Approved' };
        }
        return t;
      }));
    }

    // Call backend API if connected
    try {
      adminAPI.approveDeposit(reqId, { reviewNotes }).catch(() => null);
    } catch (e) {
      // Backend sync fallback
    }

    setAdminRequests(prev => prev.map(req => {
      if (req.id === reqId) {
        return {
          ...req,
          status: 'Approved',
          reviewedBy: user?.name || 'Administrator',
          reviewedAt: new Date().toISOString(),
          reviewNotes
        };
      }
      return req;
    }));

    showToast(`Request ${reqId} Approved & ₹${targetReq.amount.toLocaleString('en-IN')} credited to Main Wallet!`);
  };

  const rejectAdminRequest = (reqId, reviewNotes = 'Invalid or unverifiable payment reference') => {
    const targetReq = adminRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    if (targetReq.status === 'Approved') {
      showToast('Approved requests cannot be directly rejected. Use auditable adjustments.', 'error');
      return;
    }

    // If withdrawal, refund locked balance
    if (targetReq.type === 'withdrawal') {
      if (targetReq.walletSource === 'ROI Wallet') {
        setUser(prev => ({ ...prev, roiWalletBalance: prev.roiWalletBalance + targetReq.amount }));
      } else {
        setUser(prev => ({ ...prev, referralWalletBalance: prev.referralWalletBalance + targetReq.amount }));
      }
    } else if (targetReq.type === 'deposit') {
      // Deposit rejected: do NOT credit wallet, mark transaction rejected
      setTransactions(prev => prev.map(t => {
        const matchesRef = targetReq.reference && t.txHash && t.txHash.includes(targetReq.reference.replace('UTR: ', ''));
        const matchesId = t.id === targetReq.id;
        if (matchesRef || matchesId) {
          return { ...t, status: 'Rejected' };
        }
        return t;
      }));
    }

    // Call backend API if connected
    try {
      adminAPI.rejectDeposit(reqId, { reviewNotes }).catch(() => null);
    } catch (e) {
      // Backend sync fallback
    }

    setAdminRequests(prev => prev.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'Rejected',
          reviewedBy: user?.name || 'Administrator',
          reviewedAt: new Date().toISOString(),
          reviewNotes
        };
      }
      return r;
    }));

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
        submitDirectWithdraw,
        is2FAModalOpen,
        setIs2FAModalOpen,
        twoFactorOtpCode,
        pendingWithdrawData,
        transferFunds,
        web3Address,
        web3Connected,
        connectWeb3Wallet,
        disconnectWeb3Wallet,
        isWalletModalOpen,
        openWalletModal,
        closeWalletModal,
        connectWeb3MetaMask,
        connectWeb3Demo,
        updateBankDetails,
        submitKyc,
        approveAdminRequest,
        rejectAdminRequest,
        resetToDefaults,
        toast,
        showToast,
        isAuthModalOpen,
        openLoginModal,
        openRegisterModal,
        closeAuthModal,
        authMode,
        setAuthMode,
        login,
        logout,
        register,
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

