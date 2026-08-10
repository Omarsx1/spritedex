import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Copy, Check, ArrowDownLeft, ArrowUpRight, Handshake, Upload, ExternalLink } from 'lucide-react';
import { ALL_SPRITES, getSpriteCardStyle } from '../data/spritesData';
import { generateShareableLink, decodeCollectionState } from '../utils/shareLink';
import { sounds } from '../utils/audio';

export function FriendCompareModal({ userState, onToggleOwned, onClose }) {
  const [activeTab, setActiveTab] = useState('friendToMe'); // 'friendToMe' | 'meToFriend' | 'common'
  const [copied, setCopied] = useState(false);
  const [friendState, setFriendState] = useState({});
  const [friendLoaded, setFriendLoaded] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const fileInputRef = useRef(null);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const friendParam = params.get('friend');
    if (friendParam) {
      const decoded = decodeCollectionState(friendParam);
      if (Object.keys(decoded).length > 0) {
        setFriendState(decoded);
        setFriendLoaded(true);
      }
    }
  }, []);

  const myShareLink = generateShareableLink(userState);

  const handleCopyLink = () => {
    sounds.playBeep();
    navigator.clipboard.writeText(myShareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLoadFriendLink = () => {
    if (!friendInput.trim()) return;
    sounds.playBeep();

    let code = friendInput.trim();
    if (code.includes('friend=')) {
      try {
        const url = new URL(code);
        code = url.searchParams.get('friend') || '';
      } catch (e) {
        // Not a full URL, treat as raw code
      }
    }

    const decoded = decodeCollectionState(code);
    if (Object.keys(decoded).length > 0) {
      setFriendState(decoded);
      setFriendLoaded(true);
    } else {
      alert('No se pudo leer la colección del amigo. Verifica el código o enlace.');
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
          setFriendState(json);
          setFriendLoaded(true);
          sounds.playBeep();
        }
      } catch (err) {
        alert('El archivo no tiene un formato de colección válido.');
      }
    };
    reader.readAsText(file);
  };

  // Sprites friend can lend to me (Friend has it, I don't)
  const friendToMeList = ALL_SPRITES.filter(s => {
    const friendHas = friendState[s.id]?.owned;
    const iHave = userState[s.id]?.owned;
    return friendHas && !iHave;
  });

  // Sprites I can lend to friend (I have it, friend doesn't)
  const meToFriendList = ALL_SPRITES.filter(s => {
    const friendHas = friendState[s.id]?.owned;
    const iHave = userState[s.id]?.owned;
    return iHave && !friendHas;
  });

  // Sprites both own
  const commonList = ALL_SPRITES.filter(s => {
    const friendHas = friendState[s.id]?.owned;
    const iHave = userState[s.id]?.owned;
    return iHave && friendHas;
  });

  const activeList = activeTab === 'friendToMe' ? friendToMeList : activeTab === 'meToFriend' ? meToFriendList : commonList;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Planificador de Intercambios en Fortnite
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
              Compara tu colección con la de tu amigo para prestarse Sprites en la partida y registrarlos.
            </p>
          </div>
        </div>

        {/* Top Actions: Copy my link or Paste friend's link */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Step 1: Copy my link */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                1. Mándale tu colección a tu amigo:
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: copied ? '#10b981' : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? '¡Enlace Copiado!' : 'Copiar Mi Enlace de Intercambio'}</span>
              </button>
            </div>

            {/* Step 2: Paste friend's link or upload JSON */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a855f7', marginBottom: '6px' }}>
                2. Cargar colección de tu amigo:
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Pega el enlace o código de tu amigo..."
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
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
                  onClick={handleLoadFriendLink}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Cargar
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
            </div>
          </div>
        </div>

        {/* Trade Comparison Results */}
        {!friendLoaded ? (
          <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8' }}>
            <ExternalLink size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1rem', color: '#e2e8f0', margin: '0 0 6px' }}>Esperando Colección de tu Amigo</h3>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>
              Pega el enlace o código que te envió tu amigo arriba para generar la lista de préstamos de la partida en Fortnite.
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
                  background: activeTab === 'friendToMe' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${activeTab === 'friendToMe' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  color: activeTab === 'friendToMe' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowDownLeft size={16} />
                <span>Tu amigo te presta ({friendToMeList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('meToFriend')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: activeTab === 'meToFriend' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${activeTab === 'meToFriend' ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`,
                  color: activeTab === 'meToFriend' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowUpRight size={16} />
                <span>Tú le me prestas ({meToFriendList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('common')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: activeTab === 'common' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${activeTab === 'common' ? '#c084fc' : 'rgba(255,255,255,0.1)'}`,
                  color: activeTab === 'common' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Handshake size={16} />
                <span>En común ({commonList.length})</span>
              </button>
            </div>

            {/* List Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {activeList.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay Sprites en esta categoría.
                </div>
              ) : (
                activeList.map((sprite) => {
                  const styleInfo = getSpriteCardStyle(sprite);
                  const friendInfo = friendState[sprite.id] || {};
                  const myInfo = userState[sprite.id] || {};

                  return (
                    <div
                      key={sprite.id}
                      style={{
                        background: styleInfo.background,
                        border: `2px solid ${styleInfo.borderColor}`,
                        borderRadius: '10px',
                        padding: '10px 8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <img
                        src={sprite.image}
                        alt={sprite.fullName}
                        style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                        {sprite.fullName}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '6px' }}>
                        {activeTab === 'friendToMe' ? `Amigo Niv.${friendInfo.level || 1}` : activeTab === 'meToFriend' ? `Tu Niv.${myInfo.level || 1}` : 'Ambos tienen'}
                      </div>

                      {/* Quick action button to mark as owned during/after Fortnite match */}
                      {activeTab === 'friendToMe' && (
                        <button
                          onClick={() => {
                            onToggleOwned(sprite.id);
                            sounds.playToggle(!myInfo.owned);
                          }}
                          style={{
                            width: '100%',
                            padding: '4px 0',
                            borderRadius: '4px',
                            background: myInfo.owned ? '#10b981' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {myInfo.owned ? '✓ Registrado' : '+ Registrar'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
