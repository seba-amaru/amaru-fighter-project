import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FightTimerEngine, TimerPhase } from '../src/timer/timerEngine.js';
import {
  getAllPresets,
  getPresetById,
  saveCustomPreset,
  getCustomPresets,
  getCustomPreset,
  saveEditableCustomPreset,
  createCustomPreset,
  deleteCustomPreset,
  saveVoiceGender,
  getVoiceGender
} from '../src/timer/presets.js';
import { SoundService } from '../src/timer/soundService.js';

describe('FightTimer - Presets Library (@backend / @qa)', () => {
  it('contiene los presets requeridos para deportes de contacto y HIIT', () => {
    const presets = getAllPresets();
    const ids = presets.map((p) => p.id);

    expect(ids).toContain('bjj-standard');
    expect(ids).toContain('bjj-open-mat');
    expect(ids).toContain('muay-thai-sparring');
    expect(ids).toContain('mma-pro');
    expect(ids).toContain('tabata-classic');
    expect(ids).toContain('emom-circuit');
    expect(ids).toContain('custom-timer');
  });

  it('el preset de BJJ Standard tiene 5 min work, 1 min rest, 5 rounds y aviso a 30s', () => {
    const bjj = getPresetById('bjj-standard');
    expect(bjj.settings.workDuration).toBe(300);
    expect(bjj.settings.restDuration).toBe(60);
    expect(bjj.settings.rounds).toBe(5);
    expect(bjj.settings.warningAlertAt).toBe(30);
  });

  it('el preset de Muay Thai tiene 3 min work, 1 min rest y aviso a 10s', () => {
    const mt = getPresetById('muay-thai-sparring');
    expect(mt.settings.workDuration).toBe(180);
    expect(mt.settings.restDuration).toBe(60);
    expect(mt.settings.warningAlertAt).toBe(10);
  });

  it('el preset de Tabata Clásico tiene 20s work, 10s rest y 8 rounds', () => {
    const tabata = getPresetById('tabata-classic');
    expect(tabata.settings.workDuration).toBe(20);
    expect(tabata.settings.restDuration).toBe(10);
    expect(tabata.settings.rounds).toBe(8);
  });

  it('permite guardar y recuperar presets personalizados', () => {
    const custom = {
      id: 'custom-boxing-sparring',
      name: 'Boxeo Amateur 3x3',
      category: 'Boxeo',
      description: '3 rounds de 3 minutos',
      settings: {
        rounds: 3,
        prepareDuration: 5,
        workDuration: 180,
        restDuration: 60,
        warningAlertAt: 10
      }
    };

    saveCustomPreset(custom);
    const customList = getCustomPresets();
    expect(customList.some((p) => p.id === 'custom-boxing-sparring')).toBe(true);
  });

  it('permite personalizar y modificar rondas, trabajo y descanso del preset personalizable', () => {
    const defaultCustom = getCustomPreset();
    expect(defaultCustom.id).toBe('custom-timer');
    expect(defaultCustom.isCustom).toBe(true);

    const updated = saveEditableCustomPreset({
      rounds: 12,
      workDuration: 120, // 2 min
      restDuration: 30,  // 30 seg
      prepareDuration: 5,
      warningAlertAt: 15
    });

    expect(updated.settings.rounds).toBe(12);
    expect(updated.settings.workDuration).toBe(120);
    expect(updated.settings.restDuration).toBe(30);
    expect(updated.settings.prepareDuration).toBe(5);
    expect(updated.settings.warningAlertAt).toBe(15);

    // Debe persistir y poder consultarse por ID
    const retrieved = getPresetById('custom-timer');
    expect(retrieved.settings.rounds).toBe(12);
    expect(retrieved.settings.workDuration).toBe(120);
    expect(retrieved.settings.restDuration).toBe(30);
  });

  it('permite crear nuevos presets con nombre y eliminarlos de la biblioteca', () => {
    const created = createCustomPreset('Sparring No-Gi 6m', {
      rounds: 6,
      workDuration: 360,
      restDuration: 60,
      prepareDuration: 10,
      warningAlertAt: 30
    });

    expect(created.name).toBe('Sparring No-Gi 6m');
    expect(created.isSavedPreset).toBe(true);
    expect(created.settings.workDuration).toBe(360);

    const all = getAllPresets();
    expect(all.some((p) => p.id === created.id)).toBe(true);

    const retrieved = getPresetById(created.id);
    expect(retrieved.name).toBe('Sparring No-Gi 6m');

    // Eliminar preset creado
    const deleted = deleteCustomPreset(created.id);
    expect(deleted).toBe(true);

    const afterDelete = getAllPresets();
    expect(afterDelete.some((p) => p.id === created.id)).toBe(false);
  });

  it('persiste y recupera la preferencia de género de voz (femenina / masculina)', () => {
    saveVoiceGender('male');
    expect(getVoiceGender()).toBe('male');

    saveVoiceGender('female');
    expect(getVoiceGender()).toBe('female');
  });
});

