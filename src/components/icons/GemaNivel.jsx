import React, { useId } from 'react';

/**
 * Gema de nivel de la 3ª generacion. Cada nivel es una piedra distinta, con su
 * corte y su color: rubi talla brillante, esmeralda escalonada, zafiro marquesa,
 * amatista pera y diamante trillon. Lleva degradado y destello para que se lea
 * como joya a 16 px, no como una mancha plana.
 */
const PALETAS = {
  1: { luz: '#ff9aa6', medio: '#e2485f', sombra: '#7d0c1f' },
  2: { luz: '#8ff0c8', medio: '#23b381', sombra: '#0a5c3c' },
  3: { luz: '#a8c6ff', medio: '#4a86ff', sombra: '#122f8a' },
  4: { luz: '#e0c2ff', medio: '#b070f5', sombra: '#521388' },
  5: { luz: '#ffffff', medio: '#d7ecff', sombra: '#6f9cbb' }
};

const FORMAS = {
  1: (
    <>
      <path d="M12 4.6 18 8.2v7.6L12 19.4 6 15.8V8.2z" />
      <path d="M9 8.2h6l2 2.6-2 2.6H9l-2-2.6z" fill="#ffffff" fillOpacity="0.42" stroke="none" />
      <circle cx="9.4" cy="7.8" r="0.9" fill="#ffffff" fillOpacity="0.9" stroke="none" />
    </>
  ),
  2: (
    <>
      <path d="M8.6 5h6.8l3 3.6v6.8l-3 3.6H8.6l-3-3.6V8.6z" />
      <rect x="8.4" y="8.8" width="7.2" height="6.4" fill="#ffffff" fillOpacity="0.35" stroke="none" />
      <circle cx="9.6" cy="7.4" r="0.85" fill="#ffffff" fillOpacity="0.9" stroke="none" />
    </>
  ),
  3: (
    <>
      <path d="M12 3.8c3.6 3.4 3.6 13 0 16.4-3.6-3.4-3.6-13 0-16.4Z" />
      <path d="M12 6.2v11.6" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.1" fill="none" />
      <circle cx="10.6" cy="7.4" r="0.8" fill="#ffffff" fillOpacity="0.9" stroke="none" />
    </>
  ),
  4: (
    <>
      <path d="M12 3.8a4.8 4.8 0 0 1 4.8 4.8c0 2.7-2.2 4.1-3.3 6.5-.5.9-.9 2.2-1.5 4.3-.6-2.1-1-3.4-1.5-4.3C9.4 12.7 7.2 11.3 7.2 8.6A4.8 4.8 0 0 1 12 3.8Z" />
      <ellipse cx="12" cy="8.4" rx="2.6" ry="1.9" fill="#ffffff" fillOpacity="0.4" stroke="none" />
      <circle cx="10" cy="6.8" r="0.85" fill="#ffffff" fillOpacity="0.9" stroke="none" />
    </>
  ),
  5: (
    <>
      <path d="M12 4.4 19.8 19H4.2z" />
      <path d="M12 9.4 16.2 17H7.8z" fill="#ffffff" fillOpacity="0.55" stroke="none" />
      <circle cx="10.4" cy="8.6" r="0.8" fill="#ffffff" fillOpacity="0.95" stroke="none" />
    </>
  )
};

export function GemaNivel({ nivel = 1, size = 16, className = '', ...props }) {
  const bruto = useId();
  const id = 'gema-' + bruto.replace(/:/g, '');
  const paleta = PALETAS[nivel] || PALETAS[1];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={paleta.luz} />
          <stop offset="0.55" stopColor={paleta.medio} />
          <stop offset="1" stopColor={paleta.sombra} />
        </linearGradient>
      </defs>
      <g
        fill={'url(#' + id + ')'}
        stroke={paleta.sombra}
        strokeWidth="1.1"
        strokeLinejoin="round"
      >
        {FORMAS[nivel] || FORMAS[1]}
      </g>
    </svg>
  );
}

export default GemaNivel;
