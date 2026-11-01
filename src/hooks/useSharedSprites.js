import { useCallback, useEffect, useState } from 'react';
import { recibidosPendientes, resolverEnvio } from '../utils/sharedSprites';

// Envios de espiritus que me hicieron y todavia no acepte. Alimenta el aviso de
// la barra y el bloque "Te compartieron" de Amigos.
export function useSharedSprites() {
  const [recibidos, setRecibidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const filas = await recibidosPendientes();
      setRecibidos(filas);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const filas = await recibidosPendientes();
      if (vivo) {
        setRecibidos(filas);
        setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const resolver = useCallback(async (fila, aceptar) => {
    setRecibidos((previo) => previo.filter((r) => r.id !== fila.id));
    const res = await resolverEnvio(fila.id, aceptar);
    if (!res.ok) {
      // Si la red fallo, la fila vuelve a la lista.
      setRecibidos((previo) => (previo.some((r) => r.id === fila.id) ? previo : [fila, ...previo]));
    }
    return res;
  }, []);

  return { recibidos, cargando, cargar, resolver };
}
