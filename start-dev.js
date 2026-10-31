import { spawn } from 'child_process';
import process from 'process';

console.log('====================================================');
console.log('🦄 UNICORN Full-Stack Dev Engine (Backend + Frontend)');
console.log('====================================================');

// Start Express Backend on Port 5000
const backend = spawn('node', ['backend/server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start Vite React Frontend on Port 5173
const frontend = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\nShutting down dev servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