describe('FightTimerEngine - Máquina de Estados y Lógica (@backend / @qa)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('inicializa correctamente en fase IDLE con tiempo formateado', () => {
    const engine = new FightTimerEngine({
      workDuration: 300,
      prepareDuration: 10,
      rounds: 5
    });

    expect(engine.phase).toBe(TimerPhase.IDLE);
    expect(engine.currentRound).toBe(1);
    expect(engine.formatTime(300000)).toBe('05:00');
    expect(engine.formatTime(10000)).toBe('00:10');
  });

  it('inicia en fase PREPARE y transiciona a WORK al consumir el tiempo de preparación', async () => {
    const onPhaseChange = vi.fn();
    const onRoundChange = vi.fn();

    const engine = new FightTimerEngine(
      {
        prepareDuration: 2, // 2 segundos de preparación
        workDuration: 10,
        restDuration: 5,
        rounds: 3
      },
      { onPhaseChange, onRoundChange }
    );

    await engine.start();
    expect(engine.phase).toBe(TimerPhase.PREPARE);
    expect(onPhaseChange).toHaveBeenCalledWith(TimerPhase.PREPARE, 1);

    // Avanzar 2 segundos (2000 ms)
    vi.advanceTimersByTime(2000);

    expect(engine.phase).toBe(TimerPhase.WORK);
    expect(onPhaseChange).toHaveBeenCalledWith(TimerPhase.WORK, 1);
    expect(onRoundChange).toHaveBeenCalledWith(1, 3);

    engine.stop();
  });

  it('dispara onWarning cuando el tiempo restante alcanza warningAlertAt', async () => {
    const onWarning = vi.fn();

    const engine = new FightTimerEngine(
      {
        prepareDuration: 0,
        workDuration: 10,
        warningAlertAt: 3,
        rounds: 1
      },
      { onWarning }
    );

    await engine.start();
    expect(engine.phase).toBe(TimerPhase.WORK);

    // Avanzar 7 segundos (quedan 3 segundos)
    vi.advanceTimersByTime(7000);

    expect(onWarning).toHaveBeenCalledWith(3);

    engine.stop();
  });

  it('transiciona a REST al terminar el round de trabajo y avanza de round', async () => {
    const onPhaseChange = vi.fn();

    const engine = new FightTimerEngine(
      {
        prepareDuration: 0,
        workDuration: 5,
        restDuration: 3,
        rounds: 2
      },
      { onPhaseChange }
    );

    await engine.start();
    expect(engine.phase).toBe(TimerPhase.WORK);

    // Avanzar 5 segundos para terminar el round 1
    vi.advanceTimersByTime(5000);

    expect(engine.phase).toBe(TimerPhase.REST);
    expect(onPhaseChange).toHaveBeenCalledWith(TimerPhase.REST, 1);

    // Avanzar 3 segundos de descanso
    vi.advanceTimersByTime(3000);

    expect(engine.phase).toBe(TimerPhase.WORK);
    expect(engine.currentRound).toBe(2);

    engine.stop();
  });

  it('dispara onComplete al finalizar el último round programado', async () => {
    const onComplete = vi.fn();

    const engine = new FightTimerEngine(
      {
        prepareDuration: 0,
        workDuration: 2,
        restDuration: 1,
        rounds: 1 // Solo 1 round
      },
      { onComplete }
    );

    await engine.start();
    vi.advanceTimersByTime(2000);

    expect(engine.phase).toBe(TimerPhase.FINISHED);
    expect(onComplete).toHaveBeenCalled();
    expect(engine.isRunning).toBe(false);
  });

  it('permite pausar, reanudar con toggle() y reiniciar con reset()', async () => {
    const engine = new FightTimerEngine({
      prepareDuration: 0,
      workDuration: 60,
      rounds: 3
    });

    await engine.start();
    expect(engine.isRunning).toBe(true);

    engine.toggle(); // Pausar
    expect(engine.isRunning).toBe(false);
    expect(engine.phase).toBe(TimerPhase.PAUSED);

    engine.toggle(); // Reanudar
    expect(engine.isRunning).toBe(true);

    engine.reset();
    expect(engine.phase).toBe(TimerPhase.IDLE);
    expect(engine.currentRound).toBe(1);
    expect(engine.isRunning).toBe(false);
  });
});

