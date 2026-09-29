import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Users, Copy, Check, ArrowDownLeft, ArrowUpRight, Handshake, Radio, Zap, RefreshCw, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALL_SPRITES, getSpriteCardStyle } from '../data/spritesData';
import { decodeCollectionState } from '../utils/shareLink';
import { generatePermanentFriendUrl, normalizeFriendCode } from '../utils/friendCode';
import { sounds } from '../utils/audio';
import gsap from 'gsap';
import { Modal } from './ui/Modal';

export function FriendCompareModal({
  userState,
  friendState,
  isLiveConnected,
  connectedFriendCode,
  myFriendCode,
  activeProfile,
  onSetActiveProfile,
  onConnectFriendCode,
  onDisconnectFriend,
  onLoadFriendState,
  onToggleOwned,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('friendAll'); // 'friendAll' | 'friendToMe' | 'meToFriend' | 'common'
  const [seasonFilter, setSeasonFilter] = useState('active'); // 'active' (Gen 2) | 'all'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTradePlan, setCopiedTradePlan] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const modalRef = useRef(null);

  const permanentFriendUrl = generatePermanentFriendUrl(myFriendCode || 'SDEX-0000');
  // SDEX es el prefijo de todos los codigos: se muestra fijo y la casilla lleva solo
  // el codigo, que es lo que la gente comparte.
  const codigoCorto = (myFriendCode || '').replace(/^SDEX-/i, '');

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  // Entrance animation matching modern spring physics
  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.94, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'power3.out' }
      );
    }
  }, []);

  const handleCopyCode = () => {
    sounds.playBeep();
    navigator.clipboard.writeText(myFriendCode || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPermanentLink = () => {
    sounds.playBeep();
    navigator.clipboard.writeText(permanentFriendUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentFriendState = useMemo(() => friendState || {}, [friendState]);
  const hasFriendData = useMemo(() => {
    return Object.keys(currentFriendState).some(k => k !== '_profile' && currentFriendState[k]?.owned);
  }, [currentFriendState]);

  const handleConnectFriend = async () => {
    if (!friendInput.trim()) return;
    setErrorMessage('');
    const raw = friendInput.trim();
    const code = normalizeFriendCode(raw);

    if (myFriendCode && code.toUpperCase() === myFriendCode.toUpperCase()) {
      setErrorMessage('¡Ese es tu propio código de amigo! Ingresa el código de un amigo para ver o comparar su colección.');
      return;
    }

    sounds.playBeep();
    setIsConnecting(true);

    let found = false;

    // 1. Conectar por código de amigo en la nube (ej: SDEX-XXXX, XXXX, o URL)
    if (onConnectFriendCode) {
      const success = await onConnectFriendCode(code);
      if (success) {
        found = true;
        setFriendInput('');
        setActiveTab('friendAll');
        sounds.playToggle(true, 2);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      }
    }

    // 2. Fallback: enlace codificado legado (?friend=...)
    if (!found) {
      let legacyCode = raw;
      if (legacyCode.includes('friend=')) {
        const match = legacyCode.match(/[?&]friend=([^&#\s]+)/);
        if (match) {
          legacyCode = decodeURIComponent(match[1]);
        }
      }
      const decoded = decodeCollectionState(legacyCode);
      if (Object.keys(decoded).length > 0) {
        found = true;
        if (onLoadFriendState) onLoadFriendState(decoded, 'ENLACE');
        setFriendInput('');
        setActiveTab('friendAll');
        sounds.playToggle(true, 2);
      }
    }

    setIsConnecting(false);

    if (!found) {
      setErrorMessage(`No se encontró ninguna colección con el código "${code}". Asegúrate de que tu amigo tenga su Spritedex abierto.`);
    }
  };

  // Base list depending on season filter
  const baseSpritesList = useMemo(() => {
    if (seasonFilter === 'active') {
      return ALL_SPRITES.filter(s => s.gen === 2 || s.isNew);
    }
    return ALL_SPRITES;
  }, [seasonFilter]);

  // Sprites friend owns (Friend has it)
  const friendOwnedList = useMemo(() => {
    return baseSpritesList.filter((s) => {
      return Boolean(currentFriendState[s.id]?.owned);
    });
  }, [baseSpritesList, currentFriendState]);

  // Sprites friend can lend to me (Friend has it, I don't)
  const friendToMeList = useMemo(() => {
    return baseSpritesList.filter((s) => {
      const friendHas = currentFriendState[s.id]?.owned;
      const iHave = userState[s.id]?.owned;
      return friendHas && !iHave;
    });
  }, [baseSpritesList, currentFriendState, userState]);

  // Sprites I can lend to friend (I have it, friend doesn't)
  const meToFriendList = useMemo(() => {
    return baseSpritesList.filter((s) => {
      const friendHas = currentFriendState[s.id]?.owned;
      const iHave = userState[s.id]?.owned;
      return iHave && !friendHas;
    });
  }, [baseSpritesList, currentFriendState, userState]);

  // Sprites both own
  const commonList = useMemo(() => {
    return baseSpritesList.filter((s) => {
      const friendHas = currentFriendState[s.id]?.owned;
      const iHave = userState[s.id]?.owned;
      return iHave && friendHas;
    });
  }, [baseSpritesList, currentFriendState, userState]);

  const activeList = useMemo(() => {
    switch (activeTab) {
      case 'friendAll':
        return friendOwnedList;
      case 'friendToMe':
        return friendToMeList;
      case 'meToFriend':
        return meToFriendList;
      case 'common':
        return commonList;
      default:
        return friendOwnedList;
    }
  }, [activeTab, friendOwnedList, friendToMeList, meToFriendList, commonList]);

  const handleCopyTradePlan = () => {
    sounds.playBeep();
    let text = `🎮 ¡RADAR DE AMIGOS - FORTNITE SPRITEDEX! ⚡\n`;
    text += `👥 Sincronizados: Mi Código (${myFriendCode}) ⇄ Amigo (${connectedFriendCode || 'Amigo'})\n\n`;

    if (friendOwnedList.length > 0) {
      text += `🌟 TU AMIGO TIENE ATAPADOS ${friendOwnedList.length} ESPÍRITUS EN TOTAL.\n\n`;
    }

    if (friendToMeList.length > 0) {
      text += `🟢 TE FALTAN Y TU AMIGO TIENE (${friendToMeList.length}):\n`;
      friendToMeList.slice(0, 8).forEach(s => {
        text += `• ${s.fullName}\n`;
      });
      if (friendToMeList.length > 8) text += `... y ${friendToMeList.length - 8} más.\n`;
      text += `\n`;
    }

    if (meToFriendList.length > 0) {
      text += `🟣 TU AMIGO NECESITA Y TÚ TIENES (${meToFriendList.length}):\n`;
      meToFriendList.slice(0, 8).forEach(s => {
        text += `• ${s.fullName}\n`;
      });
      if (meToFriendList.length > 8) text += `... y ${meToFriendList.length - 8} más.\n`;
      text += `\n`;
    }

    text += `¡Juguemos en Fortnite para completar la colección! 🏆\nhttps://spritedex.com/?code=${myFriendCode}`;

    navigator.clipboard.writeText(text);
    setCopiedTradePlan(true);
    setTimeout(() => setCopiedTradePlan(false), 2500);
  };

  return (
    <Modal
      onClose={handleClose}
      closeOnEscape={!isClosing}
      overlayClassName={isClosing ? 'is-closing' : ''}
      className={`sdm-share-pro sdm-compare ${isClosing ? 'is-closing' : ''}`}
      innerRef={modalRef}
    >
        
        {/* Header Elegante y Minimalista */}
        <div className="sdm-share-pro__header">
          <div className="sdm-share-pro__title-wrap">
            <div className="sdm-share-pro__icon-badge">
              <Users size={18} color="#00F0E8" />
            </div>
            <div>
              <h2 className="sdm-share-pro__title">Radar de Amigos</h2>
              <p className="sdm-share-pro__subtitle">
                {isLiveConnected ? `Conectado en vivo con ${connectedFriendCode}` : 'Sincroniza y compara en tiempo real con amigos'}
              </p>
            </div>
          </div>
          <button className="sdm-share-pro__close" onClick={handleClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* ═══ BODY CONTENT ═══ */}
        <div className="sdm-compare__body">

          {/* Top Cards: My Friend Code vs Connect to Friend */}
          <div className="sdm-compare__top-grid">

            {/* 1. Tu Código de Amigo Permanente */}
            <div className="sdm-compare__card sdm-compare__card--my-code">
              <div className="sdm-compare__card-title">
                <span>⭐ TU CÓDIGO DE AMIGO</span>
              </div>
              <div className="sdm-compare__code-row">
                <span className="sdm-compare__code-plate">
                  <span className="sdm-compare__code-prefix">SDEX</span>
                  <span className="sdm-compare__code-badge" title="Tu codigo de amigo">
                    {codigoCorto || '????'}
                  </span>
                </span>
                <div className="sdm-compare__code-actions">
                  <button
                    onClick={handleCopyCode}
                    className={`sdm-compare__btn-copy ${copiedCode ? 'sdm-compare__btn-copy--done' : ''}`}
                    title="Copiar solo el código"
                  >
                    {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCode ? '¡Copiado!' : 'Código'}</span>
                  </button>
                  <button
                    onClick={handleCopyPermanentLink}
                    className={`sdm-compare__btn-copy sdm-compare__btn-copy--link ${copiedLink ? 'sdm-compare__btn-copy--done' : ''}`}
                    title="Copiar enlace directo permanente"
                  >
                    {copiedLink ? <Check size={13} color="#10b981" /> : <Zap size={13} color="#00F0E8" />}
                    <span>{copiedLink ? '¡Enlace!' : 'Enlace'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Conectar con Amigo en Tiempo Real */}
            <div className={`sdm-compare__card sdm-compare__card--connect ${isLiveConnected ? 'sdm-compare__card--connected' : ''}`}>
              <div className="sdm-compare__card-header-row">
                <div className="sdm-compare__card-title">
                  {isLiveConnected ? (
                    <span style={{ color: '#10b981' }}>🟢 CONECTADO EN VIVO</span>
                  ) : (
                    <span>🔗 CONECTAR ENLACE O AMIGO</span>
                  )}
                </div>
                {isLiveConnected && onDisconnectFriend && (
                  <button
                    onClick={onDisconnectFriend}
                    className="sdm-compare__btn-disconnect"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              {isLiveConnected ? (
                <div className="sdm-compare__connected-info">
                  <div className="sdm-compare__connected-target">
                    <span>Amigo: <strong>{connectedFriendCode}</strong></span>
                    <span style={{
                      marginLeft: '8px',
                      background: 'rgba(0, 240, 232, 0.15)',
                      color: '#00F0E8',
                      border: '1px solid rgba(0, 240, 232, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {friendOwnedList.length} espíritus
                    </span>
                  </div>
                  <span className="sdm-compare__connected-hint">
                    ⚡ Las capturas y niveles de tu amigo se actualizan al instante.
                  </span>
                </div>
              ) : (
                <div className="sdm-compare__input-row">
                  <input
                    type="text"
                    placeholder="Código (ej: SDEX-XXXX o XXXX)..."
                    value={friendInput}
                    onChange={(e) => {
                      setFriendInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnectFriend()}
                    className="sdm-compare__input"
                  />
                  <button
                    onClick={handleConnectFriend}
                    disabled={isConnecting}
                    className="sdm-compare__btn-connect"
                  >
                    {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : 'Ver Lista'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de error amigable si el código no se encuentra */}
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Trade Comparison Results */}
          {!hasFriendData ? (
            <div className="sdm-compare__waiting">
              <div className="sdm-compare__radar-icon">
                <Radio size={32} color="#00F0E8" />
              </div>
              <h3 className="sdm-compare__waiting-title">Esperando Conexión con un Amigo</h3>
              <p className="sdm-compare__waiting-text">
                Ingresa el <strong>Código de Amigo</strong> (ej: <code>SDEX-XXXX</code> o <code>XXXX</code>) para ver su lista y sincronizar en tiempo real.
              </p>
            </div>
          ) : (
            <div className="sdm-compare__results">

              {/* Botón para ver la colección del amigo en el Dex Principal */}
              {onSetActiveProfile && (
                <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      sounds.playBeep();
                      onSetActiveProfile('friend');
                      onClose();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.25))',
                      border: '1.5px solid #a855f7',
                      color: '#ffffff',
                      padding: '9px 18px',
                      borderRadius: '12px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(168, 85, 247, 0.3)',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <Users size={16} color="#a855f7" />
                    <span>
                      🚀 Explorar toda la colección de <strong>{connectedFriendCode || 'tu amigo'}</strong> en la Pantalla Principal
                    </span>
                  </button>
                </div>
              )}

              {/* Season Filter Switcher + Share Plan Header */}
              <div className="sdm-compare__toolbar">
                <div className="sdm-compare__season-pills">
                  <button
                    className={`sdm-compare__season-pill ${seasonFilter === 'active' ? 'sdm-compare__season-pill--active' : ''}`}
                    onClick={() => setSeasonFilter('active')}
                  >
                    ⚡ Gen 2 / Glitch ({ALL_SPRITES.filter(s => s.gen === 2).length})
                  </button>
                  <button
                    className={`sdm-compare__season-pill ${seasonFilter === 'all' ? 'sdm-compare__season-pill--active' : ''}`}
                    onClick={() => setSeasonFilter('all')}
                  >
                    🌐 Toda la Colección ({ALL_SPRITES.length})
                  </button>
                </div>

                <button
                  onClick={handleCopyTradePlan}
                  className="sdm-compare__btn-trade-plan"
                >
                  {copiedTradePlan ? <Check size={14} color="#4ade80" /> : <MessageSquare size={14} />}
                  <span>{copiedTradePlan ? '¡Resumen Copiado!' : 'Copiar Resumen para Amigo'}</span>
                </button>
              </div>

              {/* 4 Tabs: Colección Amigo, Te Faltan, Le Faltan, En Común */}
              <div className="sdm-compare__tabs">
                <button
                  onClick={() => setActiveTab('friendAll')}
                  className={`sdm-compare__tab ${activeTab === 'friendAll' ? 'sdm-compare__tab--active-purple' : ''}`}
                >
                  <Users size={15} />
                  <span>Lista Amigo ({friendOwnedList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('friendToMe')}
                  className={`sdm-compare__tab ${activeTab === 'friendToMe' ? 'sdm-compare__tab--active-green' : ''}`}
                >
                  <ArrowDownLeft size={15} />
                  <span>Te Faltan ({friendToMeList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('meToFriend')}
                  className={`sdm-compare__tab ${activeTab === 'meToFriend' ? 'sdm-compare__tab--active-blue' : ''}`}
                >
                  <ArrowUpRight size={15} />
                  <span>Le Faltan ({meToFriendList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('common')}
                  className={`sdm-compare__tab ${activeTab === 'common' ? 'sdm-compare__tab--active-gold' : ''}`}
                >
                  <Handshake size={15} />
                  <span>En Común ({commonList.length})</span>
                </button>
              </div>

              {/* Sprites Grid */}
              {activeList.length === 0 ? (
                <div className="sdm-compare__empty">
                  {activeTab === 'friendAll' && 'Tu amigo aún no tiene espíritus registrados en esta categoría.'}
                  {activeTab === 'friendToMe' && '🎉 ¡Genial! Tu amigo no tiene ningún espíritu que te falte en esta categoría. ¡Tienes todos los que él tiene!'}
                  {activeTab === 'meToFriend' && '🤝 Tu amigo ya tiene todos los espíritus que tú posees en esta categoría.'}
                  {activeTab === 'common' && 'Aún no tienen espíritus en común en esta categoría.'}
                </div>
              ) : (
                <div className="sdm-compare__grid">
                  {activeList.map((sprite) => {
                    const style = getSpriteCardStyle(sprite);
                    const isMine = userState[sprite.id]?.owned;
                    const friendLvl = currentFriendState[sprite.id]?.level || 1;
                    const myLvl = userState[sprite.id]?.level || 1;
                    const isFriendMastered = friendLvl === 5;
                    const isMyMastered = isMine && myLvl === 5;

                    return (
                      <div
                        key={sprite.id}
                        className="sdm-compare__sprite-card"
                        style={{
                          background: style.background,
                          borderColor: isMine ? '#00F0E8' : style.borderColor
                        }}
                      >
                        <img
                          src={sprite.image}
                          alt={sprite.fullName}
                          className="sdm-compare__sprite-img"
                        />
                        <div className="sdm-compare__sprite-name" title={sprite.fullName}>
                          {sprite.fullName}
                        </div>

                        <div className="sdm-compare__sprite-levels">
                          {activeTab === 'friendAll' && (
                            <>
                              <div style={{ color: '#00F0E8', fontWeight: 800 }}>
                                Amigo: {isFriendMastered ? 'MAX ★5' : `Niv.${friendLvl}`}
                              </div>
                              <div style={{ color: isMine ? '#4ade80' : '#f87171', fontSize: '0.62rem', fontWeight: 700 }}>
                                {isMine ? `✓ En tu Dex (${isMyMastered ? 'MAX' : `Niv.${myLvl}`})` : '✕ Te falta'}
                              </div>
                            </>
                          )}
                          {activeTab === 'friendToMe' && (
                            <>
                              <div style={{ color: '#00F0E8', fontWeight: 700 }}>Amigo: Niv.{friendLvl}</div>
                              <div style={{ color: '#f87171', fontSize: '0.62rem' }}>✕ Te falta</div>
                            </>
                          )}
                          {activeTab === 'meToFriend' && (
                            <>
                              <div style={{ color: '#38bdf8', fontWeight: 700 }}>Tú: Niv.{myLvl}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.62rem' }}>Amigo lo necesita</div>
                            </>
                          )}
                          {activeTab === 'common' && (
                            <div>Tú: N.{myLvl} · Amigo: N.{friendLvl}</div>
                          )}
                        </div>

                        {/* Botón para marcar si a mí me falta */}
                        {!isMine && onToggleOwned && (
                          <button
                            onClick={() => {
                              onToggleOwned(sprite.id);
                              sounds.playToggle(true, sprite.gen);
                              confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
                            }}
                            className="sdm-compare__sprite-mark-btn"
                          >
                            + Marcar en mi Dex
                          </button>
                        )}
                        {isMine && activeTab === 'friendAll' && (
                          <div style={{
                            marginTop: '6px',
                            padding: '3px 6px',
                            borderRadius: '5px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}>
                            ✓ Registrado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
    </Modal>
  );
}
