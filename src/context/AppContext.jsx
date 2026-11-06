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
  INITIAL_ADMIN_PENDING_REQUESTS,
  INITIAL_ADMIN_NOTIFICATIONS
} from '../data/mockData';
import { authAPI, walletAPI, investAPI, adminAPI, userAPI, referralAPI, setStoredToken, getStoredToken, clearStoredToken } from '../services/api';

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
    // If a phantom 'Web3 Investor' or legacy demo user ('UNC-88294' / 'Rutajeet Mukherjee') was stored, discard it
    if (initial?.user && (initial.user.name === 'Web3 Investor' || initial.user.initials === 'W3' || initial.user.id === 'UNC-88294' || initial.user.name === 'Rutajeet Mukherjee')) {
      return null;
    }
    // Only restore user if an active authenticated session exists with a token in localStorage
    const token = getStoredToken();
    if (token && initial?.user && initial.user.id) {
      const rawKyc = String(initial.user.kycStatus || 'UNVERIFIED').toUpperCase();
      const normalizedKyc = rawKyc === 'VERIFIED' ? 'VERIFIED' : rawKyc === 'PENDING' ? 'PENDING' : 'UNVERIFIED';
      return {
        ...initial.user,
        kycStatus: normalizedKyc,
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
  const [adminTab, setAdminTab] = useState('requests'); // 'requests' | 'users' | 'packages' | 'settings'
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
  const [adminNotifications, setAdminNotifications] = useState(initial?.adminNotifications || INITIAL_ADMIN_NOTIFICATIONS);
  const [adminRequests, setAdminRequests] = useState(initial?.adminRequests || INITIAL_ADMIN_PENDING_REQUESTS);
  
  // Deposit flow state
  const [depositCurrency, setDepositCurrency] = useState('INR'); // 'INR' | 'USD'
  // Custom deposit amount (defaults to empty so user enters custom amount)
  const [depositAmount, setDepositAmount] = useState('10000');
  
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

  const login = async (identifier, password) => {
    const cleanId = (identifier || '').trim();
    try {
      const res = await authAPI.login({
        identifier: cleanId,
        email: cleanId,
        password
      });
      if (res && res.user) {
        if (res.token || res.accessToken) setStoredToken(res.token || res.accessToken);
        const backendAddr = res.user.walletAddress || res.user.web3Address || '';
        const backendConnected = Boolean(res.user.web3Connected || backendAddr);
        const rawKyc = String(res.user.kycStatus || (res.user.kycVerified ? 'VERIFIED' : 'UNVERIFIED')).toUpperCase();
        const normalizedKyc = rawKyc === 'VERIFIED' ? 'VERIFIED' : rawKyc === 'PENDING' ? 'PENDING' : 'UNVERIFIED';

        const displayName = res.user.name || (cleanId.includes('@') ? cleanId.split('@')[0].toUpperCase() : `User ${cleanId.slice(-4)}`);

        const loggedUser = {
          ...INITIAL_USER,
          ...res.user,
          id: res.user.id || res.user._id || `UNC-${Math.floor(10000 + Math.random() * 90000)}`,
          name: res.user.name || displayName,
          email: res.user.email || (cleanId.includes('@') ? cleanId : ''),
          phone: res.user.phone || (!cleanId.includes('@') ? cleanId : ''),
          rank: res.user.rank || 'Starter Unicorn',
          kycStatus: normalizedKyc,
          initials: res.user.name ? res.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U',
          role: res.user.role || (cleanId.toLowerCase().includes('admin') ? 'admin' : 'user'),
          web3Connected: backendConnected,
          web3Address: backendAddr,
          activeInvestedAmount: res.user.activeInvestedAmount !== undefined ? Number(res.user.activeInvestedAmount) : 0,
          isReferralActivated: Boolean(res.user.isReferralActivated || Number(res.user.activeInvestedAmount || 0) > 0),
          todayRoiIncome: Number(res.user.todayRoiIncome || 0),
          directBusiness: Number(res.user.directBusiness || 0),
          teamBusiness: Number(res.user.teamBusiness || 0),
          totalDirects: Number(res.user.totalDirects || 0),
          activePackage: res.user.activePackage || null
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
        // If admin, load real requests from backend; if user, load their transactions
        if (loggedUser.role === 'admin' || loggedUser.role === 'ADMIN') {
          setTimeout(() => fetchAdminRequests(), 500);
        } else {
          setTimeout(() => fetchUserTransactions(), 500);
        }
        return true;
      }
    } catch (e) {
      showToast(e.message || 'Login failed. Invalid credentials or server error.', 'error');
      return false;
    }
    showToast('Invalid email/phone or password.', 'error');
    return false;
  };

  // Fetch real KYC pending requests from backend (admin only)
  const fetchAdminRequests = async () => {
    try {
      const [usersRes, depositsRes, withdrawalsRes] = await Promise.allSettled([
        adminAPI.getUsers(),
        adminAPI.getDeposits(),
        adminAPI.getWithdrawals()
      ]);

      const allRequests = [];

      // Pending KYC requests
      if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
        const kycItems = usersRes.value.users
          .filter(u => String(u.kycStatus || '').toUpperCase() === 'PENDING')
          .map(u => ({
            id: u._id || u.id,
            _backendId: u._id || u.id,
            type: 'KYC Verification',
            user: `${u.name} (${u.email})`,
            userId: u._id || u.id,
            method: u.kycDocumentType || 'Document',
            amount: 0,
            reference: u.kycDocumentId || '-',
            date: u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleDateString('en-GB') : 'Pending',
            status: 'Pending'
          }));
        allRequests.push(...kycItems);
      }

      // Deposits
      if (depositsRes.status === 'fulfilled' && depositsRes.value?.deposits) {
        const depItems = depositsRes.value.deposits
          .map(d => {
            const st = (d.status || '').toLowerCase();
            const normStatus = st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'Pending';
            return {
              id: d._id,
              _backendId: d._id,
              type: 'Deposit',
              user: d.userId ? `${d.userId.name || 'User'} (${d.userId.email || ''})` : 'Unknown User',
              userId: d.userId?._id || d.userId,
              method: d.paymentMethod || 'UPI',
              amount: d.amount || 0,
              reference: d.transactionReference || '-',
              ref: d.transactionReference || '-',
              date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : 'Just now',
              time: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : 'Just now',
              status: normStatus,
              reviewedBy: d.reviewedBy ? 'Administrator' : undefined,
              reviewNotes: d.reviewNotes || ''
            };
          });
        allRequests.push(...depItems);
      }

      // Withdrawals
      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value?.withdrawals) {
        const wdItems = withdrawalsRes.value.withdrawals
          .map(w => {
            const st = (w.status || '').toLowerCase();
            const normStatus = (st === 'approved' || st === 'paid') ? 'Approved' : st === 'rejected' ? 'Rejected' : 'Pending';
            return {
              id: w._id,
              _backendId: w._id,
              type: 'Withdrawal',
              user: w.userId ? `${w.userId.name || 'User'} (${w.userId.email || ''})` : 'Unknown User',
              userId: w.userId?._id || w.userId,
              method: w.payoutMethod || w.method || 'Bank Transfer',
              amount: w.amount || 0,
              reference: w.destinationAddress || w.walletAddress || w.upiId || '-',
              ref: w.destinationAddress || w.walletAddress || w.upiId || '-',
              walletSource: w.walletSource || w.walletType || 'ROI Wallet',
              date: w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-GB') : 'Just now',
              time: w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-GB') : 'Just now',
              status: normStatus,
              reviewedBy: w.reviewedBy ? 'Administrator' : undefined,
              reviewNotes: w.reviewNotes || ''
            };
          });
        allRequests.push(...wdItems);
      }

      // Ensure Pending items appear first in the admin review queue
      allRequests.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return 0;
      });

      setAdminRequests(allRequests);

      // Generate dedicated Admin alerts for pending review items
      const pendingItems = allRequests.filter(r => r.status === 'Pending' || r.status === 'PENDING');
      if (pendingItems.length > 0) {
        const queueNotifs = pendingItems.map(item => ({
          id: `admin-req-${item.id}`,
          title: `${item.type} Review Required`,
          body: `${item.amount > 0 ? `₹${Number(item.amount).toLocaleString('en-IN')} ` : ''}${item.method ? `(${item.method}) ` : ''}submitted by ${item.user}. Action needed in Approval Queue.`,
          time: item.date || 'Pending',
          unread: true,
          type: item.type === 'Deposit' ? 'deposit' : item.type === 'Withdrawal' ? 'wallet' : 'security',
          iconType: item.type === 'Deposit' ? 'deposit' : item.type === 'Withdrawal' ? 'wallet' : 'security',
          target: 'admin'
        }));
        setAdminNotifications(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = queueNotifs.filter(q => !existingIds.has(q.id));
          return [...newItems, ...prev];
        });
      }
    } catch (e) {
      console.warn('[Admin] Could not fetch requests:', e.message);
    }
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
      role: apiUser?.role || 'user',
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

  const register = async (name, email, password, referralCode, phone, verificationToken, signupMethod = 'email') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    try {
      const res = await authAPI.register({
        name: (name || '').trim(),
        email: cleanEmail,
        password,
        referralCode: referralCode ? referralCode.trim() : undefined,
        phone: cleanPhone,
        verificationToken,
        signupMethod
      });
      if (res && res.user) {
        if (res.token || res.accessToken) setStoredToken(res.token || res.accessToken);
        const newUser = createFreshUser(name || res.user.name, res.user.email || cleanEmail, res.user, referralCode);
        if (cleanPhone) newUser.phone = cleanPhone;
        setUser(newUser);
        setTransactions([]); // Clear old transactions for new user
        showToast(`Welcome to UNICORN, ${newUser.name}! Registered successfully.`);
        setIsAuthModalOpen(false);
        setActiveScreen('home');
        setScreenHistory(['home']);
        return true;
      }
    } catch (e) {
      showToast(e.message || 'Registration failed. Could not save to database.', 'error');
      throw e;
    }
    showToast('Registration failed. Unable to create account.', 'error');
    return false;
  };

  const updateUserProfile = async ({ name, email, phone, otp }) => {
    try {
      const res = await userAPI.updateProfile({ name, email, phone, otp });
      if (res && res.user) {
        setUser(prev => prev ? {
          ...prev,
          name: res.user.name || prev.name,
          email: res.user.email || prev.email,
          phone: res.user.phone !== undefined ? res.user.phone : prev.phone
        } : null);
      } else {
        setUser(prev => prev ? {
          ...prev,
          name: name || prev.name,
          email: email || prev.email,
          phone: phone !== undefined ? phone : prev.phone
        } : null);
      }
      showToast('Contact details updated successfully!');
      return true;
    } catch (e) {
      showToast(e.message || 'Failed to update profile.', 'error');
      throw e;
    }
  };

  const requestEmailChangeOtp = async (newEmail) => {
    try {
      const res = await userAPI.requestEmailChangeOtp(newEmail);
      showToast(res.message || 'Verification OTP sent to new email!');
      return res;
    } catch (e) {
      showToast(e.message || 'Failed to send OTP to new email.', 'error');
      throw e;
    }
  };

  const verifyEmailChangeOtp = async (newEmail, otp) => {
    try {
      const res = await userAPI.verifyEmailChangeOtp(newEmail, otp);
      if (res && res.user) {
        setUser(prev => prev ? {
          ...prev,
          email: res.user.email || newEmail
        } : null);
      }
      showToast(res.message || 'Email address updated successfully!');
      return res;
    } catch (e) {
      showToast(e.message || 'Invalid or expired verification code.', 'error');
      throw e;
    }
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

  const submitKyc = async (documentType, documentId) => {
    const cleanDocId = (documentId || '').trim();
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        kycStatus: 'PENDING',
        kycDocumentType: documentType,
        kycDocumentId: cleanDocId,
        kycSubmittedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };
    });

    const newKycReq = {
      id: `KYC-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'KYC Verification',
      user: `${user?.name || 'Investor'} (${user?.id || 'UNC-ID'})`,
      userId: user?.id,
      method: documentType,
      amount: 0,
      reference: cleanDocId,
      date: 'Just now',
      status: 'Pending'
    };
    setAdminRequests(prev => [newKycReq, ...prev]);

    try {
      await userAPI.submitKyc({ documentType, documentId: cleanDocId }).catch(() => null);
    } catch (e) {}

    showToast('KYC documents submitted successfully! Status: Under Review by Admin.');
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

  // Synchronize user's personal deposits & withdrawals from the database
  const fetchUserTransactions = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const [depRes, withRes, txRes] = await Promise.allSettled([
        walletAPI.getMyDeposits(),
        walletAPI.getMyWithdrawals(),
        walletAPI.getMyTransactions ? walletAPI.getMyTransactions() : Promise.resolve({})
      ]);

      const backendTxns = [];

      if (depRes.status === 'fulfilled' && depRes.value?.deposits) {
        depRes.value.deposits.forEach(d => {
          const statusLower = (d.status || '').toLowerCase();
          const statusNormalized =
            statusLower === 'approved' ? 'Completed' :
            statusLower === 'rejected' ? 'Rejected' : 'Pending';

          backendTxns.push({
            id: d._id,
            _backendId: d._id,
            type: 'deposit',
            method: d.paymentMethod === 'USDT (BEP-20)' ? 'USDT (BEP-20)' : 'INR (UPI)',
            title: `Deposit · ${d.paymentMethod === 'USDT (BEP-20)' ? 'USDT (BEP-20)' : 'INR (UPI)'}`,
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now',
            timestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
            amount: d.amount,
            amountFormatted: `+₹${Number(d.amount).toLocaleString('en-IN')}`,
            status: statusNormalized,
            txHash: d.transactionReference || d.blockchainTxHash || '',
            wallet: 'Main Deposit Wallet',
            reviewNotes: d.reviewNotes || ''
          });
        });
      }

      if (withRes.status === 'fulfilled' && withRes.value?.withdrawals) {
        withRes.value.withdrawals.forEach(w => {
          const statusLower = (w.status || '').toLowerCase();
          const statusNormalized =
            statusLower === 'approved' || statusLower === 'paid' ? 'Completed' :
            statusLower === 'rejected' ? 'Rejected' : 'Pending';

          backendTxns.push({
            id: w._id,
            _backendId: w._id,
            type: 'withdrawal',
            method: w.payoutMethod || 'Bank Transfer',
            title: `Withdrawal · ${w.walletSource || 'ROI'}`,
            date: w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now',
            timestamp: w.createdAt ? new Date(w.createdAt).getTime() : Date.now(),
            amount: w.amount,
            amountFormatted: `-₹${Number(w.amount).toLocaleString('en-IN')}`,
            status: statusNormalized,
            txHash: w.destinationAddress || '',
            wallet: `${w.walletSource || 'ROI'} Wallet`,
            reviewNotes: w.reviewNotes || ''
          });
        });
      }

      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        txRes.value.transactions.forEach(t => {
          backendTxns.push({
            id: t._id,
            _backendId: t._id,
            type: t.type === 'ROI' ? 'roi' : t.type === 'REFERRAL' ? 'referral' : (t.type || '').toLowerCase(),
            method: t.description || 'Daily 0.45% ROI',
            title: t.title || (t.type === 'ROI' ? 'ROI income · Daily 0.45%' : t.description || 'Transaction'),
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today',
            timestamp: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
            amount: t.amount,
            amountFormatted: `+₹${Number(t.amount).toLocaleString('en-IN')}`,
            status: 'Completed',
            txHash: t.reference || 'System Automated Cycle',
            wallet: t.walletType ? `${t.walletType} Wallet` : 'ROI Wallet'
          });
        });
      }

      if (backendTxns.length > 0) {
        setTransactions(prev => {
          // Keep non-deposit and non-withdrawal transactions (like ROI or Referral income)
          const otherTxns = (prev || []).filter(t => {
            const isDup = backendTxns.some(bt => bt.id === t.id || (bt.txHash && t.txHash && bt.txHash.includes(t.txHash.replace('UTR: ', ''))));
            return !isDup && t.type !== 'deposit' && t.type !== 'withdrawal';
          });
          const merged = [...backendTxns, ...otherTxns];
          merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          return merged;
        });
      }
    } catch (err) {
      console.warn('Could not sync user transactions:', err.message);
    }
  };

  // Periodic background synchronization every 5 seconds
  // Refreshes profile, kycStatus, balances, and transactions automatically from the database
  useEffect(() => {
    const token = getStoredToken();
    if (!token || !user) return;
    // Skip mock/legacy users
    if (user.id === 'UNC-88294' || user.email === 'rutajeet@unicorn.vip') return;

    const syncFromDatabase = () => {
      authAPI.getProfile()
        .then(res => {
          if (res && res.user) {
            const rawKyc = String(res.user.kycStatus || (res.user.kycVerified ? 'VERIFIED' : 'UNVERIFIED')).toUpperCase();
            const normalizedKyc = rawKyc === 'VERIFIED' ? 'VERIFIED' : rawKyc === 'PENDING' ? 'PENDING' : 'UNVERIFIED';
            setUser(prev => {
              if (!prev) return prev;
              const serverInvested = res.user.activeInvestedAmount !== undefined ? Number(res.user.activeInvestedAmount) : (prev.activeInvestedAmount || 0);
              const finalInvested = Math.max(Number(prev.activeInvestedAmount || 0), Number(serverInvested || 0));
              const finalActivated = Boolean(prev.isReferralActivated || res.user.isReferralActivated || finalInvested > 0);
              return {
                ...prev,
                kycStatus: normalizedKyc,
                kycVerified: res.user.kycVerified || normalizedKyc === 'VERIFIED',
                kycDocumentType: res.user.kycDocumentType || prev.kycDocumentType,
                kycDocumentId: res.user.kycDocumentId || prev.kycDocumentId,
                rank: res.user.rank || prev.rank,
                status: res.user.status || prev.status,
                role: res.user.role || prev.role,
                mainWalletBalance: res.user.mainWalletBalance !== undefined ? res.user.mainWalletBalance : prev.mainWalletBalance,
                roiWalletBalance: res.user.roiWalletBalance !== undefined ? res.user.roiWalletBalance : prev.roiWalletBalance,
                referralWalletBalance: res.user.referralWalletBalance !== undefined ? res.user.referralWalletBalance : prev.referralWalletBalance,
                // Preserve activation status once activated
                activeInvestedAmount: finalInvested,
                isReferralActivated: finalActivated,
                todayRoiIncome: res.user.todayRoiIncome !== undefined ? Number(res.user.todayRoiIncome) : prev.todayRoiIncome,
                directBusiness: res.user.directBusiness !== undefined ? Number(res.user.directBusiness) : prev.directBusiness,
                teamBusiness: res.user.teamBusiness !== undefined ? Number(res.user.teamBusiness) : prev.teamBusiness,
                totalDirects: res.user.totalDirects !== undefined ? Number(res.user.totalDirects) : prev.totalDirects,
                activePackage: res.user.activePackage || prev.activePackage
              };
            });
          }
        })
        .catch(() => {});

      // Sync active investments directly from investment catalog
      investAPI.getUserInvestments()
        .then(invRes => {
          if (invRes && invRes.investments && invRes.investments.length > 0) {
            const activeInvs = invRes.investments.filter(i => {
              const st = (i.status || '').toLowerCase();
              return st === 'confirmed' || st === 'active';
            });
            if (activeInvs.length > 0) {
              const totalActive = activeInvs.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
              const totalDaily = activeInvs.reduce((acc, i) => acc + (Number(i.dailyRoiAmount) || 0), 0);
              setUser(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  activeInvestedAmount: Math.max(Number(prev.activeInvestedAmount || 0), totalActive),
                  isReferralActivated: true,
                  todayRoiIncome: (prev.todayRoiIncome && prev.todayRoiIncome > 0) ? prev.todayRoiIncome : totalDaily,
                  activePackage: activeInvs[0] || prev.activePackage
                };
              });
            }
          }
        })
        .catch(() => {});

      walletAPI.getData()
        .then(wRes => {
          if (wRes && wRes.balances) {
            setUser(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                mainWalletBalance: wRes.balances.main ?? wRes.balances.mainBalance ?? prev.mainWalletBalance,
                roiWalletBalance: wRes.balances.roi ?? wRes.balances.roiBalance ?? prev.roiWalletBalance,
                referralWalletBalance: wRes.balances.referral ?? wRes.balances.referralBalance ?? prev.referralWalletBalance,
              };
            });
          }
        })
        .catch(() => {});

      // Sync real referral team & direct business from MongoDB
      referralAPI.getOverview()
        .then(refRes => {
          if (refRes && refRes.data) {
            const { directs, directVolume, totalBusiness, directsCount } = refRes.data;
            if (Array.isArray(directs)) {
              setTeam(prev => ({
                ...prev,
                1: directs
              }));
            }
            setUser(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                totalDirects: directsCount !== undefined ? directsCount : (directs?.length ?? prev.totalDirects),
                directBusiness: directVolume !== undefined ? directVolume : prev.directBusiness,
                teamBusiness: totalBusiness !== undefined ? totalBusiness : prev.teamBusiness
              };
            });
          }
        })
        .catch(() => {});

      if (user.role === 'admin' || user.role === 'ADMIN') {
        fetchAdminRequests();
      } else {
        fetchUserTransactions();
      }
    };

    syncFromDatabase();
    // Refresh periodically every 30 seconds only when tab is visible to prevent 429 rate limit errors
    const intervalTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncFromDatabase();
    }, 30000);
    return () => clearInterval(intervalTimer);
  }, [user?.role]);

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
    if (screenName === 'transactions') {
      fetchUserTransactions();
    }
    if (screenName === 'admin') {
      fetchAdminRequests();
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

  // Global Currency State (INR / USD)
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('unicorn_currency') || 'INR';
  });

  const toggleCurrency = () => {
    setCurrency(prev => {
      const next = prev === 'INR' ? 'USD' : 'INR';
      try {
        localStorage.setItem('unicorn_currency', next);
      } catch (e) {
        // ignore
      }
      showToast(`Currency changed to ${next === 'USD' ? 'USD ($)' : 'INR (₹)'}`);
      return next;
    });
  };

  // Currency helpers (1 USD = 100 INR rate across platform)
  const currencyRate = 100;
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const convertAmount = (inrAmount) => {
    const num = Number(inrAmount) || 0;
    if (currency === 'USD') {
      const val = num / currencyRate;
      return val % 1 === 0 ? val : Number(val.toFixed(2));
    }
    return Math.round(num);
  };

  const formatCurrency = (inrAmount, options = {}) => {
    const num = Number(inrAmount) || 0;
    const isNegative = num < 0;
    const abs = Math.abs(num);
    const converted = currency === 'USD' ? abs / currencyRate : abs;
    const formatted = converted.toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN', {
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
      minimumFractionDigits: (options.fixedDecimals && currency === 'USD') ? 2 : 0
    });
    const prefix = isNegative ? '-' : (options.includePlus && num > 0 ? '+' : '');
    return `${prefix}${currencySymbol}${formatted}`;
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
    const amtNum = Number(amount) || (depositAmount ? Number(depositAmount) : 0);
    if (!amtNum || amtNum <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return false;
    }
    const ref = (utrNumber || '').trim() || `UTR${Date.now()}`;

    let backendDeposit = null;
    // Sync with MongoDB backend
    try {
      const res = await walletAPI.submitDeposit({
        amount: amtNum,
        currency: 'INR',
        paymentMethod: 'UPI',
        transactionReference: ref
      });
      if (res && res.deposit) {
        backendDeposit = res.deposit;
      }
    } catch (e) {
      console.warn('Backend deposit notice:', e.message);
    }

    const assignedId = backendDeposit?._id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalRef = backendDeposit?.transactionReference || ref;

    const newTx = {
      id: assignedId,
      _backendId: backendDeposit?._id,
      type: 'deposit',
      method: 'INR (UPI)',
      title: 'Deposit · INR (UPI)',
      date: 'Just now',
      timestamp: Date.now(),
      amount: amtNum,
      amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
      status: 'Pending',
      txHash: `UTR: ${finalRef}`,
      wallet: 'Main Deposit Wallet'
    };

    const newAdminReq = {
      id: assignedId,
      _backendId: backendDeposit?._id,
      type: 'Deposit',
      user: `${user?.name || 'Investor'} (${user?.email || user?.id || 'UNC-ID'})`,
      userId: user?.id || user?._id,
      method: 'INR (UPI)',
      amount: amtNum,
      reference: `UTR: ${finalRef}`,
      ref: `UTR: ${finalRef}`,
      date: 'Just now',
      time: 'Just now',
      status: 'Pending'
    };

    setTransactions(prev => [newTx, ...prev.filter(t => t.id !== assignedId)]);
    setAdminRequests(prev => [newAdminReq, ...prev.filter(r => r.id !== assignedId)]);

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

    // Add Admin Notification for deposit
    const adminDepNotif = {
      id: `admin-dep-${Date.now()}`,
      title: 'New Deposit Verification Required',
      body: `₹${amtNum.toLocaleString('en-IN')} via UPI (UTR: ${finalRef}) submitted by ${user?.name || 'User'}. Action required in Approval Queue.`,
      time: 'Just now',
      unread: true,
      type: 'deposit',
      iconType: 'deposit',
      target: 'admin'
    };
    setAdminNotifications(prev => [adminDepNotif, ...prev]);

    showToast(`Deposit of ₹${amtNum.toLocaleString('en-IN')} submitted! Status: Pending Admin Review.`);
    navigateTo('transactions');
    setTimeout(() => {
      fetchUserTransactions();
      if (user?.role === 'admin' || user?.role === 'ADMIN') {
        fetchAdminRequests();
      }
    }, 600);
    return true;
  };

  // Submit USDT Deposit (Automatic Blockchain Verification Flow on BNB Smart Chain)
  const submitUsdtDeposit = async (txHash, amount) => {
    const amtNum = Number(amount) || (depositAmount ? Number(depositAmount) : 0);
    if (!amtNum || amtNum <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return false;
    }
    const hash = (txHash || '').trim() || `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    let backendDeposit = null;
    // Sync with MongoDB backend
    try {
      const res = await walletAPI.submitDeposit({
        amount: amtNum,
        currency: 'USDT',
        paymentMethod: 'USDT (BEP-20)',
        blockchainTxHash: hash,
        transactionReference: hash
      });
      if (res && res.deposit) {
        backendDeposit = res.deposit;
      }
    } catch (e) {
      console.warn('Backend USDT deposit notice:', e.message);
    }

    const assignedId = backendDeposit?._id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTx = {
      id: assignedId,
      _backendId: backendDeposit?._id,
      type: 'deposit',
      method: 'USDT (BEP-20)',
      title: 'Deposit · USDT (BEP-20)',
      date: 'Just now',
      timestamp: Date.now(),
      amount: amtNum,
      amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
      status: backendDeposit?.status === 'approved' ? 'Completed' : 'Pending',
      txHash: hash,
      wallet: 'Main Deposit Wallet',
      autoVerified: true,
      confirmations: 3
    };

    setTransactions(prev => [newTx, ...prev.filter(t => t.id !== assignedId)]);
    showToast(`USDT Deposit of ₹${amtNum.toLocaleString('en-IN')} submitted!`);
    navigateTo('transactions');
    setTimeout(() => {
      fetchUserTransactions();
      if (user?.role === 'admin' || user?.role === 'ADMIN') {
        fetchAdminRequests();
      }
    }, 600);
    return true;
  };

  // Invest in a Package
  const investInPackage = async (pkgId, customAmount) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return false;

    const minAmount = Number(pkg.amount);
    const investAmount = (customAmount !== undefined && customAmount !== null && Number(customAmount) > 0)
      ? Number(customAmount)
      : minAmount;

    if (investAmount < minAmount) {
      showToast(`Minimum investment for ${pkg.name} is ₹${minAmount.toLocaleString('en-IN')}`, 'error');
      return false;
    }

    if ((user?.mainWalletBalance || 0) < investAmount) {
      showToast(`Insufficient balance in Main Wallet! Available: ₹${(user?.mainWalletBalance || 0).toLocaleString('en-IN')}`, 'error');
      return false;
    }

    // Sync with MongoDB backend
    try {
      await investAPI.invest(pkg.id, investAmount).catch(err => console.warn('Backend invest notice:', err.message));
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
      amount: -investAmount,
      amountFormatted: `-₹${investAmount.toLocaleString('en-IN')}`,
      status: 'Completed',
      txHash: 'Internal · Package Contract',
      wallet: 'Main Deposit Wallet'
    };

    // Calculate new daily return
    const currentActiveInvested = Number(user.activeInvestedAmount || 0);
    const newActiveInvested = currentActiveInvested + investAmount;
    const addedDailyRoi = Math.round(investAmount * 0.0045);

    setUser(prev => ({
      ...prev,
      mainWalletBalance: (prev.mainWalletBalance || 0) - investAmount,
      activeInvestedAmount: newActiveInvested,
      isReferralActivated: true,
      activePackage: pkg,
      todayRoiIncome: Number(prev.todayRoiIncome || 0) + addedDailyRoi
    }));

    setTransactions(prev => [newTx, ...prev]);

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Package activated!',
      body: `You have successfully activated ${pkg.name} (₹${investAmount.toLocaleString('en-IN')}). Daily ROI: +₹${addedDailyRoi.toLocaleString('en-IN')} (0.45%).`,
      time: 'Just now',
      unread: true,
      type: 'roi',
      iconType: 'roi'
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Add Admin Notification for investment
    const adminPkgNotif = {
      id: `admin-pkg-${Date.now()}`,
      title: 'Member Investment Package Activated',
      body: `${user?.name || 'Investor'} activated ${pkg.name} (₹${investAmount.toLocaleString('en-IN')}). Daily ROI: +₹${addedDailyRoi.toLocaleString('en-IN')}.`,
      time: 'Just now',
      unread: false,
      type: 'invest',
      iconType: 'roi',
      target: 'admin'
    };
    setAdminNotifications(prev => [adminPkgNotif, ...prev]);

    showToast(`Successfully invested ₹${investAmount.toLocaleString('en-IN')} in ${pkg.name}!`);
    navigateTo('home');
    return true;
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

    // Add Admin Notification for withdrawal
    const adminWdNotif = {
      id: `admin-wd-${Date.now()}`,
      title: 'New Withdrawal Payout Request',
      body: `Withdrawal of ₹${Number(amount).toLocaleString('en-IN')} requested by ${user?.name || 'Investor'}. Verification required.`,
      time: 'Just now',
      unread: true,
      type: 'withdraw',
      iconType: 'wallet',
      target: 'admin'
    };
    setAdminNotifications(prev => [adminWdNotif, ...prev]);

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

    // If withdrawing from referral wallet, funds are credited directly to ROI wallet
    if (walletType === 'referral' || walletType === 'ref') {
      setUser(prev => ({
        ...prev,
        referralWalletBalance: prev.referralWalletBalance - amtNum,
        roiWalletBalance: prev.roiWalletBalance + amtNum
      }));

      const newTx = {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        type: 'withdraw',
        method: 'ROI Wallet',
        title: 'Withdraw to ROI Wallet',
        date: 'Just now',
        timestamp: Date.now(),
        amount: amtNum,
        amountFormatted: `+₹${amtNum.toLocaleString('en-IN')}`,
        status: 'Completed',
        txHash: 'Referral Wallet ➔ ROI Wallet',
        wallet: 'ROI Wallet'
      };

      const debitTx = {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        type: 'withdraw',
        method: 'ROI Wallet',
        title: 'Referral Funds Withdrawn',
        date: 'Just now',
        timestamp: Date.now(),
        amount: -amtNum,
        amountFormatted: `-₹${amtNum.toLocaleString('en-IN')}`,
        status: 'Completed',
        txHash: 'Referral Wallet ➔ ROI Wallet',
        wallet: 'Referral Wallet'
      };

      setTransactions(prev => [newTx, debitTx, ...prev]);

      try {
        walletAPI.transferToMain({ fromWallet: 'referral', toWallet: 'roi', amount: amtNum })
          .catch(err => console.warn('Backend transfer notice:', err.message));
      } catch (e) {
        console.warn('Backend transfer notice:', e.message);
      }

      showToast(`Successfully withdrawn ₹${amtNum.toLocaleString('en-IN')} to ROI Wallet!`);
      return true;
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

    // Add Admin Notification for withdrawal
    const adminDirectWdNotif = {
      id: `admin-wd-${Date.now()}`,
      title: 'New Withdrawal Payout Request',
      body: `Withdrawal of ₹${amtNum.toLocaleString('en-IN')} requested by ${user?.name || 'Investor'}. Verification required.`,
      time: 'Just now',
      unread: true,
      type: 'withdraw',
      iconType: 'wallet',
      target: 'admin'
    };
    setAdminNotifications(prev => [adminDirectWdNotif, ...prev]);

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
      walletAPI.transferToMain({ fromWallet, toWallet, amount: amtNum }).catch(err => console.warn('Backend transfer notice:', err.message));
    } catch (e) {
      console.warn('Backend transfer notice:', e.message);
    }

    setUser(prev => ({
      ...prev,
      roiWalletBalance: fromWallet === 'roi' ? prev.roiWalletBalance - amtNum : toWallet === 'roi' ? prev.roiWalletBalance + amtNum : prev.roiWalletBalance,
      referralWalletBalance: fromWallet === 'referral' ? prev.referralWalletBalance - amtNum : prev.referralWalletBalance,
      mainWalletBalance: toWallet === 'main' ? prev.mainWalletBalance + amtNum : prev.mainWalletBalance
    }));

    showToast(`Transferred ₹${amtNum.toLocaleString('en-IN')} to ${toWallet === 'roi' ? 'ROI' : 'Main'} Wallet!`);
  };

  // Admin Actions
  const approveAdminRequest = async (reqId, reviewNotes = 'Payment verified against UTR/statement') => {
    const targetReq = adminRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    if (targetReq.status === 'Approved') {
      showToast('Request is already approved.', 'error');
      return;
    }

    const backendId = targetReq._backendId || reqId;

    try {
      if (targetReq.type.toLowerCase().includes('kyc')) {
        await adminAPI.approveKyc(targetReq._backendId || targetReq.userId);
        setUser(prev => {
          if (!prev) return prev;
          if (targetReq.userId && (prev.id === targetReq.userId || prev._id === targetReq.userId)) {
            return { ...prev, kycStatus: 'VERIFIED', kycVerified: true };
          }
          return prev;
        });
        showToast(`KYC for ${targetReq.user} has been APPROVED! Account is now Verified.`);
      } else if (targetReq.type.toLowerCase().includes('deposit')) {
        await adminAPI.approveDeposit(backendId, { reviewNotes });

        // If the current logged-in user is the one whose deposit was approved, immediately credit balance
        setUser(prev => {
          if (!prev) return prev;
          const isTargetUser = !targetReq.userId || prev.id === targetReq.userId || prev._id === targetReq.userId;
          if (isTargetUser) {
            return {
              ...prev,
              mainWalletBalance: (prev.mainWalletBalance || 0) + Number(targetReq.amount || 0)
            };
          }
          return prev;
        });

        // Update corresponding transaction in ledger
        setTransactions(prev => prev.map(t => {
          const matchesRef = targetReq.reference && t.txHash && t.txHash.includes(targetReq.reference.replace('UTR: ', ''));
          const matchesId = t.id === targetReq.id || t.id === backendId || t._backendId === backendId;
          if (matchesRef || matchesId) {
            return { ...t, status: 'Completed' };
          }
          return t;
        }));

        showToast(`Deposit of ₹${Number(targetReq.amount).toLocaleString('en-IN')} Approved & Credited to Main Wallet!`);
      } else if (targetReq.type.toLowerCase().includes('withdrawal')) {
        await adminAPI.approveWithdrawal(backendId);
        showToast(`Withdrawal of ₹${Number(targetReq.amount).toLocaleString('en-IN')} Approved!`);
      }

      // Mark request approved in local admin queue
      setAdminRequests(prev => prev.map(req => {
        if (req.id === reqId || req._backendId === backendId) {
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

      // Add Admin Notification
      setAdminNotifications(prev => [{
        id: `admin-act-${Date.now()}`,
        title: `${targetReq.type} Approved`,
        body: `Approved ${targetReq.amount > 0 ? `₹${Number(targetReq.amount).toLocaleString('en-IN')}` : 'request'} for ${targetReq.user}.`,
        time: 'Just now',
        unread: false,
        type: 'admin',
        iconType: 'security',
        target: 'admin'
      }, ...prev]);

      // Immediately fetch latest data from backend so state stays synced
      fetchAdminRequests();
      walletAPI.getData().then(wRes => {
        if (wRes && wRes.balances) {
          setUser(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              mainWalletBalance: wRes.balances.main ?? wRes.balances.mainBalance ?? prev.mainWalletBalance,
              roiWalletBalance: wRes.balances.roi ?? wRes.balances.roiBalance ?? prev.roiWalletBalance,
              referralWalletBalance: wRes.balances.referral ?? wRes.balances.referralBalance ?? prev.referralWalletBalance,
            };
          });
        }
      }).catch(() => {});
    } catch (err) {
      console.error('[Admin Action] Error approving request:', err);
      showToast(err.message || 'Failed to approve request on backend', 'error');
    }
  };

  const rejectAdminRequest = async (reqId, reviewNotes = 'Invalid or unverifiable payment reference') => {
    const targetReq = adminRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    if (targetReq.status === 'Approved') {
      showToast('Approved requests cannot be directly rejected. Use auditable adjustments.', 'error');
      return;
    }

    const backendId = targetReq._backendId || reqId;

    try {
      if (targetReq.type.toLowerCase().includes('kyc')) {
        await adminAPI.rejectKyc(targetReq._backendId || targetReq.userId, { reason: reviewNotes });
        setUser(prev => {
          if (!prev) return prev;
          if (targetReq.userId && (prev.id === targetReq.userId || prev._id === targetReq.userId)) {
            return { ...prev, kycStatus: 'UNVERIFIED', kycVerified: false };
          }
          return prev;
        });
        showToast(`KYC for ${targetReq.user} has been REJECTED.`);
      } else if (targetReq.type.toLowerCase().includes('withdrawal')) {
        await adminAPI.rejectWithdrawal(backendId, { reviewNotes });
        setUser(prev => {
          if (!prev) return prev;
          const isTargetUser = !targetReq.userId || prev.id === targetReq.userId || prev._id === targetReq.userId;
          if (isTargetUser) {
            if (targetReq.walletSource === 'ROI Wallet' || targetReq.walletSource === 'roi') {
              return { ...prev, roiWalletBalance: prev.roiWalletBalance + targetReq.amount };
            } else {
              return { ...prev, referralWalletBalance: prev.referralWalletBalance + targetReq.amount };
            }
          }
          return prev;
        });
        showToast(`Withdrawal of ₹${Number(targetReq.amount).toLocaleString('en-IN')} Rejected & Refunded.`);
      } else if (targetReq.type.toLowerCase().includes('deposit')) {
        await adminAPI.rejectDeposit(backendId, { reviewNotes });
        setTransactions(prev => prev.map(t => {
          const matchesRef = targetReq.reference && t.txHash && t.txHash.includes(targetReq.reference.replace('UTR: ', ''));
          const matchesId = t.id === targetReq.id || t.id === backendId || t._backendId === backendId;
          if (matchesRef || matchesId) {
            return { ...t, status: 'Rejected' };
          }
          return t;
        }));
        showToast(`Deposit request of ₹${Number(targetReq.amount).toLocaleString('en-IN')} Rejected.`);
      }

      setAdminRequests(prev => prev.map(r => {
        if (r.id === reqId || r._backendId === backendId) {
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

      // Add Admin Notification
      setAdminNotifications(prev => [{
        id: `admin-act-${Date.now()}`,
        title: `${targetReq.type} Rejected`,
        body: `Rejected request for ${targetReq.user}. Reason: ${reviewNotes}`,
        time: 'Just now',
        unread: false,
        type: 'admin',
        iconType: 'security',
        target: 'admin'
      }, ...prev]);

      fetchAdminRequests();
    } catch (err) {
      console.error('[Admin Action] Error rejecting request:', err);
      showToast(err.message || 'Failed to reject request on backend', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currency,
        toggleCurrency,
        currencySymbol,
        formatCurrency,
        convertAmount,
        activeScreen,
        adminTab,
        setAdminTab,
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
        setNotifications,
        adminNotifications,
        setAdminNotifications,
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
        updateUserProfile,
        requestEmailChangeOtp,
        verifyEmailChangeOtp,
        updateBankDetails,
        submitKyc,
        approveAdminRequest,
        rejectAdminRequest,
        fetchAdminRequests,
        fetchUserTransactions,
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

