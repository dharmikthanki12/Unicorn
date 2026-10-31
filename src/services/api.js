/**
 * UNICORN Protocol Frontend API Client
 * Connects React UI to Node.js / Express backend with JWT session management
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'unicorn_auth_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // If backend is not running, provide informative error
    console.warn(`[API Client] Error calling ${endpoint}:`, error.message);
    throw error;
  }
}

// 1. Authentication & Security
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/profile'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  updateWeb3Wallet: (address, connected) => request('/auth/web3-wallet', {
    method: 'POST',
    body: JSON.stringify({ address, connected })
  })
};

// 2. Wallets, 2FA & Transactions
export const walletAPI = {
  getData: () => request('/wallet/data'),
  submitDeposit: (body) => request('/wallet/deposit', { method: 'POST', body: JSON.stringify(body) }),
  request2FA: () => request('/wallet/withdraw/request-2fa', { method: 'POST' }),
  submitWithdrawal: (body) => request('/wallet/withdraw', { method: 'POST', body: JSON.stringify(body) }),
  transferToMain: (body) => request('/wallet/transfer', { method: 'POST', body: JSON.stringify(body) })
};

// 3. Investment Packages & Activation
export const investAPI = {
  getPackages: () => request('/invest/packages'),
  invest: (packageId) => request('/invest/invest', { method: 'POST', body: JSON.stringify({ packageId }) }),
  getUserInvestments: () => request('/invest/my-investments')
};

// 4. Referral Network & Rewards
export const referralAPI = {
  getOverview: () => request('/referral/overview')
};

// 5. Admin Console Management
export const adminAPI = {
  getMetrics: () => request('/admin/metrics'),
  getUsers: () => request('/admin/users'),
  getDeposits: () => request('/admin/deposits'),
  approveDeposit: (id) => request(`/admin/deposits/${id}/approve`, { method: 'POST' }),
  rejectDeposit: (id) => request(`/admin/deposits/${id}/reject`, { method: 'POST' }),
  getWithdrawals: () => request('/admin/withdrawals'),
  approveWithdrawal: (id, txHash) => request(`/admin/withdrawals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ txHash })
  }),
  rejectWithdrawal: (id) => request(`/admin/withdrawals/${id}/reject`, { method: 'POST' }),
  triggerDailyROI: () => request('/admin/roi/trigger', { method: 'POST' })
};

