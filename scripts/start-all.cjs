/**
 * Unified Full-Stack Launcher for College ERP
 * Starts both Express Backend (Port 5000) and Vite Frontend (Port 3000) concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('=============================================================');
console.log('       STARTING COLLEGE ERP SYSTEM (BACKEND + FRONTEND)       ');
console.log('=============================================================');
console.log('  ➜ Backend API:     http://localhost:5000/api/health');
console.log('  ➜ Frontend Portal: http://localhost:3000');
console.log('=============================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;

// Start Express Backend with live reloading
const backend = spawn(nodeCmd, ['--watch', 'server/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, PORT: '5000' }
});

// Start Vite Frontend
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env }
});

function cleanup() {
  console.log('\n[STOPPING] Shutting down College ERP servers...');
  if (backend && !backend.killed) backend.kill();
  if (frontend && !frontend.killed) frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[BACKEND] Backend exited with code ${code}`);
  }
});

frontend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[FRONTEND] Frontend exited with code ${code}`);
  }
});
