/**
 * FightTimer Sound Service
 * Síntesis de sonido procedural vía Web Audio API, avisos por voz (SpeechSynthesis) y vibración háptica.
 *
 * BLUETOOTH AUDIO ROUTING:
 * - AudioContext se inicializa con latencyHint:'playback' para clasificarse como canal multimedia.
 * - Audio HTML5 silencioso en loop mantiene activa la sesión multimedia (Bluetooth routing para SpeechSynthesis).
 * - Buffer silencioso en Web Audio API cada 25s evita que el sistema suspenda el AudioContext.
 * - Ducking de volumen: baja el masterGain antes de la locución y lo restaura al terminar.
 */

export class SoundService {
  constructor(options = {}) {
    this.options = {
      soundEnabled: true,
      voiceEnabled: true,
      vibrationEnabled: true,
      volume: 1.0,
      voiceLang: 'es-CL', // Español latinoamericano preferente (Chile / LatAm)
      voiceGender: 'female', // 'female' | 'male'
      duckingEnabled: true,  // Reducir volumen durante locución
      duckingLevel: 0.4,     // 40% del volumen durante la voz
      ...options
    };

    this._silentAudio = null;      // Audio HTML5 silencioso para Bluetooth session
    this._keepAliveTimer = null;   // Timer del buffer silencioso WebAudio
    this._isDucking = false;
    this._duckRampMs = 180;

    this.audioCtx = null;
    this.masterGain = null;
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.availableVoices = [];
    this.selectedVoice = null;

    this._initVoiceEngine();
    this._initSilentAudio();
  }

  // ---------------------------------------------------------------------------
  // BLUETOOTH AUDIO ROUTING
  // ---------------------------------------------------------------------------

  /**
   * Crea un <audio> silencioso en loop.
   * En Android/iOS el sistema sigue la ÚLTIMA fuente activa para determinar el canal de salida
   * (Bluetooth, altavoz, auriculares). Al reproducir este audio silencioso desde la primera
   * interacción, la sesión queda como 'multimedia/music'. SpeechSynthesis hereda esa sesión.
   */
  _initSilentAudio() {
    if (typeof document === 'undefined') return;
    try {
      // WAV de 1 segundo 100% silencioso (44100 Hz, 16-bit, mono)
      const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      this._silentAudio = new Audio(silentWav);
      this._silentAudio.loop = true;
      this._silentAudio.volume = 0.001; // Prácticamente inaudible
      // No autoplay — se activa después de la primera interacción del usuario
    } catch {
      // Silent fail
    }
  }

