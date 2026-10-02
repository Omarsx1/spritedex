import React from 'react';

/**
 * Icono de Calabaza Jack-o'-Lantern estilizado para Fortnitemares.
 * Diseñado con tallado siniestro, ojos triangulares y sonrisa luminosa.
 */
export function PumpkinIcon({ size = 22, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        ...style
      }}
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* Gradiente de piel de calabaza Fortnitemares */}
        <linearGradient id="pumpkinSkinGrad" x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff922b" />
          <stop offset="50%" stopColor="#f76707" />
          <stop offset="100%" stopColor="#d9480f" />
        </linearGradient>

        {/* Resplandor de fuego interior */}
        <linearGradient id="pumpkinGlowGrad" x1="12" y1="8" x2="12" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="100%" stopColor="#ff922b" />
        </linearGradient>

        {/* Tallo */}
        <linearGradient id="pumpkinStemGrad" x1="12" y1="1" x2="14" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#69db7c" />
          <stop offset="100%" stopColor="#2b8a3e" />
        </linearGradient>

        {/* La luz vive dentro: el tallado (pumpkinGlowGrad) es lo que brilla.
            Este halo solo separa la silueta del fondo, asi que va contenido —
            con stdDeviation 1.5 y opacity 0.8 se leia como aura alrededor de
            la calabaza entera, y ademas el glow se recortaba en el borde de
            la region del filtro. */}
        <filter id="pumpkinFireGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.1" floodColor="#ff922b" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Tallo superior curvado */}
      <path
        d="M12 4.5 C11.8 3.2 12.5 2 13.8 1.5 C14.2 1.3 14.5 1.5 14.2 1.9 C13.5 2.8 13.2 3.8 13 4.5 Z"
        fill="url(#pumpkinStemGrad)"
        stroke="#1e3a1e"
        strokeWidth="0.5"
      />

      {/* Cuerpo principal de la calabaza con costillas redondeadas */}
      <g filter="url(#pumpkinFireGlow)">
        {/* Lóbulo exterior izquierdo */}
        <path
          d="M7.5 5 C4.5 5.5 2 8 2 12.5 C2 17.5 4.5 20.5 7.5 21 C8.5 21.2 9 20 8.5 17 C8 14 7 8 7.5 5 Z"
          fill="url(#pumpkinSkinGrad)"
          opacity="0.95"
        />

        {/* Lóbulo exterior derecho */}
        <path
          d="M16.5 5 C19.5 5.5 22 8 22 12.5 C22 17.5 19.5 20.5 16.5 21 C15.5 21.2 15 20 15.5 17 C16 14 17 8 16.5 5 Z"
          fill="url(#pumpkinSkinGrad)"
          opacity="0.95"
        />

        {/* Centro de la calabaza */}
        <ellipse
          cx="12"
          cy="13"
          rx="6.5"
          ry="8"
          fill="url(#pumpkinSkinGrad)"
          stroke="#b03a0a"
          strokeWidth="0.6"
        />
      </g>

      {/* Tallado: Ojos triangulares siniestros */}
      {/* Ojo izquierdo */}
      <polygon
        points="7.2,10.2 10,11.5 8.2,12.5"
        fill="url(#pumpkinGlowGrad)"
        stroke="#451200"
        strokeWidth="0.5"
      />

      {/* Ojo derecho */}
      <polygon
        points="16.8,10.2 14,11.5 15.8,12.5"
        fill="url(#pumpkinGlowGrad)"
        stroke="#451200"
        strokeWidth="0.5"
      />

      {/* Nariz triangular */}
      <polygon
        points="12,12.2 11.2,13.5 12.8,13.5"
        fill="url(#pumpkinGlowGrad)"
      />

      {/* Sonrisa tenebrosa dentada con colmillos */}
      <path
        d="M6.2 14.8
           C7.5 15.5 8.5 16.8 9.5 15.2
           L10.5 16.8
           L12 15.3
           L13.5 16.8
           L14.5 15.2
           C15.5 16.8 16.5 15.5 17.8 14.8
           C16.8 18.2 14.8 19.5 12 19.5
           C9.2 19.5 7.2 18.2 6.2 14.8 Z"
        fill="url(#pumpkinGlowGrad)"
        stroke="#451200"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export default PumpkinIcon;
