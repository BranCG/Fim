const fs = require('fs');
const files = [
  'apps/web/src/app/(auth)/register/page.tsx',
  'apps/web/src/app/driver/page.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/parseInt\((config\.membership_[a-z_]+ \|\| '\d+'), 10\)/g, "parseInt(($1).toString().replace(/\\D/g, ''), 10)");
  fs.writeFileSync(f, c);
  console.log('Updated ' + f);
});
