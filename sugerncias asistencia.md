# Análisis y Sugerencias: Sección Asistencia — Panel Administrativo

Basado en el código (`app/modules/admin.js`, `members.js`, `app/modules/adminModals.js`, `app/services/supabaseService.js`, `schedule.js`, `app/app.js`).

---

## 1. Diagnóstico del estado actual

### Lo que existe hoy:
- **`app/modules/admin.js`** (`loadAdminAttendance`): Vista administrativa completa de asistencia con:
  - Períodos (`today`, `week`, `month`, `all`).
  - Filtro por período y búsqueda por alumno (nombre/email).
  - Grupos por clase (`displayGroups`) con fecha, hora, tipo, asistentes, y expansión de detalles.
  - Estadísticas (`stats`): sesiones, reservas, socios únicos, capacidad promedio.
  - Insights inteligentes (`insightsHTML`): mejor día, frecuencia promedio, alerta de caída (`lastWeekCount` vs `thisWeekCount`).
  - Top 3 usuarios más activos (`topUsers`).
  - Registro manual (`btn-manual-attendance`) con `Swal.fire`: usuario (`profiles`), clase (`classes`), fecha (`date`). Inserta en `reservations` (`createReservation`) y actualiza `window._attExportData`.
  - Exportación (`btn-export-attendance`) en CSV/XLS/PDF vía `exportToFormat`.
- **`members.js`**: Asistencia integrada en el CRM v2.0:
  - `dashboard`: gráfico `membersAttendanceChart` (últimos 7 días, `allReservations`), estadísticas de asistencia (`mem-attendance-heatmap` en `loadMemberAttendance`).
  - `directorio`: filtro `minLastAttendance` (días sin asistir), ordenación por `lastAttendance`, columna "Última Asistencia" con fecha y días transcurridos.
  - `retencion`: segmentación por `noAttendance` (`daysSinceLastAttendance > 14`), riesgo por baja asistencia.
  - `comunicaciones`: segmento `noAttendance` con mensaje `comeback`.
- **`adminModals.js` (`loadMemberAttendance`)**: En el drawer del socio (`openMemberModal`):
  - Estadísticas (`mem-stat-total`, `mem-stat-month`, `mem-stat-week`).
  - Mapa de calor (`mem-attendance-heatmap`) con 28 días (`opacity` basada en `count`).
  - Lista de asistencias (`mem-attendance-list`) ordenada descendente (últimas 50) con fecha, hora, día de la semana, nombre de clase.
- **`schedule.js`**: Reservas (`reservations`) por fecha, toggle (`deleteReservation` / `createReservation`), asistencia (`logAttendance` con `class_id`, `class_name`), límite mensual (`monthly` del plan, `upSell`), restricciones (`selectedDate` debe ser hoy para usuarios no admin).
- **`supabaseService.js`**:
  - `getAttendance(uid)`: `select('*').eq('user_id', uid).order('attended_at', {ascending: false})`.
  - `logAttendance(uid, classId, className)`: inserta en `attendance` (`user_id`, `class_id`, `class_name`, `attended_at` implícito o `new Date()`).
  - `createReservation(uid, classId, className, date)`: inserta en `reservations`.
  - `getAllReservations()`: `select('*')` sin filtro por usuario (usado en `members.js` para estadísticas globales).
- **`app/app.js`**: Para el usuario final (`athlete`):
  - Check-in (`se`): `logAttendance` + actualización de `xp` (+25) y `attendanceHistoryCount`.
  - Historial (`calculateDynamicStats`): `attendance.length`, `currentMonthAttendance`, `uniqueDays` (últimos 30 días), `currentStreak`.
  - Gráfico `attendanceChart` (últimos 30 días, `attendance`).
  - Gamificación (`badges`): `Novato` (5 clases), `Constante` (20 clases), basado en `attendanceHistoryCount`.

