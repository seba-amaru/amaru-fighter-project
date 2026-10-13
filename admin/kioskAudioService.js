/**
 * admin/kioskAudioService.js
 * Sintetizador de audio nativo con Web Audio API para el Modo Pantalla Tatami / Kiosco TV.
 * Genera chimes de confirmación y alertas sonoras de dojo sin dependencias ni archivos mp3 externos.
 */

let audioCtx = null;

/**
 * Obtiene o inicializa el contexto de audio del navegador de forma segura
 * @returns {AudioContext|null}
 */
function getAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }

    return audioCtx;
}

/**
 * Reproduce un tono con envolvente ADSR suave
 * @param {AudioContext} ctx 
 * @param {number} freq Frecuencia en Hertz (Hz)
 * @param {number} startTime Tiempo de inicio en segundos
 * @param {number} duration Duración del tono en segundos
 * @param {'sine'|'triangle'|'square'|'sawtooth'} type Forma de onda
 * @param {number} maxGain Volumen pico (0.0 a 1.0)
 */
function playTone(ctx, freq, startTime, duration, type = 'sine', maxGain = 0.25) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envolvente: Attack rápido + Decay y Release suave
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

/**
 * Reproduce el Chime Armónico de Éxito del Dojo (Acorde brillante C5 -> E5 -> G5)
 * @returns {boolean} true si se inició la reproducción, false si audio no está disponible
 */
export function playCheckinSuccessSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return false;

        const now = ctx.currentTime;
        // Triada mayor brillante estilo campanada zen
        playTone(ctx, 523.25, now, 0.45, 'triangle', 0.22);         // C5
        playTone(ctx, 659.25, now + 0.12, 0.55, 'sine', 0.25);     // E5
        playTone(ctx, 783.99, now + 0.24, 0.85, 'sine', 0.28);     // G5
        playTone(ctx, 1046.50, now + 0.36, 1.10, 'sine', 0.18);    // C6 (brillo final)

        return true;
    } catch (err) {
        console.warn('[kioskAudioService] Error reproduciendo sonido de éxito:', err);
        return false;
    }
}

/**
 * Reproduce un sonido de Advertencia / Error (Doble tono grave descendente)
 * @returns {boolean}
 */
export function playCheckinErrorSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return false;

        const now = ctx.currentTime;
        playTone(ctx, 220.00, now, 0.22, 'sawtooth', 0.15);         // A3
        playTone(ctx, 174.61, now + 0.18, 0.35, 'sawtooth', 0.18);  // F3

        return true;
    } catch (err) {
        console.warn('[kioskAudioService] Error reproduciendo sonido de error:', err);
        return false;
    }
}

/**
 * Desbloquea el audio context tras la primera interacción del usuario en la pantalla
 */
export function unlockAudioOnFirstInteraction() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
    };

    window.addEventListener('click', unlockHandler, { once: true });
    window.addEventListener('keydown', unlockHandler, { once: true });
    window.addEventListener('touchstart', unlockHandler, { once: true });
}
