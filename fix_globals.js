const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/app/globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// The file got duplicated content in :root due to a bad replace tool execution.
// Let's replace the whole :root to light theme section with a clean version.

const correctHeader = `/* ─── Fim Design System ─────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Satisfy&family=Dancing+Script:wght@700&family=Caveat:wght@700&display=swap');
@import 'leaflet/dist/leaflet.css';

:root {
  /* Brand Colors */
  --accent:         #00E5A0;
  --accent-dark:    #00B37E;
  --accent-light:   #00E5A020;
  --accent-glow:    0 0 24px #00E5A060;

  /* Backgrounds */
  --bg-primary:     #09090F;
  --bg-secondary:   #13131E;
  --bg-card:        #1A1A28;
  --bg-card-hover:  #1F1F32;
  --bg-glass:       rgba(26, 26, 40, 0.85);

  /* Text */
  --text-primary:   #FFFFFF;
  --text-secondary: #C0C0D8;
  --text-muted:     #7B7B9A;
  --text-accent:    #00E5A0;
  --text-inverse:   #09090F;

  /* Borders */
  --border:         rgba(255, 255, 255, 0.08);
  --border-accent:  rgba(0, 229, 160, 0.3);

  /* Status Colors */
  --success:        #00E5A0;
  --warning:        #FFB800;
  --danger:         #FF4560;
  --info:           #4FC3F7;

  /* Typography */
  --font-sans:      'Outfit', 'Inter', system-ui, -apple-system, sans-serif;

  /* Spacing */
  --radius-sm:      8px;
  --radius:         12px;
  --radius-lg:      16px;
  --radius-xl:      24px;
  --radius-full:    999px;

  /* Shadows */
  --shadow-sm:      0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow:         0 4px 24px rgba(0, 0, 0, 0.5);
  --shadow-lg:      0 8px 48px rgba(0, 0, 0, 0.6);
  --shadow-accent:  0 4px 24px rgba(0, 229, 160, 0.2);

  /* Transitions */
  --transition:     all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme='light'] {
  /* Backgrounds */
  --bg-primary:     #F3F4F6;
  --bg-secondary:   #E5E7EB; /* Gris más oscuro para dar contraste a las tarjetas */
  --bg-card:        #FFFFFF; /* Tarjetas blancas sobre fondo gris */
  --bg-card-hover:  #F9FAFB;
  --bg-glass:       rgba(255, 255, 255, 0.85);

  /* Text */
  --text-primary:   #111827;
  --text-secondary: #4B5563;
  --text-muted:     #6B7280;
  --text-accent:    #00B37E;
  --text-inverse:   #09090F;

  /* Borders */
  --border:         rgba(0, 0, 0, 0.15); /* Bordes grises más fuertes para separar tarjetas */
  --border-accent:  rgba(0, 229, 160, 0.5);
  
  /* Shadows */
  --shadow-sm:      0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow:         0 4px 24px rgba(0, 0, 0, 0.08);
  --shadow-lg:      0 8px 48px rgba(0, 0, 0, 0.12);
  --shadow-accent:  0 4px 24px rgba(0, 229, 160, 0.3);
}

/* ─── Reset ──────────────────────────────────────────────────────────────── */`;

// Replace everything from the start to the Reset comment
content = content.replace(/^[\s\S]*?\/\*\s*───\s*Reset\s*───.*?\*\//, correctHeader + '\n/* ─── Reset ──────────────────────────────────────────────────────────────── */');

fs.writeFileSync(filePath, content, 'utf8');
console.log('globals.css fixed!');
