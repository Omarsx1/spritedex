import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../../utils/supabase';
import { ADMIN_AUTH_KEY } from '../../utils/adminAuth';

// La puerta del CMS.
//
// Antes se entraba con una clave escrita aquí mismo ('override2026'), que viajaba en el
// bundle público: cualquiera podía leerla y abrir el panel. Esa clave no protegía datos
// (RLS ya limitaba lo que se veía), pero sí daba por buena una puerta que no lo era.
// Ahora la única entrada es una cuenta real, y además tiene que estar en la lista de
// administradores de la base: el permiso lo comprueba el servidor, no esta pantalla.

export function AdminAuthGate({ onAuthenticated, onExit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSupabaseLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Ingresa correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      if (data?.user) {
        // Tener sesión no basta: hace falta estar en la lista de administradores. Se lee
        // la tabla de la base (RLS solo deja ver tu propia fila) para que el permiso lo
        // decida el servidor. Si no estás, se cierra la sesión que se acaba de abrir.
        const { data: fila, error: errAdmins } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (errAdmins) throw errAdmins;

        if (!fila) {
          await supabase.auth.signOut();
          setErrorMsg('Esta cuenta no tiene acceso al CMS. Un administrador tiene que añadirla en la sección Administradores.');
          return;
        }

        sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({
          mode: 'supabase',
          email: data.user.email,
          authenticatedAt: Date.now()
        }));
        onAuthenticated();
      }
    } catch (err) {
      // Si la tabla todavía no existe, el mensaje de PostgREST no dice nada útil: se
      // explica que falta ejecutar el SQL del panel.
      const sinTabla = err?.code === 'PGRST205' || /could not find the table/i.test(String(err?.message || ''));
      setErrorMsg(sinTabla
        ? 'Falta ejecutar el SQL del panel: la tabla admins todavía no existe en la base.'
        : (err.message || 'Error al iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060714',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Background glow layers */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        borderRadius: '20px',
        padding: '32px 24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            color: '#00F0E8',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '0.05em' }}>
            SPRITEDEX STUDIO
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
            Centro de Control Privado & Gestión de Catálogo
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '9px',
            padding: '10px 12px',
            color: '#f87171',
            fontSize: '0.78rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Forms */}
        {!isSupabaseConfigured ? (
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '0.8rem',
            lineHeight: 1.6
          }}>
            El CMS necesita la nube configurada: sin ella no hay cuentas ni lista de
            administradores con la que comprobar tu acceso.
          </div>
        ) : (
          <form onSubmit={handleSupabaseLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                CORREO DE ADMINISTRADOR
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@spritedex.gg"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(2, 6, 23, 0.8)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(2, 6, 23, 0.8)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
                color: '#060714',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 900,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(0, 240, 255, 0.4)',
                opacity: loading ? 0.7 : 1
              }}
            >
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Exit link */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.76rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Volver a la web pública
          </button>
        </div>
      </div>
    </div>
  );
}
