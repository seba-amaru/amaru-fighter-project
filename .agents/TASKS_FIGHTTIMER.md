# Hoja de Ruta de Ejecución: FightTimer - HIIT & Combat Sports Timer (TASKS_FIGHTTIMER.md)

**Estado:** Todas las Fases COMPLETADAS CON ÉXITO ✅.  
**Iniciativa:** Implementación modular de "FightTimer" (Temporizador Tatami-Friendly para BJJ, Muay Thai, MMA y Acondicionamiento Físico).

---

## FASE 1: Subagente BACKEND (`@backend`) [COMPLETADA ✅]
> **Estado:** Completada.
> - `src/timer/presets.js`: Catálogo de presets deportivos implementado (BJJ estándar 5m/1m x 5R con aviso a 30s, BJJ Open Mat continuo 6m, Muay Thai 3m/1m x 5R con aviso a 10s, MMA Pro 5m/1m x 5R con aviso a 30s, Tabata Clásico 20s/10s x 8R, EMOM 1m continuo x 10R).
> - `src/timer/timerEngine.js`: Motor de tiempo de alta precisión con compensación de deriva de milisegundos (`performance.now()`), máquina de estados desacoplada (`IDLE`, `PREPARE`, `WORK`, `WARNING`, `REST`, `PAUSED`, `FINISHED`), control de pantalla activa vía Screen Wake Lock API y callbacks tipados.
> - `src/timer/soundService.js`: Síntesis procedural por Web Audio API de Campana de Boxeo metálica (armónicos 800Hz, 1100Hz, 1450Hz, 1820Hz con decaimiento exponencial), bocina grave de tatami, pitidos de alerta, locución por voz con SpeechSynthesis y háptica con Web Vibration API.

---

## FASE 2: Subagente FRONTEND (`@frontend`) [COMPLETADA ✅]
> **Estado:** Completada.
> - `timer/index.html`: Estructura semántica fullscreen para pantalla completa en tatami, display gigante de tiempo, header con selector de preset, switches de sonido/voz y overlay de bloqueo anti-sudor.
> - `timer/timer.css`: Sistema semafórico dinámico según la fase (Verde neón trabajo, Rojo carmesí con pulso en advertencia, Ámbar en descanso, Azul cobalto en preparación). Tipografía `tabular-nums` con tamaño `clamp(7.5rem, 28vw, 24rem)` legible a más de 10 metros y botones táctiles XXL (mínimo 80-120px) operables con guantes de boxeo de 14-16 oz.
> - `timer/timerUI.js`: Controlador que orquesta la vista con `FightTimerEngine` y `SoundService`, gestionando las transiciones del DOM, eventos de audio tras desbloqueo táctil y modo de desbloqueo sostenido (*hold to unlock*).
> - `vite.config.js`: Entrada `timer: resolve(__dirname, 'timer/index.html')` registrada y empaquetada.

---

## FASE 3: Subagente QA (`@qa`) [COMPLETADA ✅]
> **Estado:** Completada con éxito.
> - Nueva suite `tests/fighttimer.test.js` con 12 tests automatizados para presets, transiciones de la máquina de estados, callbacks de advertencia, descansos, reinicio, pausa y tolerancia de audio.
> - 12/12 pruebas pasando en Vitest con 100% de éxito.
> - Build de producción Vite completado exitosamente en 3.54s generando `dist/timer/index.html`, `dist/assets/timer-*.js` y `dist/assets/timer-*.css`.
