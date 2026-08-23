import React from 'react';

/**
 * Sonic Ring en SVG 3D vectorial de alta fidelidad.
 * Se utiliza como indicador de nivel exclusivo para las tarjetas de Gen 2 en lugar de estrellas.
 */
export function SonicRing({ active, mastered, size = 18, className = '' }) {
  const gradientId = React.useId();
  const goldId = `sonicRingGold-${gradientId}`;
  const glintId = `sonicRingGlint-${gradientId}`;
  const masteredId = `sonicRingMastered-${gradientId}`;
  const inactiveId = `sonicRingInactive-${gradientId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sonic-ring-svg ${active ? 'is-active' : 'is-inactive'} ${mastered ? 'is-mastered' : ''} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      <defs>
        {/* Gradiente dorado 3D para anillo activo */}
        <radialGradient id={goldId} cx="32%" cy="28%" r="70%" fx="28%" fy="24%">
          <stop offset="0%" stopColor="#fffde7" />
          <stop offset="20%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="92%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>

        {/* Brillo especular y reflejo metálico */}
        <linearGradient id={glintId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#fef08a" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#eab308" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#713f12" stopOpacity="0.85" />
        </linearGradient>

        {/* Mastered Super Sonic Gold/Rose Aura Gradient */}
        <radialGradient id={masteredId} cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>

        {/* Anillo inactivo translúcido */}
        <linearGradient id={inactiveId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
        </linearGradient>
      </defs>

      {active ? (
        <g>
          {/* Cuerpo del anillo en 3D */}
          <path
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z"
            fill={mastered ? `url(#${masteredId})` : `url(#${goldId})`}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          />

          {/* Bisel de luz superior izquierdo */}
          <path
            d="M12 2.5C7.2 2.5 3.2 6.1 2.6 10.8c.6-3.8 3.9-6.8 7.9-6.8 4.4 0 8 3.6 8 8 0 1.2-.3 2.3-.7 3.3 2.6-1.5 4.2-4.3 4.2-7.3 0-5-4.3-5.5-10-5.5z"
            fill="#ffffff"
            opacity="0.75"
          />

          {/* Borde exterior e interior para nitidez metálica */}
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke={`url(#${glintId})`}
            strokeWidth="0.8"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="5"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.6"
            fill="none"
          />

          {/* Destello de brillo */}
          <circle
            cx="7.2"
            cy="6.8"
            r="1.2"
            fill="#ffffff"
            opacity="0.95"
          />
        </g>
      ) : (
        /* Anillo inactivo */
        <g>
          <path
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z"
            fill={`url(#${inactiveId})`}
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth="0.8"
          />
        </g>
      )}
    </svg>
  );
}
