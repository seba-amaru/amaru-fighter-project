import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = __dirname;
const outputPdfPath = path.join(projectDir, 'MANUAL_ADMINISTRADOR_AMARUFIGHTER.pdf');
const tempHtmlPath = path.join(projectDir, 'temp_manual_admin.html');

let logoBase64 = '';
const logoPath = path.join(projectDir, 'admin', 'images', 'AMARU-LFNM.png');
if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
}

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Manual de Uso del Administrador - Amarufighter Dojo Management Suite</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        @page {
            size: A4 portrait;
            margin: 12mm 14mm 14mm 14mm;
            @bottom-right {
                content: "Página " counter(page);
                font-family: 'Inter', sans-serif;
                font-size: 8pt;
                color: #71717a;
            }
        }

        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #18181b;
            background-color: #ffffff;
            font-size: 9.2pt;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page-break {
            page-break-before: always;
            break-before: page;
        }

        .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
        }

        /* PORTADA */
        .cover-page {
            height: 100%;
            min-height: 258mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 28px 24px 24px 24px;
            background: linear-gradient(145deg, #09090b 0%, #18181b 55%, #0f172a 100%);
            color: #ffffff;
            border-radius: 12px;
            page-break-after: always;
            break-after: page;
        }

        .cover-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            padding-bottom: 18px;
        }

        .cover-logo {
            max-height: 60px;
            object-fit: contain;
        }

        .cover-badge {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff;
            font-size: 8pt;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }

        .cover-body {
            margin: 30px 0;
        }

        .cover-pretitle {
            color: #ef4444;
            font-size: 10.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 10px;
        }

        .cover-title {
            font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
            font-size: 27pt;
            font-weight: 900;
            line-height: 1.15;
            color: #ffffff;
            margin-bottom: 14px;
            letter-spacing: -0.02em;
        }

        .cover-title span {
            background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .cover-subtitle {
            font-size: 11pt;
            color: #cbd5e1;
            font-weight: 400;
            max-width: 620px;
            line-height: 1.55;
            margin-bottom: 25px;
        }

        .cover-features-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }

        .feature-pill {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 8pt;
            color: #e2e8f0;
            font-weight: 600;
        }

        .cover-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            padding-top: 16px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            font-size: 8pt;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            color: #94a3b8;
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
        }

        .meta-value {
            color: #ffffff;
            font-weight: 700;
        }

        /* TOC */
        .toc-container {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 18px;
        }

        .toc-title {
            font-size: 12pt;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 4px;
        }

        .toc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
        }

        .toc-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 8.2pt;
            padding: 3px 0;
            border-bottom: 1px dotted #cbd5e1;
        }

        .toc-item-title {
            font-weight: 600;
            color: #1e293b;
        }

        .toc-item-num {
            font-weight: 700;
            color: #ef4444;
        }

        /* CAPÍTULOS */
        .chapter-header {
            background: #09090b;
            color: #ffffff;
            padding: 11px 16px;
            border-radius: 7px;
            margin-top: 12px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 5px solid #ef4444;
        }

        .chapter-title-group {
            display: flex;
            flex-direction: column;
        }

        .chapter-number {
            font-size: 7.2pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #f87171;
        }

        .chapter-title {
            font-size: 13.5pt;
            font-weight: 800;
            color: #ffffff;
            margin: 0;
        }

        .section-h2 {
            font-size: 10.5pt;
            font-weight: 800;
            color: #0f172a;
            margin-top: 14px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1.5px solid #e2e8f0;
            padding-bottom: 3px;
        }

        p {
            margin-bottom: 8px;
            text-align: justify;
        }

        /* KPIS */
        .kpi-grid-manual {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin: 10px 0 14px 0;
        }

        .kpi-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 7px;
            padding: 8px 10px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            border-top: 3px solid #3b82f6;
        }

        .kpi-box.emerald { border-top-color: #10b981; }
        .kpi-box.amber { border-top-color: #f59e0b; }
        .kpi-box.purple { border-top-color: #8b5cf6; }
        .kpi-box.red { border-top-color: #ef4444; }
        .kpi-box.cyan { border-top-color: #06b6d4; }

        .kpi-box-title {
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 3px;
        }

        .kpi-box-value {
            font-size: 11.5pt;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
        }

        .kpi-box-desc {
            font-size: 6.8pt;
            color: #94a3b8;
            margin-top: 2px;
        }

        /* CALLOUTS */
        .callout {
            border-radius: 7px;
            padding: 9px 12px;
            margin: 10px 0;
            font-size: 8.3pt;
            display: flex;
            gap: 8px;
            align-items: flex-start;
        }

        .callout-tip {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-left: 4px solid #16a34a;
            color: #166534;
        }

        .callout-warning {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-left: 4px solid #d97706;
            color: #92400e;
        }

        .callout-danger {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #dc2626;
            color: #991b1b;
        }

        .callout-icon {
            font-size: 11pt;
            line-height: 1;
        }

        .callout-content {
            flex: 1;
        }

        .callout-content strong {
            display: block;
            margin-bottom: 2px;
            font-weight: 700;
        }

        /* WORKFLOW */
        .workflow-steps {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin: 10px 0;
        }

        .wf-step {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            padding: 8px;
        }

        .wf-step-num {
            background: #0f172a;
            color: #ffffff;
            font-size: 7pt;
            font-weight: 800;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
        }

        .wf-step-title {
            font-size: 8pt;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 3px;
        }

        .wf-step-desc {
            font-size: 7.2pt;
            color: #64748b;
            line-height: 1.3;
        }

        /* TABLAS */
        table.manual-table {
            width: 100%;
            border-collapse: collapse;
            margin: 9px 0 12px 0;
            font-size: 8pt;
        }

        table.manual-table th {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #1e293b;
        }

        table.manual-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        table.manual-table tr:nth-child(even) {
            background: #f8fafc;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 6.8pt;
            font-weight: 700;
            text-transform: uppercase;
        }

        .badge-active { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .badge-warning { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }
        .badge-overdue { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .badge-frozen { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }

        kbd {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 1px 5px;
            font-family: monospace;
            font-size: 7.2pt;
            font-weight: 700;
            color: #334155;
        }

        ul.custom-list {
            list-style: none;
            padding-left: 0;
            margin: 6px 0 10px 0;
        }

        ul.custom-list li {
            position: relative;
            padding-left: 16px;
            margin-bottom: 5px;
            font-size: 8.3pt;
        }

        ul.custom-list li::before {
            content: "▪";
            color: #ef4444;
            font-size: 10pt;
            position: absolute;
            left: 2px;
            top: -2px;
        }

        .shortcuts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 7px;
            padding: 10px 12px;
            margin: 8px 0;
        }

        .shortcut-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7.8pt;
        }

        .footer-note {
            font-size: 7.2pt;
            color: #94a3b8;
            text-align: center;
            margin-top: 15px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>

    <!-- PORTADA -->
    <div class="cover-page">
        <div class="cover-header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Amarufighter Logo" class="cover-logo">` : `<div style="font-size:16pt;font-weight:900;color:#fff;">AMARUFIGHTER</div>`}
            <span class="cover-badge">ADMIN SUITE v2.0</span>
        </div>

        <div class="cover-body">
            <div class="cover-pretitle">Documentación Oficial de Operaciones</div>
            <h1 class="cover-title">MANUAL DE USO PARA EL <span>ADMINISTRADOR</span></h1>
            <p class="cover-subtitle">
                Guía maestra exhaustiva para la gestión integral del dojo: control del tatami, asistencia en tiempo real, conciliación y validación de pagos, CRM 360° de socios, ingeniería financiera, cupones y analítica avanzada.
            </p>

            <div class="cover-features-pills">
                <div class="feature-pill">🥋 Tatami Cockpit & Check-in</div>
                <div class="feature-pill">💳 Conciliación de Pagos & Auditoría</div>
                <div class="feature-pill">👥 CRM de Socios & Retención</div>
                <div class="feature-pill">📈 Cockpit Financiero & Run-Rate</div>
                <div class="feature-pill">📅 Gestión Dinámica de Clases</div>
                <div class="feature-pill">⚡ Command Palette (Ctrl+K)</div>
            </div>
        </div>

        <div class="cover-footer">
            <div class="meta-item">
                <span class="meta-label">Organización</span>
                <span class="meta-value">Amarufighter Martial Arts Club</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Fecha de Edición</span>
                <span class="meta-value">Marzo 2026</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Destinatarios</span>
                <span class="meta-value">Dojo Masters & Administradores</span>
            </div>
        </div>
    </div>

    <!-- TOC -->
    <div class="toc-container avoid-break">
        <div class="toc-title">
            <span>📑</span>
            <span>Índice General del Manual</span>
        </div>
        <div class="toc-grid">
            <div class="toc-item"><span class="toc-item-title">1. Arquitectura, Acceso y Seguridad</span><span class="toc-item-num">Cap. 1</span></div>
            <div class="toc-item"><span class="toc-item-title">2. Dashboard y Vista General de KPIs</span><span class="toc-item-num">Cap. 2</span></div>
            <div class="toc-item"><span class="toc-item-title">3. Gestión de Clases y Disciplinas</span><span class="toc-item-num">Cap. 3</span></div>
            <div class="toc-item"><span class="toc-item-title">4. Control de Asistencia & Tatami Cockpit</span><span class="toc-item-num">Cap. 4</span></div>
            <div class="toc-item"><span class="toc-item-title">5. CRM de Socios y Drawer 360°</span><span class="toc-item-num">Cap. 5</span></div>
            <div class="toc-item"><span class="toc-item-title">6. Control, Validación y Conciliación de Pagos</span><span class="toc-item-num">Cap. 6</span></div>
            <div class="toc-item"><span class="toc-item-title">7. Membresías, Planes y Cupones de Descuento</span><span class="toc-item-num">Cap. 7</span></div>
            <div class="toc-item"><span class="toc-item-title">8. Cockpit Financiero, Run-Rate y Simulador</span><span class="toc-item-num">Cap. 8</span></div>
            <div class="toc-item"><span class="toc-item-title">9. Avisos Globales y Comunicaciones</span><span class="toc-item-num">Cap. 9</span></div>
            <div class="toc-item"><span class="toc-item-title">10. Protocolos Operativos (SOP) y Buenas Prácticas</span><span class="toc-item-num">Cap. 10</span></div>
        </div>
    </div>

    <!-- CAPÍTULO 1 -->
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 1</span>
            <h2 class="chapter-title">Arquitectura, Acceso y Seguridad</h2>
        </div>
        <span style="font-size: 13pt;">🔐</span>
    </div>

    <p>
        La Suite de Administración de <strong>Amarufighter</strong> es una aplicación web de escritorio desacoplada de la app móvil del alumno. Se comunica de forma directa con la base de datos de producción mediante <strong>Supabase</strong>, asegurando persistencia inmediata y sincronización en tiempo real.
    </p>

    <div class="section-h2">1.1 Ecosistema de la Plataforma</div>
    <table class="manual-table">
        <thead>
            <tr>
                <th style="width: 25%;">Componente</th>
                <th style="width: 25%;">Ruta de Acceso</th>
                <th style="width: 50%;">Propósito Operativo</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Landing Page</strong></td>
                <td><code>/index.html</code></td>
                <td>Página comercial de captación: horarios públicos, tarifas y contacto comercial vía WhatsApp.</td>
            </tr>
            <tr>
                <td><strong>App del Alumno</strong></td>
                <td><code>/app/index.html</code></td>
                <td>PWA móvil para socios: visualización de progreso XP, agenda de clases, reservas y envío de pagos.</td>
            </tr>
            <tr>
                <td><strong>Desktop Admin Suite</strong></td>
                <td><code>/admin/index.html</code></td>
                <td>Panel maestro para directores y administradores: analítica, CRM, cobros y configuración.</td>
            </tr>
        </tbody>
    </table>

    <div class="section-h2">1.2 Mecanismo de Autenticación y Route Guard</div>
    <p>
        El acceso está estrictamente protegido por el sistema de autenticación de Supabase y validación de rol. Al cargar el panel, el sistema verifica que la cuenta activa posea el atributo <code>role = 'admin'</code> en la tabla <code>profiles</code>.
    </p>
    <div class="callout callout-danger avoid-break">
        <div class="callout-icon">🛡️</div>
        <div class="callout-content">
            <strong>Protección Contra Acceso No Autorizado:</strong>
            Si un usuario no administrador intenta ingresar directamente a <code>/admin/</code>, el sistema bloqueará la pantalla mediante una alerta modal y lo redirigirá inmediatamente a la vista de usuario regular.
        </div>
    </div>

    <div class="section-h2">1.3 Command Palette y Atajos Globales de Teclado</div>
    <p>Diseñada para optimizar los tiempos de respuesta del administrador:</p>
    <div class="shortcuts-grid avoid-break">
        <div class="shortcut-item"><span>Buscador Global / Command Palette</span><kbd>Ctrl + K</kbd> o <kbd>Cmd + K</kbd></div>
        <div class="shortcut-item"><span>Cerrar Modales / Drawers activos</span><kbd>Escape</kbd></div>
        <div class="shortcut-item"><span>Sincronizar datos con Supabase</span><span>Botón Refrescar en Topbar</span></div>
        <div class="shortcut-item"><span>Alternar a App Alumno</span><span>Botón en pie de barra lateral</span></div>
    </div>

    <!-- CAPÍTULO 2 -->
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 2</span>
            <h2 class="chapter-title">Dashboard y Vista General de KPIs</h2>
        </div>
        <span style="font-size: 13pt;">📊</span>
    </div>

    <p>
        El panel <strong>Vista General</strong> ofrece una fotografía instantánea del estado de salud del dojo al comenzar la jornada. Se compone de 4 indicadores clave (KPIs) y una barra de acciones prioritarias.
    </p>

    <div class="kpi-grid-manual avoid-break">
        <div class="kpi-box red">
            <div class="kpi-box-title">Socios Activos</div>
            <div class="kpi-box-value">Padrón Total</div>
            <div class="kpi-box-desc">Membresías al día registradas</div>
        </div>
        <div class="kpi-box amber">
            <div class="kpi-box-title">Pagos Pendientes</div>
            <div class="kpi-box-value">Requieren Acción</div>
            <div class="kpi-box-desc">Comprobantes por validar</div>
        </div>
        <div class="kpi-box purple">
            <div class="kpi-box-title">Clases Hoy</div>
            <div class="kpi-box-value">Programadas</div>
            <div class="kpi-box-desc">Horario operativo del día</div>
        </div>
        <div class="kpi-box emerald">
            <div class="kpi-box-title">Recaudación Mes</div>
            <div class="kpi-box-value">$ Ingresos CLP</div>
            <div class="kpi-box-desc">Pagos aprobados acumulados</div>
        </div>
    </div>

    <div class="section-h2">2.1 Barra de Acciones Rápidas (Quick Actions)</div>
    <ul class="custom-list">
        <li><strong>+ Nueva Clase:</strong> Despliega el modal de programación semanal para añadir una nueva sesión al horario del tatami.</li>
        <li><strong>+ Registrar Socio:</strong> Permite ingresar manualmente a un nuevo atleta con asignación inmediata de membresía y contacto.</li>
        <li><strong>✓ Validar Pagos:</strong> Redirige a la bandeja de transferencias pendientes con comprobantes pendientes de aprobación.</li>
        <li><strong>📢 Enviar Notificación:</strong> Abre el modal para emitir comunicados masivos inmediatos hacia las aplicaciones móviles de los alumnos.</li>
    </ul>

    <!-- CAPÍTULO 3 -->
    <div class="page-break"></div>
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 3</span>
            <h2 class="chapter-title">Gestión de Clases y Horarios Semanales</h2>
        </div>
        <span style="font-size: 13pt;">📅</span>
    </div>

    <p>
        El módulo de <strong>Gestión de Clases</strong> ofrece una matriz semanal completa (Lunes a Sábado). Permite configurar los aforos del tatami, instructores y horarios para evitar sobrecupos y mantener la excelencia técnica.
    </p>

    <div class="section-h2">3.1 Gestor Dinámico de Disciplinas</div>
    <p>Amarufighter incluye un motor de disciplinas personalizables. Al hacer clic en <strong>"Gestionar Disciplinas"</strong>, el administrador puede:</p>
    <ul class="custom-list">
        <li><strong>Agregar nuevas disciplinas:</strong> Por ejemplo, <em>"Jiu-Jitsu Infantil"</em>, <em>"Luta Livre"</em>, <em>"Muay Thai Avanzado"</em> o <em>"Acondicionamiento Funcional"</em>.</li>
        <li><strong>Eliminar disciplinas obsoletas:</strong> Con confirmación instantánea.</li>
        <li><strong>Restaurar valores por defecto:</strong> Devuelve la lista a las 4 ramas oficiales (NOGI, MMA, GI, Kick Boxing - K1).</li>
    </ul>

    <div class="section-h2">3.2 Creación y Modificación de Clases (Paso a Paso)</div>
    <div class="workflow-steps avoid-break">
        <div class="wf-step">
            <div class="wf-step-num">1</div>
            <div class="wf-step-title">Abrir Modal</div>
            <div class="wf-step-desc">Clic en <strong>"Nueva Clase"</strong> o sobre cualquier tarjeta de clase existente para editarla.</div>
        </div>
        <div class="wf-step">
            <div class="wf-step-num">2</div>
            <div class="wf-step-title">Definir Datos</div>
            <div class="wf-step-desc">Seleccionar disciplina, ingresar nombre descriptivo y nombre del instructor a cargo.</div>
        </div>
        <div class="wf-step">
            <div class="wf-step-num">3</div>
            <div class="wf-step-title">Días y Horarios</div>
            <div class="wf-step-desc">Marcar los días de la semana (ej. Lu/Mi/Vi) y el rango horario (ej. 19:30 a 21:00).</div>
        </div>
        <div class="wf-step">
            <div class="wf-step-num">4</div>
            <div class="wf-step-title">Aforo y Nivel</div>
            <div class="wf-step-desc">Establecer cupo máximo (ej. 20 alumnos) y nivel de exigencia técnica. Guardar cambios.</div>
        </div>
    </div>

    <div class="callout callout-tip avoid-break">
        <div class="callout-icon">💡</div>
        <div class="callout-content">
            <strong>Control de Aforo Automático:</strong>
            El cupo definido en este módulo restringe directamente el número máximo de check-ins que la aplicación del alumno permitirá realizar por sesión, garantizando la seguridad en el tatami.
        </div>
    </div>

    <!-- CAPÍTULO 4 -->
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 4</span>
            <h2 class="chapter-title">Control de Asistencia & Tatami Cockpit</h2>
        </div>
        <span style="font-size: 13pt;">🥋</span>
    </div>

    <p>
        El <strong>Tatami Cockpit</strong> es el centro neurálgico de operaciones diarias. Permite controlar la afluencia física al dojo, registrar asistencias manuales y auditar el compromiso de los socios.
    </p>

    <div class="kpi-grid-manual avoid-break">
        <div class="kpi-box emerald">
            <div class="kpi-box-title">Asistencias Hoy</div>
            <div class="kpi-box-value">Check-ins</div>
            <div class="kpi-box-desc">Desglose App vs Manual</div>
        </div>
        <div class="kpi-box cyan">
            <div class="kpi-box-title">Ocupación Tatami</div>
            <div class="kpi-box-value">Fill Rate %</div>
            <div class="kpi-box-desc">Cupos usados vs disponibles</div>
        </div>
        <div class="kpi-box purple">
            <div class="kpi-box-title">Atletas (7 días)</div>
            <div class="kpi-box-value">Únicos</div>
            <div class="kpi-box-desc">% de penetración activa</div>
        </div>
        <div class="kpi-box amber">
            <div class="kpi-box-title">Ausentismo</div>
            <div class="kpi-box-value">Radar Churn</div>
            <div class="kpi-box-desc">Alerta >14 días sin asistir</div>
        </div>
    </div>

    <div class="section-h2">4.1 Las 3 Sub-pestañas Operativas</div>
    <table class="manual-table">
        <thead>
            <tr>
                <th style="width: 25%;">Sub-pestaña</th>
                <th style="width: 35%;">Funcionalidad Principal</th>
                <th style="width: 40%;">Acción Recomendada para el Administrador</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>1. Roster Diario por Clase</strong></td>
                <td>Muestra las clases del día seleccionado con la lista nominal de alumnos inscritos en tiempo real.</td>
                <td>Verificar a los alumnos presentes en el tatami y presionar <strong>"Confirmar Asistencia"</strong> para validar el check-in.</td>
            </tr>
            <tr>
                <td><strong>2. Historial & Auditoría Global</strong></td>
                <td>Libro mayor de todos los registros históricos de asistencia con filtros por rango de fechas y método.</td>
                <td>Buscar el registro de un alumno específico y descargar el reporte oficial en formato <strong>CSV</strong> para análisis externo.</td>
            </tr>
            <tr>
                <td><strong>3. Analytics e Insights</strong></td>
                <td>Gráficos de afluencia por día de la semana, Top 5 Atletas más activos del mes y radar de inactividad crítica.</td>
                <td>Revisar semanalmente los alumnos con <strong>más de 14 días sin asistir</strong> para iniciar protocolos de reactivación vía WhatsApp.</td>
            </tr>
        </tbody>
    </table>

    <div class="section-h2">4.2 Check-in Rápido Manual</div>
    <p>
        Cuando un alumno no trae su smartphone, no tiene batería o asiste a una clase de prueba, el administrador puede usar el botón <strong>"Check-in Rápido Manual"</strong> en la cabecera. Solo debe seleccionar al alumno en la lista desplegable, elegir la clase del horario y confirmar.
    </p>

    <!-- CAPÍTULO 5 -->
    <div class="page-break"></div>
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 5</span>
            <h2 class="chapter-title">CRM de Socios y Gestión 360° de Membresías</h2>
        </div>
        <span style="font-size: 13pt;">👥</span>
    </div>

    <p>
        El módulo <strong>Control de Socios</strong> es un CRM marcial especializado diseñado para maximizar la retención, automatizar cobranzas preventivas y mantener un seguimiento individualizado de cada practicante.
    </p>

    <div class="section-h2">5.1 Estados de Membresía y Código Visual</div>
    <table class="manual-table">
        <thead>
            <tr>
                <th style="width: 20%;">Estado</th>
                <th style="width: 15%;">Insignia</th>
                <th style="width: 30%;">Criterio del Sistema</th>
                <th style="width: 35%;">Acción Operativa</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Activo</strong></td>
                <td><span class="badge badge-active">Activo</span></td>
                <td>Membresía al día con fecha de vencimiento superior a 5 días.</td>
                <td>Acceso libre al tatami y reservas habilitadas.</td>
            </tr>
            <tr>
                <td><strong>Por Vencer</strong></td>
                <td><span class="badge badge-warning">Por Vencer</span></td>
                <td>La fecha de corte expira en 5 días o menos.</td>
                <td>Enviar recordatorio cordial de renovación por WhatsApp.</td>
            </tr>
            <tr>
                <td><strong>Moroso / Vencido</strong></td>
                <td><span class="badge badge-overdue">Vencido</span></td>
                <td>Fecha de membresía expirada sin pago registrado.</td>
                <td>Restricción de reservas y cobranza directa en recepción.</td>
            </tr>
            <tr>
                <td><strong>Congelado</strong></td>
                <td><span class="badge badge-frozen">Congelado</span></td>
                <td>Membresía pausada formalmente por viaje o lesión médica.</td>
                <td>Pausa del contador de días hasta su reactivación.</td>
            </tr>
        </tbody>
    </table>

    <div class="section-h2">5.2 Slide-over Drawer 360° (Ficha Maestra del Alumno)</div>
    <p>Al hacer clic en cualquier socio dentro del Directorio Maestro, se despliega desde el lateral derecho la ficha completa 360° con 5 pestañas especializadas:</p>
    <ul class="custom-list">
        <li><strong>Ficha Perfil:</strong> Fotografía/Avatar, Nombre completo, Correo electrónico, RUT, Teléfono y fecha de alta.</li>
        <li><strong>Membresía:</strong> Plan asignado, fecha de inicio, selector de fecha de expiración manual y switch de congelamiento temporal.</li>
        <li><strong>Historial de Asistencias:</strong> Lista detallada de todas las clases a las que ha asistido el alumno y cálculo de constancia.</li>
        <li><strong>Historial de Pagos:</strong> Bitácora de todas las cuotas abonadas, con enlaces a comprobantes adjuntos y estado de conciliación.</li>
        <li><strong>Notas Confidenciales de Admin:</strong> Campo privado para registrar acuerdos especiales, antecedentes médicos, lesiones o compromisos de pago. Se guarda con el botón <em>"Guardar Notas"</em>.</li>
    </ul>

    <div class="section-h2">5.3 Radar de Retención & Churn Risk (Prevención de Fuga)</div>
    <p>
        El sistema evalúa continuamente a cada alumno asignando un puntaje de riesgo de 0 a 100 basado en: frecuencia de inasistencia reciente, historial de morosidad y antigüedad en el dojo.
    </p>
    <div class="callout callout-warning avoid-break">
        <div class="callout-icon">⚡</div>
        <div class="callout-content">
            <strong>Protocolo de Retención Temprana:</strong>
            Filtre en el Radar por <strong>"Riesgo Alto (≥60)"</strong>. Desde esta misma vista, presione el botón de WhatsApp para enviar una invitación de reactivación personalizada en 1 solo clic.
        </div>
    </div>

    <!-- CAPÍTULO 6 -->
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 6</span>
            <h2 class="chapter-title">Control, Validación y Conciliación de Pagos</h2>
        </div>
        <span style="font-size: 13pt;">💳</span>
    </div>

    <p>
        El módulo de <strong>Control de Pagos</strong> centraliza la verificación de todos los ingresos económicos del dojo, garantizando que ninguna transferencia pase desapercibida y evitando discrepancias de caja.
    </p>

    <div class="workflow-steps avoid-break">
        <div class="wf-step">
            <div class="wf-step-num">1</div>
            <div class="wf-step-title">Recepción</div>
            <div class="wf-step-desc">El alumno sube el comprobante de transferencia bancaria desde su app móvil.</div>
        </div>
        <div class="wf-step">
            <div class="wf-step-num">2</div>
            <div class="wf-step-title">Alerta Visual</div>
            <div class="wf-step-desc">La barra lateral y el KPI muestran una insignia ámbar con el número de pagos pendientes.</div>
        </div>
        <div class="wf-step">
            <div class="wf-step-num">3</div>
            <div class="wf-step-title">Auditoría</div>
            <div class="wf-step-desc">El administrador abre el comprobante en alta resolución y verifica monto y cuenta bancaria.</div>
        </div>
        <div class="wf-step">
            <div class="wf-step-num">4</div>
            <div class="wf-step-title">Conciliación</div>
            <div class="wf-step-desc">Clic en <strong>"Aprobar"</strong>: el sistema extiende automáticamente 30 días la membresía del alumno.</div>
        </div>
    </div>

    <div class="section-h2">6.1 Acciones de Conciliación</div>
    <ul class="custom-list">
        <li><strong>Aprobar Pago (✓):</strong> Cambia el estado a <em>Aprobado</em>, suma el dinero a la recaudación mensual y actualiza la fecha de vencimiento del alumno en la tabla <code>profiles</code>.</li>
        <li><strong>Rechazar Pago (✗):</strong> Permite ingresar el motivo (ej. <em>"Comprobante ilegible"</em> o <em>"Transferencia no acreditada en cuenta"</em>). El alumno recibe la notificación para reenviar el pago correcto.</li>
    </ul>

    <!-- CAPÍTULO 7 -->
    <div class="page-break"></div>
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 7</span>
            <h2 class="chapter-title">Membresías, Planes y Cupones de Descuento</h2>
        </div>
        <span style="font-size: 13pt;">🏷️</span>
    </div>

    <p>
        Amarufighter permite crear y mantener un catálogo flexible de planes de membresía y campañas comerciales de descuento para incentivar renovaciones y captar nuevos alumnos.
    </p>

    <div class="section-h2">7.1 Gestión de Planes de Membresía</div>
    <table class="manual-table">
        <thead>
            <tr>
                <th style="width: 25%;">Campo del Plan</th>
                <th style="width: 35%;">Descripción / Formato</th>
                <th style="width: 40%;">Impacto en el Sistema</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Nombre del Plan</strong></td>
                <td>Texto descriptivo (ej. <em>"Plan Ilimitado Total"</em>).</td>
                <td>Visible en el landing page público y en la app del alumno.</td>
            </tr>
            <tr>
                <td><strong>Precio Mensual ($)</strong></td>
                <td>Valor numérico en pesos chilenos (ej. <em>$45.000</em>).</td>
                <td>Base de cálculo para el MRR, proyecciones financieras y pasarelas.</td>
            </tr>
            <tr>
                <td><strong>Límite de Clases</strong></td>
                <td>Número semanal (ej. 2, 3 o ilimitado).</td>
                <td>Restringe las reservas semanales que el socio puede agendar.</td>
            </tr>
            <tr>
                <td><strong>Estado de Publicación</strong></td>
                <td>Interruptor Activo / Inactivo.</td>
                <td>Permite ocultar planes discontinuados sin borrar su histórico contable.</td>
            </tr>
        </tbody>
    </table>

    <div class="section-h2">7.2 Módulo de Cupones y Descuentos Promocionales</div>
    <p>Para campañas especiales (ej. promociones de verano o convenios), el administrador puede crear cupones en la sección <strong>"Descuentos"</strong>:</p>
    <ul class="custom-list">
        <li><strong>Código del Cupón:</strong> Código alfanumérico en mayúsculas (ej. <code>AMARU2026</code>, <code>CONVENIO15</code>).</li>
        <li><strong>Modalidad de Descuento:</strong> Porcentaje sobre el valor total (ej. <code>20%</code>) o monto fijo en pesos (ej. <code>$10.000</code>).</li>
        <li><strong>Vigencia y Límites:</strong> Fecha de expiración y límite máximo de usos permitidos en el dojo.</li>
        <li><strong>Segmentación por Plan:</strong> Posibilidad de activar el descuento solo para planes seleccionados.</li>
    </ul>

    <!-- CAPÍTULO 8 -->
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 8</span>
            <h2 class="chapter-title">Cockpit Financiero, Run-Rate y Simulador</h2>
        </div>
        <span style="font-size: 13pt;">📈</span>
    </div>

    <p>
        El módulo <strong>Ingresos y Métricas</strong> proporciona herramientas de nivel gerencial para evaluar la rentabilidad del dojo, proyectar el cierre mensual y simular escenarios estratégicos.
    </p>

    <div class="section-h2">8.1 Indicadores Financieros Clave</div>
    <div class="kpi-grid-manual avoid-break">
        <div class="kpi-box emerald">
            <div class="kpi-box-title">Recaudación Total</div>
            <div class="kpi-box-value">Real Cobrado</div>
            <div class="kpi-box-desc">Suma neta del período</div>
        </div>
        <div class="kpi-box purple">
            <div class="kpi-box-title">MRR Estimado</div>
            <div class="kpi-box-value">Recurrente</div>
            <div class="kpi-box-desc">Padrón activo × Valor plan</div>
        </div>
        <div class="kpi-box cyan">
            <div class="kpi-box-title">Ticket Promedio</div>
            <div class="kpi-box-value">ARPU ($)</div>
            <div class="kpi-box-desc">Ingreso medio por socio</div>
        </div>
        <div class="kpi-box amber">
            <div class="kpi-box-title">Por Conciliar</div>
            <div class="kpi-box-value">En Espera</div>
            <div class="kpi-box-desc">Monto en pagos pendientes</div>
        </div>
    </div>

    <div class="section-h2">8.2 Herramientas de Estrategia Financiera</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 7px; padding: 10px;">
            <div style="font-weight: 800; color: #16a34a; font-size: 8.5pt; margin-bottom: 3px;">🎯 Proyector Run-Rate y Meta Mensual</div>
            <p style="font-size: 7.8pt; margin-bottom: 4px;">
                Calcula automáticamente la velocidad diaria de cobranza y proyecta la cifra final de facturación a fin de mes. Permite configurar la Meta del Dojo (ej. $3.500.000 CLP) con barra de progreso interactiva.
            </p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 7px; padding: 10px;">
            <div style="font-weight: 800; color: #7c3aed; font-size: 8.5pt; margin-bottom: 3px;">🧮 Simulador de Escenarios "What-If"</div>
            <p style="font-size: 7.8pt; margin-bottom: 4px;">
                Permite proyectar en segundos cuánto aumentarían los ingresos mensuales al captar +5, +10 o +20 socios nuevos, o al aplicar un ajuste porcentual (+5%, +10%) en las tarifas.
            </p>
        </div>
    </div>

    <div class="section-h2">8.3 Suite de Exportación Multiformato (.CSV, .XLS, .PDF)</div>
    <p>
        Toda la data del Libro Diario Contable y Directorio puede ser exportada en un clic mediante los botones ubicados en la barra de herramientas para entrega a contabilidad o respaldo institucional.
    </p>

    <!-- CAPÍTULO 9 & 10 -->
    <div class="page-break"></div>
    <div class="chapter-header">
        <div class="chapter-title-group">
            <span class="chapter-number">Capítulo 9 & 10</span>
            <h2 class="chapter-title">Avisos Globales y Protocolos Operativos (SOP)</h2>
        </div>
        <span style="font-size: 13pt;">📋</span>
    </div>

    <div class="section-h2">9.1 Emisión de Avisos Globales (Broadcast)</div>
    <p>
        Desde la sección <strong>"Avisos Globales"</strong> o mediante el botón rápido del dashboard, el administrador puede publicar anuncios con visibilidad inmediata en el muro de noticias de la app del alumno.
    </p>
    <ul class="custom-list">
        <li><strong>Tipos de aviso:</strong> <em>Informativo</em> (azul), <em>Alerta de Horario</em> (ámbar), <em>Éxito / Torneos</em> (verde) o <em>Urgente</em> (rojo).</li>
        <li><strong>Campos:</strong> Título del comunicado y cuerpo del mensaje detallado.</li>
    </ul>

    <div class="section-h2">10.1 Protocolos Operativos Estándar Recomendados (SOP)</div>
    <table class="manual-table">
        <thead>
            <tr>
                <th style="width: 20%;">Momento del Día</th>
                <th style="width: 40%;">Rutina Operativa en el Sistema</th>
                <th style="width: 40%;">Objetivo / Impacto</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Apertura (08:00 AM)</strong></td>
                <td>1. Revisar <strong>Pagos Pendientes</strong> y conciliar transferencias nocturnas.<br>2. Comprobar el <strong>Roster de Clases</strong> del día y aforos.</td>
                <td>Garantizar que todos los alumnos que entrenen en la mañana figuren con membresía al día.</td>
            </tr>
            <tr>
                <td><strong>Durante Clases (Tarde/Noche)</strong></td>
                <td>1. Mantener abierto el <strong>Tatami Cockpit</strong>.<br>2. Realizar Check-in Rápido Manual a atletas rezagados o visitas.</td>
                <td>Control de asistencia 100% fidedigno y prevención de ingresos no registrados.</td>
            </tr>
            <tr>
                <td><strong>Cierre Diario (22:00 PM)</strong></td>
                <td>1. Registrar pagos en efectivo recibidos en el dojo.<br>2. Verificar asistencias totales en el historial diario.</td>
                <td>Cuadre exacto entre libro contable y dinero en caja física.</td>
            </tr>
            <tr>
                <td><strong>Cierre Mensual (Días 25 a 30)</strong></td>
                <td>1. Filtrar en CRM socios <strong>Por Vencer</strong> y enviar recordatorios WhatsApp.<br>2. Analizar el <strong>Radar de Retención</strong> (Riesgo Alto).<br>3. Evaluar el cumplimiento de la meta en el <strong>Run-Rate</strong>.</td>
                <td>Minimizar la tasa de deserción (churn), asegurar renovaciones y cerrar balance contable.</td>
            </tr>
        </tbody>
    </table>

    <div class="section-h2">10.2 Matriz de Solución de Problemas Frecuentes (Troubleshooting)</div>
    <table class="manual-table">
        <thead>
            <tr>
                <th style="width: 30%;">Incidencia Reportada</th>
                <th style="width: 30%;">Causa Probable</th>
                <th style="width: 40%;">Solución Inmediata</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Un alumno pagó pero su app dice "Membresía Vencida".</td>
                <td>El comprobante aún está en estado <em>Pendiente</em> en el módulo de pagos.</td>
                <td>Ir a <strong>Control de Pagos</strong>, verificar el comprobante y presionar <strong>"Aprobar"</strong>.</td>
            </tr>
            <tr>
                <td>El tatami está lleno pero el sistema permite más reservas.</td>
                <td>El cupo máximo de la clase está configurado muy alto.</td>
                <td>Ir a <strong>Gestión de Clases</strong>, editar la clase y reducir el aforo máximo permitido.</td>
            </tr>
            <tr>
                <td>Los datos en pantalla no se actualizan tras un cambio.</td>
                <td>Caché local del navegador o pérdida momentánea de conexión.</td>
                <td>Presionar el botón <strong>"Refrescar"</strong> (<i style="font-size:7pt;">↻</i>) en la barra superior o <kbd>F5</kbd>.</td>
            </tr>
            <tr>
                <td>Un socio lesionado no quiere perder sus días pagados.</td>
                <td>La membresía sigue corriendo en el calendario.</td>
                <td>Abrir su <strong>Drawer 360°</strong>, pestaña Membresía, y activar el switch <strong>"Congelar Membresía"</strong>.</td>
            </tr>
        </tbody>
    </table>

    <div class="footer-note">
        Amarufighter Martial Arts Club • Sistema Integral de Administración y Control del Tatami • Documento Oficial para Uso Interno
    </div>

</body>
</html>`;

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');
console.log('Documento HTML del Manual generado con éxito en:', tempHtmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : null);

if (!browserPath) {
    console.error('No se encontró ejecutable de Edge o Chrome en las rutas estándar.');
    process.exit(1);
}

console.log('Utilizando navegador para renderizado PDF:', browserPath);

const cmd = `"${browserPath}" --headless=new --disable-gpu --allow-file-access-from-files --print-to-pdf="${outputPdfPath}" --no-pdf-header-footer "${tempHtmlPath}"`;

try {
    execSync(cmd, { stdio: 'inherit' });
    if (fs.existsSync(outputPdfPath)) {
        const stats = fs.statSync(outputPdfPath);
        console.log(`\n¡PDF Generado Exitosamente!`);
        console.log(`Ubicación: ${outputPdfPath}`);
        console.log(`Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
    } else {
        console.error('El archivo PDF no fue creado.');
    }
} catch (err) {
    console.error('Error al ejecutar el navegador headless para imprimir a PDF:', err);
} finally {
    if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
        console.log('Archivo temporal HTML limpiado.');
    }
}
