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
 * One-time Fortnitemares entrance.
 *
 * Unlike a full-screen curtain, this drives the *real* interface: it applies
 * a `data-fnm-phase` attribute to <html> and lets CSS transform the existing
 * logo, background and dock in place. The only elements this component renders
 * are non-interactive atmospheric layers (scanlines, vignette) plus a skip
 * button, so nothing covers or duplicates the live UI.
 */
export function FortnitemaresTransition({ onComplete }) {
  const [phase, setPhase] = useState(null);
  const [armed, setArmed] = useState(false);
  const timersRef = useRef([]);
  const swarmRef = useRef(null);
  const skipButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
          if (step.id === 'swarm') {
            swarmRef.current = createBatSwarm({ count: FNM_SWARM_COUNT, mode: 'burst' });
          }
          if (step.id === 'brand') {
            applySeasonalTheme(true);
            windowDispatchSeasonChange(true);
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
    // Dismissing mid-corruption still lands on the themed interface.
    applySeasonalTheme(isFortnitemaresActive());
    if (isFortnitemaresActive()) windowDispatchSeasonChange(true);
    markFortnitemaresIntroSeen();
    if (onCompleteRef.current) onCompleteRef.current();
  }, [teardown]);

  // Boot: decide whether this visit sees the cinematic at all.
  useEffect(() => {
    if (!isFortnitemaresActive()) {
      applySeasonalTheme(false);
      return undefined;
    }

    if (hasSeenFortnitemaresIntro()) {
      applySeasonalTheme(true);
      return undefined;
    }

    if (prefersReducedMotion()) {
      // No cinematic: theme on, immediately, and never replayed.
      applySeasonalTheme(true);
      markFortnitemaresIntroSeen();
      if (onCompleteRef.current) onCompleteRef.current();
      return undefined;
    }

    setArmed(true);
    return undefined;
  }, []);

  // Run the cinematic one tick after mount so the first frame is still the
  // normal interface; the corruption then happens in front of the user.
  useEffect(() => {
    if (!armed) return undefined;
    const kick = setTimeout(() => start(), FNM_BOOT_DELAY);
    return () => clearTimeout(kick);
  }, [armed, start]);

  useEffect(() => () => teardown(), [teardown]);

  // Publish the phase to CSS so the real interface animates in place.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (phase) root.setAttribute('data-fnm-phase', phase);
    else root.removeAttribute('data-fnm-phase');
  }, [phase]);

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
      setArmed(true);
    };

    window.addEventListener('spritedex:replay-fortnitemares', handleReplay);
    return () => window.removeEventListener('spritedex:replay-fortnitemares', handleReplay);
  }, []);

  if (!armed) return null;

  return (
    <div className="fnm-cinematic" data-phase={phase || 'boot'}>
      {/* Atmospheric layers only: they tint and distort the live UI behind them */}
      <div className="fnm-crt-scanlines" aria-hidden="true" />
      <div className="fnm-crt-flicker" aria-hidden="true" />
      <div className="fnm-corrupt-vignette" aria-hidden="true" />
      <div className="fnm-glitch-bars" aria-hidden="true" />

      <button
        type="button"
        className="fnm-skip-btn"
        ref={skipButtonRef}
        onClick={dismiss}
      >
        Skip
      </button>
    </div>
  );
}

export default FortnitemaresTransition;