### Problemas detectados:
- **Fragmentación entre vista admin y CRM**: `members.js` usa `membersData` con `allReservations` para estadísticas de asistencia, mientras `admin/admin.js` (`loadAdminAttendance`) usa `window.supabase.from('reservations')` con `profiles` join. No comparten datos ni estado. Un admin que registra asistencia manual en `admin.js` no ve reflejado inmediatamente en `members.js` (y viceversa) sin refrescar la página.
- **Asistencia y reservas separadas**: `attendance` (`attendance`) y `reservations` (`reservations`) son tablas distintas. `schedule.js` crea `reservations`, pero `logAttendance` crea `attendance`. No hay vínculo automático entre ambas: un usuario puede tener una reserva (`reservation`) sin asistencia (`attendance`) y viceversa. No hay validación que impida registrar asistencia sin reserva, o que borre la reserva al registrar asistencia.
- **Registro manual sin validación cruzada**: `btn-manual-attendance` (`admin.js:1428`) inserta en `reservations` (`createReservation`), no en `attendance`. Si el admin quiere registrar asistencia real (no reserva), debe usar otro mecanismo o confiar en que `schedule.js` registre la asistencia al hacer check-in. Esto puede confundir: ¿el botón registra una reserva o una asistencia?
- **Sin trazabilidad de asistencia**: `attendance` (`supabaseService.js:105`) no tiene `registered_by` (admin que registró) ni `method` (`check-in`, `manual`, `auto`). Esto impide auditar quién registró una asistencia manual.
- **Sin gestión de asistencia por plan/clase**: `members.js` (`directorio`) muestra la última asistencia, pero no indica a qué clase asistió ni si cumplió con el límite del plan (`monthly`). No hay un KPI de "asistencias vs límite del plan" en el dashboard o directorio.
- **Insights inteligentes limitados**: `loadAdminAttendance` (`admin.js:1215`) calcula `bestDay`, `avgWeek`, `lastWeekCount`, `thisWeekCount`, y alerta de caída (`< 0.8`). Es útil, pero no predice ni compara con meses anteriores. No hay alerta automática (solo visual).
- **Exportación limitada**: `btn-export-attendance` (`admin.js:1538`) exporta `Fecha`, `Clase`, `Horario`, `Alumno`, `Email`. Falta `Estado` (presente/ausente), `Tipo de registro` (manual, automático), `ID`, `Plan` del alumno.
- **Mapa de calor (`members.js` / `adminModals.js`) sin contexto**: El mapa (`mem-attendance-heatmap`) muestra 28 días con `opacity` basada en `count`. No muestra fechas específicas ni permite navegar a un día específico. No indica si un día tiene asistencia de una clase específica o es un registro general.
- **Asistencia en `members.js` (dashboard)**: `membersAttendanceChart` (`members.js:263`) usa `last7Days` con `allReservations.filter(r => r.reservation_date === dStr)`. Esto mide reservas, no asistencias confirmadas (`attendance`). Un usuario puede reservar pero no asistir; el gráfico muestra reservas como asistencia.
- **No hay vista de asistencia en `members.js`**: Aunque `members.js` es el "CRM v2.0", no tiene una pestaña o vista dedicada exclusivamente a asistencia (como `attendance` en `members.js` o `retencion`). La asistencia está dispersa en `dashboard`, `directorio`, `retencion`, `comunicaciones`. No hay una sección para ver todas las asistencias de un socio con contexto completo (plan, vencimiento, reservas).
- **Performance**: `loadAdminAttendance` hace `select('*, profiles(...)')` con `.limit(800)` (`admin.js:1084`). Para bases grandes, 800 registros pueden ser insuficientes (no ve todo el historial), pero suficientes para hoy/semana/mes. No hay paginación en el grupo, solo expansión por clase.

---

## 2. Sugerencias detalladas por categoría

### A. Unificación y arquitectura (Alta prioridad)

1. **Consolidar asistencia y reservas en una sola fuente de verdad**:
   - `members.js` debe usar los datos de `loadAdminAttendance` (o viceversa) en lugar de `membersData` con `allReservations` independientes. Sugerencia: hacer que `members.js` llame a `fetchAllMembersData()` pero también obtenga `attendance` (`getAllAttendance()` o `getAttendanceByDateRange`) y sincronice con `admin/admin.js`.
2. **Definir claramente la relación `reservations` vs `attendance`**:
   - Si `reservations` es el registro de reserva (planificación) y `attendance` es el registro de asistencia confirmada (check-in), debe haber un flujo claro:
     - Reserva (`schedule.js`) → Asistencia (`logAttendance` en `schedule.js` o `adminModals.js`).
     - Si un admin registra asistencia manual (`btn-manual-attendance`), debe insertarse en `attendance`, no solo en `reservations`, o debe haber una opción clara: "Registrar reserva" vs "Registrar asistencia confirmada".
