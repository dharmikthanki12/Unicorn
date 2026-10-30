const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isUsingMemoryStore, getStore, saveStore } = require('../config/db');
const { INVESTMENT_PACKAGES } = require('../config/constants');

// --- MONGOOSE SCHEMAS ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String, default: null }, // Sponsor's referralCode
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Wallets (in INR)
  mainWalletBalance: { type: Number, default: 0 },
  roiWalletBalance: { type: Number, default: 0 },
  referralWalletBalance: { type: Number, default: 0 },
  uncBalance: { type: Number, default: 0 }, // Bonus UNC Tokens (BEP-20)
  
  // Web3 & Security
  web3Address: { type: String, default: '' },
  web3Connected: { type: Boolean, default: false },
  kycStatus: { type: String, default: 'Verified' },
  twoFactorOtp: { type: String, default: null },
  twoFactorOtpExpires: { type: Date, default: null },
  
  // Performance & Stats
  activeInvestedAmount: { type: Number, default: 0 },
  todayRoiIncome: { type: Number, default: 0 },
  todayReferralIncome: { type: Number, default: 0 },
  directBusiness: { type: Number, default: 0 },
  teamBusiness: { type: Number, default: 0 },
  directsCount: { type: Number, default: 0 },
  rank: { type: String, default: 'Beginner' },
  
  // Rewards Claimed
  claimedRankRewards: [{ type: String }],
  achieverTripsWon: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now }
});

const investmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  packageId: { type: String, required: true },
  packageName: { type: String, required: true },
  tier: { type: Number, required: true },
  amount: { type: Number, required: true },
  dailyRoi: { type: Number, required: true },
  bonusUnc: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  lastRoiDate: { type: Date, default: Date.now },
  totalRoiEarned: { type: Number, default: 0 },
  daysCredited: { type: Number, default: 0 }
});

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'roi', 'referral', 'withdrawal', 'transfer', 'bonus'], required: true },
  amount: { type: Number, required: true },
  amountFormatted: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  status: { type: String, enum: ['completed', 'pending', 'rejected'], default: 'completed' },
  txHash: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const depositSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  method: { type: String, enum: ['UPI', 'USDT (BEP-20)'], required: true },
  utrOrTxHash: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const withdrawalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  sourceWallet: { type: String, enum: ['roi', 'referral'], required: true },
  amount: { type: Number, required: true },
  payoutMethod: { type: String, enum: ['bank', 'crypto'], required: true },
  payoutDetails: { type: Object, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.models.User || mongoose.model('User', userSchema);
const MongoInvestment = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);
const MongoTransaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const MongoDeposit = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema);
const MongoWithdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

