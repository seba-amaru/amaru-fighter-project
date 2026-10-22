/**
 * Presets y Configuración Inicial para FightTimer
 * Modelos de datos para Jiu Jitsu, Muay Thai, MMA, Tabata y circuitos funcionales.
 */

export const TimerMode = Object.freeze({
  STANDARD: 'STANDARD',
  OPEN_MAT: 'OPEN_MAT',
  TABATA: 'TABATA',
  EMOM: 'EMOM',
  CUSTOM: 'CUSTOM'
});

export const PRESET_LIBRARY = [
  {
    id: 'bjj-standard',
    name: 'BJJ / No-Gi Sparring',
    category: 'Jiu Jitsu',
    description: '5 minutos de lucha x 1 min de descanso. 5 rounds estándar de tatami.',
    icon: 'swords',
    settings: {
      rounds: 5,
      prepareDuration: 10,
      workDuration: 300,
      restDuration: 60,
      warningAlertAt: 30,
      mode: TimerMode.STANDARD,
      direction: 'COUNTDOWN',
      continuousInterval: 0
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'BOXING_BELL',
      vibrate: true
    }
  },
  {
    id: 'bjj-open-mat',
    name: 'BJJ Open Mat Continuo',
    category: 'Jiu Jitsu',
    description: 'Temporizador continuo de 6 minutos con señal acústica para rotación sin descanso.',
    icon: 'refresh-cw',
    settings: {
      rounds: 10,
      prepareDuration: 5,
      workDuration: 360,
      restDuration: 0,
      warningAlertAt: 15,
      mode: TimerMode.OPEN_MAT,
      direction: 'COUNTUP',
      continuousInterval: 360
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'HORN',
      vibrate: true
    }
  },
  {
    id: 'muay-thai-sparring',
    name: 'Muay Thai / Kickboxing',
    category: 'Striking',
    description: '3 minutos de asalto x 1 min de descanso con aviso a falta de 10 segundos.',
    icon: 'flame',
    settings: {
      rounds: 5,
      prepareDuration: 10,
      workDuration: 180,
      restDuration: 60,
      warningAlertAt: 10,
      mode: TimerMode.STANDARD,
      direction: 'COUNTDOWN',
      continuousInterval: 0
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'BOXING_BELL',
      vibrate: true
    }
  },
  {
    id: 'mma-pro',
    name: 'MMA Profesional',
    category: 'MMA',
    description: '5 rounds de 5 minutos x 1 min de descanso. Aviso a los últimos 30 segundos.',
    icon: 'shield',
    settings: {
      rounds: 5,
      prepareDuration: 10,
      workDuration: 300,
      restDuration: 60,
      warningAlertAt: 30,
      mode: TimerMode.STANDARD,
      direction: 'COUNTDOWN',
      continuousInterval: 0
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'DOUBLE_GONG',
      vibrate: true
    }
  },
  {
    id: 'tabata-classic',
    name: 'Tabata Clásico',
    category: 'HIIT / Acondicionamiento',
    description: '20 segundos de máxima intensidad x 10 segundos de descanso, 8 intervalos.',
    icon: 'zap',
    settings: {
      rounds: 8,
      prepareDuration: 10,
      workDuration: 20,
      restDuration: 10,
      warningAlertAt: 3,
      mode: TimerMode.TABATA,
      direction: 'COUNTDOWN',
      continuousInterval: 0
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'WHISTLE',
      vibrate: true
    }
  },
  {
    id: 'emom-circuit',
    name: 'EMOM (Cada minuto en el minuto)',
    category: 'HIIT / Acondicionamiento',
    description: '10 rondas de 1 minuto continuo sin descanso para circuitos funcionales.',
    icon: 'timer',
    settings: {
      rounds: 10,
      prepareDuration: 10,
      workDuration: 60,
      restDuration: 0,
      warningAlertAt: 5,
      mode: TimerMode.EMOM,
      direction: 'COUNTDOWN',
      continuousInterval: 60
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'HORN',
      vibrate: true
    }
  }
];

export const DEFAULT_CUSTOM_PRESET = {
  id: 'custom-timer',
  name: 'Personalizado',
  category: 'Personalizado',
  description: 'Temporizador configurable: ajusta asaltos, tiempo de trabajo y descanso.',
  icon: 'sliders',
  isCustom: true,
  settings: {
    rounds: 5,
    prepareDuration: 10,
    workDuration: 180,
    restDuration: 60,
    warningAlertAt: 10,
    mode: TimerMode.CUSTOM,
    direction: 'COUNTDOWN',
    continuousInterval: 0
  },
  audioConfig: {
    voiceAnnouncements: true,
    warningBeep: true,
    bellStyle: 'BOXING_BELL',
    vibrate: true
  }
};

const STORAGE_KEY_CUSTOM_PRESETS = 'fighttimer_custom_presets_v1';
const STORAGE_KEY_LAST_CONFIG = 'fighttimer_last_config_v1';

