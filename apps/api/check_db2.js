const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/DATABASE_URL="(.*?)"/);
  if (!match) {
    console.error("No DATABASE_URL found in .env");
    return;
  }
  const originalUrl = match[1];
  
  console.log("--- Testing Original Pooler URL via Prisma ---");
  try {
    execSync(`npx prisma db pull --url="${originalUrl}"`, { stdio: 'pipe' });
    console.log("Success with original URL!");
  } catch (e) {
    console.error("Failed original URL:");
    console.error(e.stderr ? e.stderr.toString() : e.message);
  }

  const pwdMatch = originalUrl.match(/:([^:@]+)@/);
  if (pwdMatch) {
    const pwd = pwdMatch[1];
    const directUrl = `postgresql://postgres:${pwd}@db.bqlrtguyggdthbjxtics.supabase.co:5432/postgres`;
    console.log("\n--- Testing Direct Connection URL via Prisma ---");
    try {
      execSync(`npx prisma db pull --url="${directUrl}"`, { stdio: 'pipe' });
      console.log("Success with Direct URL!");
    } catch (e) {
      console.error("Failed Direct URL:");
      console.error(e.stderr ? e.stderr.toString() : e.message);
    }
  }
}

main();
