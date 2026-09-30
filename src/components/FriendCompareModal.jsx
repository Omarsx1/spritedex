import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Users, Copy, Check, ArrowDownLeft, ArrowUpRight, Handshake, Radio, Zap, MessageSquare, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALL_SPRITES, getSpriteCardStyle, pickName } from '../data/spritesData';
import { decodeCollectionState } from '../utils/shareLink';
import { generatePermanentFriendUrl, normalizeFriendCode } from '../utils/friendCode';
import { sounds } from '../utils/audio';
import gsap from 'gsap';
import { Modal } from './ui/Modal';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { t } from '../i18n';
import { dominioParaCompartir } from '../utils/canvasExporter';

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
  onOpenFriendsPage,
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
  const [codigoSolicitud, setCodigoSolicitud] = useState('');
  const [avisoSolicitud, setAvisoSolicitud] = useState('');
  const radar = useFriendRequests();
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

  // Enviar una solicitud por código. La base resuelve el código a su dueño y aplica
  // sus propias reglas (nadie puede crear solicitudes en nombre de otro).
  const handleEnviarSolicitud = async () => {
    const codigo = codigoSolicitud.trim();
    if (!codigo) return;
    setAvisoSolicitud(t('comparar.enviando'));
    const res = await radar.enviar(codigo, myFriendCode);
    if (res.error) {
      setAvisoSolicitud(res.error);
      return;
    }
    sounds.playBeep();
    setCodigoSolicitud('');
    setAvisoSolicitud(t('comparar.solicitudEnviada', { codigo: String(res.codigo || '').replace(/^SDEX-/i, '') }));
  };

  // Ver la colección de un amigo aceptado: reusa el mismo camino que conectar por
  // código, así no hay dos formas distintas de cargar una colección.
  const handleVerColeccion = async (codigo) => {
    if (!codigo || !onConnectFriendCode) return;
    const ok = await onConnectFriendCode(codigo);
    if (ok === false) {
      setErrorMessage(t('comparar.errorCargarColeccion'));
      return;
    }
    // Se queda dentro del radar a proposito: al conectar aparecen abajo las listas de
    // comparacion, que es lo que el usuario viene a ver. Sacarlo a la pantalla
    // principal era perder el contexto que acaba de pedir.
  };

  const handleConnectFriend = async () => {
    if (!friendInput.trim()) return;
    if (!friendInput.trim()) return;
    setErrorMessage('');
    const raw = friendInput.trim();
    const code = normalizeFriendCode(raw);

    if (myFriendCode && code.toUpperCase() === myFriendCode.toUpperCase()) {
      setErrorMessage(t('comparar.errorCodigoPropio'));
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
        if (onLoadFriendState) onLoadFriendState(decoded, t('comparar.etiquetaEnlace'));
        setFriendInput('');
        setActiveTab('friendAll');
        sounds.playToggle(true, 2);
      }
    }

    setIsConnecting(false);

    if (!found) {
      setErrorMessage(t('comparar.errorNoEncontrado', { codigo: code }));
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
    let text = t('comparar.planTitulo') + '\n';
    text += t('comparar.planSincronizados', { mio: myFriendCode, suyo: connectedFriendCode || t('comparar.amigo') }) + '\n\n';

    if (friendOwnedList.length > 0) {
      text += t('comparar.planAmigoTiene', { n: friendOwnedList.length }) + '\n\n';
    }

    if (friendToMeList.length > 0) {
      text += t('comparar.planTeFaltan', { n: friendToMeList.length }) + '\n';
      friendToMeList.slice(0, 8).forEach(s => {
        text += `• ${pickName(s)}\n`;
      });
      if (friendToMeList.length > 8) text += t('comparar.planMas', { n: friendToMeList.length - 8 }) + '\n';
      text += `\n`;
    }

    if (meToFriendList.length > 0) {
      text += t('comparar.planLeFaltan', { n: meToFriendList.length }) + '\n';
      meToFriendList.slice(0, 8).forEach(s => {
        text += `• ${pickName(s)}\n`;
      });
      if (meToFriendList.length > 8) text += t('comparar.planMas', { n: meToFriendList.length - 8 }) + '\n';
      text += `\n`;
    }

    text += t('comparar.planCierre', { enlace: dominioParaCompartir() + '?code=' + myFriendCode });

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
              <h2 className="sdm-share-pro__title">{t('comparar.titulo')}</h2>
              <p className="sdm-share-pro__subtitle">
                {isLiveConnected ? t('comparar.conectadoEnVivo', { nombre: connectedFriendCode }) : t('comparar.subtitulo')}
              </p>
            </div>
          </div>
          <button className="sdm-share-pro__close" onClick={handleClose} aria-label={t('comparar.cerrarModal')}>
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
                <span>{t('comparar.tuCodigoDeAmigo')}</span>
              </div>
              <div className="sdm-compare__code-row">
                <span className="sdm-compare__code-plate">
                  <span className="sdm-compare__code-prefix">SDEX</span>
                  <span className="sdm-compare__code-badge" title={t('comparar.titleTuCodigo')}>
                    {codigoCorto || '????'}
                  </span>
                </span>
                <div className="sdm-compare__code-actions">
                  <button
                    onClick={handleCopyCode}
                    className={`sdm-compare__btn-copy ${copiedCode ? 'sdm-compare__btn-copy--done' : ''}`}
                    title={t('comparar.titleCopiarCodigo')}
                  >
                    {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCode ? t('comparar.copiado') : t('comparar.codigo')}</span>
                  </button>
                  <button
                    onClick={handleCopyPermanentLink}
                    className={`sdm-compare__btn-copy sdm-compare__btn-copy--link ${copiedLink ? 'sdm-compare__btn-copy--done' : ''}`}
                    title={t('comparar.titleCopiarEnlace')}
                  >
                    {copiedLink ? <Check size={13} color="#10b981" /> : <Zap size={13} color="#00F0E8" />}
                    <span>{copiedLink ? t('comparar.enlaceCopiado') : t('comparar.enlace')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Conectar con Amigo en Tiempo Real */}
            <div className={`sdm-compare__card sdm-compare__card--connect ${isLiveConnected ? 'sdm-compare__card--connected' : ''}`}>
              <div className="sdm-compare__card-header-row">
                <div className="sdm-compare__card-title">
                  {isLiveConnected ? (
                    <span style={{ color: '#10b981' }}>{t('comparar.conectadoEnVivoLabel')}</span>
                  ) : (
                    <span>{t('comparar.conectarEnlaceOAmigo')}</span>
                  )}
                </div>
                {isLiveConnected && onDisconnectFriend && (
                  <button
                    onClick={onDisconnectFriend}
                    className="sdm-compare__btn-disconnect"
                  >
                    {t('comparar.desconectar')}
                  </button>
                )}
              </div>

              {isLiveConnected ? (
                <div className="sdm-compare__connected-info">
                  <div className="sdm-compare__connected-target">
                    <span>{t('comparar.amigo')}: <strong>{connectedFriendCode}</strong></span>
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
                      {t('comparar.espiritusContados', { n: friendOwnedList.length })}
                    </span>
                  </div>
                  <span className="sdm-compare__connected-hint">
                    {t('comparar.hintActualizacion')}
                  </span>
                </div>
              ) : (
                <div className="sdm-compare__input-row">
                  <input
                    type="text"
                    placeholder={t('comparar.placeholderCodigo')}
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
                    {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : t('comparar.verLista')}
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

          {/* ═══ RADAR DE AMIGOS: solicitudes con aprobación y lista de amigos ═══ */}
          <div className="sdm-friends">
            <div className="sdm-friends__head">
              <span className="sdm-friends__title"><Users size={14} /> {t('comparar.radarDeAmigos')}</span>
              {onOpenFriendsPage && (
                <button type="button" className="sdm-friends__refresh" onClick={onOpenFriendsPage}>
                  {t('comparar.paginaCompleta')}
                </button>
              )}
            </div>

            <div className="sdm-friends__add">
              <input
                type="text"
                className="sdm-friends__input"
                placeholder={t('comparar.placeholderCodigoAmigo')}
                value={codigoSolicitud}
                onChange={(e) => setCodigoSolicitud(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEnviarSolicitud(); }}
              />
              <button
                type="button"
                className="sdm-friends__send"
                onClick={handleEnviarSolicitud}
                disabled={!codigoSolicitud.trim()}
              >
                {t('comparar.enviarSolicitud')}
              </button>
            </div>
            {avisoSolicitud && <p className="sdm-friends__aviso">{avisoSolicitud}</p>}
            {!radar.haySesion && (
              <p className="sdm-friends__aviso">{t('comparar.necesitaSesion')}</p>
            )}

            {radar.recibidas.length > 0 && (
              <div className="sdm-friends__group">
                <span className="sdm-friends__label">{t('comparar.solicitudesConteo', { n: radar.recibidas.length })}</span>
                {radar.recibidas.map((s) => (
                  <div key={s.id} className="sdm-friends__row">
                    <span className="sdm-friends__plate">
                      <span className="sdm-friends__prefix">SDEX</span>
                      <span className="sdm-friends__code">{String(s.from_code || '').replace(/^SDEX-/i, '')}</span>
                    </span>
                    <div className="sdm-friends__actions">
                      <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => { sounds.playBeep(); radar.aceptar(s.id); }}>{t('comparar.aceptar')}</button>
                      <button type="button" className="sdm-friends__btn" onClick={() => radar.rechazar(s.id)}>{t('comparar.rechazar')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sdm-friends__group">
              <span className="sdm-friends__label">{t('comparar.amigosConteo', { n: radar.amigos.length })}</span>
              {radar.amigos.length === 0 ? (
                <p className="sdm-friends__hint">{t('comparar.sinAmigos')}</p>
              ) : radar.amigos.map((a) => {
                const codigoAmigo = radar.codigoDeAmigo(a);
                return (
                  <div key={a.id} className="sdm-friends__row">
                    <span className="sdm-friends__plate">
                      <span className="sdm-friends__prefix">SDEX</span>
                      <span className="sdm-friends__code">{String(codigoAmigo || '').replace(/^SDEX-/i, '')}</span>
                    </span>
                    <div className="sdm-friends__actions">
                      <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => handleVerColeccion(codigoAmigo)}>{t('comparar.verColeccion')}</button>
                      <button type="button" className="sdm-friends__btn sdm-friends__btn--danger" onClick={() => radar.borrar(a.id)}>{t('comparar.quitar')}</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {radar.enviadas.length > 0 && (
              <div className="sdm-friends__group">
                <span className="sdm-friends__label">{t('comparar.enviadasConteo', { n: radar.enviadas.length })}</span>
                {radar.enviadas.map((s) => (
                  <div key={s.id} className="sdm-friends__row">
                    <span className="sdm-friends__plate">
                      <span className="sdm-friends__prefix">SDEX</span>
                      <span className="sdm-friends__code">{String(s.to_code || '').replace(/^SDEX-/i, '')}</span>
                    </span>
                    <div className="sdm-friends__actions">
                      <span className="sdm-friends__pendiente">{t('comparar.esperandoAprobacion')}</span>
                      <button type="button" className="sdm-friends__btn" onClick={() => radar.borrar(s.id)}>{t('comparar.cancelar')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trade Comparison Results */}
          {!hasFriendData ? (
            <div className="sdm-compare__waiting">
              <div className="sdm-compare__radar-icon">
                <Radio size={32} color="#00F0E8" />
              </div>
              <h3 className="sdm-compare__waiting-title">{t('comparar.esperandoConexion')}</h3>
              <p className="sdm-compare__waiting-text">
                {t('comparar.esperandoEntrada')}<strong>{t('comparar.codigoDeAmigo')}</strong>{t('comparar.esperandoEjemploA')}<code>SDEX-XXXX</code>{t('comparar.esperandoEjemploB')}<code>XXXX</code>{t('comparar.esperandoFinal')}
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
                      {t('comparar.verColeccionCompleta')}
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
                    {t('comparar.gen2', { n: ALL_SPRITES.filter(s => s.gen === 2).length })}
                  </button>
                  <button
                    className={`sdm-compare__season-pill ${seasonFilter === 'all' ? 'sdm-compare__season-pill--active' : ''}`}
                    onClick={() => setSeasonFilter('all')}
                  >
                    {t('comparar.todas', { n: ALL_SPRITES.length })}
                  </button>
                </div>

                <button
                  onClick={handleCopyTradePlan}
                  className="sdm-compare__btn-trade-plan"
                >
                  {copiedTradePlan ? <Check size={14} color="#4ade80" /> : <MessageSquare size={14} />}
                  <span>{copiedTradePlan ? t('comparar.copiado') : t('comparar.resumen')}</span>
                </button>
              </div>

              {/* 4 Tabs: Colección Amigo, Te Faltan, Le Faltan, En Común */}
              <div className="sdm-compare__tabs">
                <button
                  onClick={() => setActiveTab('friendAll')}
                  className={`sdm-compare__tab ${activeTab === 'friendAll' ? 'sdm-compare__tab--active-purple' : ''}`}
                >
                  <Users size={15} />
                  <span>{t('comparar.listaAmigo', { n: friendOwnedList.length })}</span>
                </button>

                <button
                  onClick={() => setActiveTab('friendToMe')}
                  className={`sdm-compare__tab ${activeTab === 'friendToMe' ? 'sdm-compare__tab--active-green' : ''}`}
                >
                  <ArrowDownLeft size={15} />
                  <span>{t('comparar.tabTeFaltan', { n: friendToMeList.length })}</span>
                </button>

                <button
                  onClick={() => setActiveTab('meToFriend')}
                  className={`sdm-compare__tab ${activeTab === 'meToFriend' ? 'sdm-compare__tab--active-blue' : ''}`}
                >
                  <ArrowUpRight size={15} />
                  <span>{t('comparar.tabLeFaltan', { n: meToFriendList.length })}</span>
                </button>

                <button
                  onClick={() => setActiveTab('common')}
                  className={`sdm-compare__tab ${activeTab === 'common' ? 'sdm-compare__tab--active-gold' : ''}`}
                >
                  <Handshake size={15} />
                  <span>{t('comparar.tabEnComun', { n: commonList.length })}</span>
                </button>
              </div>

              {/* Sprites Grid */}
              {activeList.length === 0 ? (
                <div className="sdm-compare__empty">
                  {activeTab === 'friendAll' && t('comparar.vacioFriendAll')}
                  {activeTab === 'friendToMe' && t('comparar.vacioFriendToMe')}
                  {activeTab === 'meToFriend' && t('comparar.vacioMeToFriend')}
                  {activeTab === 'common' && t('comparar.vacioComun')}
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
                          alt={pickName(sprite)}
                          className="sdm-compare__sprite-img"
                        />
                        <div className="sdm-compare__sprite-name" title={pickName(sprite)}>
                          {pickName(sprite)}
                        </div>

                        <div className="sdm-compare__sprite-levels">
                          {activeTab === 'friendAll' && (
                            <>
                              <div style={{ color: '#00F0E8', fontWeight: 800 }}>
                                {t('comparar.amigo')}: {isFriendMastered ? 'MAX ★5' : t('comparar.niv', { n: friendLvl })}
                              </div>
                              <div style={{ color: isMine ? '#4ade80' : '#f87171', fontSize: '0.62rem', fontWeight: 700 }}>
                                {isMine ? t('comparar.enTuDex', { nivel: isMyMastered ? 'MAX' : t('comparar.niv', { n: myLvl }) }) : t('comparar.teFalta')}
                              </div>
                            </>
                          )}
                          {activeTab === 'friendToMe' && (
                            <>
                              <div style={{ color: '#00F0E8', fontWeight: 700 }}>{t('comparar.amigo')}: {t('comparar.niv', { n: friendLvl })}</div>
                              <div style={{ color: '#f87171', fontSize: '0.62rem' }}>{t('comparar.teFalta')}</div>
                            </>
                          )}
                          {activeTab === 'meToFriend' && (
                            <>
                              <div style={{ color: '#38bdf8', fontWeight: 700 }}>{t('comparar.tu')}: {t('comparar.niv', { n: myLvl })}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.62rem' }}>{t('comparar.amigoLoNecesita')}</div>
                            </>
                          )}
                          {activeTab === 'common' && (
                            <div>{t('comparar.tuYAmigo', { mio: myLvl, suyo: friendLvl })}</div>
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
                            {t('comparar.marcarEnMiDex')}
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
                            {t('comparar.registrado')}
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