// --- UNIFIED REPOSITORY INTERFACE ---
// Automatically switches between MongoDB and local persistence store
const DB = {
  // USERS
  users: {
    async findOne(query) {
      if (!isUsingMemoryStore()) return await MongoUser.findOne(query);
      const store = getStore();
      return store.users.find(u => {
        for (let key in query) {
          if (query[key] !== undefined && u[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    },
    async findById(id) {
      if (!isUsingMemoryStore()) return await MongoUser.findById(id);
      const store = getStore();
      return store.users.find(u => String(u._id) === String(id) || u.id === id) || null;
    },
    async find(query = {}) {
      if (!isUsingMemoryStore()) return await MongoUser.find(query);
      const store = getStore();
      return store.users.filter(u => {
        for (let key in query) {
          if (query[key] !== undefined && u[key] !== query[key]) return false;
        }
        return true;
      });
    },
    async create(data) {
      if (!isUsingMemoryStore()) return await MongoUser.create(data);
      const store = getStore();
      const user = {
        _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6),
        id: 'usr_' + Date.now(),
        ...data,
        claimedRankRewards: data.claimedRankRewards || [],
        achieverTripsWon: data.achieverTripsWon || [],
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
      saveStore(store);
      return user;
    },
    async updateOne(query, update) {
      if (!isUsingMemoryStore()) return await MongoUser.updateOne(query, update);
      const store = getStore();
      const index = store.users.findIndex(u => {
        for (let key in query) {
          if (query[key] !== undefined && u[key] !== query[key]) return false;
        }
        return true;
      });
      if (index !== -1) {
        const u = store.users[index];
        const setFields = update.$set || update;
        const incFields = update.$inc || {};
        const pushFields = update.$push || {};

        Object.assign(u, setFields);
        for (let k in incFields) {
          u[k] = (Number(u[k]) || 0) + Number(incFields[k]);
        }
        for (let k in pushFields) {
          if (!Array.isArray(u[k])) u[k] = [];
          u[k].push(pushFields[k]);
        }
        saveStore(store);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
  },

  // INVESTMENTS
  investments: {
    async find(query = {}) {
      if (!isUsingMemoryStore()) return await MongoInvestment.find(query);
      const store = getStore();
      return store.investments.filter(i => {
        for (let key in query) {
          if (query[key] !== undefined && i[key] !== query[key]) return false;
        }
        return true;
      });
    },
    async create(data) {
      if (!isUsingMemoryStore()) return await MongoInvestment.create(data);
      const store = getStore();
      const inv = {
        _id: 'inv_' + Date.now() + Math.random().toString(36).substring(2, 6),
        ...data,
        startDate: new Date().toISOString()
      };
      store.investments.push(inv);
      saveStore(store);
      return inv;
    }
  },

  // TRANSACTIONS
  transactions: {
    async find(query = {}) {
      if (!isUsingMemoryStore()) return await MongoTransaction.find(query).sort({ date: -1 });
      const store = getStore();
      return (store.transactions || []).filter(t => {
        for (let key in query) {
          if (query[key] !== undefined && t[key] !== query[key]) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    async create(data) {
      if (!isUsingMemoryStore()) return await MongoTransaction.create(data);
      const store = getStore();
      const tx = {
        _id: 'tx_' + Date.now() + Math.random().toString(36).substring(2, 6),
        id: 'tx_' + Date.now(),
        date: new Date().toISOString(),
        ...data
      };
      if (!store.transactions) store.transactions = [];
      store.transactions.unshift(tx);
      saveStore(store);
      return tx;
    }
  },

  // DEPOSIT REQUESTS
  deposits: {
    async find(query = {}) {
      if (!isUsingMemoryStore()) return await MongoDeposit.find(query).sort({ createdAt: -1 });
      const store = getStore();
      return (store.deposits || []).filter(d => {
        for (let key in query) {
          if (query[key] !== undefined && d[key] !== query[key]) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      if (!isUsingMemoryStore()) return await MongoDeposit.findById(id);
      const store = getStore();
      return (store.deposits || []).find(d => String(d._id) === String(id) || d.id === id) || null;
    },
    async create(data) {
      if (!isUsingMemoryStore()) return await MongoDeposit.create(data);
      const store = getStore();
      const dep = {
        _id: 'dep_' + Date.now() + Math.random().toString(36).substring(2, 6),
        id: 'dep_' + Date.now(),
        createdAt: new Date().toISOString(),
        ...data
      };
      if (!store.deposits) store.deposits = [];
      store.deposits.unshift(dep);
      saveStore(store);
      return dep;
    },
    async updateOne(query, update) {
      if (!isUsingMemoryStore()) return await MongoDeposit.updateOne(query, update);
      const store = getStore();
      const item = (store.deposits || []).find(d => {
        for (let key in query) {
          if (query[key] !== undefined && d[key] !== query[key]) return false;
        }
        return true;
      });
      if (item) {
        Object.assign(item, update.$set || update);
        saveStore(store);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
  },

  // WITHDRAWAL REQUESTS
  withdrawals: {
    async find(query = {}) {
      if (!isUsingMemoryStore()) return await MongoWithdrawal.find(query).sort({ createdAt: -1 });
      const store = getStore();
      return (store.withdrawals || []).filter(w => {
        for (let key in query) {
          if (query[key] !== undefined && w[key] !== query[key]) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async findById(id) {
      if (!isUsingMemoryStore()) return await MongoWithdrawal.findById(id);
      const store = getStore();
      return (store.withdrawals || []).find(w => String(w._id) === String(id) || w.id === id) || null;
    },
    async create(data) {
      if (!isUsingMemoryStore()) return await MongoWithdrawal.create(data);
      const store = getStore();
      const wth = {
        _id: 'wth_' + Date.now() + Math.random().toString(36).substring(2, 6),
        id: 'wth_' + Date.now(),
        createdAt: new Date().toISOString(),
        ...data
      };
      if (!store.withdrawals) store.withdrawals = [];
      store.withdrawals.unshift(wth);
      saveStore(store);
      return wth;
    },
    async updateOne(query, update) {
      if (!isUsingMemoryStore()) return await MongoWithdrawal.updateOne(query, update);
      const store = getStore();
      const item = (store.withdrawals || []).find(w => {
        for (let key in query) {
          if (query[key] !== undefined && w[key] !== query[key]) return false;
        }
        return true;
      });
      if (item) {
        Object.assign(item, update.$set || update);
        saveStore(store);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
  }
};

module.exports = {
  DB,
  INVESTMENT_PACKAGES
};
