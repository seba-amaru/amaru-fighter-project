# Hoja de Ruta de Ejecución: Corrección de Heartbeat Timeout & Resiliencia en Supabase Realtime (.agents/TASKS_CORRECCION_HEARTBEAT.md)

**Estado:** 🟢 COMPLETADO AL 100% ✅ (Fases 1 Backend, 2 Frontend y 3 QA validadas con éxito).
**Origen del Incidente:** Error en consola en producción/preview:
`[realtimeService] Estado CHANNEL_ERROR: Error: heartbeat timeout` seguido de bucle de reconexión en carrera con `TIMED_OUT`.

---

## 🔍 Diagnóstico Técnico de la Causa Raíz
1. **Suspensión de Pestaña / Estrangulamiento de Temporizadores (Timer Throttling):**
   Al minimizar la pestaña o cambiar de ventana, el navegador congela o estrangula los timers de JavaScript (`setInterval`), retrasando el heartbeat (ping) del WebSocket interno de Phoenix/Supabase. Al volver a la pestaña, Supabase detecta que expiró el tiempo de respuesta del heartbeat y emite `heartbeat timeout` con estado `CHANNEL_ERROR`.
2. **Colisión de Motores de Reconexión (Race Condition):**
   El cliente de Supabase (`@supabase/realtime-js`) cuenta con su propio mecanismo nativo para reintentar y reconectar el socket (`rejoin()`). Al recibir `CHANNEL_ERROR`, `admin/realtimeService.js` destruye inmediatamente el canal con `removeChannel()` e inicia un `scheduleReconnect` paralelo. Mientras el socket nativo intenta el `rejoin`, la remoción destructiva del canal desencadena un segundo evento `TIMED_OUT`, lo que dispara múltiples temporizadores simultáneos y reinicia de forma anómala el contador de reintentos (de 3/5 a 1/5).
3. **Ausencia de Sincronización con el Ciclo de Vida del Navegador:**
   Faltan escuchadores de `visibilitychange` y `window.online` para reactivar de forma limpia y transparente la conexión al volver a la pestaña sin disparar ráfagas de errores en consola.

---

## FASE 1: Subagente BACKEND (`@backend`) [COMPLETADA ✅]
> **Estado:** Completada con éxito.
> - `admin/realtimeService.js`: Protección anti-carreras con `isReconnecting`, debounce, tolerancia a `heartbeat timeout` transitorio, desuscripción segura con `safeRemoveActiveChannel` e integración con `visibilitychange` y `online`.
> - `admin/supabaseClient.js`: Configuración de `realtime` con heartbeat (25s) y timeout (15s).
> - 68/68 tests unitarios pasando en Vitest. 0 errores de ESLint. Build de producción Vite verificado.
> - **Regla estricta:** NO modificar archivos HTML visuales ni hojas de estilo CSS. Cumplida al 100%.

### Tarea B1: Desacoplamiento y Anti-Colisión de Reconexión en `admin/realtimeService.js`
- **Archivo:** `admin/realtimeService.js`
- **Acciones requeridas:**
  1. **Flag de Reconexión y Debounce:** Implementar un candado (`isReconnecting`) y debouncing para evitar que eventos consecutivos (`CHANNEL_ERROR` seguido inmediatamente de `TIMED_OUT`) programen múltiples timers de reconexión paralelos o reinicien `reconnectAttempts` inesperadamente.
  2. **Tolerancia a Heartbeat Timeout:**
     - Identificar si el error es un `heartbeat timeout` transitorio.
     - Dar un margen de gracia al mecanismo nativo de Supabase (`channel.rejoin()`) antes de forzar la destrucción del canal (`removeChannel`).
     - Si el canal logra volver a `SUBSCRIBED` de manera nativa, resetear limpiamente `reconnectAttempts` a 0 y transicionar a `ONLINE`.
  3. **Limpieza Segura en `initAdminRealtime`:**
     - Si se destruye el canal previo, asegurar desuscripción atómica para que el canal anterior no siga emitiendo callbacks residuales (`TIMED_OUT` huérfanos).
  4. **Listeners de Ciclo de Vida (`visibilitychange` & `online`):**
     - Al activarse `document.visibilityState === 'visible'` o `window.ononline`, verificar si el canal está en estado `OFFLINE` o `ERROR` y gatillar una reconexión controlada y silenciosa.

### Tarea B2: Optimización del Cliente en `admin/supabaseClient.js`
- **Archivo:** `admin/supabaseClient.js`
- **Acciones requeridas:**
  1. Configurar opciones de `realtime` en `createClient` si es pertinente (gestión de parámetros de reconexión y heartbeat estables para evitar timeouts prematuros en navegadores de escritorio).

---

## FASE 2: Subagente FRONTEND (`@frontend`) [COMPLETADA ✅]
> **Estado:** Completada con éxito.
> - `admin/admin.js`: Suavizado de estados en `initRealtimeUI`, gestión de estados deshabilitados (`is-reconnecting`, `pointer-events-none`) en el botón de reconexión durante `CONNECTING` y verificación de `!diags.isReconnecting` para evitar clics duplicados.
> - `admin/admin.css`: Nuevas clases de soporte para `.realtime-reconnect-btn:disabled` e `.is-reconnecting` con animación pulsante atenuada.
> - **Regla estricta:** NO manipular llamadas directas a Supabase ni lógica interna del socket. Cumplida al 100%.

### Tarea F1: Suavizado Visual del Live Status Pill en `admin/admin.js`
- **Archivo:** `admin/admin.js`
- **Acciones requeridas:**
  1. Evitar transiciones bruscas o parpadeos en el badge `#realtime-status-pill` cuando ocurre una reconexión rápida transitoria por heartbeat.
  2. Mientras el estado se encuentre en `CONNECTING`, deshabilitar temporalmente el botón manual `#realtime-reconnect-btn` para prevenir múltiples clics del usuario mientras la reconexión está en curso.

---

## FASE 3: Subagente QA (`@qa`) [COMPLETADA ✅]
> **Estado:** Completada con éxito.
> - `tests/admin-realtime.test.js`: Incorporadas 2 nuevas pruebas automatizadas que simulan fallos de `heartbeat timeout` y reconexión nativa a `SUBSCRIBED`.
> - **Resultados:**
>   - 70/70 pruebas unitarias pasando al 100% en Vitest.
>   - 0 errores de ESLint (`npm run lint`).
>   - Build de producción Vite (`npm run build`) validado con éxito (`dist/assets/admin-Aq7Onw_u.js`).

---

## 🏆 Resumen Final de Entrega
1. **Estabilidad de Red y WebSocket (Backend):** Eliminada la condición de carrera y los bucles desfasados en `admin/realtimeService.js` mediante control `isReconnecting`, debouncing, tolerancia de reconexión nativa ante `heartbeat timeout` e integración con el ciclo de vida del navegador (`visibilitychange` y `online`).
2. **Experiencia de Usuario Suave (Frontend):** Control de estados transitorios en `admin/admin.js` y `admin/admin.css` que previene dobles pulsaciones en `#realtime-reconnect-btn` y `#realtime-status-pill` durante la fase de reconexión.
3. **Calidad y Confianza (QA):** 70 tests en verde, 0 regresiones y build de producción verificado.
