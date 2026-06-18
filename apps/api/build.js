const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbEnvPath = path.join(__dirname, '../../packages/database/.env');
const dbEnvBackup = path.join(__dirname, '../../packages/database/.env.backup');

let renamed = false;
if (fs.existsSync(dbEnvPath)) {
  try {
    fs.renameSync(dbEnvPath, dbEnvBackup);
    renamed = true;
  } catch (err) {
    console.warn('Warning: Could not temporarily rename packages/database/.env:', err.message);
  }
}

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate --schema=../../packages/database/schema.prisma', { stdio: 'inherit', cwd: __dirname });
  console.log('Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
} finally {
  if (renamed && fs.existsSync(dbEnvBackup)) {
    try {
      fs.renameSync(dbEnvBackup, dbEnvPath);
    } catch (err) {
      console.error('Error: Could not restore packages/database/.env:', err.message);
    }
  }
}
