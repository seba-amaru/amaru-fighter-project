# Análisis y Sugerencias: Socios CRM v2.0 — Panel Administrativo

Basado en el código (`app/modules/members.js`, `admin/admin.js`, `app/modules/adminModals.js`, `app/services/supabaseService.js`).

---

## 1. Diagnóstico del estado actual

### Lo que existe hoy:
- **`app/modules/members.js`**: Implementa el "Control de Socios v2.0" con 4 vistas operativas claras:
  - `dashboard`: KPIs (total, activos, congelados, morosos, nuevos este mes, retención %, días promedio de membresía), gráficos (evolución 6 meses, distribución por plan, asistencia 7 días), actividad reciente (socios recientes + pagos recientes), y alertas críticas (por vencer, sin asistencia >14 días, morosos).
  - `directorio`: Tabla densa con filtros (búsqueda, estado, plan, días restantes, asistencia mínima), ordenación, paginación y acciones rápidas (editar, renovar, eliminar).
  - `retencion`: Vista de riesgo (`churn score` 0-100) con filtros (alto, medio, bajo, inactivo) y acciones de registro de pago / edición.
  - `comunicaciones`: Segmentos predefinidos (todos, activos, morosos, por vencer esta semana, sin asistir >14 días, inactivos), plantillas de mensajes, canal (In-App, Email, Ambos) y vista previa de destinatarios.
- **`admin/admin.js`**: Tiene una versión anterior (`loadMembersTable`) con tabla básica, búsqueda por nombre/email y filtros por `membership_status`. Usa `cachedMembers`, `plansMap`. Abre drawer (`openMemberDrawer`) con pestañas Perfil, Membresía, Asistencia, Pagos, Notas.
- **`app/modules/adminModals.js`**: `openMemberModal` es el editor completo del socio. Incluye:
  - Datos personales, RUT, teléfono, nivel, XP, fecha de ingreso, fecha de nacimiento, dirección, contacto de emergencia, notas de admin.
  - Pestaña Membresía: plan, estado (activo/inactivo/congelado), fecha de vencimiento, límite de clases, recargo.
  - Pestaña Asistencia: lista de asistencias + mapa de calor (últimos 28 días).
  - Pestaña Pagos: historial + estadísticas (total, pendiente, monto aprobado).
  - Pestaña Notas.
  - Acciones rápidas: renovar (+30 días), congelar/descongelar, activar/inactivar, extender (+7 o +30), enviar mensaje (In-App / Email / Ambos), eliminar.
  - Auto-registro de pago al renovar/activar (`quickRenewMember`, `openMemberModal` al guardar).
- **`supabaseService.js`**: `getAllProfiles`, `getProfile`, `updateProfile`, `getAttendance`, `getPayments`, `getClasses`, `getMembershipPlans`, etc.

