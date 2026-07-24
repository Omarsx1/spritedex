import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicSpritesDir = path.join(__dirname, '../public/sprites');
if (!fs.existsSync(publicSpritesDir)) {
  fs.mkdirSync(publicSpritesDir, { recursive: true });
}

// Generate stylized SVG sprite renders matching Fortnite 3D Sprites
function createSvgSprite(name, variant, primaryColor, secondaryColor, accentColor, shape = 'cute') {
  let auraEffect = '';
  if (variant === 'Gold') {
    auraEffect = `<circle cx="100" cy="100" r="85" fill="url(#goldGlow)" opacity="0.4"/>`;
  } else if (variant === 'Galaxy') {
    auraEffect = `
      <circle cx="100" cy="100" r="85" fill="url(#galaxyGlow)" opacity="0.5"/>
      <circle cx="50" cy="50" r="2" fill="#fff"/>
      <circle cx="150" cy="60" r="3" fill="#a855f7"/>
      <circle cx="140" cy="140" r="2" fill="#38bdf8"/>
      <circle cx="60" cy="130" r="3" fill="#f472b6"/>
    `;
  } else if (variant === 'Holofoil') {
    auraEffect = `<circle cx="100" cy="100" r="85" fill="url(#holoGlow)" opacity="0.6"/>`;
  } else if (variant === 'Cube') {
    auraEffect = `<rect x="25" y="25" width="150" height="150" rx="20" fill="none" stroke="#d8b4fe" stroke-width="3" opacity="0.5"/>`;
  }

  // Ears / Batman horns if Batman
  let headExtra = '';
  if (name.toLowerCase().includes('batman')) {
    headExtra = `
      <!-- Bat ears -->
      <path d="M 55 60 L 45 15 L 75 45 Z" fill="${primaryColor}" />
      <path d="M 145 60 L 155 15 L 125 45 Z" fill="${primaryColor}" />
      <!-- Bat Mask -->
      <path d="M 50 65 Q 100 85 150 65 L 145 110 Q 100 125 55 110 Z" fill="#1e1e1e" opacity="0.9"/>
      <!-- Belt -->
      <rect x="65" y="145" width="70" height="12" rx="4" fill="#f59e0b"/>
      <rect x="92" y="143" width="16" height="16" rx="3" fill="#eab308" stroke="#78350f" stroke-width="1.5"/>
    `;
  } else if (name.toLowerCase().includes('peely')) {
    headExtra = `
      <path d="M 95 25 Q 100 10 105 25 Z" fill="#84cc16"/>
    `;
  } else if (name.toLowerCase().includes('earth')) {
    headExtra = `
      <!-- Wood / Tree texture -->
      <path d="M 75 40 L 70 20 L 85 35 Z" fill="#15803d"/>
      <path d="M 115 40 L 125 20 L 130 38 Z" fill="#166534"/>
    `;
  } else if (name.toLowerCase().includes('fire')) {
    headExtra = `
      <!-- Flame top -->
      <path d="M 80 45 Q 100 10 120 45 Q 100 30 80 45 Z" fill="#ef4444"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <!-- Gradients -->
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>

    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#eab308" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="galaxyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>

    <linearGradient id="holoGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="25%" stop-color="#eab308"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="75%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  ${auraEffect}

  <!-- Shadow -->
  <ellipse cx="100" cy="180" rx="45" ry="10" fill="#000000" opacity="0.3"/>

  <!-- Sprite Body (Cute Rounded Capsule Body) -->
  <g filter="url(#shadow)">
    <rect x="55" y="45" width="90" height="125" rx="40" fill="url(#bodyGrad)" stroke="${accentColor}" stroke-width="3"/>
    ${headExtra}

    <!-- Cute Eyes -->
    <ellipse cx="80" cy="90" rx="7" ry="9" fill="#0f172a"/>
    <ellipse cx="120" cy="90" rx="7" ry="9" fill="#0f172a"/>
    
    <!-- Eye Highlights -->
    <circle cx="78" cy="87" r="3" fill="#ffffff"/>
    <circle cx="118" cy="87" r="3" fill="#ffffff"/>

    <!-- Cute Cheeks -->
    <ellipse cx="70" cy="102" rx="6" ry="3" fill="#f43f5e" opacity="0.4"/>
    <ellipse cx="130" cy="102" rx="6" ry="3" fill="#f43f5e" opacity="0.4"/>

    <!-- Mouth -->
    <path d="M 92 104 Q 100 112 108 104" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>

    <!-- Tiny Feet -->
    <rect x="70" y="165" width="16" height="12" rx="6" fill="${secondaryColor}"/>
    <rect x="114" y="165" width="16" height="12" rx="6" fill="${secondaryColor}"/>
  </g>
</svg>`;
}

const spriteDefinitions = [
  // Batman Family
  { id: 'batman_base', name: 'Batman', variant: 'Base', p: '#475569', s: '#1e293b', a: '#94a3b8' },
  { id: 'batman_gold', name: 'Batman', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'batman_gummy', name: 'Batman', variant: 'Gummy', p: '#f87171', s: '#4ade80', a: '#ef4444' },
  { id: 'batman_galaxy', name: 'Batman', variant: 'Galaxy', p: '#c084fc', s: '#1e1b4b', a: '#a855f7' },
  { id: 'batman_holofoil', name: 'Batman', variant: 'Holofoil', p: '#38bdf8', s: '#ec4899', a: '#e0e7ff' },
  { id: 'batman_cube', name: 'Batman', variant: 'Cube', p: '#a855f7', s: '#3b0764', a: '#d8b4fe' },
  { id: 'batman_gem', name: 'Batman', variant: 'Gem', p: '#22d3ee', s: '#0e7490', a: '#67e8f9' },
  { id: 'batman_quack', name: 'Batman', variant: 'Quack', p: '#fde047', s: '#ca8a04', a: '#facc15' },

  // Water Family
  { id: 'water_base', name: 'Water', variant: 'Base', p: '#38bdf8', s: '#0284c7', a: '#7dd3fc' },
  { id: 'water_gold', name: 'Water', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'water_gummy', name: 'Water', variant: 'Gummy', p: '#f472b6', s: '#38bdf8', a: '#fb7185' },
  { id: 'water_galaxy', name: 'Water', variant: 'Galaxy', p: '#818cf8', s: '#311b92', a: '#c084fc' },
  { id: 'water_holofoil', name: 'Water', variant: 'Holofoil', p: '#34d399', s: '#f472b6', a: '#a7f3d0' },
  { id: 'water_cube', name: 'Water', variant: 'Cube', p: '#c084fc', s: '#4c1d95', a: '#e9d5ff' },

  // Earth Family
  { id: 'earth_base', name: 'Earth', variant: 'Base', p: '#4ade80', s: '#15803d', a: '#86efac' },
  { id: 'earth_gold', name: 'Earth', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'earth_gummy', name: 'Earth', variant: 'Gummy', p: '#fb923c', s: '#22c55e', a: '#fdba74' },
  { id: 'earth_galaxy', name: 'Earth', variant: 'Galaxy', p: '#a855f7', s: '#1e1b4b', a: '#e9d5ff' },
  { id: 'earth_holofoil', name: 'Earth', variant: 'Holofoil', p: '#f472b6', s: '#06b6d4', a: '#fbcfe8' },
  { id: 'earth_cube', name: 'Earth', variant: 'Cube', p: '#a855f7', s: '#3b0764', a: '#d8b4fe' },

  // Fire Family
  { id: 'fire_base', name: 'Fire', variant: 'Base', p: '#fb923c', s: '#c2410c', a: '#fed7aa' },
  { id: 'fire_gold', name: 'Fire', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'fire_gummy', name: 'Fire', variant: 'Gummy', p: '#f87171', s: '#fb923c', a: '#fca5a5' },
  { id: 'fire_galaxy', name: 'Fire', variant: 'Galaxy', p: '#c084fc', s: '#431407', a: '#e9d5ff' },
  { id: 'fire_holofoil', name: 'Fire', variant: 'Holofoil', p: '#f43f5e', s: '#eab308', a: '#fecdd3' },

  // Slime Family
  { id: 'slime_base', name: 'Slime', variant: 'Base', p: '#a3e635', s: '#4d7c0f', a: '#bef264' },
  { id: 'slime_gold', name: 'Slime', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'slime_gummy', name: 'Slime', variant: 'Gummy', p: '#ec4899', s: '#10b981', a: '#f472b6' },
  { id: 'slime_galaxy', name: 'Slime', variant: 'Galaxy', p: '#818cf8', s: '#1e1b4b', a: '#c084fc' },
  { id: 'slime_holofoil', name: 'Slime', variant: 'Holofoil', p: '#06b6d4', s: '#ec4899', a: '#67e8f9' },

  // Peely Family
  { id: 'peely_base', name: 'Peely', variant: 'Base', p: '#fde047', s: '#ca8a04', a: '#fef08a' },
  { id: 'peely_gold', name: 'Peely', variant: 'Gold', p: '#fef08a', s: '#854d0e', a: '#facc15' },
  { id: 'peely_gummy', name: 'Peely', variant: 'Gummy', p: '#f87171', s: '#eab308', a: '#fca5a5' },
  { id: 'peely_galaxy', name: 'Peely', variant: 'Galaxy', p: '#c084fc', s: '#1e1b4b', a: '#e9d5ff' },
  { id: 'peely_holofoil', name: 'Peely', variant: 'Holofoil', p: '#38bdf8', s: '#ec4899', a: '#7dd3fc' },

  // Meowscles Family
  { id: 'meowscles_base', name: 'Meowscles', variant: 'Base', p: '#94a3b8', s: '#334155', a: '#cbd5e1' },
  { id: 'meowscles_gold', name: 'Meowscles', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'meowscles_gummy', name: 'Meowscles', variant: 'Gummy', p: '#f472b6', s: '#38bdf8', a: '#fbcfe8' },
  { id: 'meowscles_galaxy', name: 'Meowscles', variant: 'Galaxy', p: '#a855f7', s: '#1e1b4b', a: '#e9d5ff' },
  { id: 'meowscles_holofoil', name: 'Meowscles', variant: 'Holofoil', p: '#34d399', s: '#ec4899', a: '#a7f3d0' },

  // Fishstick Family
  { id: 'fishstick_base', name: 'Fishstick', variant: 'Base', p: '#fb923c', s: '#9a3412', a: '#fdba74' },
  { id: 'fishstick_gold', name: 'Fishstick', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'fishstick_gummy', name: 'Fishstick', variant: 'Gummy', p: '#f87171', s: '#22c55e', a: '#fca5a5' },
  { id: 'fishstick_galaxy', name: 'Fishstick', variant: 'Galaxy', p: '#818cf8', s: '#311b92', a: '#c084fc' },

  // Drift Family
  { id: 'drift_base', name: 'Drift', variant: 'Base', p: '#f472b6', s: '#be185d', a: '#fbcfe8' },
  { id: 'drift_gold', name: 'Drift', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'drift_gummy', name: 'Drift', variant: 'Gummy', p: '#a855f7', s: '#ec4899', a: '#e9d5ff' },
  { id: 'drift_galaxy', name: 'Drift', variant: 'Galaxy', p: '#38bdf8', s: '#1e1b4b', a: '#7dd3fc' },
  { id: 'drift_holofoil', name: 'Drift', variant: 'Holofoil', p: '#f43f5e', s: '#34d399', a: '#fecdd3' },

  // Zero Point Family
  { id: 'zero_point_base', name: 'Zero Point', variant: 'Base', p: '#38bdf8', s: '#1e1b4b', a: '#7dd3fc' },
  { id: 'zero_point_gold', name: 'Zero Point', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'zero_point_galaxy', name: 'Zero Point', variant: 'Galaxy', p: '#c084fc', s: '#0f172a', a: '#e9d5ff' },
  { id: 'zero_point_holofoil', name: 'Zero Point', variant: 'Holofoil', p: '#ec4899', s: '#06b6d4', a: '#fbcfe8' },

  // Pollo Family
  { id: 'pollo_base', name: 'Pollo', variant: 'Base', p: '#fde047', s: '#ea580c', a: '#fef08a' },
  { id: 'pollo_gold', name: 'Pollo', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'pollo_gummy', name: 'Pollo', variant: 'Gummy', p: '#f87171', s: '#eab308', a: '#fca5a5' },
  { id: 'pollo_galaxy', name: 'Pollo', variant: 'Galaxy', p: '#a855f7', s: '#1e1b4b', a: '#e9d5ff' },

  // Cube Kevin Family
  { id: 'cube_kevin_base', name: 'Cube Kevin', variant: 'Base', p: '#a855f7', s: '#3b0764', a: '#d8b4fe' },
  { id: 'cube_kevin_gold', name: 'Cube Kevin', variant: 'Gold', p: '#fef08a', s: '#ca8a04', a: '#facc15' },
  { id: 'cube_kevin_galaxy', name: 'Cube Kevin', variant: 'Galaxy', p: '#818cf8', s: '#1e1b4b', a: '#c084fc' },
  { id: 'cube_kevin_holofoil', name: 'Cube Kevin', variant: 'Holofoil', p: '#f43f5e', s: '#06b6d4', a: '#fecdd3' }
];

console.log(`Generating ${spriteDefinitions.length} SVG sprite assets in public/sprites/...`);

spriteDefinitions.forEach((s) => {
  const svgContent = createSvgSprite(s.name, s.variant, s.p, s.s, s.a);
  const filePath = path.join(publicSpritesDir, `${s.id}.svg`);
  fs.writeFileSync(filePath, svgContent);
});

console.log('✅ All sprite image assets generated in public/sprites/!');
