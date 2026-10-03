import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IS_DEV_BUILD,
  applySeasonalTheme,
  hasSeenFortnitemaresIntro,
  isFortnitemaresActive,
  markFortnitemaresIntroSeen,
  windowDispatchSeasonChange
} from '../config/seasonalEvent';
import { prefersReducedMotion } from '../utils/motion';
import { createBatSwarm } from '../utils/batSwarm';
import {
  FNM_BOOT_DELAY,
  FNM_PHASES,
  FNM_SWARM_COUNT
} from '../config/fortnitemaresTimeline';
/**
 * One-time Fortnitemares entrance, built in PARTS.
 *
 * Nothing covers the interface: the component publishes a `data-fnm-phase`
 * attribute to <html> and CSS transforms the real UI piece by piece — first
 * the wordmark (with the swarm), then the ground (grid crossfades to forest),
 * then the seasonal glow. The only elements this component renders are the
 * persistent haunted-forest layer and, while the cinematic runs, a skip
 * button.
 */
export function FortnitemaresTransition({ onComplete }) {
  const [phase, setPhase] = useState(null);
  const [armed, setArmed] = useState(false);
  // Whether the seasonal theme is on right now: owns the persistent forest.
  const [themed, setThemed] = useState(() => isFortnitemaresActive());
  const timersRef = useRef([]);
  const swarmRef = useRef(null);
  const skipButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Keep the forest layer honest while the tab stays open: dev toggles and
  // the season ending both broadcast on this channel.
  useEffect(() => {
    const sync = (e) => setThemed(e?.detail?.active !== undefined ? Boolean(e.detail.active) : isFortnitemaresActive());
    window.addEventListener('spritedex:season-change', sync);
    return () => window.removeEventListener('spritedex:season-change', sync);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const teardown = useCallback(() => {
    clearTimers();
    if (swarmRef.current) {
      swarmRef.current.stop();
      swarmRef.current = null;
    }
  }, [clearTimers]);

  const finish = useCallback(() => {
    teardown();
    setPhase(null);
    setArmed(false);
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-fnm-phase');
    }
    // The themed interface stays on; the intro simply stops driving it.
    applySeasonalTheme(true);
    markFortnitemaresIntroSeen();
    if (onCompleteRef.current) onCompleteRef.current();
  }, [teardown]);

  const start = useCallback(() => {
    clearTimers();
    previousFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null;

    for (const step of FNM_PHASES) {
      timersRef.current.push(
        setTimeout(() => {
          if (step.id === 'title') {
            // Parte 1: la marca. La clase enciende el tema (con cada capa
            // gateada a su fase) y el Header muta el wordmark y la calabaza.
            applySeasonalTheme(true);
            windowDispatchSeasonChange(true);
            swarmRef.current = createBatSwarm({ count: FNM_SWARM_COUNT, mode: 'burst' });
          }
          if (step.id === 'done') {
            finish();
            return;
          }
          setPhase(step.id);
        }, step.at)
      );
    }
  }, [clearTimers, finish]);

  const dismiss = useCallback(() => {
    teardown();
    setPhase(null);
    setArmed(false);
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-fnm-phase');
    }
    // Dismissing mid-sequence still lands on the themed interface.
    applySeasonalTheme(isFortnitemaresActive());
    if (isFortnitemaresActive()) {
      windowDispatchSeasonChange(true);
      setThemed(true);
    }
    markFortnitemaresIntroSeen();
    if (onCompleteRef.current) onCompleteRef.current();
  }, [teardown]);

  // Boot: decide whether this visit sees the cinematic at all.
  useEffect(() => {
    if (!isFortnitemaresActive()) {
      applySeasonalTheme(false);
      return undefined;
    }

    /* Replay de desarrollo: ?intro=1 fuerza la cinematica aunque la bandera ya
       este puesta o el visitante tenga el movimiento reducido. Vive detras de
       IS_DEV_BUILD, asi que no existe en produccion: un visitante no repite la
       cinematica por recargar. */
    const forceReplay = IS_DEV_BUILD
      && typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).has('intro');

    if (hasSeenFortnitemaresIntro() && !forceReplay) {
      applySeasonalTheme(true);
      windowDispatchSeasonChange(true);
      return undefined;
    }

    if (prefersReducedMotion() && !forceReplay) {
      // No cinematic: theme on, immediately, and never replayed. The dispatch
      // syncs the Header, whose initial read predates this effect.
      applySeasonalTheme(true);
      windowDispatchSeasonChange(true);
      markFortnitemaresIntroSeen();
      if (onCompleteRef.current) onCompleteRef.current();
      return undefined;
    }

    setArmed(true);
    return undefined;
  }, []);

  // Run the cinematic one tick after mount so the first frame is still the
  // normal interface; the first part then begins in front of the user.
  useEffect(() => {
    if (!armed) return undefined;
    const kick = setTimeout(() => start(), FNM_BOOT_DELAY);
    return () => clearTimeout(kick);
  }, [armed, start]);

  useEffect(() => () => teardown(), [teardown]);

  // Publish the phase to CSS so the real interface animates in place. While
  // the cinematic is armed but the first part has not fired yet, hold the
  // 'boot' phase: the theme class is on, but every themed layer stays gated
  // so the visitor still sees the normal web.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (phase) root.setAttribute('data-fnm-phase', phase);
    else if (armed) root.setAttribute('data-fnm-phase', 'boot');
    else root.removeAttribute('data-fnm-phase');
  }, [phase, armed]);

  // Focus handling for the skip control.
  useEffect(() => {
    if (armed && skipButtonRef.current) skipButtonRef.current.focus();
  }, [armed]);

  useEffect(() => {
    if (armed) return undefined;
    const previous = previousFocusRef.current;
    if (previous && typeof previous.focus === 'function' && previous.isConnected) previous.focus();
    previousFocusRef.current = null;
    return undefined;
  }, [armed]);

  useEffect(() => {
    if (!armed) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        dismiss();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [armed, dismiss]);

  // Development replay hook: development builds only, so a stray dispatch can
  // never force the theme outside the event window in production.
  useEffect(() => {
    if (!IS_DEV_BUILD) return undefined;

    const handleReplay = () => {
      applySeasonalTheme(false);
      windowDispatchSeasonChange(false);
      setPhase(null);
      setThemed(false);
      setArmed(true);
    };

    window.addEventListener('spritedex:replay-fortnitemares', handleReplay);
    return () => window.removeEventListener('spritedex:replay-fortnitemares', handleReplay);
  }, []);

  if (!themed && !armed) return null;

  return (
    <>
      {armed && (
        <div className="fnm-cinematic" data-phase={phase || 'boot'}>
          {/* Nada tapa la interfaz: las piezas reales se transforman solas. */}
          <button
            type="button"
            className="fnm-skip-btn"
            ref={skipButtonRef}
            onClick={dismiss}
          >
            Skip
          </button>
        </div>
      )}
    </>
  );
}

export default FortnitemaresTransition;