  /**
   * Inicia la reproducción del audio silencioso HTML5.
   * Esto registra una sesión multimedia activa, forzando que SpeechSynthesis
   * use el mismo canal de salida (Bluetooth / altavoz activo).
   */
  _startSilentAudioSession() {
    if (!this._silentAudio) return;
    try {
      const p = this._silentAudio.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => { /* autoplay bloqueado — se reintentará */ });
      }
    } catch { /* ignore */ }
  }

  /**
   * Inicializa la detección y carga asíncrona de voces en el navegador
   */
  _initVoiceEngine() {
    if (!this.synth) return;

    this._loadVoices();

    if (typeof this.synth.addEventListener === 'function') {
      this.synth.addEventListener('voiceschanged', () => this._loadVoices());
    } else if ('onvoiceschanged' in this.synth) {
      this.synth.onvoiceschanged = () => this._loadVoices();
    }
  }

  /**
   * Carga las voces disponibles en el dispositivo y selecciona la mejor opción latinoamericana
   */
  _loadVoices() {
    if (!this.synth || typeof this.synth.getVoices !== 'function') return [];
    try {
      const voices = this.synth.getVoices() || [];
      if (voices.length > 0) {
        this.availableVoices = voices;
        this.selectedVoice = SoundService.findBestLatinVoice(
          voices,
          this.options.voiceLang,
          this.options.voiceGender
        );
      }
      return voices;
    } catch {
      return [];
    }
  }

  /**
   * Algoritmo inteligente de selección de voz para español latinoamericano con soporte de género:
   * Evalúa dialecto (Chile > México/419 > Otros LatAm > Fallback España) combinado con género (femenino / masculino).
   */
  static findBestLatinVoice(voices, preferredLang = 'es-CL', preferredGender = 'female') {
    if (!Array.isArray(voices) || voices.length === 0) return null;

    const norm = (str) => (str || '').toLowerCase().replace(/_/g, '-').trim();

    const detectGender = (v) => {
      const text = `${v.name || ''} ${v.lang || ''}`.toLowerCase();
      if (v.gender) {
        const g = String(v.gender).toLowerCase();
        if (g.includes('female')) return 'female';
        if (g.includes('male')) return 'male';
      }

      const femaleKeywords = [
        'female', 'femenin', 'mujer', 'francisca', 'catalina', 'paulina',
        'sabina', 'dalia', 'monica', 'mónica', 'elena', 'lucia', 'lucía',
        'camila', 'sofia', 'sofía', 'paloma', 'salomé', 'valeria', 'lupe', 'rosa'
      ];
      const maleKeywords = [
        'male', 'masculin', 'hombre', 'jorge', 'raul', 'raúl', 'diego',
        'alonso', 'gonzalo', 'carlos', 'pablo', 'enrique', 'mateo', 'miguel',
        'alvaro', 'álvaro', 'fernando', 'andres', 'andrés'
      ];

      const isF = femaleKeywords.some((k) => text.includes(k));
      const isM = maleKeywords.some((k) => text.includes(k));

      if (isF && !isM) return 'female';
      if (isM && !isF) return 'male';
      return 'unknown';
    };

    // Calcular puntaje para cada voz
    const scoredVoices = voices.map((v) => {
      let score = 0;
      const lang = norm(v.lang);
      const name = norm(v.name);
      const voiceGen = detectGender(v);

      // Ponderación por dialecto
      const isChile = lang === 'es-cl' || name.includes('chile') || name.includes('chileno');
      const isStandardLatin =
        lang === 'es-mx' ||
        lang === 'es-419' ||
        lang === 'es-us' ||
        name.includes('mexic') ||
        name.includes('latin') ||
        name.includes('latino');

      const latinCodes = ['es-ar', 'es-co', 'es-pe', 'es-uy', 'es-ve', 'es-cr', 'es-ec', 'es-pa', 'es-bo', 'es-py'];
      const isOtherLatin =
        latinCodes.includes(lang) ||
        name.includes('argentin') ||
        name.includes('colomb') ||
        name.includes('peru') ||
        name.includes('perú');

      const isSpanish = lang.startsWith('es');
      const isSpain = lang === 'es-es' || name.includes('spain') || name.includes('españa');

      if (!isSpanish) {
        score = -100; // Descartar otros idiomas
      } else if (isChile) {
        score += preferredLang === 'es-CL' || !preferredLang ? 150 : 100;
      } else if (isStandardLatin) {
        score += preferredLang === 'es-MX' || preferredLang === 'es-419' ? 140 : 110;
      } else if (isOtherLatin) {
        score += 90;
      } else if (!isSpain) {
        score += 70;
      } else {
        score += 10; // Fallback España
      }

      // Ponderación por género (+25 / -15 garantiza que Latinoamérica siempre prevalezca sobre España)
      if (voiceGen === preferredGender) {
        score += 25; // Coincidencia de género
      } else if (voiceGen !== 'unknown' && voiceGen !== preferredGender) {
        score -= 15; // Penalizar género opuesto si hay opciones del género deseado
      }

      return { voice: v, score };
    });

    // Ordenar de mayor a menor puntaje
    scoredVoices.sort((a, b) => b.score - a.score);

    const best = scoredVoices[0];
    return best && best.score > -50 ? best.voice : (voices.find((v) => norm(v.lang).startsWith('es')) || null);
  }

  getSelectedVoiceInfo() {
    if (!this.selectedVoice) {
      this._loadVoices();
    }
    return this.selectedVoice
      ? { name: this.selectedVoice.name, lang: this.selectedVoice.lang, gender: this.options.voiceGender }
      : { name: null, lang: this.options.voiceLang, gender: this.options.voiceGender };
  }

  setVoiceLang(lang) {
    this.options.voiceLang = lang;
    if (this.availableVoices.length > 0) {
      this.selectedVoice = SoundService.findBestLatinVoice(
        this.availableVoices,
        lang,
        this.options.voiceGender
      );
    }
  }

  setVoiceGender(gender) {
    if (gender !== 'female' && gender !== 'male') return;
    this.options.voiceGender = gender;
    if (this.availableVoices.length > 0) {
      this.selectedVoice = SoundService.findBestLatinVoice(
        this.availableVoices,
        this.options.voiceLang,
        gender
      );
    }
  }

  _initContext() {
    if (typeof window === 'undefined') return;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        /**
         * latencyHint:'playback' indica al SO que este contexto es canal MULTIMEDIA
         * (music stream), NO notificación. Esto es clave para routing Bluetooth:
         * el sistema envía el audio al mismo dispositivo que la música (Spotify, etc.).
         */
        this.audioCtx = new AudioCtxClass({ latencyHint: 'playback' });
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.options.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);

        // Iniciar sesiones para mantener el canal multimedia activo
        this._startKeepAlive();
        this._startSilentAudioSession();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => this._startSilentAudioSession());
    }
  }

  /**
   * Mantiene vivo el AudioContext con un buffer silencioso cada 25s.
   * Sin esto, en Chrome Mobile y Safari el contexto es suspendido y
   * reclasificado como 'background', saliendo por el altavoz interno.
   */
  _startKeepAlive() {
    if (!this.audioCtx) return;
    try {
      const bufferSize = Math.min(this.audioCtx.sampleRate, 4096);
      const keepAliveBuf = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);

      const schedule = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        const src = this.audioCtx.createBufferSource();
        src.buffer = keepAliveBuf;
        const sg = this.audioCtx.createGain();
        sg.gain.value = 0; // Silencio total
        src.connect(sg);
        sg.connect(this.audioCtx.destination);
        src.start();
        this._keepAliveTimer = setTimeout(schedule, 25000);
      };

      schedule();
    } catch { /* Keep-alive no crítico */ }
  }

  /**
   * Desbloquea el audio en la primera interacción táctil/clic del usuario
   */
  unlockAudio() {
    this._initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this._startSilentAudioSession();
  }

  // ---------------------------------------------------------------------------
  // DUCKING — Reducción suave de volumen durante locución
  // ---------------------------------------------------------------------------

  /** Baja el masterGain gradualmente antes de la locución */
  _duckDown() {
    if (!this.options.duckingEnabled || !this.masterGain || !this.audioCtx) return;
    this._isDucking = true;
    const now = this.audioCtx.currentTime;
    const ramp = this._duckRampMs / 1000;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.options.volume * this.options.duckingLevel, now + ramp);
  }

  /** Restaura el masterGain al volumen normal al terminar la locución */
  _duckUp() {
    if (!this.masterGain || !this.audioCtx) return;
    this._isDucking = false;
    const now = this.audioCtx.currentTime;
    const ramp = this._duckRampMs / 1000;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.options.volume, now + ramp);
  }

  setVolume(vol) {
    this.options.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.options.volume, this.audioCtx.currentTime);
    }
  }

  /**
   * Campana de Boxeo / Gong Metálico (Bronce con armónicos)
   */
  playBoxingBell() {
    if (!this.options.soundEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const frequencies = [800, 1100, 1450, 1820];

    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const decay = 2.4 - (idx * 0.35);
      const amp = (0.35 / (idx + 1)) * this.options.volume;

      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + decay);
    });

    this.vibrate([200, 100, 250]);
  }

  /**
   * Campana Doble de Ring (para inicio de asalto o combate)
   */
  playDoubleBell() {
    this.playBoxingBell();
    setTimeout(() => {
      this.playBoxingBell();
    }, 320);
  }

  /**
   * Bocina / Buzzer de Tatami (grave y penetrante para ambientes ruidosos)
   */
  playBuzzer() {
    if (!this.options.soundEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);

    gain.gain.setValueAtTime(0.45 * this.options.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.1);

    this.vibrate(500);
  }

  /**
   * Pitido de advertencia para los últimos 10 o 3 segundos
   */
  playWarningBeep(isFinal = false) {
    if (!this.options.soundEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 1250 : 880, now);

    const duration = isFinal ? 0.35 : 0.15;
    gain.gain.setValueAtTime(0.3 * this.options.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    this.vibrate(80);
  }

  /**
   * Locución por voz sintética (SpeechSynthesis) con pronunciación latinoamericana
   */
  speak(text) {
    if (!this.options.voiceEnabled || !this.synth) return;

    try {
      this.synth.cancel(); // Limpiar cola previa

      // Si las voces aún no se habían cargado (común en Chrome al inicio), refrescar
      if (!this.selectedVoice || this.availableVoices.length === 0) {
        this._loadVoices();
      }

      /**
       * BLUETOOTH TRICK: Reproducir el audio silencioso HTML5 justo antes de hablar.
       * En Android, SpeechSynthesis sigue el AudioFocus del último elemento de audio activo.
       * Si el audio silencioso está en el canal multimedia (Bluetooth activo), la voz
       * también saldrá por el mismo canal (altavoz Bluetooth / auriculares).
       */
      this._startSilentAudioSession();

      // Ducking: bajar volumen de los sonidos de ring antes de que la voz hable
      this._duckDown();

      const utterance = new SpeechSynthesisUtterance(text);

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang || this.options.voiceLang;
      } else {
        utterance.lang = this.options.voiceLang; // 'es-CL'
      }

      if (this.options.voiceGender === 'male') {
        utterance.rate = 1.02;
        utterance.pitch = 0.88; // Voz masculina autoritaria y grave de esquina
      } else {
        utterance.rate = 1.06;
        utterance.pitch = 1.12; // Voz femenina nítida y brillante
      }
      utterance.volume = this.options.volume;

      // Restaurar volumen al terminar (duck up)
      utterance.onend = () => this._duckUp();
      utterance.onerror = () => this._duckUp();

      this.synth.speak(utterance);

      // Seguro: si onend no dispara (bug en algunos navegadores), estimar duración
      const estimatedMs = Math.max(1500, text.length * 70);
      setTimeout(() => { if (this._isDucking) this._duckUp(); }, estimatedMs + 500);

    } catch (err) {
      this._duckUp();
      console.warn('Error en SpeechSynthesis:', err);
    }
  }

  /**
   * Patrón de vibración táctil (Web Vibration API)
   */
  vibrate(pattern) {
    if (!this.options.vibrationEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors
      }
    }
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  destroy() {
    if (this._keepAliveTimer) {
      clearTimeout(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
    if (this._silentAudio) {
      try { this._silentAudio.pause(); this._silentAudio.src = ''; } catch { /* ignore */ }
      this._silentAudio = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch { /* ignore */ }
    }
    this.audioCtx = null;
    this.masterGain = null;
  }
}
