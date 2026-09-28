import React, { useEffect, useRef } from 'react';

// Una sola implementacion de modal para el proyecto. Reproduce el mismo markup que
// ya usaban las nueve modales (para que el CSS siga aplicando igual) y concentra lo
// que estaba repetido en cada archivo: el cierre con Escape, el cierre al tocar el
// fondo y la proteccion contra el toque que abre la modal y la cierra al instante.
//
// Uso:
//   <Modal onClose={cerrar} className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
//     ...contenido...
//   </Modal>
export function Modal({
  onClose,
  children,
  className = '',
  overlayClassName = '',
  style,
  overlayStyle,
  innerRef,
  afterCard,
  closeOnBackdrop = true,
  closeOnEscape = true,
  guardMs = 400
}) {
  const abiertaEnRef = useRef(Date.now());

  useEffect(() => {
    if (!closeOnEscape || !onClose) return undefined;
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, [closeOnEscape, onClose]);

  const alTocarFondo = (evento) => {
    if (!closeOnBackdrop || !onClose) return;
    if (evento.target !== evento.currentTarget) return;
    if (Date.now() - abiertaEnRef.current < guardMs) return;
    onClose();
  };

  return (
    <div className={`modal-overlay ${overlayClassName}`.trim()} style={overlayStyle} onClick={alTocarFondo}>
      <div ref={innerRef} className={className} style={style} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
      {/* Contenido que debe vivir fuera de la tarjeta: si la tarjeta tiene transform,
          un position fixed dentro de ella se ancla a la tarjeta y no a la pantalla. */}
      {afterCard}
    </div>
  );
}