export function getCustomPreset(id = 'custom-timer') {
  const customList = getCustomPresets();
  const saved = customList.find((p) => p.id === id);
  if (saved) {
    return {
      ...DEFAULT_CUSTOM_PRESET,
      ...saved,
      settings: { ...DEFAULT_CUSTOM_PRESET.settings, ...saved.settings }
    };
  }
  return { ...DEFAULT_CUSTOM_PRESET };
}

export function saveEditableCustomPreset(updatedSettings, name = 'Personalizado', presetId = 'custom-timer') {
  const current = getPresetById(presetId);
  const workSecs = updatedSettings.workDuration !== undefined ? updatedSettings.workDuration : current.settings.workDuration;
  const restSecs = updatedSettings.restDuration !== undefined ? updatedSettings.restDuration : current.settings.restDuration;
  const totalRounds = updatedSettings.rounds !== undefined ? updatedSettings.rounds : current.settings.rounds;

  const workMinDisplay = Math.floor(workSecs / 60);
  const workSecDisplay = String(workSecs % 60).padStart(2, '0');
  const restMinDisplay = Math.floor(restSecs / 60);
  const restSecDisplay = String(restSecs % 60).padStart(2, '0');

  const updatedPreset = {
    ...current,
    id: presetId,
    name: name || current.name,
    description: `${workMinDisplay}:${workSecDisplay} trabajo / ${restMinDisplay}:${restSecDisplay} descanso · ${totalRounds} rounds`,
    settings: {
      ...current.settings,
      ...updatedSettings,
      mode: TimerMode.CUSTOM
    }
  };
  saveCustomPreset(updatedPreset);
  return updatedPreset;
}

export function createCustomPreset(name, settings) {
  const cleanName = (name || '').trim() || 'Mi Preset';
  const workSecs = settings.workDuration !== undefined ? settings.workDuration : 180;
  const restSecs = settings.restDuration !== undefined ? settings.restDuration : 60;
  const totalRounds = settings.rounds !== undefined ? settings.rounds : 5;

  const workMinDisplay = Math.floor(workSecs / 60);
  const workSecDisplay = String(workSecs % 60).padStart(2, '0');
  const restMinDisplay = Math.floor(restSecs / 60);
  const restSecDisplay = String(restSecs % 60).padStart(2, '0');

  const newPreset = {
    id: `custom-${Date.now()}`,
    name: cleanName,
    category: 'Personalizado',
    description: `${workMinDisplay}:${workSecDisplay} trabajo / ${restMinDisplay}:${restSecDisplay} descanso · ${totalRounds} rounds`,
    icon: 'bookmark',
    isCustom: true,
    isSavedPreset: true,
    settings: {
      rounds: totalRounds,
      prepareDuration: settings.prepareDuration !== undefined ? settings.prepareDuration : 10,
      workDuration: workSecs,
      restDuration: restSecs,
      warningAlertAt: settings.warningAlertAt !== undefined ? settings.warningAlertAt : 10,
      mode: TimerMode.CUSTOM,
      direction: 'COUNTDOWN',
      continuousInterval: 0
    },
    audioConfig: {
      voiceAnnouncements: true,
      warningBeep: true,
      bellStyle: 'BOXING_BELL',
      vibrate: true
    }
  };

  saveCustomPreset(newPreset);
  return newPreset;
}

export function deleteCustomPreset(id) {
  if (id === 'custom-timer') return false; // No eliminar el preset rápido por defecto
  try {
    const current = getCustomPresets().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(current));
    return true;
  } catch (err) {
    console.error('Error al eliminar preset personalizado:', err);
    return false;
  }
}

export function getAllPresets() {
  const custom = getCustomPresets();
  const hasCustomTimer = custom.some((p) => p.id === 'custom-timer');
  const baseCustom = hasCustomTimer ? [] : [DEFAULT_CUSTOM_PRESET];
  return [...PRESET_LIBRARY, ...baseCustom, ...custom];
}

export function getPresetById(id) {
  if (id === 'custom-timer') {
    return getCustomPreset('custom-timer');
  }
  const customList = getCustomPresets();
  const customFound = customList.find((p) => p.id === id);
  if (customFound) {
    return customFound;
  }
  return getAllPresets().find((p) => p.id === id) || PRESET_LIBRARY[0];
}

export function getCustomPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomPreset(preset) {
  try {
    const current = getCustomPresets().filter((p) => p.id !== preset.id);
    current.push(preset);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(current));
    return true;
  } catch (err) {
    console.error('Error al guardar preset personalizado:', err);
    return false;
  }
}

export function saveLastActivePresetId(id) {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_CONFIG, id);
  } catch {
    // Ignore storage errors
  }
}

export function getLastActivePresetId() {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_CONFIG) || PRESET_LIBRARY[0].id;
  } catch {
    return PRESET_LIBRARY[0].id;
  }
}

const STORAGE_KEY_VOICE_GENDER = 'fighttimer_voice_gender_v1';

export function saveVoiceGender(gender) {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_GENDER, gender);
  } catch {
    // Ignore storage errors
  }
}

export function getVoiceGender() {
  try {
    return localStorage.getItem(STORAGE_KEY_VOICE_GENDER) || 'female';
  } catch {
    return 'female';
  }
}
