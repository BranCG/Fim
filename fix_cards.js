const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the section for the cards
const startMarker = '{/* ── PLAN BLACK ────────────────────────────────────────── */}';
const endMarker = '{/* Calculadora de Pérdida */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  let cardsSection = content.substring(startIndex, endIndex);

  // Restore light text colors inside the dark cards
  cardsSection = cardsSection.replace(/color:\s*'var\(--text-muted\)'/g, "color: 'rgba(255,255,255,0.5)'");
  cardsSection = cardsSection.replace(/color:\s*'var\(--text-secondary\)'/g, "color: 'rgba(255,255,255,0.7)'");
  cardsSection = cardsSection.replace(/color:\s*'var\(--text-primary\)'/g, "color: 'white'");

  // Replace the section back into the file
  content = content.substring(0, startIndex) + cardsSection + content.substring(endIndex);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Cards colors restored to white/light!');
} else {
  console.log('Could not find markers');
}
