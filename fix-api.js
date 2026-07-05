const fs = require('fs');
const files = [
  'apps/api/src/routes/payments.routes.ts',
  'apps/api/src/routes/admin.ts',
  'apps/api/src/routes/drivers.ts'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  // Handle configMap.x OR config.x OR comfortConfig?.value
  c = c.replace(/parseInt\(([^,]+), 10\)/g, "parseInt(($1).toString().replace(/\\D/g, ''), 10)");
  fs.writeFileSync(f, c);
  console.log('Updated ' + f);
});
