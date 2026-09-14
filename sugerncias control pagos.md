# Análisis y Sugerencias: Control de Pagos — App Admin

Basado en el código (`admin/admin.js`, `app/modules/payments.js`, `app/modules/adminModals.js`, `app/services/supabaseService.js`, `PROPUESTA_CONTROL_PAGOS.md`).

---

## 1. Diagnóstico del estado actual

### Lo que existe hoy:
- **`admin/admin.js`**: Usa un `split-view` básico (`loadPaymentsSplitView`). Lista pagos en una columna y previsualización en otra. Filtra por `status`. No diferencia método de pago visualmente en la lista (solo en datos). No hay métricas de ingresos en la cabecera de esta sección.
- **`app/modules/payments.js`**: Implementa 3 vistas (`resumen`, `transacciones`, `cobranza`) mucho más completas (KPIs, tabla con filtros, grafo de 7 días, cobertura del mes, registro rápido). Es la implementación de `PROPUESTA_CONTROL_PAGOS.md`. Sin embargo, parece no estar totalmente integrada como la vista principal de admin.
- **`adminModals.js`**: `handlePaymentAction` aprueba/rechaza pagos y actualiza `membership_expiry` (+30 días). También borra pagos `pending` del usuario (`deletePendingPayments`). El registro rápido (`quickRenewMember`) inserta un pago `approved` con método `efectivo` automáticamente.
- **`supabaseService.js`**: `recordPayment`, `getAllPayments`, `updatePaymentStatus`, `deletePendingPayments`. No hay función para editar montos directamente ni para registrar pagos por transferencia con comprobante.
- **`PROPUESTA_CONTROL_PAGOS.md`**: Define una arquitectura excelente (3 vistas operativas, cruce de datos `profiles` + `payments` + `plans`) que parece parcialmente implementada en `payments.js`.

### Problemas detectados:
- **Fragmentación**: `admin/admin.js` usa su propio sistema de pagos (`loadPaymentsSplitView`), mientras `payments.js` ofrece una experiencia mucho más rica pero no parece ser la vista por defecto del panel admin.
- **Métodos de pago sin gestión visual**: La tabla de transacciones (`payments.js`) muestra `transferencia`, `pasarela`, `efectivo`, `mercadopago`, `webpay`, `manual`, pero no hay acciones diferenciadas por método (ej. para efectivo no hay comprobante, para transferencia sí se podría adjuntar).
- **Sin trazabilidad de modificaciones**: No existe un historial de quién aprobó/rechazó/revirtió un pago, ni un log de cambios (`updated_by`, `updated_at` existe en la DB pero no se usa para auditoría en la UI).
- **Cobranza del mes (`cobranza`)**: Calcula cobertura cruzando `profiles` y `payments` en memoria. Funciona, pero no persiste el estado de cobertura ni permite acciones masivas.
- **Sin gestión de ingresos por método**: No hay un desglose rápido por método de pago en el dashboard de resumen (`payments.js` sí lo tiene en filtros, pero no en KPIs).

---

## 2. Sugerencias detalladas para experiencia óptima del admin

### A. Unificación y arquitectura (Alta prioridad)

1. **Consolidar la vista principal**: Hacer que `payments.js` (Resumén / Transacciones / Cobranza) sea la vista por defecto al navegar a `payments` en `admin/admin.js`, reemplazando `loadPaymentsSplitView` o integrándola como una versión simplificada dentro del nuevo sistema.
2. **Enrutamiento claro**: En `SECTION_TITLES` (`admin/admin.js:126`), `payments` debe apuntar al módulo `payments.js`. Asegurar que `navigateToSection('payments')` invoque `renderAdminPayments()`.

### B. Gestión de métodos de pago (Pasarela, Transferencia, Efectivo)

3. **Diferenciar visualmente en la tabla (`payments.js`)**:
   - Añadir un icono o color por método:
     - `pasarela` / `mercadopago` / `webpay`: 💳 (verde/azul)
     - `transferencia`: 🏦 (ámbar)
     - `efectivo`: 💵 (gris/morado)
   - Esto ayuda al admin a identificar de un vistazo qué pagos requieren comprobante físico.