describe('SoundService - Servicios de Audio y Háptica (@backend / @qa)', () => {
  it('instancia correctamente con lang latinoamericano por defecto (es-CL)', () => {
    const sound = new SoundService();
    expect(sound.options.soundEnabled).toBe(true);
    expect(sound.options.voiceEnabled).toBe(true);
    expect(sound.options.voiceLang).toBe('es-CL');

    sound.setVolume(0.5);
    expect(sound.options.volume).toBe(0.5);

    // Métodos tolerantes que no lanzan errores en entorno sin audio hardware
    expect(() => sound.playBoxingBell()).not.toThrow();
    expect(() => sound.playWarningBeep()).not.toThrow();
    expect(() => sound.playBuzzer()).not.toThrow();
    expect(() => sound.speak('Prueba')).not.toThrow();
    expect(() => sound.vibrate(200)).not.toThrow();
  });

  describe('SoundService.findBestLatinVoice - Jerarquía de Selección de Voces', () => {
    it('prioriza explícitamente voces con lang es-CL o etiquetas chilenas sobre otras', () => {
      const mockVoices = [
        { name: 'Monica (Spain)', lang: 'es-ES' },
        { name: 'Paulina (Mexico)', lang: 'es-MX' },
        { name: 'Francisca (Chile)', lang: 'es-CL' },
        { name: 'Diego (Argentina)', lang: 'es-AR' }
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL');
      expect(selected).not.toBeNull();
      expect(selected.lang).toBe('es-CL');
      expect(selected.name).toContain('Chile');
    });

    it('hace fallback a México (es-MX / es-419 / Latin America) si no hay voz chilena', () => {
      const mockVoices = [
        { name: 'Monica', lang: 'es-ES' },
        { name: 'Google Español de México', lang: 'es-MX' },
        { name: 'Diego', lang: 'es-AR' }
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL');
      expect(selected).not.toBeNull();
      expect(selected.lang).toBe('es-MX');
    });

    it('soporta etiquetas con es-419 o Latin America como estándar latino', () => {
      const mockVoices = [
        { name: 'Mónica', lang: 'es-ES' },
        { name: 'Latin America Neural', lang: 'es-419' }
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL');
      expect(selected).not.toBeNull();
      expect(selected.lang).toBe('es-419');
    });

    it('hace fallback a otros países de Latinoamérica (es-AR, es-CO, etc.) antes de usar España', () => {
      const mockVoices = [
        { name: 'Monica de España', lang: 'es-ES' },
        { name: 'Diego de Argentina', lang: 'es-AR' }
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL');
      expect(selected).not.toBeNull();
      expect(selected.lang).toBe('es-AR');
    });

    it('utiliza es-ES como último recurso si es la única voz en español instalada en el dispositivo', () => {
      const mockVoices = [
        { name: 'David (English)', lang: 'en-US' },
        { name: 'Monica (España)', lang: 'es-ES' }
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL');
      expect(selected).not.toBeNull();
      expect(selected.lang).toBe('es-ES');
    });

    it('permite conmutar entre voz femenina y masculina', () => {
      const sound = new SoundService();
      expect(sound.options.voiceGender).toBe('female');

      sound.setVoiceGender('male');
      expect(sound.options.voiceGender).toBe('male');

      sound.setVoiceGender('female');
      expect(sound.options.voiceGender).toBe('female');
    });

    it('prioriza voces masculinas cuando se solicita preferredGender: "male"', () => {
      const mockVoices = [
        { name: 'Francisca (Chile)', lang: 'es-CL' }, // Femenina
        { name: 'Jorge (Chile)', lang: 'es-CL' }       // Masculina
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL', 'male');
      expect(selected).not.toBeNull();
      expect(selected.name).toContain('Jorge');
    });

    it('prioriza voces femeninas cuando se solicita preferredGender: "female"', () => {
      const mockVoices = [
        { name: 'Diego (Argentina)', lang: 'es-AR' },  // Masculina
        { name: 'Paulina (Mexico)', lang: 'es-MX' }    // Femenina
      ];

      const selected = SoundService.findBestLatinVoice(mockVoices, 'es-CL', 'female');
      expect(selected).not.toBeNull();
      expect(selected.name).toContain('Paulina');
    });
  });
});
