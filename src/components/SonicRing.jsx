import React, { useState, useEffect, useRef } from 'react';

/**
 * Sonic Ring en SVG 3D vectorial de alta fidelidad.
 * 100% geométricamente circular con círculos concéntricos matemáticos perfectos.
 * Giro de moneda 3D sobre su eje vertical (como una moneda girando en una mesa).
 */
export function SonicRing({ active, mastered, size = 18, className = '', isSpinning = false }) {
  const gradientId = React.useId();
  const goldId = `sonicRingGold-${gradientId}`;
  const rimId = `sonicRingRim-${gradientId}`;
  const masteredId = `sonicRingMastered-${gradientId}`;
  const inactiveId = `sonicRingInactive-${gradientId}`;

  const [spinning, setSpinning] = useState(false);
  const prevActiveRef = useRef(active);

  useEffect(() => {
    if (active !== prevActiveRef.current) {
      prevActiveRef.current = active;
      setSpinning(true);
      const timer = setTimeout(() => setSpinning(false), 600);
      return () => clearTimeout(timer);
    }
  }, [active]);

  const spinClass = (spinning || isSpinning) ? 'sonic-ring--spinning' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sonic-ring-svg ${active ? 'is-active' : 'is-inactive'} ${mastered ? 'is-mastered' : ''} ${spinClass} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Gradiente dorado 3D simétrico para anillo activo */}
        <radialGradient id={goldId} cx="36%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#fff9c4" />
          <stop offset="22%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#eab308" />
          <stop offset="85%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>

        {/* Gradiente de bisel metálico concéntrico */}
        <linearGradient id={rimId} x1="20%" y1="15%" x2="80%" y2="85%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#fef08a" stopOpacity="0.5" />
          <stop offset="75%" stopColor="#eab308" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#713f12" stopOpacity="0.8" />
        </linearGradient>

        {/* Mastered Super Sonic Gold/Rose Gradient */}
        <radialGradient id={masteredId} cx="36%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="90%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#881337" />
        </radialGradient>

        {/* Anillo inactivo translúcido perfectamente redondo */}
        <linearGradient id={inactiveId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.06)" />
        </linearGradient>
      </defs>

      {active ? (
        <g>
          {/* Anillo base 100% perfectamente circular usando stroke concéntrico */}
          <circle
            cx="12"
            cy="12"
            r="8.2"
            stroke={mastered ? `url(#${masteredId})` : `url(#${goldId})`}
            strokeWidth="3.8"
            fill="none"
          />

          {/* Borde exterior e interior de alta definición para nitidez metálica */}
          <circle
            cx="12"
            cy="12"
            r="10.1"
            stroke={`url(#${rimId})`}
            strokeWidth="0.75"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="6.3"
            stroke="rgba(0, 0, 0, 0.35)"
            strokeWidth="0.7"
            fill="none"
          />

          {/* Arco de brillo sutil simétrico en la curvatura superior */}
          <path
            d="M 6.8 12 A 5.2 5.2 0 0 1 12 6.8"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />

          {/* Micro destello especular */}
          <circle
            cx="7.6"
            cy="7.6"
            r="0.9"
            fill="#ffffff"
            opacity="0.9"
          />
        </g>
      ) : (
        /* Anillo inactivo 100% concéntrico */
        <g>
          <circle
            cx="12"
            cy="12"
            r="8.2"
            stroke={`url(#${inactiveId})`}
            strokeWidth="3.8"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="10.1"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="0.75"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="6.3"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="0.7"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