4. **Adjuntar comprobante por método**:
   - `transferencia`: El usuario debe subir comprobante (`receipt_url`). El admin debe poder ver el comprobante (`receipt_image_el` ya existe en `admin/admin.js`).
   - `efectivo`: Marcar explícitamente que no requiere comprobante (`receipt_url` opcional o `null`). Añadir una etiqueta visual "Pago en efectivo — sin comprobante".
   - `pasarela`: Vincular automáticamente con webhook (`mp-webhook`). Añadir un campo `transaction_id` o `gateway_reference` para rastrear.
5. **Filtro por método mejorado (`payments.js`)**: El filtro `tx-method` ya existe, pero debería agrupar `mercadopago` y `webpay` bajo `pasarela` si el admin desea ver todos los pagos digitales juntos, o mantenerlos separados según preferencia.

### C. Control de ingresos y métricas operativas (KPIs)

6. **KPIs por método (`payments.js` - Vista Resumen)**:
   - Añadir 4 tarjetas adicionales o reemplazar las actuales con desglose:
     - Ingresos `Pasarela`
     - Ingresos `Transferencia`
     - Ingresos `Efectivo`
     - Pendientes por aprobar (con desglose por método)
7. **Gráfico de ingresos diarios (`resumenChart`)**: Ya existe (`payments.js:330`). Mejorarlo con colores por método (stacked bar) para ver la proporción diaria.
8. **Cálculo de variación vs mes anterior**: Ya existe (`growth`). Asegurar que calcule sobre `approved` y que ignore `rejected`.

### D. Gestión de modificaciones y auditoría

9. **Log de acciones (`payments` table)**:
   - Añadir campos a la tabla `payments` (o crear `payment_logs`):
     - `approved_by` (user_id del admin)
     - `rejected_by`
     - `updated_by`
     - `updated_at` (ya existe)
   - En `updatePaymentStatus` (`supabaseService.js`), pasar el `user_id` del admin como parte del update.
10. **Historial de cambios en el drawer (`admin/admin.js`)**:
    - En `loadMemberDrawerHistory` (`admin/admin.js:724`), además del historial de pagos, mostrar un pequeño log: "Aprobado por Admin X el [fecha]".
11. **Edición de montos con trazabilidad (`payments.js`)**:
    - `tx-edit-btn` (`payments.js:629`) usa `prompt`. Debería abrir un modal (`adminModals.js`) que registre el cambio, el monto anterior, el nuevo monto, y el admin que lo hizo. Esto previene errores y da trazabilidad.

### E. Cobranza del mes (`Cobranza`) — Optimización

12. **Estado de cobertura persistente**:
    - Actualmente (`payments.js:690`) calcula `ok`, `warning`, `overdue`, `none` en memoria. Sugerencia: crear una vista materializada (`coverage_status`) o una columna calculada que se actualice cada noche o al registrar un pago.
13. **Acciones masivas en Cobranza**:
    - Añadir checkbox por fila para seleccionar múltiples alumnos.
    - Botón "Aprobar pagos seleccionados" o "Enviar recordatorio masivo".
    - Botón "Exportar morosos" (CSV) para enviar a WhatsApp/email.
14. **Registro rápido con validación (`openQuickPaymentModal`)**:
    - El modal (`payments.js:846`) prellena monto y concepto. Debería validar que el monto coincida con el plan (`plansData`). Si el usuario tiene descuento (`discounts`), sugerir monto con descuento aplicado.
    - Añadir validación de `coverage_month`: impedir que se registre un pago con cobertura de un mes anterior sin confirmación explícita ("¿Estás seguro que este pago cubre [mes anterior]?").

### F. Flujo de datos y sincronización

15. **Sincronización con `revenue.js`**:
    - En `payments.js`, `forceRefreshRevenue()` se llama tras registrar/aprobar. Asegurar que `revenue.js` reciba los datos por método de pago también, no solo totales.
16. **Fetch unificado (`fetchAllPaymentsData`)**:
    - Actualmente (`payments.js:54`) hace 3 queries separadas. Usar `.select('*, profiles(...)')` como ya hace. Añadir `receipt_url` y `gateway_reference` al `select`.

### G. Seguridad y validación

