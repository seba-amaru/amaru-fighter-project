# Hoja de Ruta de Ejecución: Unificación de Módulos Admin + Supabase Realtime (TASKS_UNIFICACION_REALTIME.md)

**Estado:** Fase 1 (Backend) y Fase 2 (Frontend) COMPLETADAS ✅. Listo para Fase 3 (QA).
**Iniciativa:** 1. Unificación de módulos Admin + Supabase Realtime.

---

## FASE 1: Subagente BACKEND (`@backend`) [COMPLETADA ✅]
> **Estado:** Completada. `admin/realtimeService.js` implementado, integrado en `admin/paymentService.js` y `admin/admin.js`. 55/55 tests en verde.
> **Regla estricta:** NO tocar HTML visual ni CSS. Exponer métodos limpios y eventos tipados/documentados.

### Tarea B1: Módulo Centralizado `admin/realtimeService.js`
- **Archivo a crear:** `admin/realtimeService.js`
- **Requerimientos técnicos:**
  1. Conexión única a Supabase Realtime Channel (`amaru_admin_live`).
  2. Suscripciones `postgres_changes` para:
     - `payments` (INSERT, UPDATE)
     - `profiles` (INSERT, UPDATE, DELETE)
     - `attendance` (INSERT, UPDATE)
     - `reservations` (INSERT, UPDATE, DELETE)
     - `classes` (UPDATE, INSERT)
  3. Máquina de estados de conexión observable: `CONNECTING`, `ONLINE`, `OFFLINE`, `ERROR`.
  4. Métodos a exponer:
     - `initAdminRealtime(supabaseClient, options)`: Inicia el canal y configura listeners.
     - `onRealtimeEvent(table, eventType, callback)`: Suscribe handlers a eventos específicos.
     - `onConnectionStatusChange(callback)`: Notifica cambios en el estado del socket (para que el frontend actualice el badge).
     - `reconnect()`: Fuerza la reconexión manual cerrando el canal previo y volviendo a suscribir.
     - `disconnect()`: Cierre limpio y `unsubscribe()` para prevenir fugas de memoria.
     - `getStatus()`: Devuelve el estado actual y marcas de tiempo del último ping/evento.

### Tarea B2: Unificación e Integración con `admin/paymentService.js` y `admin/admin.js`
- **Archivos:** `admin/paymentService.js`, `admin/admin.js`
- **Requerimientos técnicos:**
  1. En `admin/paymentService.js`, hacer que `setupRealtimeSync` delegue en `realtimeService.js` o consuma el canal centralizado para evitar crear múltiples WebSockets innecesarios a Supabase.
  2. En `admin/admin.js`, reemplazar la suscripción local básica de la línea 39 por la inicialización de `initAdminRealtime()`, vinculando las acciones reactivas a los eventos emitidos por el bus centralizado.

---

## FASE 2: Subagente FRONTEND (`@frontend`) [COMPLETADA ✅]
> **Estado:** Completada. Live Status Pill con pulso luminoso, reconexión manual, contenedor de toasts flotantes `#admin-live-toasts` y animación `.row-live-highlight`.
> **Regla estricta:** NO escribir lógica de base de datos directa. Consumir los métodos provistos por el Backend.

### Tarea F1: Indicador Visual de Conexión en Vivo ("Live Status Badge")
- **Archivos:** `admin/index.html`, `admin/admin.css`, `admin/admin.js`
- **Requerimientos visuales:**
  1. Ubicación: Header o barra superior del Admin, junto al selector de perfil/sucursal.
  2. Componente: Pill Glassmorphism con indicador luminoso (`.live-pulse-dot`):
     - **Verde esmeralda palpitante (`online`):** "En Vivo" + tooltip con hora del último evento.
     - **Ámbar intermitente (`connecting`):** "Conectando..."
     - **Rojo atenuado (`offline` / `error`):** "Desconectado" + botón clickable para "Reconectar".
  3. Transiciones y animaciones CSS sutiles acordes a la identidad visual de Amaru Fighter.

### Tarea F2: Sistema de Notificaciones Toast Reactivas ("Live Tatami Alerts")
- **Archivos:** `admin/admin.css`, `admin/admin.js`
- **Requerimientos visuales:**
  1. Contenedor de toasts flotantes en la esquina superior derecha (`#admin-live-toasts`).
  2. Tarjetas tipo Glassmorphism con borde acentuado e iconos Lucide correspondientes:
     - Pagos: icono de tarjeta/recibo verde esmeralda ("Pago Recibido: [Nombre] - [Monto]").
     - Asistencia: icono de check / tatami azul ("Check-in Tatami: [Nombre] en [Clase]").
  3. Desaparición automática tras 4 segundos con animación de salida suave y botón de descarte manual.

### Tarea F3: Actualización Reactiva de Vistas y Badges en Admin
- **Archivos:** `admin/admin.js`
- **Requerimientos:**
  1. Al recibir un evento en tiempo real, actualizar los contadores del sidebar (`#badge-pending-payments`, `#badge-total-members`).
  2. Si la fila del socio o pago modificado está visible en la tabla activa, aplicar una animación de destello esmeralda momentáneo (`.row-live-highlight`) sin recargar ni alterar el scroll del usuario.
  3. Unificar la vista de socios para garantizar que muestre siempre los datos reactivos consolidados.

---

## FASE 3: Subagente QA (`@qa`) [COMPLETADA ✅]
> **Estado:** Completada con éxito.
> - Nueva suite `tests/admin-realtime.test.js` con 7 tests unitarios y de integración para Realtime.
> - 62/62 pruebas pasando al 100% en Vitest.
> - Cero errores de ESLint.
> - Build de producción Vite (`npm run build`) validado con éxito.

---

## 🏆 Resumen Final de Entrega
1. **Servicio Centralizado:** `admin/realtimeService.js` opera un único WebSocket multiplexado para `payments`, `profiles`, `attendance`, `reservations` y `classes` con reconexión automática y EventEmitter.
2. **UI & Experiencia Admin:** Header enriquecido con Live Status Pill (pulsos luminoso 🟢/🟡/🔴), reconexión manual con un clic, Toasts flotantes para eventos en el tatami/pagos y resaltado reactivo de filas (`.row-live-highlight`).
3. **Calidad y Estabilidad:** 62 tests en verde y cero regresiones.