### Problemas detectados:
- **Fragmentación entre versiones**: `members.js` (v2.0) y `admin/admin.js` (`loadMembersTable`) coexisten. El usuario no tiene una única fuente de verdad para la gestión de socios.
- **Datos duplicados/sin sincronización**: `membersData` en `members.js` hace fetch independiente de `profiles`, `reservations`, `plans`, `payments`. No usa `cachedMembers` de `admin/admin.js`. Esto puede generar inconsistencias si un admin edita en un lado y no refresca el otro.
- **Sin trazabilidad de cambios en socio**: `updateProfile` (`supabaseService.js`) no registra quién modificó el perfil ni qué cambió. No hay `updated_by` ni `updated_at` visible en el drawer.
- **Retención (`churn score`) basada solo en datos actuales**: El cálculo (`members.js:729`) es estático (basado en asistencia, vencimiento, estado, consumo mensual). No compara con períodos anteriores ni predice. Es útil pero no es una métrica de tendencia.
- **Comunicaciones (`comunicaciones`) sin personalización real**: Las plantillas usan `{nombre}`, pero los emails se envían con `msg.replace(/{nombre}/g, 'Atleta')` (`members.js:1049`) en lugar de reemplazar por el nombre real del destinatario individual. El mensaje In-App sí reemplaza (`msg.replace(/{nombre}/g, user.full_name || 'Atleta')`), pero el email usa un reemplazo genérico.
- **Sin validación de datos críticos**: `openMemberModal` (`adminModals.js`) no valida que `email` tenga formato válido, ni que `rut` cumpla con un patrón básico. Permite guardar `email` vacío generando `socio.{timestamp}@amaru.local` automáticamente (`adminModals.js:799`), lo cual puede ser intencional para usuarios sin tecnología, pero no hay indicador claro en el drawer de que ese email es generado.
- **Falta de integración con ingresos**: El dashboard de `members.js` muestra pagos recientes (`paymentsData`), pero no cruza ingresos con retención. No hay KPI de "ingresos por plan" ni "valor de vida del cliente" (LTV) básico.
- **Acciones masivas limitadas**: `comunicaciones` permite enviar a segmentos, pero `directorio` no permite acciones masivas (ej. renovar todos los morosos, congelar todos los inactivos). `retencion` tampoco tiene acciones masivas.
- **Rendimiento en `members.js`**: `fetchAllMembersData` hace 4 queries separadas (`profiles`, `reservations`, `membership_plans`, `payments`). Para bases grandes, podría usar joins o vistas materializadas.
- **Estado `is_deleted`**: `members.js` (`fetchAllMembersData`) usa `.eq('is_deleted', false)` (`members.js:44`), pero `supabaseService.getAllProfiles` (`supabaseService.js:155`) también usa `.eq('is_deleted', false)`. Consistente, pero no hay vista de "socios eliminados" ni posibilidad de restaurar (soft delete sin UI de recuperación).

---

## 2. Sugerencias detalladas por categoría

### A. Unificación y arquitectura (Alta prioridad)

1. **Consolidar el módulo de socios**: Hacer que `members.js` sea el módulo oficial para la sección `members` en `admin/admin.js`. Reemplazar `loadMembersTable` (`admin/admin.js:882`) con `renderAdminMembers()` (`members.js:60`). Esto elimina la duplicación y garantiza que los admin usen la v2.0 con todas sus vistas.
2. **Estado global compartido**: Si `members.js` y `admin/admin.js` deben coexistir, usar `cachedMembers` (`admin/admin.js:879`) como fuente de verdad y hacer que `members.js` consuma ese cache en lugar de hacer `fetchAllMembersData` independiente. O, mejor aún, eliminar `cachedMembers` y usar `membersData` con un evento de actualización (`updateMembersCache`).
3. **Enrutamiento único**: En `admin/admin.js`, `navigateToSection('members')` debe invocar `renderAdminMembers()` (`members.js`) en lugar de `loadMembersTable`.

### B. Datos del socio y gestión de perfiles

4. **Trazabilidad completa (`profiles` table)**:
   - Añadir `updated_by` (referencia a `auth.users`) y `updated_at` (ya existe implícitamente pero no se usa para auditoría visible).
   - En `openMemberModal` (`adminModals.js`), al guardar, pasar `updated_by: window.appState.user?.uid` o similar.
   - Mostrar en el drawer (`loadMemberDrawerHistory`) un pequeño log: "Última actualización por [nombre] el [fecha]".
5. **Validación de datos críticos** (`openMemberModal`):
   - Validar `email`: si no tiene `@` y no es `@amaru.local`, mostrar advertencia.
   - Validar `rut`: usar un regex básico para formato chileno (ej. `12.345.678-9` o `12345678-9`).
   - Validar `full_name`: obligatorio, no vacío.
   - Validar `membership_plan_id`: si el usuario es `active`, debe tener un plan asignado (a menos que sea un caso especial).
