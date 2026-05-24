const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;

const services = [
  {
    name: 'api',
    command: 'npx',
    args: ['ts-node-dev', '--respawn', '--transpile-only', 'src/index.ts'],
    cwd: path.join(rootDir, 'apps', 'api')
  },
  {
    name: 'web',
    command: 'npx',
    args: ['next', 'dev', '-p', '3000'],
    cwd: path.join(rootDir, 'apps', 'web')
  },
  {
    name: 'admin',
    command: 'npx',
    args: ['next', 'dev', '-p', '3002'],
    cwd: path.join(rootDir, 'apps', 'admin')
  }
];

console.log('🚀 starting Fim dev servers via custom runner...');

services.forEach(service => {
  const processName = `[${service.name.toUpperCase()}]`;
  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${processName} ${data.toString()}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${processName} ERR: ${data.toString()}`);
  });

  proc.on('close', (code) => {
    console.log(`${processName} exited with code ${code}`);
  });
});