3. **Crear módulo `attendance` integrado en `members.js`**:
   - Añadir una pestaña `asistencia` en `members.js` (o integrar `loadAdminAttendance` dentro del CRM v2.0) para que el admin tenga una vista completa sin salir del CRM.

### B. Datos y trazabilidad (`attendance` table)

4. **Añadir campos a `attendance`** (`supabaseService.js` y DB):
   - `registered_by` (string, `user_id` del admin o `user_id` del atleta que hizo check-in).
   - `method` (`'check-in'`, `'manual'`, `'admin-manual'`, `'webhook'`).
   - `reservation_id` (referencia a `reservations.id`) para vincular reserva con asistencia confirmada.
   - `notes` (opcional, para notas del admin sobre la asistencia).
5. **Vincular `attendance` con `reservations`**:
   - En `schedule.js`, al hacer `logAttendance`, pasar `reservation_id` si existe (`getReservations` del usuario para esa fecha y clase).
   - En `members.js` (`directorio`), al calcular `daysSinceLastAttendance`, usar `attendance` (`getAttendance`) en lugar de `allReservations`, o aclarar en la UI que es "última asistencia confirmada" vs "última reserva".
6. **Auditoría de asistencia manual** (`admin.js`):
   - `btn-manual-attendance` debe registrar `method: 'manual'` y `registered_by: window.appState.user?.uid` en `attendance`. Si se quiere registrar una reserva (sin asistencia confirmada), usar `createReservation` con `method: 'reservation-manual'`.

### C. Vista administrativa (`loadAdminAttendance` — `admin.js`)

7. **Diferenciar registro manual por tipo**:
   - En el `Swal.fire` (`admin.js:1438`), añadir una opción: "¿Registrar reserva o asistencia confirmada?"
   - Si es asistencia confirmada, insertar en `attendance` (`logAttendance` con datos manuales) y opcionalmente crear `reservation` si no existe.
8. **Filtrado avanzado**:
   - Añadir filtro por `classType` (`Striking`, `BJJ`, etc.) en `loadAdminAttendance` (ya existe parcialmente mediante `typeColor`, pero no como filtro interactivo).
   - Añadir filtro por rango de fechas (`start` / `end`) con `date picker`.
   - Añadir filtro por alumno específico (ya existe `att-search-input`, pero podría ser un dropdown con autocompletado usando `profiles`).
9. **Estadísticas mejoradas** (`stats` — `admin.js:1172`):
   - Añadir "Asistencias confirmadas vs Reservas" (`attendance` vs `reservations`) para ver tasa de cumplimiento.
   - Añadir "Asistencia por plan" (desglose por `membership_plans` usando `profiles` del alumno).
   - Añadir "Asistencia por día de la semana" (gráfico de barras con `dayCounts` ya calculado en `insightsHTML`, pero no visualizado como gráfico).
10. **Insights predictivos y alertas automáticas**:
    - La alerta de caída (`admin.js:1244`) es visual (`insightsHTML`). Añadir un `window.showToast` o una notificación persistente en la UI del admin si `thisWeekCount < lastWeekCount * 0.8`.
    - Añadir predicción simple: "A este ritmo, la asistencia semanal proyectada será X% menor que la anterior."
11. **Exportación completa (`admin.js:1538`)**:
    - Añadir `Estado` (`reservation` o `attendance`), `Tipo de registro` (`manual`, `check-in`), `Plan` (del alumno), `Registro por`.
    - Añadir opción de exportar con o sin datos de contacto (para privacidad).
12. **Paginación o scroll virtual**:
    - `allReservations` (`admin.js:1084`) tiene `.limit(800)`. Para bases grandes, 800 puede ser insuficiente. Añadir paginación (`offset` / `limit`) o `virtual scroll` en los grupos (`att-panel-card`).

### D. CRM v2.0 (`members.js`)

13. **Integrar `loadAdminAttendance` en `members.js`**:
    - En `members.js`, añadir una pestaña `asistencia` que invoque `loadAdminAttendance` (o reimplementar una versión simplificada con los datos de `membersData` y `allReservations`).
    - En `dashboard`, el gráfico `membersAttendanceChart` debe usar `attendance` en lugar de `allReservations` (o aclarar en el tooltip: "Reservas confirmadas" vs "Asistencias registradas").
14. **Directorio con contexto de asistencia**:
    - En `directorio`, la columna "Última Asistencia" debe mostrar la fecha de `attendance` (`attended_at`), no solo `reservation_date`. Si no hay asistencia confirmada, mostrar "Sin confirmar" o "Reserva pendiente".
    - Añadir una columna opcional: "Asistencias este mes" (`monthRes` en `members.js` ya existe, pero podría ser más prominente o tener color por estado).
