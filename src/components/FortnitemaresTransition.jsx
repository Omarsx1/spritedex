import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IS_DEV_BUILD,
  INTRO_TIMELINE,
  applySeasonalTheme,
  hasSeenFortnitemaresIntro,
  isFortnitemaresActive,
  markFortnitemaresIntroSeen
} from '../config/seasonalEvent';
import { prefersReducedMotion } from '../utils/motion';
import { fireBatSwarm } from '../utils/confetti';

/**
 * One-time Fortnitemares entrance cinematic.
 * Plays once per browser during the event, can be dismissed with mouse or
 * keyboard, and is skipped completely for reduced-motion visitors.
 */
export function FortnitemaresTransition({ onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0); // 0 idle, 1 glitch, 2 lightning + bats, 3 fog, 4 fade out
  const [glitchText, setGlitchText] = useState('FORTNITE');
  const timeoutRefs = useRef([]);
  const skipButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimers = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  const startTransition = useCallback(() => {
    clearTimers();
    previousFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null;
    setIsPlaying(true);
    setStep(1);

    const push = (delay, fn) => {
      timeoutRefs.current.push(setTimeout(fn, delay));
    };

    // 120ms: the logo and the scanlines start corrupting.
    push(INTRO_TIMELINE.corrupt, () => {
      setGlitchText('F̸O̸R̸T̸N̸I̸T̸E̸');
      setStep(1);
    });

    // 320ms: purple lightning and the bat swarm.
    push(INTRO_TIMELINE.transform, () => {
      setStep(2);
      setGlitchText('FORTNITEMARES');
      applySeasonalTheme(true);
      fireBatSwarm();
    });

    // 780ms: spectral fog and the warning line.
    push(INTRO_TIMELINE.curse, () => setStep(3));

    // 1300ms: the curtain fades out (600ms CSS transition).
    push(INTRO_TIMELINE.fade, () => setStep(4));

    // 1900ms: the cinematic is over.
    push(INTRO_TIMELINE.end, () => {
      clearTimers();
      markFortnitemaresIntroSeen();
      setIsPlaying(false);
      if (onCompleteRef.current) onCompleteRef.current();
    });
  }, [clearTimers]);

  const dismiss = useCallback(() => {
    clearTimers();
    applySeasonalTheme(isFortnitemaresActive());
    markFortnitemaresIntroSeen();
    setIsPlaying(false);
    if (onCompleteRef.current) onCompleteRef.current();
  }, [clearTimers]);

  // Boot: decide whether this visit sees the cinematic.
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
      // The visitor asked for less motion: no cinematic, straight to the theme.
      applySeasonalTheme(true);
      markFortnitemaresIntroSeen();
      if (onCompleteRef.current) onCompleteRef.current();
      return undefined;
    }

    const initialDelay = setTimeout(() => startTransition(), INTRO_TIMELINE.bootDelay);
    return () => clearTimeout(initialDelay);
  }, [startTransition]);

  // Move focus into the dialog while it plays.
  useEffect(() => {
    if (!isPlaying) return undefined;
    if (skipButtonRef.current) skipButtonRef.current.focus();
    return undefined;
  }, [isPlaying]);

  // Restore the previous focus once the dialog closes.
  useEffect(() => {
    if (isPlaying) return undefined;
    const previous = previousFocusRef.current;
    if (previous && typeof previous.focus === 'function' && previous.isConnected) {
      previous.focus();
    }
    previousFocusRef.current = null;
    return undefined;
  }, [isPlaying]);

  // Keyboard: Escape/Enter/Space dismiss; Tab stays inside the single-control dialog.
  useEffect(() => {
    if (!isPlaying) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        if (skipButtonRef.current) skipButtonRef.current.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, dismiss]);

  // Development/testing replay hook. Registered in development builds only so
  // a stray dispatch cannot force the theme outside the event window in production.
  useEffect(() => {
    if (!IS_DEV_BUILD) return undefined;

    const handleReplay = () => {
      applySeasonalTheme(false);
      setTimeout(() => startTransition(), 100);
    };

    window.addEventListener('spritedex:replay-fortnitemares', handleReplay);
    return () => window.removeEventListener('spritedex:replay-fortnitemares', handleReplay);
  }, [startTransition]);

  if (!isPlaying) return null;

  return (
    <div
      className={'fnm-transition-overlay fnm-step-' + step}
      onMouseDown={(event) => {
        // Pointer shortcut: clicking the backdrop also skips the cinematic.
        if (event.target === event.currentTarget) dismiss();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Fortnitemares intro"
    >
      {/* Corrupted CRT scanlines and cursed-TV static */}
      <div className="fnm-crt-scanlines" />
      <div className="fnm-crt-flicker" />

      {/* Purple and crimson energy flash */}
      {step >= 2 && <div className="fnm-lightning-flash" />}

      {/* Visual core of the transformation */}
      <div className="fnm-center-content">
        <div className="fnm-spooky-aura" />

        <div className="fnm-glitch-title-wrap">
          <span className="fnm-glitch-badge">⚠️ SIGNAL CORRUPTED</span>
          <h2 className="fnm-glitch-title" data-text={glitchText}>
            {glitchText}
          </h2>
          <span className="fnm-glitch-sub">
            {step >= 2 ? 'THE GAME IS CURSED' : 'SYNCING EVENT...'}
          </span>
        </div>

        {/* Silhouetted ambient bats */}
        <div className="fnm-bat-ambient fnm-bat-1">🦇</div>
        <div className="fnm-bat-ambient fnm-bat-2">🦇</div>
        <div className="fnm-bat-ambient fnm-bat-3">🦇</div>
        <div className="fnm-bat-ambient fnm-bat-4">🦇</div>
      </div>

      <button
        type="button"
        className="fnm-skip-btn"
        ref={skipButtonRef}
        onClick={dismiss}
      >
        Skip intro
      </button>
    </div>
  );
}

export default FortnitemaresTransition;
