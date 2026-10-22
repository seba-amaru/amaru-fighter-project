/**
 * FightTimer UI Controller
 * Enlaza los componentes del DOM con el FightTimerEngine y el SoundService.
 * Soporta selección de voz latina (Masculina / Femenina) y creación/guardado de presets en la biblioteca.
 */

import { FightTimerEngine, TimerPhase } from '../src/timer/timerEngine.js';
import {
  getAllPresets,
  getPresetById,
  saveLastActivePresetId,
  getLastActivePresetId,
  getCustomPreset,
  saveEditableCustomPreset,
  createCustomPreset,
  deleteCustomPreset,
  saveVoiceGender,
  getVoiceGender
} from '../src/timer/presets.js';
import { SoundService } from '../src/timer/soundService.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de Servicios y Voz
  let currentVoiceGender = getVoiceGender();
  const soundService = new SoundService({ voiceGender: currentVoiceGender });
  let currentPreset = getPresetById(getLastActivePresetId());

  // Elementos DOM Principales
  const body = document.body;
  const timerDisplay = document.getElementById('timer-display');
  const phaseBadge = document.getElementById('phase-badge');
  const roundCurrent = document.getElementById('round-current');
  const roundTotal = document.getElementById('round-total');
  const progressBar = document.getElementById('progress-bar');
  const labelActivePreset = document.getElementById('label-active-preset');

  // Botones de Control XXL
  const btnTogglePlay = document.getElementById('btn-toggle-play');
  const labelPlayState = document.getElementById('label-play-state');
  const iconPlayState = document.getElementById('icon-play-state');
  const btnReset = document.getElementById('btn-reset');
  const btnSkipRound = document.getElementById('btn-skip-round');

  // Acciones Superiores
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnToggleVoice = document.getElementById('btn-toggle-voice');
  const btnToggleLock = document.getElementById('btn-toggle-lock');
  const btnOpenPresets = document.getElementById('btn-open-presets');
  const btnOpenCustomEditor = document.getElementById('btn-open-custom-editor');

  // Modales y Overlays
  const modalPresets = document.getElementById('modal-presets');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const presetsContainer = document.getElementById('presets-list-container');
  const btnCreatePresetFromModal = document.getElementById('btn-create-preset-from-modal');
  const overlaySweatLock = document.getElementById('overlay-sweat-lock');
  const btnHoldUnlock = document.getElementById('btn-hold-unlock');

  // Modal de Personalización
  const modalCustomEditor = document.getElementById('modal-custom-editor');
  const customModalTitle = document.getElementById('custom-modal-title');
  const btnCloseCustomModal = document.getElementById('btn-close-custom-modal');
  const btnCancelCustomModal = document.getElementById('btn-cancel-custom-modal');
  const btnSaveCustomModal = document.getElementById('btn-save-custom-modal');
  const btnSaveAsNewPreset = document.getElementById('btn-save-as-new-preset');
  const inputCustomName = document.getElementById('input-custom-name');
  const labelSaveAction = document.getElementById('label-save-action');

  // Displays en el modal Custom
  const displayCustomRounds = document.getElementById('display-custom-rounds');
  const displayCustomWork = document.getElementById('display-custom-work');
  const displayCustomRest = document.getElementById('display-custom-rest');

  // Inputs y Steppers
  const inputCustomRounds = document.getElementById('input-custom-rounds');
  const btnRoundsDec = document.getElementById('btn-rounds-dec');
  const btnRoundsInc = document.getElementById('btn-rounds-inc');

  const inputWorkMin = document.getElementById('input-work-min');
  const inputWorkSec = document.getElementById('input-work-sec');
  const btnWorkMinDec = document.getElementById('btn-work-min-dec');
  const btnWorkMinInc = document.getElementById('btn-work-min-inc');
  const btnWorkSecDec = document.getElementById('btn-work-sec-dec');
  const btnWorkSecInc = document.getElementById('btn-work-sec-inc');

  const inputRestMin = document.getElementById('input-rest-min');
  const inputRestSec = document.getElementById('input-rest-sec');
  const btnRestMinDec = document.getElementById('btn-rest-min-dec');
  const btnRestMinInc = document.getElementById('btn-rest-min-inc');
  const btnRestSecDec = document.getElementById('btn-rest-sec-dec');
  const btnRestSecInc = document.getElementById('btn-rest-sec-inc');

  // Grupos de chips
  const chipsRounds = document.getElementById('chips-rounds');
  const chipsWork = document.getElementById('chips-work');
  const chipsRest = document.getElementById('chips-rest');
  const chipsPrepare = document.getElementById('chips-prepare');
  const chipsWarning = document.getElementById('chips-warning');

  // Voz del asistente
  const voiceGenderButtons = document.querySelectorAll('.voice-gender-btn');
  const btnTestVoice = document.getElementById('btn-test-voice');

  let activeEditingPresetId = 'custom-timer';
  let customPrepareDuration = 10;
  let customWarningAlertAt = 10;
  let unlockTimer = null;

  // Instanciar Motor de Tiempo
  const engine = new FightTimerEngine(currentPreset.settings, {
    onTick: (data) => {
      timerDisplay.textContent = data.secondsFormatted;
      progressBar.style.width = `${data.progressRatio * 100}%`;
      roundCurrent.textContent = data.currentRound;
      roundTotal.textContent = data.totalRounds;

      // Pitidos en los últimos 3 segundos del round de trabajo
      if (data.phase === TimerPhase.WORK && data.remainingSeconds <= 3 && data.remainingSeconds > 0) {
        if (data.remainingMs % 1000 === 0) {
          soundService.playWarningBeep(data.remainingSeconds === 1);
        }
      }
    },

    onPhaseChange: (phase, round) => {
      body.setAttribute('data-phase', phase);
      updatePhaseBadge(phase, round);
      updatePlayButtonState(engine.isRunning);

      if (phase === TimerPhase.WORK) {
        soundService.playBoxingBell();
        soundService.speak(`Round ${round}. ¡Combate!`);
      } else if (phase === TimerPhase.REST) {
        soundService.playBuzzer();
        soundService.speak('Descanso');
      } else if (phase === TimerPhase.PREPARE) {
        soundService.speak('Listos');
      }
    },

    onWarning: (seconds) => {
      body.setAttribute('data-phase', TimerPhase.WARNING);
      phaseBadge.textContent = `¡ÚLTIMOS ${seconds}s!`;
      soundService.playWarningBeep(false);
      soundService.speak(`Últimos ${seconds} segundos`);
    },

    onRoundChange: (round, total) => {
      roundCurrent.textContent = round;
      roundTotal.textContent = total;
    },

    onComplete: () => {
      body.setAttribute('data-phase', 'IDLE');
      phaseBadge.textContent = '¡COMBATE FINALIZADO!';
      soundService.playDoubleBell();
      soundService.speak('Sesión completada. Buen trabajo.');
      updatePlayButtonState(false);
      refreshLucide();
    }
  });

  function updatePhaseBadge(phase, round) {
    switch (phase) {
      case TimerPhase.PREPARE:
        phaseBadge.textContent = 'PREPARACIÓN';
        break;
      case TimerPhase.WORK:
        phaseBadge.textContent = `ROUND ${round} - COMBATE`;
        break;
      case TimerPhase.WARNING:
        phaseBadge.textContent = 'ÚLTIMOS SEGUNDOS';
        break;
      case TimerPhase.REST:
        phaseBadge.textContent = 'DESCANSO';
        break;
      case TimerPhase.PAUSED:
        phaseBadge.textContent = 'PAUSA';
        break;
      case TimerPhase.FINISHED:
        phaseBadge.textContent = 'FINALIZADO';
        break;
      default:
        phaseBadge.textContent = 'LISTOS';
    }
  }

  function updatePlayButtonState(isRunning) {
    if (isRunning) {
      labelPlayState.textContent = 'PAUSE';
      iconPlayState.setAttribute('data-lucide', 'pause');
      btnTogglePlay.classList.add('btn-secondary');
      btnTogglePlay.classList.remove('btn-main-action');
    } else {
      labelPlayState.textContent = 'START';
      iconPlayState.setAttribute('data-lucide', 'play');
      btnTogglePlay.classList.add('btn-main-action');
      btnTogglePlay.classList.remove('btn-secondary');
    }
    refreshLucide();
  }

  function refreshLucide() {
    if (typeof window !== 'undefined' && window.lucide) {
      window.lucide.createIcons();
    }
  }

  function applyPreset(preset) {
    currentPreset = preset;
    saveLastActivePresetId(preset.id);
    labelActivePreset.textContent = preset.name;
    engine.loadPreset(preset.settings);
    roundCurrent.textContent = '1';
    roundTotal.textContent = preset.settings.rounds;
    updatePhaseBadge(TimerPhase.IDLE, 1);
    updatePlayButtonState(false);
    modalPresets.classList.remove('active');
    refreshLucide();
  }

  function renderPresetsList() {
    const all = getAllPresets();
    presetsContainer.innerHTML = '';

    const savedCustoms = all.filter((p) => p.isSavedPreset);
    const standardCustom = all.find((p) => p.id === 'custom-timer');
    const builtIns = all.filter((p) => !p.isCustom);

    // 1. Presets guardados por el usuario
    if (savedCustoms.length > 0) {
      const headerSaved = document.createElement('div');
      headerSaved.className = 'preset-section-title';
      headerSaved.textContent = 'Mis Presets Guardados';
      presetsContainer.appendChild(headerSaved);

      savedCustoms.forEach((preset) => {
        presetsContainer.appendChild(createPresetCardElement(preset, true));
      });
    }

    // 2. Preset modificable rápido
    if (standardCustom) {
      const headerQuick = document.createElement('div');
      headerQuick.className = 'preset-section-title';
      headerQuick.textContent = 'Personalizado Rápido';
      presetsContainer.appendChild(headerQuick);
      presetsContainer.appendChild(createPresetCardElement(standardCustom, false));
    }

    // 3. Biblioteca oficial de combate
    const headerOfficial = document.createElement('div');
    headerOfficial.className = 'preset-section-title';
    headerOfficial.textContent = 'Presets Oficiales de Combate';
    presetsContainer.appendChild(headerOfficial);

    builtIns.forEach((preset) => {
      presetsContainer.appendChild(createPresetCardElement(preset, false));
    });

    refreshLucide();
  }

  function createPresetCardElement(preset, canDelete = false) {
    const card = document.createElement('div');
    const isSelected = preset.id === currentPreset.id;
    card.className = `preset-card-item ${isSelected ? 'selected' : ''}`;

    const workMin = Math.floor(preset.settings.workDuration / 60);
    const workSec = String(preset.settings.workDuration % 60).padStart(2, '0');
    const timeStr = `${workMin}:${workSec}`;

    card.innerHTML = `
      <div style="flex: 1; padding-right: 0.75rem;">
        <div class="preset-card-name">${preset.name} ${preset.isCustom ? '⚙️' : ''}</div>
        <div class="preset-card-desc">${preset.description}</div>
      </div>
      <div class="preset-card-right">
        <div class="preset-card-meta">
          ${timeStr} / ${preset.settings.rounds} R
        </div>
        ${
          preset.isCustom
            ? `
          <button type="button" class="btn-card-edit" title="Editar Preset">
            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
            <span>Editar</span>
          </button>
        `
            : ''
        }
        ${
          canDelete
            ? `
          <button type="button" class="btn-card-delete" title="Eliminar Preset">
            <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
          </button>
        `
            : ''
        }
      </div>
    `;

    card.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-card-edit');
      const deleteBtn = e.target.closest('.btn-card-delete');

      if (deleteBtn) {
        e.stopPropagation();
        if (confirm(`¿Eliminar el preset "${preset.name}" de tu biblioteca?`)) {
          deleteCustomPreset(preset.id);
          if (currentPreset.id === preset.id) {
            applyPreset(getCustomPreset('custom-timer'));
          }
          renderPresetsList();
        }
        return;
      }

      if (editBtn) {
        e.stopPropagation();
        openCustomEditor(preset);
        return;
      }

      applyPreset(preset);
    });

    return card;
  }

  // Lógica del Editor Personalizado
  function openCustomEditor(basePreset = null, isNewCreation = false) {
    const target = basePreset || (currentPreset.isCustom ? currentPreset : getCustomPreset('custom-timer'));
    const settings = target.settings;

    if (isNewCreation) {
      activeEditingPresetId = null; // nuevo
      customModalTitle.textContent = 'Crear Nuevo Preset';
      inputCustomName.value = 'Mi Preset ' + (getAllPresets().filter((p) => p.isSavedPreset).length + 1);
      labelSaveAction.textContent = 'APLICAR AL TIMER';
    } else {
      activeEditingPresetId = target.id;
      customModalTitle.textContent = target.isSavedPreset ? `Editar: ${target.name}` : 'Ajustar Temporizador';
      inputCustomName.value = target.name || 'Personalizado';
      labelSaveAction.textContent = target.isSavedPreset ? 'GUARDAR CAMBIOS' : 'APLICAR AL TIMER';
    }

    // Rondas
    inputCustomRounds.value = settings.rounds || 5;

    // Trabajo
    const workDuration = settings.workDuration !== undefined ? settings.workDuration : 180;
    inputWorkMin.value = Math.floor(workDuration / 60);
    inputWorkSec.value = workDuration % 60;

    // Descanso
    const restDuration = settings.restDuration !== undefined ? settings.restDuration : 60;
    inputRestMin.value = Math.floor(restDuration / 60);
    inputRestSec.value = restDuration % 60;

    // Preparación y Aviso
    customPrepareDuration = settings.prepareDuration !== undefined ? settings.prepareDuration : 10;
    customWarningAlertAt = settings.warningAlertAt !== undefined ? settings.warningAlertAt : 10;

    // Sincronizar botones de voz
    syncVoiceGenderButtons(currentVoiceGender);

    updateCustomEditorDisplays();
    modalCustomEditor.classList.add('active');
    refreshLucide();
  }

  function closeCustomEditor() {
    modalCustomEditor.classList.remove('active');
  }

  function updateCustomEditorDisplays() {
    // Normalizar Rondas
    let rounds = parseInt(inputCustomRounds.value, 10);
    if (isNaN(rounds) || rounds < 1) rounds = 1;
    if (rounds > 50) rounds = 50;
    inputCustomRounds.value = rounds;
    displayCustomRounds.textContent = `${rounds} ${rounds === 1 ? 'ROUND' : 'ROUNDS'}`;

    // Normalizar Trabajo
    let wMin = parseInt(inputWorkMin.value, 10);
    if (isNaN(wMin) || wMin < 0) wMin = 0;
    if (wMin > 60) wMin = 60;
    inputWorkMin.value = wMin;

    let wSec = parseInt(inputWorkSec.value, 10);
    if (isNaN(wSec) || wSec < 0) wSec = 0;
    if (wSec > 59) wSec = 59;
    inputWorkSec.value = wSec;

    const totalWorkSecs = wMin * 60 + wSec;
    displayCustomWork.textContent = `${String(wMin).padStart(2, '0')}:${String(wSec).padStart(2, '0')}`;

    // Normalizar Descanso
    let rMin = parseInt(inputRestMin.value, 10);
    if (isNaN(rMin) || rMin < 0) rMin = 0;
    if (rMin > 15) rMin = 15;
    inputRestMin.value = rMin;

    let rSec = parseInt(inputRestSec.value, 10);
    if (isNaN(rSec) || rSec < 0) rSec = 0;
    if (rSec > 59) rSec = 59;
    inputRestSec.value = rSec;

    const totalRestSecs = rMin * 60 + rSec;
    displayCustomRest.textContent = `${String(rMin).padStart(2, '0')}:${String(rSec).padStart(2, '0')}`;

    // Sincronizar chips
    syncChipsState(chipsRounds, rounds);
    syncChipsState(chipsWork, totalWorkSecs);
    syncChipsState(chipsRest, totalRestSecs);
    syncChipsState(chipsPrepare, customPrepareDuration);
    syncChipsState(chipsWarning, customWarningAlertAt);
  }

  function syncChipsState(container, value) {
    if (!container) return;
    const buttons = container.querySelectorAll('.chip-btn');
    buttons.forEach((btn) => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      btn.classList.toggle('active', val === value);
    });
  }

  function syncVoiceGenderButtons(gender) {
    voiceGenderButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-gender') === gender);
    });
  }

  // Steppers: Rondas
  btnRoundsDec.addEventListener('click', () => {
    inputCustomRounds.value = Math.max(1, (parseInt(inputCustomRounds.value, 10) || 5) - 1);
    updateCustomEditorDisplays();
  });
  btnRoundsInc.addEventListener('click', () => {
    inputCustomRounds.value = Math.min(50, (parseInt(inputCustomRounds.value, 10) || 5) + 1);
    updateCustomEditorDisplays();
  });

  // Steppers: Trabajo Min/Sec
  btnWorkMinDec.addEventListener('click', () => {
    inputWorkMin.value = Math.max(0, (parseInt(inputWorkMin.value, 10) || 0) - 1);
    updateCustomEditorDisplays();
  });
  btnWorkMinInc.addEventListener('click', () => {
    inputWorkMin.value = Math.min(60, (parseInt(inputWorkMin.value, 10) || 0) + 1);
    updateCustomEditorDisplays();
  });
  btnWorkSecDec.addEventListener('click', () => {
    let s = (parseInt(inputWorkSec.value, 10) || 0) - 5;
    if (s < 0) s = 55;
    inputWorkSec.value = s;
    updateCustomEditorDisplays();
  });
  btnWorkSecInc.addEventListener('click', () => {
    let s = (parseInt(inputWorkSec.value, 10) || 0) + 5;
    if (s >= 60) s = 0;
    inputWorkSec.value = s;
    updateCustomEditorDisplays();
  });

  // Steppers: Descanso Min/Sec
  btnRestMinDec.addEventListener('click', () => {
    inputRestMin.value = Math.max(0, (parseInt(inputRestMin.value, 10) || 0) - 1);
    updateCustomEditorDisplays();
  });
  btnRestMinInc.addEventListener('click', () => {
    inputRestMin.value = Math.min(15, (parseInt(inputRestMin.value, 10) || 0) + 1);
    updateCustomEditorDisplays();
  });
  btnRestSecDec.addEventListener('click', () => {
    let s = (parseInt(inputRestSec.value, 10) || 0) - 5;
    if (s < 0) s = 55;
    inputRestSec.value = s;
    updateCustomEditorDisplays();
  });
  btnRestSecInc.addEventListener('click', () => {
    let s = (parseInt(inputRestSec.value, 10) || 0) + 5;
    if (s >= 60) s = 0;
    inputRestSec.value = s;
    updateCustomEditorDisplays();
  });

  // Eventos de entrada directa en inputs
  [inputCustomRounds, inputWorkMin, inputWorkSec, inputRestMin, inputRestSec].forEach((input) => {
    input.addEventListener('input', updateCustomEditorDisplays);
    input.addEventListener('change', updateCustomEditorDisplays);
  });

  // Eventos de Chips Rápidos
  if (chipsRounds) {
    chipsRounds.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (btn) {
        inputCustomRounds.value = btn.getAttribute('data-val');
        updateCustomEditorDisplays();
      }
    });
  }

  if (chipsWork) {
    chipsWork.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (btn) {
        const totalSecs = parseInt(btn.getAttribute('data-val'), 10);
        inputWorkMin.value = Math.floor(totalSecs / 60);
        inputWorkSec.value = totalSecs % 60;
        updateCustomEditorDisplays();
      }
    });
  }

  if (chipsRest) {
    chipsRest.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (btn) {
        const totalSecs = parseInt(btn.getAttribute('data-val'), 10);
        inputRestMin.value = Math.floor(totalSecs / 60);
        inputRestSec.value = totalSecs % 60;
        updateCustomEditorDisplays();
      }
    });
  }

  if (chipsPrepare) {
    chipsPrepare.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (btn) {
        customPrepareDuration = parseInt(btn.getAttribute('data-val'), 10);
        updateCustomEditorDisplays();
      }
    });
  }

  if (chipsWarning) {
    chipsWarning.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (btn) {
        customWarningAlertAt = parseInt(btn.getAttribute('data-val'), 10);
        updateCustomEditorDisplays();
      }
    });
  }

  // Selección de Género de Voz
  voiceGenderButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedGender = btn.getAttribute('data-gender');
      if (selectedGender) {
        currentVoiceGender = selectedGender;
        soundService.setVoiceGender(selectedGender);
        saveVoiceGender(selectedGender);
        syncVoiceGenderButtons(selectedGender);
      }
    });
  });

  // Probar Voz con Frase de Combate
  if (btnTestVoice) {
    btnTestVoice.addEventListener('click', () => {
      soundService.unlockAudio();
      const phrase =
        currentVoiceGender === 'male'
          ? '¡Atención peleadores! Voz masculina configurada. ¡A entrenar fuerte!'
          : '¡Atención tatami! Voz femenina configurada. ¡Listos para el combate!';
      soundService.speak(phrase);
    });
  }

  // Guardar y Aplicar (Edición de Preset Actual o Configuración Rápida)
  btnSaveCustomModal.addEventListener('click', () => {
    soundService.unlockAudio();
    const rounds = parseInt(inputCustomRounds.value, 10) || 5;
    let workSecs = (parseInt(inputWorkMin.value, 10) || 0) * 60 + (parseInt(inputWorkSec.value, 10) || 0);
    const restSecs = (parseInt(inputRestMin.value, 10) || 0) * 60 + (parseInt(inputRestSec.value, 10) || 0);
    const name = inputCustomName.value.trim() || 'Personalizado';

    if (workSecs <= 0) workSecs = 60;

    const presetSettings = {
      rounds,
      workDuration: workSecs,
      restDuration: restSecs,
      prepareDuration: customPrepareDuration,
      warningAlertAt: customWarningAlertAt
    };

    let updated;
    if (activeEditingPresetId && activeEditingPresetId !== 'custom-timer') {
      // Guardando cambios en un preset existente
      updated = saveEditableCustomPreset(presetSettings, name, activeEditingPresetId);
    } else {
      // Guardando preset rápido
      updated = saveEditableCustomPreset(presetSettings, name, 'custom-timer');
    }

    applyPreset(updated);
    closeCustomEditor();
    modalPresets.classList.remove('active');
    soundService.playWarningBeep(true);
    soundService.speak(`Preset ${updated.name} configurado`);
  });

  // Guardar como Nuevo Preset Permanente en Biblioteca
  if (btnSaveAsNewPreset) {
    btnSaveAsNewPreset.addEventListener('click', () => {
      soundService.unlockAudio();
      const rounds = parseInt(inputCustomRounds.value, 10) || 5;
      let workSecs = (parseInt(inputWorkMin.value, 10) || 0) * 60 + (parseInt(inputWorkSec.value, 10) || 0);
      const restSecs = (parseInt(inputRestMin.value, 10) || 0) * 60 + (parseInt(inputRestSec.value, 10) || 0);
      const name = inputCustomName.value.trim() || 'Mi Preset';

      if (workSecs <= 0) workSecs = 60;

      const created = createCustomPreset(name, {
        rounds,
        workDuration: workSecs,
        restDuration: restSecs,
        prepareDuration: customPrepareDuration,
        warningAlertAt: customWarningAlertAt
      });

      applyPreset(created);
      closeCustomEditor();
      modalPresets.classList.remove('active');
      soundService.playWarningBeep(true);
      soundService.speak(`Preset ${created.name} guardado en tu biblioteca`);
    });
  }

  // Botón "+ Crear Nuevo Preset" dentro de la biblioteca
  if (btnCreatePresetFromModal) {
    btnCreatePresetFromModal.addEventListener('click', () => {
      modalPresets.classList.remove('active');
      openCustomEditor(null, true);
    });
  }

  btnCloseCustomModal.addEventListener('click', closeCustomEditor);
  btnCancelCustomModal.addEventListener('click', closeCustomEditor);
  modalCustomEditor.addEventListener('click', (e) => {
    if (e.target === modalCustomEditor) closeCustomEditor();
  });

  if (btnOpenCustomEditor) {
    btnOpenCustomEditor.addEventListener('click', () => {
      openCustomEditor();
    });
  }

  // Event Listeners: Controles
  btnTogglePlay.addEventListener('click', () => {
    soundService.unlockAudio();
    engine.toggle();
  });

  btnReset.addEventListener('click', () => {
    soundService.unlockAudio();
    engine.reset();
  });

  btnSkipRound.addEventListener('click', () => {
    soundService.unlockAudio();
    engine.nextRound();
  });

  timerDisplay.addEventListener('click', () => {
    soundService.unlockAudio();
    engine.toggle();
  });

  // Event Listeners: Cabecera
  btnToggleSound.addEventListener('click', () => {
    soundService.options.soundEnabled = !soundService.options.soundEnabled;
    btnToggleSound.classList.toggle('active', soundService.options.soundEnabled);
  });

  btnToggleVoice.addEventListener('click', () => {
    soundService.options.voiceEnabled = !soundService.options.voiceEnabled;
    btnToggleVoice.classList.toggle('active', soundService.options.voiceEnabled);
  });

  // Modal Presets
  btnOpenPresets.addEventListener('click', () => {
    renderPresetsList();
    modalPresets.classList.add('active');
  });

  btnCloseModal.addEventListener('click', () => {
    modalPresets.classList.remove('active');
  });

  modalPresets.addEventListener('click', (e) => {
    if (e.target === modalPresets) modalPresets.classList.remove('active');
  });

  // Modo Bloqueo Anti-Sudor (Sweat Lock)
  btnToggleLock.addEventListener('click', () => {
    overlaySweatLock.classList.add('active');
  });

  btnHoldUnlock.addEventListener('pointerdown', () => {
    btnHoldUnlock.style.transform = 'scale(0.92)';
    unlockTimer = setTimeout(() => {
      overlaySweatLock.classList.remove('active');
      btnHoldUnlock.style.transform = 'scale(1)';
      soundService.playWarningBeep(true);
    }, 1500); // 1.5s pulsado
  });

  const cancelUnlock = () => {
    if (unlockTimer) {
      clearTimeout(unlockTimer);
      unlockTimer = null;
    }
    btnHoldUnlock.style.transform = 'scale(1)';
  };

  btnHoldUnlock.addEventListener('pointerup', cancelUnlock);
  btnHoldUnlock.addEventListener('pointerleave', cancelUnlock);

  // Inicialización de la vista
  applyPreset(currentPreset);
  refreshLucide();
});


