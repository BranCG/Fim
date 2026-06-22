const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/app/globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Replace specific background and colors to use CSS variables
content = content.replace(/\.main-content\s*\{\s*[^}]*background:\s*#09090F;[^}]*\}/g, (match) => {
  return match.replace(/background:\s*#09090F;/g, "background: var(--bg-primary);");
});

content = content.replace(/\.gps-button\s*\{\s*([\s\S]*?)background:\s*#131320;/g, '.gps-button {\n$1background: var(--bg-card);');

content = content.replace(/\.upload-area img\s*\{\s*([\s\S]*?)background:\s*#0d0d16;/g, '.upload-area img {\n$1background: var(--bg-secondary);');

content = content.replace(/\.step\.active \.step-number\s*\{\s*([\s\S]*?)color:\s*#09090F;/g, ".step.active .step-number {\n$1color: var(--text-inverse, #09090F);");

// Create the text-inverse variable in the root and light theme
content = content.replace(/--text-accent:\s*#00E5A0;/g, "--text-accent:    #00E5A0;\n  --text-inverse:   #09090F;");
content = content.replace(/--text-accent:\s*#00B37E;/g, "--text-accent:    #00B37E;\n  --text-inverse:   #09090F;");

fs.writeFileSync(filePath, content, 'utf8');
console.log('globals.css colors replaced!');