6. **Indicador de email generado**: Si `email` termina en `@amaru.local`, mostrar una etiqueta visual en el drawer y en la tabla: "📵 Sin tecnología — Email generado automáticamente" (`members.js` y `admin/admin.js` ya lo muestran parcialmente).
7. **Campos adicionales sugeridos para `profiles`**:
   - `technology_access` (boolean): si el usuario tiene acceso a tecnología (email real, app, WhatsApp). Esto ayuda al admin a saber si puede enviar comunicaciones digitales o debe usar contacto físico/telefónico.
   - `last_active_at` (timestamp): fecha de última asistencia o actividad confirmada (no solo `created_at`).
   - `lifetime_value` (numeric): suma acumulada de pagos `approved` (calculado, no persistente necesariamente, pero útil para reportes).

### C. Dashboard (`members.js` — Vista Dashboard)

8. **KPIs más operativos**:
   - Añadir "Ingresos este mes por plan" (desglose del gráfico `planDist` con montos, no solo cantidad de socios).
   - Añadir "Tasa de asistencia semanal" (% de activos que asistieron al menos una vez en los últimos 7 días).
   - Añadir "Promedio de días hasta vencimiento" (para los activos), no solo "días promedio de membresía".
9. **Gráficos con tendencias**:
   - El gráfico de evolución (`membersEvolutionChart`) muestra nuevos por mes. Añadir una línea de "bajas" (socios que pasaron a `inactive` o `moroso`) para ver balance neto.
   - El gráfico de asistencia (`membersAttendanceChart`) es por día. Añadir una línea de referencia del mes anterior para comparar.
10. **Alertas críticas más inteligentes**:
    - En lugar de solo mostrar "Vence en X días", añadir un botón rápido "Renovar" que abra `quickRenew` directamente, y otro "Enviar mensaje" que abra el segmento "Por vencer esta semana" en `comunicaciones`.
    - Para "Sin asistir >14 días", añadir un botón "Enviar recordatorio" que abra `comunicaciones` con el segmento `noAttendance` preseleccionado.

### D. Directorio (`directorio`)

11. **Acciones masivas en Directorio**:
    - Añadir checkbox por fila.
    - Botones masivos: "Renovar seleccionados", "Enviar mensaje a seleccionados", "Congelar seleccionados", "Eliminar seleccionados" (con confirmación de impacto).
    - Esto es especialmente útil para gestionar grupos de morosos o congelados sin hacerlo uno por uno.
12. **Filtrado avanzado**:
    - El filtro `minDaysLeft` / `maxDaysLeft` funciona por `_daysLeft` (`members.js:471`). Asegurar que `_daysLeft` sea `null` para `Inactivo` sin fecha de vencimiento, para que los filtros no los excluyan incorrectamente si el admin busca por rango.
    - Añadir filtro por "Último pago aprobado" (ej. socios sin pago aprobado en los últimos 30 días). Esto requiere cruzar `paymentsData` (`members.js:16`) en el filtro, que actualmente no se usa en `directorio`.
13. **Exportación mejorada (`members.js:710`)**:
    - El CSV exporta datos básicos. Añadir: `email`, `plan`, `estado`, `días restantes`, `última asistencia`, `total reservas mes`, `churn score` (si se implementa persistencia de retención).
    - Añadir opción de exportar con o sin datos de contacto (para cumplir con privacidad si se comparte externamente).

### E. Retención (`retencion`)

14. **Churn score con historial**:
    - Actualmente (`members.js:729`) calcula `score` estático. Sugerencia: persistir `_churnScore` (o un campo `retention_score`) en `profiles` cada noche o al realizar acciones (asistencia, pago, renovación). Esto permite comparar evolución (ej. "¿Mejoró o empeoró este mes?").
    - Añadir gráfico de evolución del `score` por socio (en el drawer o en una vista de detalle de retención).