15. **Retención con asistencia confirmada**:
    - El cálculo de riesgo (`members.js:729`) usa `_daysSinceLastAttendance` (`allReservations`). Debería usar `attendance` (`getAttendance`) para ser más preciso. Si se mantiene `allReservations`, aclarar en la UI que es "última reserva/actividad".
16. **Comunicaciones con datos de asistencia**:
    - El segmento `noAttendance` (`members.js:858`) usa `_daysSinceLastAttendance > 14`. Debería basarse en `attendance`. Añadir un botón rápido en cada tarjeta del segmento que envíe `comeback` con personalización de asistencia: "Hola {nombre}, te extrañamos. Tu última asistencia confirmada fue hace X días."

### E. Modal de socio (`adminModals.js` — `loadMemberAttendance`)

17. **Mapa de calor mejorado (`members.js:635` / `adminModals.js`)**:
    - Añadir `title` o `tooltip` con la fecha exacta (`d.toLocaleDateString('es-CL')`) y la cantidad de asistencias (`count`).
    - Añadir navegación: clic en un día del mapa para ver las asistencias de ese día específico (o navegar a `directorio` con filtro de fecha).
    - Añadir leyenda de colores para `count` (`0`: transparente, `1`: `0.3`, `2`: `0.6`, `>2`: `1`).
18. **Lista de asistencias con contexto**:
    - `loadMemberAttendance` (`adminModals.js:646`) muestra `dateStr`, `timeStr`, `dayName`, `class_name`. Añadir:
      - Tipo de registro (`check-in`, `manual`).
      - Estado de reserva (`reserved`, `attended`, `cancelled`).
      - Botón rápido para ver la clase correspondiente (`openClassModal` o navegar al horario).
    - Añadir estadísticas adicionales: "Asistencias confirmadas vs Reservas totales" (`getAttendance` vs `getUserReservations`).
19. **Integración con `schedule.js`**:
    - En `loadMemberAttendance`, añadir un botón "Ver reservas futuras" que muestre las reservas (`getUserReservations`) del socio para los próximos días, con opción de cancelar (`deleteReservation`) o confirmar asistencia (`logAttendance`).

### F. Usuario final (`schedule.js`, `app/app.js`)

20. **Diferenciación clara entre reserva y asistencia** (`schedule.js`):
    - En `schedule.js`, la reserva (`createReservation`) y la asistencia (`logAttendance`) deben ser acciones separadas con estados visibles:
      - `pending`: reserva pendiente.
      - `attended`: asistencia confirmada.
      - `cancelled`: reserva cancelada.
    - El `check-in` (`btn-checkin-dash` en `app/app.js:1590`) debe validar que la reserva existe (`getReservations`) antes de crear `attendance`. Si no existe, mostrar mensaje: "No tienes reserva para hoy. ¿Registrar asistencia sin reserva?" (opción para admin o caso especial).
21. **Asistencia por plan y límite** (`schedule.js`):
    - `schedule.js` (`toggleReservation`) valida `monthly` (`plan.monthly`). Añadir validación similar para `attendance`: si un usuario tiene un plan con límite mensual (`monthly`), contar `attendance` del mes (`currentMonth`) en lugar de `reservations` para el límite. Esto es más preciso, ya que una reserva sin asistencia no consume el límite real.
22. **Asistencia y XP (`app/app.js`)**:
    - `app/app.js` (`se`) suma `+25 XP` (`c.xp = n + 25`). Asegurar que `logAttendance` (`supabaseService.js`) registre `attendance`, y que el cálculo de `currentStreak` (`app/app.js`) sea consistente con los datos de `attendance` (no solo con `attendanceHistoryCount` en memoria).
    - Añadir `streak` calculado en `supabaseService` o en `members.js`: número de días consecutivos con asistencia (`uniqueDays` ordenados, `currentStreak` = días consecutivos al final).

### G. Datos y base de datos (Sugerencia de esquema)

23. **Campos sugeridos para `attendance`**:
    - `user_id`, `class_id`, `class_name`, `attended_at`, `registered_by`, `method` (`check-in`, `manual`, `admin-manual`), `reservation_id` (referencia a `reservations`), `notes`.
