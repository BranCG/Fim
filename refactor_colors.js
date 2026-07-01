const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// SVG Fills
content = content.replace(/fill="#ffffff"/gi, 'fill="currentColor"');
content = content.replace(/fill="#191919"/gi, 'fill="var(--text-primary)"');
content = content.replace(/stroke="#191919"/gi, 'stroke="var(--text-primary)"');

// Text Colors (white to text-primary)
content = content.replace(/color:\s*'white'/g, "color: 'var(--text-primary)'");
content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text-primary)'");
content = content.replace(/color:\s*'#ffffff'/gi, "color: 'var(--text-primary)'");

// Backgrounds
// #09090F is the dark background. Replace with var(--bg-primary)
content = content.replace(/background:\s*'#09090F'/g, "background: 'var(--bg-primary)'");
content = content.replace(/backgroundColor:\s*'#09090F'/g, "backgroundColor: 'var(--bg-primary)'");

// rgba(9, 9, 15, x) which is #09090F with transparency
content = content.replace(/rgba\(9,\s*9,\s*15,\s*0\.8\)/g, 'var(--bg-glass)');
content = content.replace(/rgba\(9,9,15,1\)/g, 'var(--bg-primary)');

// rgba(255, 255, 255, 0.5) to text-muted
content = content.replace(/color:\s*'rgba\(255,255,255,0\.5\)'/g, "color: 'var(--text-muted)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.7\)'/g, "color: 'var(--text-secondary)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.8\)'/g, "color: 'var(--text-primary)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.65\)'/g, "color: 'var(--text-muted)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.4\)'/g, "color: 'var(--text-muted)'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('page.tsx colors replaced!');