15. **Alertas predictivas**:
    - En lugar de solo filtrar por `high` (`score >= 60`), añadir una alerta automática diaria para los admins: "Hoy hay X socios en riesgo alto" con un botón para verlos directamente.
    - Integrar con `comunicaciones`: un botón en cada tarjeta de riesgo que envíe directamente el mensaje `comeback` o `expiry_reminder` según el motivo principal del riesgo (`members.js:792`).
16. **Segmentación dinámica**:
    - El filtro `inactive` (`members.js:746`) muestra solo inactivos. Añadir un filtro combinado: "Inactivos que fueron morosos" (para distinguir entre baja voluntaria y baja por falta de pago).

### F. Comunicaciones (`comunicaciones`)

17. **Personalización real en emails**:
    - Corregir `members.js:1049`: reemplazar `msg.replace(/{nombre}/g, 'Atleta')` por `msg.replace(/{nombre}/g, user.full_name || 'Atleta')` para cada destinatario individual en `sendBulkEmail`, o construir mensajes individuales si `SupabaseService.sendBulkEmail` no soporta personalización masiva.
    - Si el servicio `send-email` (`supabase/functions/send-email/index.ts`) permite enviar a múltiples destinatarios con contenido personalizado, considerar usar `sendUserNotification` individual para cada usuario con mensaje personalizado.
18. **Confirmación de envío con estadísticas**:
    - Después de enviar, mostrar en un toast: "Enviado a X socios: Y In-App, Z Email, W fallidos".
    - Añadir un botón "Reintentar fallidos" si hay errores.
19. **Plantillas adicionales**:
    - Añadir plantilla `no_payment`: para morosos.
    - Añadir plantilla `renew_now`: para por vencer.
    - Añadir plantilla `attendance_reminder`: para sin asistencia >14 días.
    - Añadir plantilla `freeze_notice`: para congelados (recordatorio de descongelar).
20. **Integración con pagos y retención**:
    - En `comunicaciones`, al seleccionar un segmento, mostrar un resumen del impacto esperado: "Enviar recordatorio a 15 morosos podría recuperar ~$X en ingresos mensuales" (basado en el monto promedio de sus planes).

### G. Modal de socio (`openMemberModal` — `adminModals.js`)

21. **Dashboard dentro del modal**:
    - En la pestaña Perfil (`mem-tab-profile`), añadir una mini-sección con los datos clave de retención: `churn score` (si existe), días restantes, asistencia del mes, pagos recientes, y alertas rápidas.
    - Esto evita que el admin tenga que navegar entre vistas para ver el contexto completo del socio.
22. **Acciones en contexto**:
    - En la pestaña Pagos (`mem-payments-list`), añadir un botón "Registrar Pago" que abra `openQuickPaymentModal` (`payments.js`) con los datos del socio prellenados.
    - En la pestaña Membresía, añadir un botón "Ver Cobranza del Mes" que navegue a `comunicaciones` o `retencion` con ese socio filtrado.
23. **Notas con metadatos**:
    - El campo `admin_notes` (`members.js` y `adminModals.js`) acepta texto libre. Mejorarlo con estructura: fecha, autor, tipo (nota, alerta, seguimiento), y contenido. Esto convierte las notas en un historial de interacción, no solo un campo de texto.
24. **Foto y datos de contacto**:
    - `photo_url` (`members.js:273`, `adminModals.js:293`) usa `unknowAvatar` como fallback. Añadir un botón "Subir foto" que use `uploadAvatar` (`supabaseService.js:348`) directamente desde el modal.
    - Añadir un botón "Llamar" (`btnWhatsapp`) que funcione con el número real, no solo si tiene `phone` (`admin/admin.js:686`). Asegurar que `members.js` también muestre el botón de WhatsApp en el drawer o en la tarjeta de directorio.

### H. Datos y base de datos (Sugerencia de esquema)