17. **Validación de estados**:
    - Evitar que un admin pueda cambiar `pending` a `rejected` sin motivo o `rejected` a `approved` sin registro de comprobante.
    - Añadir `confirm()` con mensaje de impacto: "Rechazar este pago eliminará el comprobante de [nombre] y no actualizará su membresía".
18. **Restricción por rol**:
    - `verifyAdminRole` (`admin/admin.js:56`) ya protege el panel. Asegurar que `payments.js` valide `isAdmin` antes de permitir acciones de modificación.

### H. Experiencia de usuario (UI/UX)

19. **Estado vacío mejorado (`payments.js`)**:
    - Si no hay pagos, mostrar no solo "No hay comprobantes", sino acciones sugeridas: "¿Es el inicio del mes? Revisa Cobranza para ver quién debe."
20. **Paginación y rendimiento**:
    - `txPerPage` (`payments.js:19`) por defecto es 25. Para administradores con muchos pagos, permitir 100 sin problemas.
    - Añadir `virtual scroll` si la lista supera 500 registros.
21. **Notificaciones de acciones** (`window.showToast`):
    - Ya se usa. Asegurar que cada acción (`approve`, `reject`, `delete`, `edit`, `register`) muestre mensaje con el nombre del alumno y el monto afectado.
22. **Exportación detallada (`payments.js:658`)**:
    - El CSV exporta `Fecha`, `Alumno`, `Email`, `Concepto`, `Monto`, `Método`, `Estado`, `Cobertura`. Añadir `ID Pago`, `Comprobante URL` (si existe), `Aprobado por` (si se implementa log).

### I. Datos y base de datos (Sugerencia de esquema)

23. **Campos sugeridos para la tabla `payments`** (para soportar todo lo anterior sin romper lo existente):
    - `receipt_url` (ya existe implícitamente en `admin/admin.js`)
    - `gateway_reference` (string, para pasarela/webhook)
    - `approved_by`, `rejected_by`, `updated_by` (string o referencia a `auth.users`)
    - `notes` (string, notas del admin sobre el pago)
    - `is_manual` (boolean, para distinguir pagos registrados manualmente vs automáticos)
24. **Nueva tabla `payment_logs`** (opcional, para auditoría completa):
    - `payment_id`, `action` (`approve`, `reject`, `revert`, `edit_amount`, `delete`), `previous_value`, `new_value`, `performed_by`, `created_at`.

---

## 3. Propuesta de implementación paso a paso

| Paso | Acción | Archivo(s) afectado(s) |
|---|---|---|
| 1 | Integrar `payments.js` como vista principal de `payments` | `admin/admin.js`, `app/index.html` (rutas) |
| 2 | Añadir `approved_by` / `updated_by` a `payments` y actualizar `updatePaymentStatus` | `supabaseService.js`, DB |
| 3 | Mejorar `renderResumenView` con KPIs por método de pago | `app/modules/payments.js` |
| 4 | Añadir iconos y colores por método en tabla y filtros | `app/modules/payments.js` |
| 5 | Implementar `payment_logs` o extender `payments` con notas | DB, `supabaseService.js` |
| 6 | Mejorar `tx-edit-btn` con modal de edición auditado | `adminModals.js`, `payments.js` |
| 7 | Validar `openQuickPaymentModal` con descuento y confirmación | `payments.js` |
| 8 | Mejorar exportación CSV con nuevos campos | `payments.js` |
| 9 | Añadir acciones masivas en `Cobranza` | `payments.js` |
| 10 | Sincronizar `revenue.js` con datos por método | `revenue.js`, `payments.js` |

---

## 4. Beneficio esperado para el administrador

- **Claridad inmediata**: Al entrar a "Control de Pagos", verá cuánto entró hoy, cuánto está pendiente, y quiénes son morosos, sin contar manualmente.
- **Gestión por método**: Sabrá si debe ir al banco a revisar transferencias o verificar comprobantes físicos de efectivo.
- **Auditoría completa**: Cualquier cambio en un pago quedará registrado con quién y cuándo lo hizo.
- **Proactividad**: La vista "Cobranza" le permite actuar antes de que la membresía venza, registrando pagos o enviando recordatorios sin buscar uno a uno.
