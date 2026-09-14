# Propuesta: Separación del Admin - App Web de Escritorio Independiente

## 1. Análisis del Landing Page (`index.html`)
- Marketing puro: Hero, servicios (flip-cards), horario dinámico, planes, contacto WhatsApp, footer.
- Consume datos públicos de Supabase (`schedule`, `membership_plans`).
- Sin lógica administrativa.

## 2. Análisis de la App Usuario (`app/index.html`)
- PWA con auth Supabase, dashboard con XP/streak/clases, agenda, torneos, perfil, notificaciones.
- **Admin embebido** (`#admin-panel`): activado por rol (`appState.role === 'admin'`) o gesto secreto (3 clics Home).
- Módulos admin: `admin.js`, `members.js` (v2.0 con 5 pestañas), `payments.js`, `revenue.js`, `adminModals.js`.
- Funcionalidad completa: gestión de clases, asistencia, pagos, socios (perfil, membresía, asistencia, pagos, notas), planes (drag-and-drop), ingresos (gráficos + exportación CSV/XLS/PDF), descuentos, notificaciones globales.

## 3. Problema Actual
- Admin oculto por CSS, no protegido por ruta real.
- Usuario descarga módulos admin innecesarios.
- Experiencia confusa (gestor secreto).
- No es una app de escritorio: usa bottom-nav y pantalla móvil.

## 4. Propuesta: `admin/` como App Independiente

### Estructura
```
repo/
├── index.html              ← Landing
├── app/                    ← Usuario (limpio de admin)
│   ├── index.html
│   ├── app.js              ← Sin admin
│   └── ...
├── admin/                  ← NUEVA App Admin Escritorio
│   ├── index.html
│   ├── admin.js            ← Entry point admin
│   ├── admin.css           ← Layout desktop (sidebar fija)
│   └── modules/            ← Referencia o copia de módulos admin
└── vite.config.js          ← Multi-page input
```

### Diseño Desktop (estética conservada)
- Sidebar fija con navegación vertical (en lugar de bottom-nav).
- Layout `grid-template-columns: 260px 1fr`.
- `glass-premium` y `glass-card` mantenidos.
- Datos densos: tablas anchas, charts grandes (`revenueChart`), exportaciones visibles.
- Atajos de teclado (`Ctrl+N`, `Ctrl+S`, `/`).

### Seguridad
- `admin/index.html` verifica sesión + `profile.role === 'admin'` al cargar.
- Redirección al usuario si no es admin.
- RLS en Supabase para tablas sensibles (`profiles` updates, `payments`, `global_notifications`, `classes`).
- Mismos `.env` y `supabase-config.js` (misma DB, sin migración de datos).

### Funcionalidad a conservar (checklist)
- [ ] Gestión de clases (CRUD + búsqueda + colores por tipo)
- [ ] Asistencia
- [ ] Pagos (validación comprobantes + historia)
- [ ] Socios v2.0 (modal 5 pestañas: Perfil, Membresía, Asistencia, Pagos, Notas + acciones rápidas)
- [ ] Planes (CRUD + drag-and-drop + métricas `_monthlyRevenue`, `_capacityUsed`, `ARPU` + charts)
- [ ] Descuentos (`discounts`)
- [ ] Notificaciones globales
- [ ] Ingresos (selector mensual/anual + desglose + exportación CSV/XLS/PDF)
- [ ] Real-time (`postgres_changes` para pagos admin)

## 5. Plan de Acción

### Fase 1: Infraestructura
1. Crear `admin/` y `admin/index.html` con layout sidebar + header premium.
2. Configurar `vite.config.js` con `rollupOptions.input` para `main`, `userApp`, `adminApp`.
3. Referenciar `supabase-config.js` desde `admin/`.

### Fase 2: Limpieza Usuario
1. Eliminar de `app/app.js`: `setAdminMode`, `isAdminMode`, `admin-panel`, gestos secretos, referencias a admin.
2. Eliminar de `app/index.html`: sección `#admin-panel`, `#class-modal`, `#plan-modal` (si solo admin), scripts admin.
3. Limpiar `store/appState.js`: variables de admin.

### Fase 3: Admin Desktop
1. Copiar/migrar `modules/admin.js`, `members.js`, `revenue.js`, `payments.js`, `adminModals.js`.
2. Adaptar a vistas densas y sidebar fija.
3. Implementar protección de ruta + rol en carga inicial.

### Fase 4: Seguridad y Build
1. Reforzar RLS en Supabase.
2. Agregar scripts `build:admin` y `dev:admin`.
3. Probar accesos cruzados (usuario bloqueado, admin funcional con misma DB).

## 6. Beneficios
- Separación real de responsabilidades.
- App usuario más ligera (sin módulos admin).
- Admin profesional para escritorio (sidebar fija, datos densos, teclado).
- Misma base de datos, sin migraciones.
- Escalabilidad futura (nuevos dashboards, integraciones, reportes avanzados).
