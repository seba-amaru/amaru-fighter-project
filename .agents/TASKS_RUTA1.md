# Hoja de Ruta: RUTA 1 — Cobranza Rápida por WhatsApp & Waitlist Inteligente

**Estado:** 🟢 COMPLETADO por Backend y Frontend. En verificación final de QA.

---

## SPRINT 1: MÓDULO DE COBRANZA PROACTIVA POR WHATSAPP (EL BOTÓN MÁGICO)

### 👨‍💻 Subagente BACKEND (`@backend`)
1. **Tarea B1.1: Sanitizador de Teléfonos y Formato Internacional**
   - Archivo: `app/services/supabaseService.js`
   - Función `sanitizePhoneNumber(phone, defaultCountryCode = '56')`:
     - Limpia espacios, guiones, paréntesis y signos +.
     - Si empieza con 9 y tiene 9 dígitos (formato celular chileno), antepone `56`.
     - Si ya tiene código de país, lo valida y normaliza.
2. **Tarea B1.2: Generador de URLs y Plantillas de Cobranza WhatsApp**
   - Archivo: `app/services/supabaseService.js`
   - Función `generateWhatsAppCobranzaUrl({ phone, name, planName, expiryDate, daysLeft, amount, bankDetails })`:
     - Construye mensajes diferenciados:
       - *Por vencer (≤5 días):* Recordatorio preventivo amigable.
       - *Moroso / Vencido (<0 días):* Aviso de membresía vencida con datos de transferencia y llamado a regularizar para mantener cupos.
     - Codifica la URL con `encodeURIComponent` apuntando a `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`.
3. **Tarea B1.3: Gestión de Datos de Transferencia del Dojo**
   - Métodos `getDojoBankDetails()` y `setDojoBankDetails(details)` con persistencia en `localStorage` (clave `amarufighter_bank_details`) con valores por defecto del dojo.

### 🎨 Subagente FRONTEND (`@frontend`)
1. **Tarea F1.1: Botón "Cobrar WhatsApp" en CRM de Socios**
   - Archivos: `app/modules/members.js`, `styles.css`
   - En las vistas `directorio`, `retencion` y tarjetas de alertas críticas del `dashboard`, agregar el botón verde WhatsApp con icono de Lucide en cada socio moroso o por vencer.
   - Al pulsar, abre WhatsApp directamente en una nueva pestaña con el mensaje listo para enviar.
2. **Tarea F1.2: Modal de Configuración de Datos Bancarios en Admin**
   - Archivos: `admin/index.html`, `admin/admin.js`
   - En la sección financiera o ajustes, agregar botón *"Datos de Transferencia"* que permita al admin configurar: Banco, Tipo de Cuenta, N° Cuenta, RUT y Correo de confirmación.

### 🧪 Subagente QA (`@qa`)
1. **Tarea Q1.1: Validación de Enlaces de WhatsApp**
   - Pruebas con números con prefijos diversos (+569, 9, 569, espacios, guiones).
   - Verificación de que ningún dato sensible se filtre y que los saltos de línea se codifiquen correctamente (`%0A`).

---

## SPRINT 2: LISTA DE ESPERA AUTOMATIZADA (WAITLIST INTELIGENTE)

### 👨‍💻 Subagente BACKEND (`@backend`)
1. **Tarea B2.1: Estructura y Métodos de Waitlist**
   - Archivo: `app/services/supabaseService.js`
   - Métodos:
     - `getWaitlist(classId, date)`: Devuelve atletas en espera ordenados por `created_at` (FIFO).
     - `joinWaitlist(userId, classId, className, date)`: Inscribe al atleta en espera si la clase está llena.
     - `leaveWaitlist(userId, classId, date)`: Retira al atleta de la lista de espera.
     - `promoteNextFromWaitlist(classId, date)`: Al cancelarse una reserva, promueve al primer atleta en espera a `reservations` activa y le genera una notificación en `user_notifications`.

### 🎨 Subagente FRONTEND (`@frontend`)
1. **Tarea F2.1: Interfaz de Lista de Espera en App del Alumno**
   - Archivos: `app/modules/schedule.js`, `app/app.js`, `styles.css`
   - Si la clase está llena (`attendeeCount >= capacity`):
     - Si el alumno no está en espera: Mostrar botón ámbar *"Unirme a Lista de Espera"*.
     - Si ya está en espera: Mostrar botón *"En Espera (#Posición) • Salir"*.
2. **Tarea F2.2: Indicador de Waitlist en Tatami Cockpit (Admin)**
   - Archivo: `admin/admin.js`
   - En la tarjeta de clase, mostrar badge de lista de espera con cantidad de atletas aguardando cupo.

### 🧪 Subagente QA (`@qa`)
1. **Tarea Q2.1: Pruebas de Flujo de Espera y Promoción FIFO**
   - Caso 1: Ingreso a lista de espera con clase al 100%.
   - Caso 2: Cancelación de un cupo y promoción automática del 1er lugar.
   - Caso 3: Generación de notificación interna al usuario promovido.
