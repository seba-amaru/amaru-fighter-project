/**
 * FightTimer Engine - Motor de Intervalos de Alta Precisión
 * Gestiona la máquina de estados, compensación de desfase de reloj (drift compensation) y Screen Wake Lock.
 */

export const TimerPhase = Object.freeze({
  IDLE: 'IDLE',
  PREPARE: 'PREPARE',
  WORK: 'WORK',
  WARNING: 'WARNING',
  REST: 'REST',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED'
});

export class FightTimerEngine {
  constructor(config = {}, callbacks = {}) {
    this.config = {
      rounds: 5,
      prepareDuration: 10,
      workDuration: 300,
      restDuration: 60,
      warningAlertAt: 10,
      direction: 'COUNTDOWN',
      keepAwake: true,
      ...config
    };

    this.callbacks = {
      onTick: () => {},
      onPhaseChange: () => {},
      onWarning: () => {},
      onRoundChange: () => {},
      onComplete: () => {},
      ...callbacks
    };

    this.currentRound = 1;
    this.phase = TimerPhase.IDLE;
    this.previousPhase = null;
    this.remainingMs = 0;
    this.phaseTotalMs = 0;
    this.isRunning = false;

    // Control de tiempo de alta precisión
    this.expectedNextTick = 0;
    this.timerId = null;
    this.TICK_INTERVAL_MS = 100; // Resolución a 100ms
    this.wakeLock = null;
    this.warningFiredInCurrentPhase = false;

    this._initializeDurations();
  }

  _initializeDurations() {
    const initialSecs = this.config.prepareDuration > 0
      ? this.config.prepareDuration
      : this.config.workDuration;
    this.remainingMs = initialSecs * 1000;
    this.phaseTotalMs = this.remainingMs;
  }

  /**
   * Carga una nueva configuración o preset deportivo
   */
  loadPreset(newConfig) {
    this.stop();
    this.config = { ...this.config, ...newConfig };
    this.reset();
  }

  /**
   * Inicia o despausa el temporizador
   */
  async start() {
    if (this.isRunning) return;

    if (this.phase === TimerPhase.IDLE || this.phase === TimerPhase.FINISHED) {
      this.currentRound = 1;
      this.warningFiredInCurrentPhase = false;
      const initialPhase = this.config.prepareDuration > 0 ? TimerPhase.PREPARE : TimerPhase.WORK;
      this._setPhase(initialPhase);
      const secs = initialPhase === TimerPhase.PREPARE ? this.config.prepareDuration : this.config.workDuration;
      this.remainingMs = secs * 1000;
      this.phaseTotalMs = this.remainingMs;
      if (initialPhase === TimerPhase.WORK) {
        this.callbacks.onRoundChange(this.currentRound, this.config.rounds);
      }
    } else if (this.phase === TimerPhase.PAUSED) {
      this.phase = this.previousPhase || TimerPhase.WORK;
      this.callbacks.onPhaseChange(this.phase, this.currentRound);
    }

    this.isRunning = true;
    this.expectedNextTick = performance.now() + this.TICK_INTERVAL_MS;
    this._scheduleNextTick();
    await this._requestWakeLock();
  }

