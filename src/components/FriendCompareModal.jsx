import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Users, Copy, Check, ArrowDownLeft, ArrowUpRight, Handshake, Upload, Radio, Zap, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import { ALL_SPRITES, getSpriteCardStyle } from '../data/spritesData';
import { decodeCollectionState } from '../utils/shareLink';
import { generatePermanentFriendUrl, normalizeFriendCode } from '../utils/friendCode';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

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
  const [seasonFilter, setSeasonFilter] = useState('active'); // 'active' (Gen 2) | 'all'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTradePlan, setCopiedTradePlan] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const permanentFriendUrl = generatePermanentFriendUrl(myFriendCode || 'SDEX-0000');

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
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

  // Base list depending on season filter
  const baseSpritesList = useMemo(() => {
    if (seasonFilter === 'active') {
      return ALL_SPRITES.filter(s => s.gen === 2 || s.isNew);
    }
    return ALL_SPRITES;
  }, [seasonFilter]);

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

  const activeList = activeTab === 'friendToMe' ? friendToMeList : activeTab === 'meToFriend' ? meToFriendList : commonList;

  const handleCopyTradePlan = () => {
    sounds.playBeep();
    let text = `🎮 ¡PLAN DE INTERCAMBIO FORTNITE SPRITEDEX! 🤝\n`;
    text += `👥 Conexión: Mi Código (${myFriendCode}) ⇄ Amigo (${connectedFriendCode || 'Amigo'})\n\n`;

    if (friendToMeList.length > 0) {
      text += `📥 TÚ ME PRESTAS (${friendToMeList.length}):\n`;
      friendToMeList.slice(0, 8).forEach(s => {
        text += `- ${s.fullName}\n`;
      });
      if (friendToMeList.length > 8) text += `... y ${friendToMeList.length - 8} más.\n`;
      text += `\n`;
    }

    if (meToFriendList.length > 0) {
      text += `📤 YO TE PRESTO (${meToFriendList.length}):\n`;
      meToFriendList.slice(0, 8).forEach(s => {
        text += `- ${s.fullName}\n`;
      });
      if (meToFriendList.length > 8) text += `... y ${meToFriendList.length - 8} más.\n`;
      text += `\n`;
    }

    text += `¡Nos vemos en Fortnite para intercambiar! 🏆 #FNGGOverride`;

    navigator.clipboard.writeText(text);
    setCopiedTradePlan(true);
    setTimeout(() => setCopiedTradePlan(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sdm sdm-compare sdm-share--glitch" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="sdm__close" onClick={onClose}>
          <X size={18} />
        </button>

        {/* ═══ HERO HEADER (GLITCH THEMED) ═══ */}
        <div className="sdm__hero sdm-share__hero sdm-compare__hero">
          <div
            className="sdm__hero-glow"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.4) 0%, rgba(0, 240, 232, 0.25) 50%, transparent 80%)'
            }}
          />

          <div className="sdm-share__hero-icon">
            <Users size={28} color="#00F0E8" />
          </div>

          <div className="sdm__hero-info">
            <div className="sdm__hero-badges">
              <span className="sdm-share__tag-chapter">FORTNITE | TEMPORADA GLITCH</span>
              <span className="sdm-share__tag-pill" style={{ background: '#8b5cf6' }}>INTERCAMBIO EN VIVO</span>
            </div>
            <h2 className="sdm__name sdm-share__glitch-title">PLANIFICADOR DE INTERCAMBIOS</h2>
            <p className="sdm__meta">
              Sincroniza y compara en tiempo real con tu amigo en Fortnite mediante tu Código de Amigo permanente.
            </p>
          </div>
        </div>

        {/* ═══ BODY CONTENT ═══ */}
        <div className="sdm__body sdm-compare__body">

          {/* Top Cards: My Friend Code vs Connect to Friend */}
          <div className="sdm-compare__top-grid">

            {/* 1. Tu Código de Amigo Permanente */}
            <div className="sdm-compare__card sdm-compare__card--my-code">
              <div className="sdm-compare__card-title">
                <span>⭐ TU CÓDIGO DE AMIGO</span>
              </div>
              <div className="sdm-compare__code-row">
                <span className="sdm-compare__code-badge">
                  {myFriendCode || 'SDEX-????'}
                </span>
                <button
                  onClick={handleCopyCode}
                  className={`sdm-compare__btn-copy ${copiedCode ? 'sdm-compare__btn-copy--done' : ''}`}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <button
                onClick={handleCopyPermanentLink}
                className="sdm-compare__btn-link"
              >
                {copiedLink ? <Check size={13} color="#10b981" /> : <Zap size={13} color="#00F0E8" />}
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace Directo'}</span>
              </button>
            </div>

            {/* 2. Conectar con Amigo en Tiempo Real */}
            <div className={`sdm-compare__card sdm-compare__card--connect ${isLiveConnected ? 'sdm-compare__card--connected' : ''}`}>
              <div className="sdm-compare__card-header-row">
                <div className="sdm-compare__card-title">
                  {isLiveConnected ? (
                    <span style={{ color: '#10b981' }}>🟢 CONECTADO EN VIVO</span>
                  ) : (
                    <span>🤝 CONECTAR CON UN AMIGO</span>
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
                    Amigo: <strong>{connectedFriendCode}</strong>
                  </div>
                  <span className="sdm-compare__connected-hint">
                    ⚡ Las nuevas capturas de tu amigo se actualizan al instante.
                  </span>
                </div>
              ) : (
                <div className="sdm-compare__input-row">
                  <input
                    type="text"
                    placeholder="Código (ej: SDEX-7K9X) o enlace..."
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnectFriend()}
                    className="sdm-compare__input"
                  />
                  <button
                    onClick={handleConnectFriend}
                    disabled={isConnecting}
                    className="sdm-compare__btn-connect"
                  >
                    {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : 'Conectar'}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Cargar archivo JSON"
                    className="sdm-compare__btn-upload"
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

          {/* Trade Comparison Results */}
          {!hasFriendData ? (
            <div className="sdm-compare__waiting">
              <div className="sdm-compare__radar-icon">
                <Radio size={36} color="#00F0E8" />
              </div>
              <h3 className="sdm-compare__waiting-title">Esperando Conexión de Amigo</h3>
              <p className="sdm-compare__waiting-text">
                Ingresa el <strong>Código de Amigo</strong> o pega el enlace arriba para comparar colecciones y planificar préstamos en tiempo real.
              </p>
            </div>
          ) : (
            <div className="sdm-compare__results">

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
                  <span>{copiedTradePlan ? '¡Plan Copiado!' : 'Copiar Plan de Intercambio'}</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="sdm-compare__tabs">
                <button
                  onClick={() => setActiveTab('friendToMe')}
                  className={`sdm-compare__tab ${activeTab === 'friendToMe' ? 'sdm-compare__tab--active-green' : ''}`}
                >
                  <ArrowDownLeft size={16} />
                  <span>Te Puede Prestar ({friendToMeList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('meToFriend')}
                  className={`sdm-compare__tab ${activeTab === 'meToFriend' ? 'sdm-compare__tab--active-blue' : ''}`}
                >
                  <ArrowUpRight size={16} />
                  <span>Le Puedes Prestar ({meToFriendList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('common')}
                  className={`sdm-compare__tab ${activeTab === 'common' ? 'sdm-compare__tab--active-purple' : ''}`}
                >
                  <Handshake size={16} />
                  <span>Ambos Tienen ({commonList.length})</span>
                </button>
              </div>

              {/* Sprites Grid */}
              {activeList.length === 0 ? (
                <div className="sdm-compare__empty">
                  {activeTab === 'friendToMe' && '🎉 ¡Genial! Tu amigo no tiene ningún Sprite que te falte en esta categoría.'}
                  {activeTab === 'meToFriend' && '🤝 No tienes Sprites adicionales para prestarle a tu amigo en esta categoría.'}
                  {activeTab === 'common' && 'Aún no tienen Sprites repetidos en común en esta categoría.'}
                </div>
              ) : (
                <div className="sdm-compare__grid">
                  {activeList.map((sprite) => {
                    const style = getSpriteCardStyle(sprite);
                    const isMine = userState[sprite.id]?.owned;
                    const friendLvl = currentFriendState[sprite.id]?.level || 1;
                    const myLvl = userState[sprite.id]?.level || 1;

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
                        <div className="sdm-compare__sprite-name">
                          {sprite.fullName}
                        </div>

                        <div className="sdm-compare__sprite-levels">
                          {activeTab === 'friendToMe' && `Amigo: Niv.${friendLvl}`}
                          {activeTab === 'meToFriend' && `Tú: Niv.${myLvl}`}
                          {activeTab === 'common' && `Tú: N.${myLvl} · Amigo: N.${friendLvl}`}
                        </div>

                        {activeTab === 'friendToMe' && onToggleOwned && (
                          <button
                            onClick={() => onToggleOwned(sprite.id)}
                            className={`sdm-compare__sprite-mark-btn ${isMine ? 'sdm-compare__sprite-mark-btn--owned' : ''}`}
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
    </div>
  );
}