25. **Campos adicionales para `profiles`**:
    - `updated_by` (string, referencia al admin que hizo el último cambio).
    - `retention_score` (integer, 0-100, actualizado periódicamente).
    - `technology_access` (boolean).
    - `last_active_at` (timestamp).
    - `admin_notes` ya existe, pero podría ser una tabla separada (`member_notes`) para historial auditado.
26. **Nueva tabla `member_activity_logs`** (opcional):
    - `member_id`, `action` (`updated`, `renewed`, `frozen`, `activated`, `deleted`), `performed_by`, `changes` (JSON), `created_at`.
27. **Vista materializada `retention_status`** (opcional):
    - Calcula `_status`, `_daysLeft`, `_daysSinceLastAttendance`, `_monthRes`, `_churnScore` periódicamente. Esto acelera `members.js` (`fetchAllMembersData`) y `directorio`.

### I. Experiencia de usuario (UI/UX)

28. **Estado vacío inteligente**:
    - En `retencion`, si no hay riesgos altos, mostrar: "🎉 Ningún socio en riesgo alto. Revisa los de riesgo medio para acciones preventivas."
    - En `comunicaciones`, si no se selecciona segmento, mostrar ejemplos de impacto: "Enviar a todos los activos podría mejorar la retención en un 5%."
29. **Animaciones y transiciones**:
    - `members.js` ya usa `dashFadeIn` (`members.js:215`). Extenderlo a `directorio`, `retencion` y `comunicaciones` para consistencia visual.
30. **Responsive**:
    - La tabla `directorio` (`members.js:555`) ya tiene `overflow-x:auto`. Asegurar que `comunicaciones` (`members.js:867`) también sea responsive en pantallas pequeñas (actualmente usa `grid-template-columns: 1fr 1fr`, que puede romper en móviles).

---

## 3. Propuesta de implementación paso a paso

| Paso | Acción | Archivo(s) afectado(s) |
|---|---|---|
| 1 | Unificar `members.js` como módulo principal de socios | `admin/admin.js`, `members.js` |
| 2 | Añadir `updated_by`, `retention_score`, `technology_access`, `last_active_at` a `profiles` | DB, `supabaseService.js` |
| 3 | Mejorar `openMemberModal` con trazabilidad de cambios (`updated_by`) | `adminModals.js`, `members.js` |
| 4 | Mejorar `directorio` con acciones masivas y filtros avanzados | `members.js` |
| 5 | Mejorar `retencion` con histórico de `churnScore` y acciones masivas | `members.js`, DB |
| 6 | Corregir `comunicaciones` (personalización real, estadísticas de envío) | `members.js`, `supabase/functions/send-email` |
| 7 | Mejorar `dashboard` con KPIs por plan, balance neto, asistencia histórica | `members.js` |
| 8 | Añadir validación de datos críticos (`email`, `rut`, `full_name`) en `openMemberModal` | `adminModals.js` |
| 9 | Implementar `member_notes` (historial auditado) o mejorar `admin_notes` | DB, `members.js` |
| 10 | Sincronizar `membersData` con `cachedMembers` o eliminar duplicación | `members.js`, `admin/admin.js` |

---

## 4. Beneficio esperado para el administrador

- **Unificación**: Un solo panel para ver, buscar, retener y comunicar con los socios, sin saltar entre módulos fragmentados.
- **Retención proactiva**: El `churn score` y las alertas permiten intervenir antes de que un socio se convierta en moroso o inactivo.
- **Comunicaciones segmentadas**: Enviar mensajes relevantes (pago pendiente, vencimiento cercano, ausencia prolongada) en lugar de mensajes genéricos, mejorando la tasa de respuesta.
- **Gestión masiva**: Renovar, congelar o comunicar con grupos de socios en un solo paso, reduciendo el tiempo operativo del admin.
- **Auditoría completa**: Cada cambio en un perfil (plan, estado, notas) queda registrado con quién lo hizo y cuándo, protegiendo la integridad de los datos.