  /**
   * Pausa la sesión activa
   */
  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.previousPhase = this.phase;
    this.phase = TimerPhase.PAUSED;
    this.callbacks.onPhaseChange(this.phase, this.currentRound);
    this._releaseWakeLock();
  }

  /**
   * Alterna entre iniciar y pausar
   */
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * Reinicia el temporizador al estado inicial
   */
  reset() {
    this.stop();
    this.currentRound = 1;
    this.phase = TimerPhase.IDLE;
    this.previousPhase = null;
    this.warningFiredInCurrentPhase = false;
    this._initializeDurations();
    this._notifyTick();
    this.callbacks.onPhaseChange(this.phase, this.currentRound);
  }

  /**
   * Detiene el reloj y libera recursos
   */
  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this._releaseWakeLock();
  }

  /**
   * Salta al siguiente round
   */
  nextRound() {
    if (this.currentRound < this.config.rounds) {
      this.currentRound++;
      this.warningFiredInCurrentPhase = false;
      this._setPhase(TimerPhase.WORK);
      this.remainingMs = this.config.workDuration * 1000;
      this.phaseTotalMs = this.remainingMs;
      this.callbacks.onRoundChange(this.currentRound, this.config.rounds);
      this._notifyTick();
    } else {
      this.phase = TimerPhase.FINISHED;
      this.stop();
      this.callbacks.onComplete();
    }
  }

  /**
   * Retrocede al round anterior
   */
  previousRound() {
    if (this.currentRound > 1) {
      this.currentRound--;
    }
    this.warningFiredInCurrentPhase = false;
    this._setPhase(TimerPhase.WORK);
    this.remainingMs = this.config.workDuration * 1000;
    this.phaseTotalMs = this.remainingMs;
    this.callbacks.onRoundChange(this.currentRound, this.config.rounds);
    this._notifyTick();
  }

  /**
   * Ciclo de tiempo con compensación de deriva de milisegundos
   */
  _scheduleNextTick() {
    if (!this.isRunning) return;

    const now = performance.now();
    const drift = now - this.expectedNextTick;

    this.remainingMs = Math.max(0, this.remainingMs - this.TICK_INTERVAL_MS);

    this._handlePhaseLogic();
    this._notifyTick();

    if (this.isRunning) {
      this.expectedNextTick += this.TICK_INTERVAL_MS;
      const nextDelay = Math.max(0, this.TICK_INTERVAL_MS - drift);
      this.timerId = setTimeout(() => this._scheduleNextTick(), nextDelay);
    }
  }

  _handlePhaseLogic() {
    const remainingSeconds = Math.ceil(this.remainingMs / 1000);

    // Advertencia de final de round (ej. últimos 10 o 30 segundos)
    if (
      this.phase === TimerPhase.WORK &&
      !this.warningFiredInCurrentPhase &&
      remainingSeconds <= this.config.warningAlertAt &&
      remainingSeconds > 0
    ) {
      this.warningFiredInCurrentPhase = true;
      this.callbacks.onWarning(remainingSeconds);
    }

    if (this.remainingMs <= 0) {
      this._transitionToNextPhase();
    }
  }

  _transitionToNextPhase() {
    this.warningFiredInCurrentPhase = false;

    if (this.phase === TimerPhase.PREPARE) {
      this._setPhase(TimerPhase.WORK);
      this.remainingMs = this.config.workDuration * 1000;
      this.phaseTotalMs = this.remainingMs;
      this.callbacks.onRoundChange(this.currentRound, this.config.rounds);
    } else if (this.phase === TimerPhase.WORK) {
      if (this.currentRound < this.config.rounds) {
        if (this.config.restDuration > 0) {
          this._setPhase(TimerPhase.REST);
          this.remainingMs = this.config.restDuration * 1000;
          this.phaseTotalMs = this.remainingMs;
        } else {
          // Sin descanso (Open Mat o EMOM continuo)
          this.currentRound++;
          this.remainingMs = this.config.workDuration * 1000;
          this.phaseTotalMs = this.remainingMs;
          this.callbacks.onRoundChange(this.currentRound, this.config.rounds);
        }
      } else {
        this._setPhase(TimerPhase.FINISHED);
        this.stop();
        this.callbacks.onComplete();
      }
    } else if (this.phase === TimerPhase.REST) {
      this.currentRound++;
      this._setPhase(TimerPhase.WORK);
      this.remainingMs = this.config.workDuration * 1000;
      this.phaseTotalMs = this.remainingMs;
      this.callbacks.onRoundChange(this.currentRound, this.config.rounds);
    }
  }

  _setPhase(newPhase) {
    this.phase = newPhase;
    this.callbacks.onPhaseChange(this.phase, this.currentRound);
  }

  _notifyTick() {
    const progress = this.phaseTotalMs > 0
      ? 1 - (this.remainingMs / this.phaseTotalMs)
      : 1;

    this.callbacks.onTick({
      remainingMs: this.remainingMs,
      secondsFormatted: this.formatTime(this.remainingMs),
      remainingSeconds: Math.ceil(this.remainingMs / 1000),
      progressRatio: Math.min(1, Math.max(0, progress)),
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.config.rounds,
      isRunning: this.isRunning
    });
  }

  formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async _requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && this.config.keepAwake) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock no disponible:', err);
      }
    }
  }

  _releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {
        // Ignore
      }
      this.wakeLock = null;
    }
  }
}
