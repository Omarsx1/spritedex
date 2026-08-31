import React, { useId, forwardRef } from 'react';

/**
 * Liquid Gooey Provider & Components
 * Basado en la arquitectura oficial de Jakub Antalik (Liquid Gooey)
 * Genera una capa de silueta liquida mediante filtros SVG de alto contraste (feGaussianBlur + feColorMatrix)
 * garantizando que el contenido hijo (texto, iconos, inputs) se mantenga 100% nitido.
 */

export const Liquid = forwardRef(function Liquid({
  blur = 6,
  contrast = 18,
  fill = 'transparent',
  shadow = '0 4px 20px rgba(0,0,0,0.3)',
  className = '',
  style = {},
  children,
  ...props
}, ref) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const filterId = `liquid-gooey-${id}`;

  return (
    <div
      ref={ref}
      className={`liquid-gooey-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        ...style
      }}
      {...props}
    >
      {/* SVG Gooey Filter Definition */}
      <svg
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          pointerEvents: 'none',
          visibility: 'hidden'
        }}
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} -9`}
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Silhouette Liquid Layer */}
      <div
        className="liquid-gooey-silhouette"
        style={{
          position: 'absolute',
          inset: 0,
          filter: `url(#${filterId})`,
          pointerEvents: 'none',
          zIndex: 0
        }}
        aria-hidden="true"
      />

      {/* Crisp UI Content Layer (Icons, Text, Inputs) */}
      <div
        className="liquid-gooey-content"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {children}
      </div>
    </div>
  );
});

export function LiquidItem({
  x = 0,
  y = 0,
  scale = 1,
  opacity = 1,
  transition = 'bouncy',
  delay = 0,
  className = '',
  style = {},
  children,
  ...props
}) {
  const transitionTiming = transition === 'bouncy'
    ? 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

  return (
    <div
      className={`liquid-item ${className}`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity,
        transition: transitionTiming,
        transitionDelay: `${delay}ms`,
        willChange: 'transform, opacity',
        display: 'inline-flex',
        alignItems: 'center',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

Liquid.Item = LiquidItem;
