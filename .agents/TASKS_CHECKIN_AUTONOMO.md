# Hoja de Ruta de Ejecución: Check-in Autónomo sin Contacto & Tatami TV Celeste (TASKS_CHECKIN_AUTONOMO.md)

**Estado:** Todas las Fases COMPLETADAS CON ÉXITO ✅.
**Iniciativa:** Check-in Autónomo sin contacto (Totem/Kiosco con QR Dinámico anti-capturas y validación sonora/visual) + Reestilización Tatami TV a paleta Azul/Celeste.

---

## FASE 1: Subagente BACKEND (`@backend`) [COMPLETADA ✅]
> **Estado:** Completada.
> - `admin/kioskAudioService.js` implementado con Web Audio API (chime de Dojo armónico y alerta sonora).
> - `admin/kioskService.js` actualizado con QR dinámico por bloques de 30s (`time_window`, `generated_at`, `validateQRTokenFreshness`).
> - `app/services/supabaseService.js` actualizado con validación estricta de tiempo de vida (máx 60s con ventana de gracia).

---

## FASE 2: Subagente FRONTEND (`@frontend`) [COMPLETADA ✅]
> **Estado:** Completada.
> - Sustitución total del morado por Azul Océano / Celeste Neón (`#0284c7`, `#0ea5e9`, `#38bdf8`) en toda la Pantalla Tatami TV (`admin/admin.css` e `admin/index.html`).
> - Botones "Pantalla Tatami TV" con gradiente celeste y glow cian.
> - Barra regresiva continua de 30s (`#kiosk-qr-timer-fill`) e indicador de seguridad anti-captura.
> - Integración de chime de Dojo sonoro y destello visual `.flash-success` en el marco del escáner al validar atletas.

---

## FASE 3: Subagente QA (`@qa`) [COMPLETADA ✅]
> **Estado:** Completada.
> - Suite `tests/kiosk-dynamic-qr.test.js` con 5 tests unitarios.
> - 67 / 67 tests pasando en Vitest (100% éxito).
> - Cero errores de ESLint.
> - Build de producción Vite en 1.62 segundos.
