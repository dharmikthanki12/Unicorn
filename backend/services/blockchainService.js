const { ethers } = require('ethers');

const BSC_RPC = process.env.RPC_URL || process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
let provider = null;

try {
  provider = new ethers.JsonRpcProvider(BSC_RPC);
} catch (e) {
  console.warn('[Blockchain Service] Provider initialization notice:', e.message);
}

const UNC_TOKEN = process.env.UNC_TOKEN_ADDRESS || '0x82f9A1498C71e84C21a50B2026BEP20UNC';
const USDT_TOKEN = process.env.USDT_BEP20_ADDRESS || '0x337610d27c682E347C9cD60BE4B3b107C9d34dDd';

// ERC20/BEP20 minimal ABI for balance & transfer checking
const BEP20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)'
];

/**
 * Verifies on-chain transaction status independently
 */
exports.verifyTransactionOnChain = async (txHash) => {
  if (!provider) {
    return { verified: false, reason: 'Blockchain provider not initialized' };
  }

  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return { verified: false, reason: 'Transaction not found on BNB Smart Chain' };
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, reason: 'Transaction pending confirmation' };
    }

    return {
      verified: receipt.status === 1,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.warn(`[Blockchain Service] Error verifying tx ${txHash}:`, error.message);
    return { verified: false, reason: error.message };
  }
};

/**
 * Get Token Details
 */
exports.getTokenInfo = async (tokenAddress) => {
  const address = tokenAddress || process.env.UNC_TOKEN_ADDRESS || '0x86ff73998b5A4dE1E90bEb8415F1560B05efF377';
  if (!provider) {
    return { name: 'Unicorn', symbol: 'UNC', decimals: 18, totalSupply: '100000000' };
  }

  try {
    const contract = new ethers.Contract(address, BEP20_ABI, provider);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatUnits(totalSupply, decimals)
    };
  } catch (e) {
    return { name: 'Unicorn', symbol: 'UNC', decimals: 18, totalSupply: '100000000' };
  }
};

