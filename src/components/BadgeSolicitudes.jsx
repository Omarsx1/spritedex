// Indicador de solicitudes pendientes. Estatico a proposito: sin animacion, sin
// transicion y sin will-change — la app prioriza fluidez y esto es solo un dato.
export function BadgeSolicitudes({ n, className = '' }) {
  if (!n) return null;
  return <span className={`solicitudes-badge ${className}`} aria-hidden="true">{n > 9 ? '9+' : n}</span>;
}
