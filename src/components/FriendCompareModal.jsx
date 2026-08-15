import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Copy, Check, ArrowDownLeft, ArrowUpRight, Handshake, Upload, ExternalLink, Radio, Zap, RefreshCw } from 'lucide-react';
import { ALL_SPRITES, getSpriteCardStyle } from '../data/spritesData';
import { generateShareableLink, decodeCollectionState } from '../utils/shareLink';
import { generatePermanentFriendUrl, normalizeFriendCode } from '../utils/friendCode';
import { sounds } from '../utils/audio';

export function FriendCompareModal({
  userState,
  friendState,
  isLiveConnected,
  connectedFriendCode,
  myFriendCode,
  onConnectFriendCode,
  onDisconnectFriend,
  onLoadFriendState,
  onToggleOwned,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('friendToMe'); // 'friendToMe' | 'meToFriend' | 'common'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const fileInputRef = useRef(null);

  const permanentFriendUrl = generatePermanentFriendUrl(myFriendCode || 'SDEX-0000');

  const handleCopyCode = () => {
    sounds.playBeep();
    navigator.clipboard.writeText(myFriendCode || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyPermanentLink = () => {
    sounds.playBeep();
    navigator.clipboard.writeText(permanentFriendUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleConnectFriend = async () => {
    if (!friendInput.trim()) return;
    sounds.playBeep();
    setIsConnecting(true);

    let raw = friendInput.trim();

    // 1. If user entered a Friend Code or URL with ?code=
    if (onConnectFriendCode && (raw.includes('code=') || raw.toUpperCase().startsWith('SDEX-') || !raw.includes('friend='))) {
      const code = normalizeFriendCode(raw);
      const success = await onConnectFriendCode(code);
      setIsConnecting(false);
      if (success) {
        setFriendInput('');
        return;
      }
    }

    // 2. Fallback: Legacy encoded state / URL with ?friend=
    let code = raw;
    if (code.includes('friend=')) {
      const match = code.match(/[?&]friend=([^&#\s]+)/);
      if (match) {
        code = decodeURIComponent(match[1]);
      }
    }

    const decoded = decodeCollectionState(code);
    setIsConnecting(false);
    if (Object.keys(decoded).length > 0) {
      if (onLoadFriendState) onLoadFriendState(decoded, 'ENLACE');
      setFriendInput('');
    } else {
      alert('No se pudo encontrar la colección del amigo. Verifica el código (ej: SDEX-XXXX) o enlace.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (typeof json === 'object') {
          sounds.playBeep();
          if (onLoadFriendState) onLoadFriendState(json, 'ARCHIVO');
        }
      } catch (err) {
        alert('El archivo no tiene un formato de colección válido.');
      }
    };
    reader.readAsText(file);
  };

  const currentFriendState = friendState || {};
  const hasFriendData = Object.keys(currentFriendState).length > 0;

  // Sprites friend can lend to me (Friend has it, I don't)
  const friendToMeList = ALL_SPRITES.filter((s) => {
    const friendHas = currentFriendState[s.id]?.owned;
    const iHave = userState[s.id]?.owned;
    return friendHas && !iHave;
  });

  // Sprites I can lend to friend (I have it, friend doesn't)
  const meToFriendList = ALL_SPRITES.filter((s) => {
    const friendHas = currentFriendState[s.id]?.owned;
    const iHave = userState[s.id]?.owned;
    return iHave && !friendHas;
  });

  // Sprites both own
  const commonList = ALL_SPRITES.filter((s) => {
    const friendHas = currentFriendState[s.id]?.owned;
    const iHave = userState[s.id]?.owned;
    return iHave && friendHas;
  });

  const activeList = activeTab === 'friendToMe' ? friendToMeList : activeTab === 'meToFriend' ? meToFriendList : commonList;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Planificador de Intercambios en Vivo
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
              Sincroniza en tiempo real con tu amigo en Fortnite mediante tu Código de Amigo permanente.
            </p>
          </div>
        </div>

        {/* Top Actions: My Friend Code vs Connect to Friend */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* 1. Tu Código de Amigo Permanente */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                ⭐ Tu Código de Amigo Permanente
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.15rem',
                    fontWeight: 900,
                    color: '#fff',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  {myFriendCode || 'SDEX-????'}
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: copiedCode ? '#10b981' : '#0284c7',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <button
                onClick={handleCopyPermanentLink}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: copiedLink ? '#10b981' : 'rgba(255,255,255,0.08)',
                  color: copiedLink ? '#fff' : '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copiedLink ? <Check size={13} /> : <Zap size={13} />}
                <span>{copiedLink ? '¡Enlace Permanente Copiado!' : 'Copiar Enlace Directo'}</span>
              </button>
            </div>

            {/* 2. Conectar con Amigo en Tiempo Real */}
            <div
              style={{
                background: isLiveConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(168, 85, 247, 0.08)',
                border: `1px solid ${isLiveConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.25)'}`,
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isLiveConnected ? '#10b981' : '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isLiveConnected ? '🟢 Conectado en Tiempo Real' : '🤝 Conectar con un Amigo'}
                </div>
                {isLiveConnected && onDisconnectFriend && (
                  <button
                    onClick={onDisconnectFriend}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Desconectar
                  </button>
                )}
              </div>

              {isLiveConnected ? (
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '6px 0' }}>
                  Sincronizado en vivo con: <strong style={{ color: '#10b981' }}>{connectedFriendCode}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    ⚡ Las nuevas capturas de tu amigo se reflejan solas al instante.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="Código (ej: SDEX-7K9X) o enlace..."
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnectFriend()}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.78rem'
                    }}
                  />
                  <button
                    onClick={handleConnectFriend}
                    disabled={isConnecting}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#8b5cf6',
                      color: '#fff',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isConnecting ? <RefreshCw size={13} className="animate-spin" /> : 'Conectar'}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Cargar archivo JSON"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trade Comparison Results */}
        {!hasFriendData ? (
          <div style={{ padding: '35px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8' }}>
            <Radio size={36} style={{ marginBottom: '10px', opacity: 0.6, color: '#38bdf8' }} />
            <h3 style={{ fontSize: '1rem', color: '#e2e8f0', margin: '0 0 6px' }}>Esperando Conexión de Amigo</h3>
            <p style={{ fontSize: '0.8rem', margin: 0, maxWidth: '460px', marginInline: 'auto' }}>
              Ingresa el <strong>Código de Amigo</strong> o pega el enlace que te envió tu amigo arriba para ver las diferencias y planificar préstamos de espíritus en Fortnite en tiempo real.
            </p>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setActiveTab('friendToMe')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'friendToMe' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowDownLeft size={16} />
                <span>Te Puede Prestar ({friendToMeList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('meToFriend')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'meToFriend' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowUpRight size={16} />
                <span>Le Puedes Prestar ({meToFriendList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('common')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'common' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Handshake size={16} />
                <span>Ambos Tienen ({commonList.length})</span>
              </button>
            </div>

            {/* Sprites Grid */}
            {activeList.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                {activeTab === 'friendToMe' && '🎉 ¡Genial! Tu amigo no tiene ningún Sprite que te falte.'}
                {activeTab === 'meToFriend' && '🤝 No tienes Sprites adicionales para prestarle a tu amigo.'}
                {activeTab === 'common' && 'Aún no tienen Sprites repetidos en común.'}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                  gap: '10px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}
              >
                {activeList.map((sprite) => {
                  const style = getSpriteCardStyle(sprite);
                  const isMine = userState[sprite.id]?.owned;
                  const friendLvl = currentFriendState[sprite.id]?.level || 1;
                  const myLvl = userState[sprite.id]?.level || 1;

                  return (
                    <div
                      key={sprite.id}
                      style={{
                        background: style.background,
                        border: `1px solid ${style.borderColor}`,
                        borderRadius: '10px',
                        padding: '10px 6px',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={sprite.image}
                        alt={sprite.fullName}
                        style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 4px' }}
                      />
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {sprite.fullName}
                      </div>

                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                        {activeTab === 'friendToMe' && `Amigo: Niv.${friendLvl}`}
                        {activeTab === 'meToFriend' && `Tú: Niv.${myLvl}`}
                        {activeTab === 'common' && `Tú: Niv.${myLvl} · Amigo: Niv.${friendLvl}`}
                      </div>

                      {activeTab === 'friendToMe' && onToggleOwned && (
                        <button
                          onClick={() => onToggleOwned(sprite.id)}
                          style={{
                            marginTop: '6px',
                            width: '100%',
                            padding: '4px',
                            borderRadius: '5px',
                            background: isMine ? '#10b981' : 'rgba(255,255,255,0.15)',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isMine ? '✓ Registrado' : '+ Marcar'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
