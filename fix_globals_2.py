import sys

file_path = r'C:\dev\Fim\apps\web\src\app\globals.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscamos el inicio de la animación original o la parte dañada
start_marker = '.timer-ring circle {'
end_marker = '.gps-button {'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    prefix = content[:start_idx]
    suffix = content[end_idx:]
    
    fixed_middle = """.timer-ring circle {
  fill: none;
  stroke: var(--accent);
  stroke-width: 6;
  stroke-dasharray: 201;
  transition: stroke-dashoffset 1s linear;
}

.timer-text {
  position: absolute;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--accent);
}

.price-display {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--accent);
  letter-spacing: -0.03em;
}

/* ─── Animations ─────────────────────────────────────────────────────────── */
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner { 
  width: 32px; height: 32px; 
  border: 4px solid rgba(255,255,255,0.1); 
  border-top-color: var(--accent); 
  border-radius: 50%; 
  animation: spin 1s linear infinite; 
}

.animated-route-line {
  /* La animación de stroke-dashoffset la manejamos dinámicamente desde JS, aquí ponemos el pulso */
  animation: routePulse 1.5s infinite alternate ease-in-out;
}

@keyframes routePulse {
  0% {
    opacity: 0.6;
    filter: drop-shadow(0 0 2px currentColor);
  }
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 10px currentColor);
  }
}

/* ─── Alerts ─────────────────────────────────────────────────────────────── */
.alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-error   { background: rgba(255, 69, 96, 0.12); color: var(--danger); border: 1px solid rgba(255, 69, 96, 0.2); }
.alert-success { background: rgba(0, 229, 160, 0.12); color: var(--accent); border: 1px solid rgba(0, 229, 160, 0.2); }
.alert-warning { background: rgba(255, 184, 0, 0.12); color: var(--warning); border: 1px solid rgba(255, 184, 0, 0.2); }

/* ─── Floating GPS Button ─────────────────────────────────────────────────── */
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(prefix + fixed_middle + suffix)
    print("Fixed globals.css successfully.")
else:
    print("Could not find markers in globals.css")
