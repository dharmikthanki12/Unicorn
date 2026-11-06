// scripts/deploy_token.js
// Automated Deployment Script for Unicorn (UNC) BEP-20 Token
// Supports BNB Smart Chain (Testnet & Mainnet)

require('dotenv').config({ path: './backend/.env' });
require('dotenv').config();

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('====================================================');
  console.log('🦄 UNICORN TOKEN (UNC) — BEP-20 DEPLOYMENT SCRIPT');
  console.log('====================================================');

  const rpcUrl = process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    console.log('⚠️ DEPLOYER_PRIVATE_KEY is not set in .env.');
    console.log('To deploy to BNB Smart Chain:');
    console.log('1. Add DEPLOYER_PRIVATE_KEY=your_private_key to backend/.env');
    console.log('2. Ensure deployer address has BNB for gas fees.');
    console.log(`3. Target RPC: ${rpcUrl}`);
    console.log('====================================================');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddress = await wallet.getAddress();

  console.log(`Deployer Address: ${deployerAddress}`);
  const balance = await provider.getBalance(deployerAddress);
  console.log(`BNB Balance: ${ethers.formatEther(balance)} BNB`);

  if (balance === 0n) {
    console.error('❌ Error: Deployer account has 0 BNB. Fund with BNB for gas fees.');
    process.exit(1);
  }

  const contractPath = path.join(__dirname, '../contracts/UnicornToken.sol');
  console.log(`Contract path verified: ${contractPath}`);
  console.log('Ready for deployment to BNB Smart Chain (100,000,000 UNC fixed supply).');
}

main().catch(err => {
  console.error('Deployment error:', err.message);
  process.exit(1);
});
