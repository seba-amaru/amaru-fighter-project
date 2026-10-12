# Hoja de Ruta de Ejecución Modular (TASKS.md)

**Estado:** Aprobado por el usuario. En fase de delegación.  
**Exclusiones:** No realizar migración de dominio Vercel.

---

## FASE 1: Subagente BACKEND (`@backend`)
> **Objetivo:** Resolver el bug de exportación financiera, implementar la lógica de negocio para restricciones de cancelación y el servicio de validación de check-in QR en Supabase.
> **Regla estricta:** NO tocar HTML visual ni CSS. Exponer métodos limpios.

### Tarea B1: Corrección de Nombres en Reportes Financieros
- **Archivo:** `admin/admin.js` (función `exportRevenueToCSV`)
- **Problema:** La consulta `supabase.from('payments').select('*')` no hace join con `profiles`. Como `p.user_display_name` suele ser nulo, toma `p.user_id` (UUID alfanumérico).
- **Acción requerida:**
  1. Modificar la consulta para incluir `profiles:profiles(id, full_name, email)`.
  2. Mapear el nombre del alumno priorizando: `p.profiles?.full_name || p.user_display_name || p.profiles?.email || 'Socio'`.
  3. Permitir que el reporte respete el filtro de mes y año activo en el cockpit (`revFilterMonth`, `revFilterYear`).

### Tarea B2: Lógica de Reglas de Cancelación de Reservas
- **Archivo:** `app/services/supabaseService.js` y `app/app.js`
- **Acción requerida:**
  1. Crear función `canCancelReservation({ classTime, reservationDate, deadlineHours = 1 })`.
  2. Validar que la diferencia entre `new Date()` y `${reservationDate}T${classTime}` sea mayor o igual a `deadlineHours`.
  3. Si la diferencia es menor y el rol no es `admin`, denegar la cancelación y retornar `{ allowed: false, reason: 'Límite de tiempo superado' }`.
  4. Exponer método para actualizar la configuración de horas límite de cancelación del dojo (`updateCancellationPolicy(hours)`).

### Tarea B3: Lógica y Servicio de Check-in QR
- **Archivo:** `app/services/supabaseService.js`
- **Acción requerida:**
  1. Crear método `generateClassQRToken(classId, date, time)` que emita un payload codificado con fecha, id de clase y firma/token temporal válido solo para el bloque de la clase.
  2. Crear método `validateAndCheckInQR(userId, qrData)` que:
     - Verifique que la fecha del token sea la actual.
     - Compruebe que el usuario tenga una reserva activa en `reservations` para esa clase y fecha.
     - Verifique que no exista ya un registro de asistencia en `attendance` para ese usuario y clase hoy.
     - Registre la asistencia en `attendance` con `method: 'qr-scan'` y `user_id`.
     - Actualice el perfil del usuario sumando +25 XP.
     - Retorne `{ success: true, xpEarned: 25, className: ... }`.

---

## FASE 2: Subagente FRONTEND (`@frontend`)
> **Objetivo:** Desarrollar los componentes visuales, estados de interacción y pantallas para cancelación y escaneo QR.
> **Regla estricta:** NO tocar lógica profunda de base de datos ni validaciones directas. Consumir los métodos del Backend.

### Tarea F1: Interfaz de Restricción de Cancelación en App Alumno
- **Archivo:** `app/app.js`, `styles.css`
- **Acción requerida:**
  1. En la tarjeta de la clase reservada, evaluar si la clase está en periodo bloqueado.
  2. Si está bloqueada, estilizar el botón de "Cancelar Reserva" como deshabilitado/bloqueado (`opacity: 0.5`, icono de candado o reloj de arena) con tooltip explicativo.
  3. Al pulsar sobre el botón bloqueado, disparar alerta toast informativa y amigable.

### Tarea F2: Configuración de Horas Límite en Panel Admin
- **Archivo:** `admin/index.html`, `admin/admin.js`
- **Acción requerida:**
  1. Añadir en los ajustes de clases o configuración general del Tatami un selector/input numérico de estética Glassmorphism: *"Horas límite de cancelación anticipada (Default: 1h)"*.

### Tarea F3: Proyección de QR de Asistencia en Tatami Cockpit
- **Archivo:** `admin/index.html`, `admin/admin.js`, `styles.css`
- **Acción requerida:**
  1. Añadir botón *"Proyectar QR"* en las tarjetas de clases activas del día en el Tatami Cockpit.
  2. Abrir un modal oscuro de alta definición con el código QR generado para la clase, visible a distancia para que los alumnos lo puedan escanear desde sus teléfonos al ingresar al dojo.

### Tarea F4: Lector QR de Cámara en App del Alumno
- **Archivo:** `app/index.html` (o vistas DOM de la app), `app/app.js`
- **Acción requerida:**
  1. En el dashboard del alumno, transformar el botón *"MARCAR ASISTENCIA"* para que abra un modal con escáner de cámara (usando librería ligera o BarcodeDetector).
  2. Al detectar el QR, enviar el contenido al método `validateAndCheckInQR` del Backend.
  3. Mostrar animación de éxito (confeti, sonido y tarjeta de +25 XP).

---

## FASE 3: Subagente QA (`@qa`)
> **Objetivo:** Pruebas destructivas, verificación cruzada y reporte de fallos.
> **Regla estricta:** NO implementar soluciones. Reportar hallazgos detallados.

### Tarea Q1: Auditoría de Exportación Financiera
- Generar reporte en formato .CSV, .XLS y .PDF.
- Validar que la columna Alumno muestre nombres reales y ningún UUID alfanumérico.

### Tarea Q2: Pruebas de Límites de Cancelación
- Caso 1: Cancelar con 70 minutos de anticipación (debe permitir).
- Caso 2: Cancelar con 50 minutos de anticipación (debe bloquear y notificar).
- Caso 3: Cancelar como Administrador (debe permitir siempre anular).

### Tarea Q3: Pruebas de Escaneo QR
- Caso 1: Escaneo con reserva activa (asistencia registrada y +25 XP otorgados).
- Caso 2: Escaneo sin reserva previa (alerta de reserva requerida).
- Caso 3: Escaneo duplicado en la misma sesión (alerta de asistencia ya registrada).
- Caso 4: Escaneo de código de otra clase o fecha vencida (rechazado).
