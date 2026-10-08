// Web Audio API Synthesizer & Audio Sample Manager for Spritedex

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.audioPool = {};
    // Los sonidos tienen que respetar el interruptor de silencio, como cualquier
    // aviso del sistema: eso es la categoria "ambient" en iOS. Dejandolo en "auto"
    // la pagina entera se declara "playback" — gana el HTMLMediaElement de
    // playSample por prioridad — y "playback" es justo la categoria con la que iOS
    // le entrega a Safari el reproductor de la pantalla de bloqueo.
    this.ponerCategoria('ambient');
    // Con la pagina oculta no hay nada que sonar: dormir el contexto evita que el
    // navegador mantenga una sesion de audio viva.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.dormir());
      window.addEventListener('pagehide', () => this.dormir());
    }
  }

  // Declara el tipo de audio de la pagina (iOS Safari 16.4+). Sin declararlo queda
  // en "auto" y el navegador lo deduce de las APIs de audio que ve.
  // "transient" seria el nombre ideal para efectos cortos, pero WebKit lo mapea a
  // la misma categoria que "ambient" (bug 264473), asi que no cambia nada.
  ponerCategoria(tipo) {
    if (typeof navigator === 'undefined') return;
    try {
      if (!navigator.audioSession) return;
      navigator.audioSession.type = tipo;
    } catch {
      // sin Audio Session API, o el navegador rechaza el tipo: se queda en "auto"
    }
  }

  // En iOS el contexto no queda en 'suspended' al apagar la pantalla o salir de la
  // pagina: queda en 'interrupted' (MDN, BaseAudioContext.state). Mirar solo
  // 'running' hacia que en el iPhone esto no durmiera nada.
  dormir() {
    const ctx = this.ctx;
    if (ctx && (ctx.state === 'running' || ctx.state === 'interrupted')) {
      try {
        ctx.suspend().catch(() => {});
      } catch {
        // el contexto ya no existe: nada que dormir
      }
    }
    this.limpiarSesion();
  }

  // La sesion de medios la pinta el sistema en la pantalla de bloqueo, no la app.
  // Quitar el src la cierra en Chrome; en iOS hay que decirlo explicitamente o el
  // widget "Now Playing" se queda pegado aunque la app ya este cerrada.
  limpiarSesion() {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    } catch {
      // navegador sin soporte: no hay sesion que limpiar
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // resume() es la salida tambien desde el estado 'interrupted' de iOS.
    if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
      this.ctx.resume().catch(() => {});
    }
  }

  // Helper to play audio samples with zero latency and overlap support
  playSample(src, volume = 0.7) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      // El elemento se suelta en cuanto termina. Si se queda vivo, el navegador lo
      // cuenta como sesion de medios activa y en el movil aparece un reproductor
      // fantasma en la pantalla de bloqueo, incluso despues de cerrar la app.
      let suelto = false;
      const soltar = () => {
        if (suelto) return;
        suelto = true;
        try {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch {
          // el elemento ya no esta: nada que soltar
        }
        this.limpiarSesion();
      };
      audio.addEventListener('ended', soltar, { once: true });
      audio.addEventListener('error', soltar, { once: true });
      // Red de seguridad: si 'ended' no llega (pestaña oculta, el sistema pausa),
      // se suelta al cumplirse su duracion.
      audio.addEventListener('loadedmetadata', () => {
        const ms = Number.isFinite(audio.duration) ? audio.duration * 1000 + 1200 : 5000;
        setTimeout(soltar, Math.min(ms, 20000));
      }, { once: true });
      audio.play().catch(soltar);
    } catch (e) {
      console.warn('Audio sample play error:', e);
    }
  }

  playGen2Level() {
    this.playSample('/sound cards/level_spirit.mp3', 0.65);
  }

  playGen2Maxed() {
    this.playSample('/sound cards/maxed_8_bit.mp3', 0.8);
  }

  playToggle(state, gen = 1) {
    if (!this.enabled) return;

    if (gen === 2) {
      if (state) {
        this.playGen2Level();
      } else {
        // Falling synth beep on un-catch
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
      return;
    }

    // Classic Gen 1 Synthesizer
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    if (state) {
      // Catch sound - rising tone
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    } else {
      // Uncatch sound - falling tone
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playLevelUp(level, gen = 1) {
    if (!this.enabled) return;

    // 2ª Generación custom sound effects:
    if (gen === 2) {
      if (level === 5) {
        this.playGen2Maxed();
      } else {
        this.playGen2Level();
      }
      return;
    }

    // 1ª Generación classic synthesized sounds:
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (level === 5) {
      // Mastery Fanfare (Nivel 5)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } else {
      // Regular Level Up chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 400 + level * 100;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 200, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  playBeep() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sounds = new SoundManager();
