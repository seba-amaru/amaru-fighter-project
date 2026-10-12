# Hoja de Ruta: RUTA 2 — Modo Pantalla Tatami / Kiosco TV en Vivo

**Estado:** ✅ COMPLETADO (100% Desarrollado, Auditado y Probado)

---

## OBJETIVO
Proveer una experiencia visual inmersiva para Smart TVs, tablets o pantallas fijas ubicadas en la recepción o tatami del Dojo. La pantalla proyecta en tiempo real la clase en curso, el código QR gigante para check-in de asistencia y la lista dinámica de atletas presentes y pendientes.

---

## SPRINT 1: ARQUITECTURA DE DATOS & SINCRONIZACIÓN EN VIVO (BACKEND) ✅ COMPLETADO

### 👨‍💻 Subagente BACKEND (`@backend`)
1. **Tarea B2.1: Detector Inteligente de Clase Activa / Próxima** ✅
   - Archivo: `app/services/supabaseService.js`
   - Función `getActiveClassForKiosk(classes, nowRef)`:
     - Detecta clase activa (-20 min de inicio hasta +20 min de fin), próxima clase del día o estado de jornada finalizada con fallback elegante.
2. **Tarea B2.2: Agregador de Roster en Vivo (Reservas + Asistencias)** ✅
   - Archivo: `app/services/supabaseService.js`
   - Función `getLiveClassStatus(classId, date)`:
     - Retorna clase, Sensei, token QR de gran resolución, lista unificada de atletas ordenados por estado de asistencia (`hasAttended`), cálculo de aforo y lista de espera separada.
3. **Tarea B2.3: Canal Realtime para Asistencias en Tatami** ✅
   - Archivo: `app/services/supabaseService.js`
   - Función `subscribeToLiveAttendance(classId, date, callback)`:
     - Suscripción con Supabase Realtime a cambios en las tablas `attendance` y `reservations` para reflejar check-ins en tiempo real sin refresco manual.

---

## SPRINT 2: EXPERIENCIA VISUAL KIOSCO TV (FRONTEND) ✅ COMPLETADO

### 🎨 Subagente FRONTEND (`@frontend`)
1. **Tarea F2.1: Vista Kiosco TV Fullscreen (Modo Tatami Arena)** ✅
   - Archivos: `admin/index.html`, `admin/admin.css`, `admin/admin.js`
   - Overlay a pantalla completa (#tatami-kiosk-overlay) optimizado para 1080p/4K TV con Dark Obsidian Glassmorphism:
     - Cabecera con branding oficial de Amarufighter Dojo, reloj en tiempo real y badges de estado dinámicos (EN VIVO 🔴 / PRÓXIMA CLASE ⏳ / FINALIZADA 🥋).
     - Caja QR de alta definición (350x350px) con resplandor neón pulsante e instrucciones claras de escaneo.
     - Grid interactivo de atletas con tarjetas Obsidian Neón: borde esmeralda pulsante y badge "EN TATAMI ✓" para presentes; borde sutil y badge "POR LLEGAR" para pendientes.
     - Barra de aforo dinámica con porcentaje de ocupación instantáneo.
2. **Tarea F2.2: Lanzador de Pantalla Completa desde Cockpit Admin** ✅
   - Botón directo `"📺 Kiosco TV Tatami"` en la barra superior del Admin y en el módulo de Asistencias.
   - Soporte nativo para Fullscreen API del navegador con fallback elegante.

---

## SPRINT 3: AUDITORÍA QA & ESTABILIDAD (QA) ✅ COMPLETADO

### 🧪 Subagente QA (`@qa`)
1. **Tarea Q2.1: Pruebas de Detección de Clase y Roster** ✅
   - Archivo: `tests/qa-audit.test.js`
   - 6 pruebas automatizadas añadidas (Q5.1 a Q5.6) cubriendo detección matutina/vespertina/fuera de horario, conteo de presentes vs reservados, cálculo de ocupación y generación de tokens QR.
2. **Tarea Q2.2: Compilación y Calidad de Código** ✅
   - `npm run test`: 55/55 pruebas unitarias e integración aprobadas (100% pasando).
   - `npm run lint`: 0 errores en ESLint.
   - `npm run build`: Compilación limpia de Vite sin advertencias de sintaxis o fallos de empaquetado.