24. **Campos sugeridos para `reservations`**:
    - `user_id`, `class_id`, `class_name`, `reservation_date`, `status` (`pending`, `attended`, `cancelled`), `reservation_method` (`user`, `admin-manual`).
25. **Relación entre tablas**:
    - `attendance.reservation_id` → `reservations.id`.
    - `reservations.user_id` → `profiles.id`.
    - `attendance.class_id` → `classes.id`.
26. **Vista materializada o función de sincronización**:
    - Crear una función (`syncReservationStatus`) que actualice `reservations.status` a `attended` cuando existe `attendance` con `reservation_id`. Esto mantiene la consistencia entre reserva y asistencia.

### H. Experiencia de usuario (UI/UX)

27. **Estado vacío inteligente (`loadAdminAttendance`)**:
    - Si no hay reservas (`allReservations.length === 0`), mostrar mensaje con acción: "No hay reservas registradas. ¿Registrar asistencia manual?" (`btn-manual-attendance`).
    - Si hay reservas pero `attendance` está vacío (`filteredReservations` sin `attendance` confirmada), mostrar alerta: "Hay reservas pero ninguna asistencia confirmada hoy."
28. **Visualización por clase (`att-panel-card`)**:
    - Añadir un indicador de capacidad (`attendees.length / class.capacity`) para ver si la clase está llena.
    - Añadir un indicador de asistencia histórica por clase (`attendance` filtrado por `class_id`).
29. **Animaciones consistentes**:
    - `loadAdminAttendance` (`admin.js:1283`) usa `staggerFadeIn` (`admin.js:1384`). Aplicar la misma animación a `members.js` (`directorio`, `retencion`, `comunicaciones`) y `loadMemberAttendance` (`adminModals.js`).
30. **Accesibilidad y responsive**:
    - `att-panel-card` (`admin.js:1293`) usa `overflow:hidden`. Asegurar que sea responsive en pantallas pequeñas (`flex-wrap` en `att-panel-header`).
    - El `Swal.fire` (`admin.js:1438`) debe ser accesible (`focusConfirm`, `showCancelButton`).

---

## 3. Propuesta de implementación paso a paso

| Paso | Acción | Archivo(s) afectado(s) |
|---|---|---|
| 1 | Definir relación `reservations` ↔ `attendance` (`reservation_id`, `method`, `registered_by`) | DB, `supabaseService.js` |
| 2 | Unificar datos de asistencia en `members.js` (o integrar `loadAdminAttendance`) | `members.js`, `admin/admin.js` |
| 3 | Mejorar `btn-manual-attendance` con opción de tipo (`reserva` vs `asistencia confirmada`) | `admin.js` (`app/modules/admin.js`) |
| 4 | Añadir trazabilidad (`registered_by`, `method`) a `attendance` | `supabaseService.js`, DB |
| 5 | Mejorar `loadAdminAttendance` con estadísticas avanzadas (asistencia vs reservas, asistencia por plan) | `admin.js` (`app/modules/admin.js`) |
| 6 | Mejorar exportación (`btn-export-attendance`) con nuevos campos (`Estado`, `Plan`, `Registro por`) | `admin.js`, `exportUtils.js` |
| 7 | Mejorar `loadMemberAttendance` (mapa de calor con fechas, contexto, botón para navegar) | `adminModals.js` |
| 8 | Corregir `members.js` (`dashboard`) para usar `attendance` en lugar de `reservations` o aclarar la fuente | `members.js` |
| 9 | Mejorar `schedule.js` (validación de límite por `attendance`, estado de reserva) | `schedule.js` |
| 10 | Integrar `streak` y asistencia confirmada en `app/app.js` (gamificación) | `app/app.js` |

---

## 4. Beneficio esperado para el administrador

- **Claridad operativa**: Diferenciar claramente entre "reserva" (intención) y "asistencia confirmada" (acción), evitando confusiones en reportes.
- **Auditoría completa**: Cada registro de asistencia (manual o automático) queda trazado con quién lo hizo, cómo y cuándo.
- **Retención basada en datos reales**: El `churn score` y las alertas se basan en asistencia confirmada, no en reservas no cumplidas, haciendo la retención más precisa.
- **Gestión masiva y rápida**: Exportar asistencias con contexto completo (plan, registro por, tipo) para reportes externos o análisis internos.
- **Proactividad**: Las alertas de caída de asistencia permiten intervenir antes de que los socios dejen de asistir completamente.
