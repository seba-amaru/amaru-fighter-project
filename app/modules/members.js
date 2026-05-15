// app/modules/members.js
// Control de Socios v2.0 — Panel Administrativo con 4 vistas
// Dashboard | Directorio | Retención | Comunicaciones

import { exportToFormat, exportUserData } from '../utils/exportUtils.js';
import { openMemberModal, deleteMember } from './adminModals.js';
import { openQuickPaymentModal } from './payments.js';
import unknowAvatar from '../images/unknow.png';

/* global Chart */

// ─── Estado local ───────────────────────────────────────────────────────────
let membersData = [];
let allReservations = [];
let plansData = [];
let paymentsData = [];
let currentView = 'dashboard'; // 'dashboard' | 'directorio' | 'retencion' | 'comunicaciones'
let dirFilter = { search: '', status: [], plan: '', minDaysLeft: '', maxDaysLeft: '', minLastAttendance: '' };
let dirSort = { field: 'full_name', dir: 'asc' };
let dirPage = 1;
let dirPerPage = 25;
let riskFilter = 'all'; // 'all' | 'high' | 'medium' | 'low' | 'inactive'
let commFilterStatus = 'all';

const getAdminContent = () => document.getElementById('admin-content-area');

// ─── Utilidades ─────────────────────────────────────────────────────────────
const formatDateShort = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getMonthName = (m) => {
    const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return names[m] || '';
};

const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Fetch unificado ────────────────────────────────────────────────────────
const fetchAllMembersData = async () => {
    try {
        const users = await window.supabase.from('profiles').select('*').eq('is_deleted', false);
        const res = await window.supabase.from('reservations').select('*');
        const plans = await window.supabase.from('membership_plans').select('*');
        const pays = await window.supabase.from('payments').select('*');

        membersData = users.data || [];
        allReservations = res.data || [];
        plansData = plans.data || [];
        paymentsData = pays.data || [];
    } catch (err) {
        console.error('[Members] Error fetching data:', err);
        window.showToast && window.showToast('Error cargando datos de socios', '#ef4444');
    }
};

// ─── Entry point ────────────────────────────────────────────────────────────
export const renderAdminMembers = async () => {
    const adminContent = getAdminContent();
    const revSection = document.getElementById('admin-revenue-section');
    if (revSection) revSection.classList.add('hidden');

    adminContent.innerHTML = `
        <div class="glass-premium p-20">
            <div class="p-20 text-center">
                <i data-lucide="loader" class="spin"></i>
                <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">Cargando control de socios...</p>
            </div>
        </div>`;
    window.lucide && window.lucide.createIcons();

    await fetchAllMembersData();
    renderMembersDashboard();
};

// ─── Dashboard principal con tabs ───────────────────────────────────────────
const renderMembersDashboard = () => {
    const adminContent = getAdminContent();
    if (!adminContent) return;

    adminContent.innerHTML = `
        <div class="glass-premium p-20" id="members-dashboard">
            <div class="header-split mb-20" style="align-items:flex-start;">
                <div>
                    <h3 style="font-size:1.3rem; margin-bottom:4px;">👥 Control de Socios</h3>
                    <p class="subtitle">Gestión integral de membresías, retención y comunicaciones</p>
                </div>
                <button class="btn-action-glow" id="btn-add-member-admin" style="width: 32px; height: 32px;"><i data-lucide="user-plus" style="width: 16px;"></i></button>
            </div>

            <!-- Tabs -->
            <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; flex-wrap:wrap;">
                <button id="tab-dashboard" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'dashboard' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="layout-dashboard" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Dashboard
                </button>
                <button id="tab-directorio" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'directorio' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="users" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Directorio
                </button>
                <button id="tab-retencion" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'retencion' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="heart-pulse" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Retención
                </button>
                <button id="tab-comunicaciones" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'comunicaciones' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="message-square" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Comunicaciones
                </button>
            </div>

            <!-- Content area -->
            <div id="members-view-content"></div>
        </div>
    `;

    window.lucide && window.lucide.createIcons();

    // Tab listeners
    document.getElementById('tab-dashboard').onclick = () => { currentView = 'dashboard'; renderMembersDashboard(); };
    document.getElementById('tab-directorio').onclick = () => { currentView = 'directorio'; renderMembersDashboard(); };
    document.getElementById('tab-retencion').onclick = () => { currentView = 'retencion'; renderMembersDashboard(); };
    document.getElementById('tab-comunicaciones').onclick = () => { currentView = 'comunicaciones'; renderMembersDashboard(); };

    document.getElementById('btn-add-member-admin').onclick = () => openMemberModal();

    // Render active view
    const contentArea = document.getElementById('members-view-content');
    if (currentView === 'dashboard') renderDashboardView(contentArea);
    else if (currentView === 'directorio') renderDirectorioView(contentArea);
    else if (currentView === 'retencion') renderRetencionView(contentArea);
    else renderComunicacionesView(contentArea);
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 1: DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
const renderDashboardView = (container) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Procesar datos de socios
    const processed = membersData.map(u => processMemberData(u, now, currentMonth, currentYear));

    // KPIs
    const total = processed.length;
    const active = processed.filter(p => p._status === 'Activo').length;
    const inactive = processed.filter(p => p._status === 'Inactivo').length;
    const moroso = processed.filter(p => p._status === 'Moroso').length;
    const frozen = processed.filter(p => p._status === 'Congelado').length;
    const newThisMonth = processed.filter(p => {
        const created = p.created_at ? new Date(p.created_at) : null;
        return created && created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    }).length;

    // Métricas avanzadas
    const avgDaysAsMember = processed.length > 0
        ? Math.round(processed.reduce((sum, p) => {
            const created = p.created_at ? new Date(p.created_at) : now;
            return sum + Math.floor((now - created) / (1000 * 60 * 60 * 24));
        }, 0) / processed.length)
        : 0;

    const retentionRate = total > 0 ? ((active / total) * 100).toFixed(0) : 0;

    // Últimos 5 socios registrados
    const recentMembers = [...processed]
        .filter(p => p.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    // Últimos 5 pagos
    const recentPayments = [...paymentsData]
        .filter(p => p.status === 'approved')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    // Datos para gráfico de evolución (últimos 6 meses)
    const evolutionData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        const count = processed.filter(p => {
            const created = p.created_at ? new Date(p.created_at) : null;
            return created && created.getMonth() === m && created.getFullYear() === y;
        }).length;
        evolutionData.push({ label: getMonthName(m).substring(0, 3), count });
    }

    // Distribución por plan
    const planDist = {};
    processed.forEach(p => {
        const planName = p.membership_plans?.name || 'Sin Plan';
        planDist[planName] = (planDist[planName] || 0) + 1;
    });

    // Datos para gráfico de asistencia (últimos 7 días)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const count = allReservations.filter(r => r.reservation_date === dStr).length;
        last7Days.push({
            label: d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
            count
        });
    }

    // Alertas críticas
    const expiringSoon = processed.filter(p => p._status === 'Activo' && p._daysLeft !== null && p._daysLeft > 0 && p._daysLeft <= 5).slice(0, 5);
    const noAttendance14 = processed.filter(p => p._status === 'Activo' && p._daysSinceLastAttendance > 14 && p._daysSinceLastAttendance !== -1).slice(0, 5);
    const overdue = processed.filter(p => p._status === 'Moroso').slice(0, 5);

    container.innerHTML = `
        <style>
            @keyframes dashFadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
            .dash-section { animation: dashFadeIn 0.4s ease forwards; }
        </style>

        <!-- KPIs con barras de progreso -->
        <div class="dash-section" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
            <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${total}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Total Socios</span>
                <div style="width:100%; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                    <div style="width:${retentionRate}%; height:100%; background:var(--accent-purple); border-radius:2px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${retentionRate}% retención • ${newThisMonth} nuevos</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">${active}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Activos</span>
                <div style="width:100%; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                    <div style="width:${total > 0 ? (active / total * 100) : 0}%; height:100%; background:#22c55e; border-radius:2px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${total > 0 ? Math.round(active / total * 100) : 0}% del total</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:#3b82f6;">${frozen}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Congelados</span>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${avgDaysAsMember} días promedio</span>
            </div>
            <div class="stat-mini-premium ${moroso > 0 ? 'pulse-warning' : ''}" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:#ef4444;">${moroso}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Morosos</span>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${inactive} inactivos totales</span>
            </div>
        </div>

        <!-- Gráficos -->
        <div class="dash-section" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:25px;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="trending-up" style="width:14px; color:var(--accent-purple);"></i> Nuevos Socios (6 meses)</h4>
                <div class="chart-container" style="min-height:160px;"><canvas id="membersEvolutionChart"></canvas></div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="pie-chart" style="width:14px; color:#22c55e;"></i> Distribución por Plan</h4>
                <div class="chart-container" style="min-height:160px;"><canvas id="membersPlanChart"></canvas></div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="calendar-check" style="width:14px; color:var(--accent-cyan);"></i> Asistencia Últimos 7 Días</h4>
                <div class="chart-container" style="min-height:160px;"><canvas id="membersAttendanceChart"></canvas></div>
            </div>
        </div>

        <!-- Actividad Reciente -->
        <div class="dash-section" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:25px;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="user-plus" style="width:14px; color:var(--accent-purple);"></i> Socios Recientes</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${recentMembers.length === 0
            ? '<p style="opacity:0.5; font-size:0.8rem; padding:10px;">Sin registros recientes</p>'
            : recentMembers.map(p => `
                            <div style="display:flex; align-items:center; gap:10px; padding:8px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <img src="${p.photo_url || (typeof unknowAvatar !== 'undefined' ? unknowAvatar : '/app/images/icon-192.png')}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                                <div style="flex:1; min-width:0;">
                                    <strong style="font-size:0.8rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.full_name || 'Sin nombre'}</strong>
                                    <span style="font-size:0.65rem; color:var(--text-gray);">${p._status} • ${p.membership_plans?.name || 'Sin plan'}</span>
                                </div>
                                <span style="font-size:0.65rem; color:var(--text-gray); flex-shrink:0;">${p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : ''}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="receipt" style="width:14px; color:#22c55e;"></i> Pagos Recientes</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${recentPayments.length === 0
            ? '<p style="opacity:0.5; font-size:0.8rem; padding:10px;">Sin pagos recientes</p>'
            : recentPayments.map(p => {
                const user = processed.find(u => u.id === p.user_id);
                return `
                            <div style="display:flex; align-items:center; gap:10px; padding:8px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <div style="width:32px; height:32px; border-radius:50%; background:rgba(34,197,94,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="dollar-sign" style="width:14px; color:#22c55e;"></i>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <strong style="font-size:0.8rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user?.full_name || 'Socio'}</strong>
                                    <span style="font-size:0.65rem; color:var(--text-gray);">${p.concept || 'Pago'}</span>
                                </div>
                                <span style="font-size:0.8rem; color:#22c55e; font-weight:700; flex-shrink:0;">$${(parseFloat(p.amount) || 0).toLocaleString('es-CL')}</span>
                            </div>
                        `;
            }).join('')}
                </div>
            </div>
        </div>

        <!-- Alertas críticas -->
        <div class="dash-section">
            <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-triangle" style="width:16px; color:#ef4444;"></i> Alertas Críticas
            </h4>
            ${expiringSoon.length === 0 && noAttendance14.length === 0 && overdue.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem; padding:15px;">🎉 No hay alertas críticas. Todo está bajo control.</p>'
            : `<div style="display:flex; flex-direction:column; gap:8px;">
                    ${expiringSoon.map(p => renderAlertCard(p, 'expiring')).join('')}
                    ${noAttendance14.map(p => renderAlertCard(p, 'noAttendance')).join('')}
                    ${overdue.map(p => renderAlertCard(p, 'overdue')).join('')}
                </div>`
        }
        </div>
    `;

    window.lucide && window.lucide.createIcons();
    renderDashboardCharts(evolutionData, planDist, last7Days);

    // Listeners para acciones rápidas en alertas
    container.querySelectorAll('.alert-action-renew').forEach(btn => {
        btn.onclick = () => quickRenew(btn.getAttribute('data-id'));
    });
    container.querySelectorAll('.alert-action-register').forEach(btn => {
        btn.onclick = () => openQuickPaymentModal(btn.getAttribute('data-uid'));
    });
    container.querySelectorAll('.alert-action-edit').forEach(btn => {
        btn.onclick = () => openMemberModal(btn.getAttribute('data-id'), membersData);
    });
};

const renderAlertCard = (p, type) => {
    const configs = {
        expiring: { icon: 'clock', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: `Vence en ${p._daysLeft} días` },
        noAttendance: { icon: 'user-x', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: `Sin asistir hace ${p._daysSinceLastAttendance} días` },
        overdue: { icon: 'alert-circle', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: 'Membresía vencida' }
    };
    const cfg = configs[type];
    return `
        <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:${cfg.bg}; border-radius:10px; border:1px solid ${cfg.border};">
            <div style="width:36px; height:36px; border-radius:50%; background:${cfg.color}22; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i data-lucide="${cfg.icon}" style="width:16px; color:${cfg.color};"></i>
            </div>
            <div style="flex:1;">
                <strong style="font-size:0.9rem;">${p.full_name || 'Sin nombre'}</strong>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${cfg.text} — ${p.membership_plans?.name || 'Sin plan'}</span>
            </div>
            <div style="display:flex; gap:6px;">
                ${type === 'expiring' || type === 'overdue' ? `<button class="alert-action-register btn-glass-small" data-uid="${p.id}" style="border-color:var(--accent-purple); color:var(--accent-purple); font-size:0.7rem;"><i data-lucide="dollar-sign" style="width:12px;"></i></button>` : ''}
                <button class="alert-action-edit btn-glass-small" data-id="${p.id}" style="font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>
            </div>
        </div>
    `;
};

const renderDashboardCharts = (evolutionData, planDist, last7Days) => {
    const evCtx = document.getElementById('membersEvolutionChart');
    if (evCtx) {
        if (window._membersEvolutionChart) window._membersEvolutionChart.destroy();
        window._membersEvolutionChart = new Chart(evCtx, {
            type: 'line',
            data: {
                labels: evolutionData.map(d => d.label),
                datasets: [{
                    label: 'Nuevos',
                    data: evolutionData.map(d => d.count),
                    borderColor: 'var(--accent-purple)',
                    backgroundColor: 'rgba(139,92,246,0.15)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true }
                }
            }
        });
    }

    const planCtx = document.getElementById('membersPlanChart');
    if (planCtx) {
        if (window._membersPlanChart) window._membersPlanChart.destroy();
        const labels = Object.keys(planDist);
        const data = Object.values(planDist);
        const colors = ['#8b5cf6', '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#fbbf24'];
        window._membersPlanChart = new Chart(planCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 }, boxWidth: 10 } }
                }
            }
        });
    }

    const attCtx = document.getElementById('membersAttendanceChart');
    if (attCtx && last7Days) {
        if (window._membersAttendanceChart) window._membersAttendanceChart.destroy();
        window._membersAttendanceChart = new Chart(attCtx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => d.label),
                datasets: [{
                    label: 'Asistencias',
                    data: last7Days.map(d => d.count),
                    backgroundColor: 'rgba(6,182,212,0.7)',
                    borderColor: 'rgba(6,182,212,1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 9 } }, grid: { display: false } },
                    y: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true }
                }
            }
        });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 2: DIRECTORIO
// ═════════════════════════════════════════════════════════════════════════════
const renderDirectorioView = (container) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Procesar y filtrar
    let processed = membersData.map(u => processMemberData(u, now, currentMonth, currentYear));

    // Aplicar filtros
    if (dirFilter.search) {
        const term = dirFilter.search.toLowerCase();
        processed = processed.filter(p =>
            (p.full_name || '').toLowerCase().includes(term) ||
            (p.email || '').toLowerCase().includes(term) ||
            (p.phone || '').toLowerCase().includes(term)
        );
    }
    if (dirFilter.status.length > 0) {
        processed = processed.filter(p => dirFilter.status.includes(p._status));
    }
    if (dirFilter.plan) {
        processed = processed.filter(p => (p.membership_plans?.name || '') === dirFilter.plan);
    }
    if (dirFilter.minDaysLeft !== '') {
        processed = processed.filter(p => p._daysLeft !== null && p._daysLeft >= parseInt(dirFilter.minDaysLeft));
    }
    if (dirFilter.maxDaysLeft !== '') {
        processed = processed.filter(p => p._daysLeft !== null && p._daysLeft <= parseInt(dirFilter.maxDaysLeft));
    }
    if (dirFilter.minLastAttendance !== '') {
        processed = processed.filter(p => p._daysSinceLastAttendance >= parseInt(dirFilter.minLastAttendance));
    }

    // Ordenar
    processed.sort((a, b) => {
        let valA, valB;
        switch (dirSort.field) {
            case 'full_name': valA = a.full_name || ''; valB = b.full_name || ''; break;
            case 'status': valA = a._status; valB = b._status; break;
            case 'plan': valA = a.membership_plans?.name || ''; valB = b.membership_plans?.name || ''; break;
            case 'expiry': valA = a._expiryDate || 0; valB = b._expiryDate || 0; break;
            case 'lastAttendance': valA = a._lastAttendance || 0; valB = b._lastAttendance || 0; break;
            case 'level': valA = a.level || 0; valB = b.level || 0; break;
            default: valA = a.full_name || ''; valB = b.full_name || '';
        }
        if (dirSort.dir === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });

    const totalPages = Math.max(1, Math.ceil(processed.length / dirPerPage));
    dirPage = Math.min(dirPage, totalPages);
    const startIdx = (dirPage - 1) * dirPerPage;
    const pageItems = processed.slice(startIdx, startIdx + dirPerPage);

    const statusOptions = [
        { val: 'Activo', label: 'Activo', color: '#22c55e' },
        { val: 'Inactivo', label: 'Inactivo', color: '#ef4444' },
        { val: 'Moroso', label: 'Moroso', color: '#f97316' },
        { val: 'Congelado', label: 'Congelado', color: '#3b82f6' }
    ];

    const uniquePlans = [...new Set(membersData.map(u => u.membership_plans?.name).filter(Boolean))];

    container.innerHTML = `
        <!-- Filtros -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <input type="text" id="dir-search" placeholder="🔍 Buscar nombre, email o teléfono..." value="${dirFilter.search}" style="flex:1; min-width:180px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 12px; border-radius:8px; font-size:0.8rem; outline:none;">

            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                ${statusOptions.map(opt => `
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.7rem; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; border:1px solid ${dirFilter.status.includes(opt.val) ? opt.color : 'rgba(255,255,255,0.1)'};">
                        <input type="checkbox" class="dir-status-check" value="${opt.val}" ${dirFilter.status.includes(opt.val) ? 'checked' : ''} style="accent-color:${opt.color};">
                        <span style="color:${dirFilter.status.includes(opt.val) ? opt.color : 'var(--text-gray)'};">${opt.label}</span>
                    </label>
                `).join('')}
            </div>

            <select id="dir-plan" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todos los planes</option>
                ${uniquePlans.map(p => `<option value="${p}" ${dirFilter.plan === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="dir-min-days" placeholder="Min días" value="${dirFilter.minDaysLeft}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <span style="opacity:0.5; font-size:0.75rem;">-</span>
                <input type="number" id="dir-max-days" placeholder="Max días" value="${dirFilter.maxDaysLeft}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
            </div>

            <input type="number" id="dir-min-attendance" placeholder="Sin asistir ≥ días" value="${dirFilter.minLastAttendance}" style="width:120px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">

            <button id="dir-clear-filters" class="btn-glass-small" style="font-size:0.7rem;"><i data-lucide="x" style="width:12px;"></i> Limpiar</button>
        </div>

        <!-- Totales -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.8rem; color:var(--text-gray);">Mostrando <strong style="color:white;">${processed.length}</strong> socios</span>
            <div style="display:flex; gap:8px; align-items:center;">
                <select id="dir-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="csv">CSV</option>
                    <option value="xls">XLS</option>
                    <option value="pdf">PDF</option>
                </select>
                <button id="dir-export-btn" class="btn-primary" style="padding:6px 14px; font-size:0.75rem; border-radius:8px;"><i data-lucide="download" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Exportar</button>
            </div>
        </div>

        <!-- Tabla -->
        <div style="overflow-x:auto; border:1px solid rgba(255,255,255,0.06); border-radius:12px; margin-bottom:15px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="full_name">Socio ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="plan">Plan ↕</th>
                        <th style="padding:10px 12px; text-align:center; cursor:pointer; white-space:nowrap;" data-sort="status">Estado ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="expiry">Vencimiento ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="lastAttendance">Última Asistencia ↕</th>
                        <th style="padding:10px 12px; text-align:center; cursor:pointer; white-space:nowrap;" data-sort="level">Nivel ↕</th>
                        <th style="padding:10px 12px; text-align:right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageItems.length === 0
            ? `<tr><td colspan="7" style="padding:30px; text-align:center; opacity:0.5;">No hay socios que coincidan con los filtros.</td></tr>`
            : pageItems.map(p => {
                const statusColor = p._statusColor;
                const statusBg = p._statusBg;
                const avatar = p.photo_url || (typeof unknowAvatar !== 'undefined' ? unknowAvatar : '/app/images/icon-192.png');
                return `
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding:10px 12px;">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <img src="${avatar}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">
                                            <div>
                                                <strong style="font-size:0.85rem;">${p.full_name || 'Sin nombre'}</strong>
                                                <span style="font-size:0.7rem; color:var(--text-gray); display:block;">
                                                    ${p.email && !p.email.includes('@amaru.local') ? p.email : '<span style="color:#fbbf24;">📵 Sin tecnología</span>'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding:10px 12px;">${p.membership_plans?.name || 'Sin Plan'}</td>
                                    <td style="padding:10px 12px; text-align:center;">
                                        <span style="font-size:0.7rem; background:${statusBg}; color:${statusColor}; padding:3px 10px; border-radius:20px; font-weight:700;">${p._status}</span>
                                    </td>
                                    <td style="padding:10px 12px; white-space:nowrap;">
                                        ${p._expiryDate ? formatDateShort(p._expiryDate.toISOString()) : '—'}
                                        ${p._daysLeft !== null ? `<span style="font-size:0.7rem; color:${p._daysLeft <= 5 ? '#ef4444' : 'var(--text-gray)'}; display:block;">${p._daysLeft > 0 ? p._daysLeft + ' días' : 'Expirado'}</span>` : ''}
                                    </td>
                                    <td style="padding:10px 12px; white-space:nowrap;">
                                        ${p._lastAttendance ? formatDateShort(p._lastAttendance.toISOString()) : 'Nunca'}
                                        ${p._daysSinceLastAttendance > 0 ? `<span style="font-size:0.7rem; color:var(--text-gray); display:block;">hace ${p._daysSinceLastAttendance} días</span>` : ''}
                                    </td>
                                    <td style="padding:10px 12px; text-align:center;">LVL ${p.level || 0}</td>
                                    <td style="padding:10px 12px; text-align:right; white-space:nowrap;">
                                        <button class="dir-edit-btn btn-glass-small" data-id="${p.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>
                                        <button class="dir-renew-btn btn-glass-small" data-id="${p.id}" style="border-color:#22c55e; color:#22c55e; padding:3px 8px; font-size:0.7rem;"><i data-lucide="refresh-cw" style="width:12px;"></i></button>
                                        <button class="dir-delete-btn btn-glass-small delete" data-id="${p.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="trash-2" style="width:12px;"></i></button>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:8px; align-items:center;">
                <span style="font-size:0.75rem; color:var(--text-gray);">Filas:</span>
                <select id="dir-per-page" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="25" ${dirPerPage === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${dirPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${dirPerPage === 100 ? 'selected' : ''}>100</option>
                </select>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button id="dir-prev-page" class="btn-glass-small" ${dirPage <= 1 ? 'disabled style="opacity:0.3;"' : ''} style="font-size:0.75rem;"><i data-lucide="chevron-left" style="width:14px;"></i></button>
                <span style="font-size:0.8rem;">Página <strong>${dirPage}</strong> de ${totalPages}</span>
                <button id="dir-next-page" class="btn-glass-small" ${dirPage >= totalPages ? 'disabled style="opacity:0.3;"' : ''} style="font-size:0.75rem;"><i data-lucide="chevron-right" style="width:14px;"></i></button>
            </div>
        </div>
    `;

    window.lucide && window.lucide.createIcons();
    attachDirectorioListeners(container, processed);
};

const attachDirectorioListeners = (container, filteredList) => {
    // Búsqueda
    const searchInput = container.querySelector('#dir-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { dirFilter.search = searchInput.value; dirPage = 1; renderMembersDashboard(); }, 300);
        };
    }

    // Status checkboxes
    container.querySelectorAll('.dir-status-check').forEach(chk => {
        chk.onchange = () => {
            const vals = Array.from(container.querySelectorAll('.dir-status-check:checked')).map(c => c.value);
            dirFilter.status = vals;
            dirPage = 1; renderMembersDashboard();
        };
    });

    // Plan
    const planSelect = container.querySelector('#dir-plan');
    if (planSelect) { planSelect.onchange = () => { dirFilter.plan = planSelect.value; dirPage = 1; renderMembersDashboard(); }; }

    // Días
    const minDays = container.querySelector('#dir-min-days');
    const maxDays = container.querySelector('#dir-max-days');
    if (minDays) { minDays.onchange = () => { dirFilter.minDaysLeft = minDays.value; dirPage = 1; renderMembersDashboard(); }; }
    if (maxDays) { maxDays.onchange = () => { dirFilter.maxDaysLeft = maxDays.value; dirPage = 1; renderMembersDashboard(); }; }

    // Asistencia
    const minAtt = container.querySelector('#dir-min-attendance');
    if (minAtt) { minAtt.onchange = () => { dirFilter.minLastAttendance = minAtt.value; dirPage = 1; renderMembersDashboard(); }; }

    // Limpiar filtros
    const clearBtn = container.querySelector('#dir-clear-filters');
    if (clearBtn) {
        clearBtn.onclick = () => {
            dirFilter = { search: '', status: [], plan: '', minDaysLeft: '', maxDaysLeft: '', minLastAttendance: '' };
            dirPage = 1; renderMembersDashboard();
        };
    }

    // Sort headers
    container.querySelectorAll('th[data-sort]').forEach(th => {
        th.onclick = () => {
            const field = th.getAttribute('data-sort');
            if (dirSort.field === field) dirSort.dir = dirSort.dir === 'asc' ? 'desc' : 'asc';
            else { dirSort.field = field; dirSort.dir = 'asc'; }
            renderMembersDashboard();
        };
    });

    // Paginación
    const prevBtn = container.querySelector('#dir-prev-page');
    const nextBtn = container.querySelector('#dir-next-page');
    const perPageSelect = container.querySelector('#dir-per-page');
    if (prevBtn) prevBtn.onclick = () => { if (dirPage > 1) { dirPage--; renderMembersDashboard(); } };
    if (nextBtn) nextBtn.onclick = () => { dirPage++; renderMembersDashboard(); };
    if (perPageSelect) perPageSelect.onchange = () => { dirPerPage = parseInt(perPageSelect.value); dirPage = 1; renderMembersDashboard(); };

    // Acciones inline
    container.querySelectorAll('.dir-edit-btn').forEach(btn => {
        btn.onclick = () => openMemberModal(btn.getAttribute('data-id'), membersData);
    });
    container.querySelectorAll('.dir-renew-btn').forEach(btn => {
        btn.onclick = () => quickRenew(btn.getAttribute('data-id'));
    });
    container.querySelectorAll('.dir-delete-btn').forEach(btn => {
        btn.onclick = () => deleteMember(btn.getAttribute('data-id'));
    });

    // Exportar
    const exportBtn = container.querySelector('#dir-export-btn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const format = container.querySelector('#dir-export-format')?.value || 'csv';
            exportUserData(filteredList, format);
            window.showToast && window.showToast(`Exportado (${format.toUpperCase()}) ✅`, '#22c55e');
        };
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 3: RETENCIÓN Y RIESGO
// ═════════════════════════════════════════════════════════════════════════════
const renderRetencionView = (container) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const processed = membersData.map(u => processMemberData(u, now, currentMonth, currentYear));

    // Calcular churn score
    const withScore = processed.map(p => {
        let score = 0; // 0-100, mayor = más riesgo
        if (p._status === 'Inactivo') score += 80;
        if (p._status === 'Moroso') score += 60;
        if (p._daysSinceLastAttendance > 30) score += 40;
        else if (p._daysSinceLastAttendance > 14) score += 25;
        else if (p._daysSinceLastAttendance > 7) score += 10;
        if (p._daysLeft !== null && p._daysLeft <= 5 && p._daysLeft > 0) score += 30;
        if (p._monthRes <= 1 && now.getDate() > 15) score += 15;
        if (p._status === 'Congelado') score += 20;
        return { ...p, _churnScore: Math.min(100, score) };
    });

    let filtered = withScore;
    if (riskFilter === 'high') filtered = withScore.filter(p => p._churnScore >= 60);
    else if (riskFilter === 'medium') filtered = withScore.filter(p => p._churnScore >= 30 && p._churnScore < 60);
    else if (riskFilter === 'low') filtered = withScore.filter(p => p._churnScore > 0 && p._churnScore < 30);
    else if (riskFilter === 'inactive') filtered = withScore.filter(p => p._status === 'Inactivo');

    filtered.sort((a, b) => b._churnScore - a._churnScore);

    const counts = { high: 0, medium: 0, low: 0, inactive: 0 };
    withScore.forEach(p => {
        if (p._status === 'Inactivo') counts.inactive++;
        else if (p._churnScore >= 60) counts.high++;
        else if (p._churnScore >= 30) counts.medium++;
        else if (p._churnScore > 0) counts.low++;
    });

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:20px;">
            <div style="display:flex; flex-wrap:wrap; gap:10px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
                <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px;">
                    <span style="font-size:1.2rem; font-weight:900; color:white;">${withScore.length}</span>
                    <span style="font-size:0.8rem; color:var(--text-gray);">socios evaluados</span>
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="risk-filter-btn btn-glass-small ${riskFilter === 'all' ? 'active' : ''}" data-filter="all" style="font-size:0.75rem; ${riskFilter === 'all' ? 'background:rgba(255,255,255,0.1); color:white; border-color:white;' : ''}">
                    Todos
                </button>
                <button class="risk-filter-btn btn-glass-small ${riskFilter === 'high' ? 'active' : ''}" data-filter="high" style="font-size:0.75rem; ${riskFilter === 'high' ? 'background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;' : 'color:#ef4444; border-color:rgba(239,68,68,0.3);'}">
                    🔴 Alto riesgo (${counts.high})
                </button>
                <button class="risk-filter-btn btn-glass-small ${riskFilter === 'medium' ? 'active' : ''}" data-filter="medium" style="font-size:0.75rem; ${riskFilter === 'medium' ? 'background:rgba(251,191,36,0.2); color:#fbbf24; border-color:#fbbf24;' : 'color:#fbbf24; border-color:rgba(251,191,36,0.3);'}">
                    🟡 Medio riesgo (${counts.medium})
                </button>
                <button class="risk-filter-btn btn-glass-small ${riskFilter === 'low' ? 'active' : ''}" data-filter="low" style="font-size:0.75rem; ${riskFilter === 'low' ? 'background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e;' : 'color:#22c55e; border-color:rgba(34,197,94,0.3);'}">
                    🟢 Bajo riesgo (${counts.low})
                </button>
                <button class="risk-filter-btn btn-glass-small ${riskFilter === 'inactive' ? 'active' : ''}" data-filter="inactive" style="font-size:0.75rem; ${riskFilter === 'inactive' ? 'background:rgba(156,163,175,0.2); color:#9ca3af; border-color:#9ca3af;' : 'color:#9ca3af; border-color:rgba(156,163,175,0.3);'}">
                    ⚪ Inactivos (${counts.inactive})
                </button>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
            ${filtered.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem; padding:20px; text-align:center;">No hay socios en esta categoría.</p>'
            : filtered.map(p => {
                const score = p._churnScore;
                const scoreColor = score >= 60 ? '#ef4444' : score >= 30 ? '#fbbf24' : '#22c55e';
                const scoreBg = score >= 60 ? 'rgba(239,68,68,0.15)' : score >= 30 ? 'rgba(251,191,36,0.15)' : 'rgba(34,197,94,0.15)';
                const reasons = [];
                if (p._daysSinceLastAttendance > 14) reasons.push(`Sin asistir ${p._daysSinceLastAttendance} días`);
                if (p._daysLeft !== null && p._daysLeft <= 5 && p._daysLeft > 0) reasons.push(`Vence en ${p._daysLeft} días`);
                if (p._monthRes <= 1 && now.getDate() > 15) reasons.push('Baja frecuencia');
                if (p._status === 'Congelado') reasons.push('Membresía congelada');
                if (p._status === 'Moroso') reasons.push('Membresía vencida');
                if (p._status === 'Inactivo') reasons.push('Inactivo');

                return `
                        <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid ${scoreColor};">
                            <div style="width:44px; height:44px; border-radius:50%; background:${scoreBg}; display:flex; align-items:center; justify-content:center; flex-shrink:0; flex-direction:column;">
                                <span style="font-size:0.7rem; font-weight:800; color:${scoreColor};">${score}</span>
                                <span style="font-size:0.5rem; color:${scoreColor}; opacity:0.7;">Riesgo</span>
                            </div>
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <strong style="font-size:0.9rem;">${p.full_name || 'Sin nombre'}</strong>
                                    <span class="tag" style="background:${p._statusBg}; color:${p._statusColor}; font-size:0.65rem; padding:2px 8px; font-weight:700;">${p._status}</span>
                                    <span class="tag" style="background:rgba(255,255,255,0.05); font-size:0.65rem; padding:2px 8px;">${p.membership_plans?.name || 'Sin plan'}</span>
                                </div>
                                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:2px;">
                                    ${reasons.join(' • ')}
                                </span>
                            </div>
                            <div style="flex-shrink:0; display:flex; gap:6px;">
                                <button class="risk-action-edit btn-glass-small" data-id="${p.id}" style="font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>
                                ${p._status !== 'Inactivo' ? `<button class="risk-action-register btn-glass-small" data-uid="${p.id}" style="border-color:var(--accent-purple); color:var(--accent-purple); font-size:0.7rem;"><i data-lucide="dollar-sign" style="width:12px;"></i></button>` : ''}
                            </div>
                        </div>
                    `;
            }).join('')}
        </div>
    `;

    window.lucide && window.lucide.createIcons();

    container.querySelectorAll('.risk-filter-btn').forEach(btn => {
        btn.onclick = () => {
            riskFilter = btn.getAttribute('data-filter');
            renderMembersDashboard();
        };
    });

    container.querySelectorAll('.risk-action-edit').forEach(btn => {
        btn.onclick = () => openMemberModal(btn.getAttribute('data-id'), membersData);
    });
    container.querySelectorAll('.risk-action-register').forEach(btn => {
        btn.onclick = () => openQuickPaymentModal(btn.getAttribute('data-uid'));
    });
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 4: COMUNICACIONES
// ═════════════════════════════════════════════════════════════════════════════
const renderComunicacionesView = (container) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const processed = membersData.map(u => processMemberData(u, now, currentMonth, currentYear));

    let filtered = processed;
    if (commFilterStatus !== 'all') {
        filtered = processed.filter(p => {
            if (commFilterStatus === 'active') return p._status === 'Activo';
            if (commFilterStatus === 'inactive') return p._status === 'Inactivo';
            if (commFilterStatus === 'moroso') return p._status === 'Moroso';
            if (commFilterStatus === 'expiring') return p._status === 'Activo' && p._daysLeft !== null && p._daysLeft > 0 && p._daysLeft <= 7;
            if (commFilterStatus === 'noAttendance') return p._status === 'Activo' && p._daysSinceLastAttendance > 14;
            return true;
        });
    }

    const uniquePlans = [...new Set(membersData.map(u => u.membership_plans?.name).filter(Boolean))];

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div>
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">🎯 Segmento</h4>
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
                    <button class="comm-segment-btn btn-glass ${commFilterStatus === 'all' ? 'active' : ''}" data-segment="all" style="text-align:left; ${commFilterStatus === 'all' ? 'background:var(--accent-purple); color:white; border-color:var(--accent-purple);' : ''}">
                        <strong>Todos los socios</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${processed.length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${commFilterStatus === 'active' ? 'active' : ''}" data-segment="active" style="text-align:left; ${commFilterStatus === 'active' ? 'background:#22c55e; color:white; border-color:#22c55e;' : ''}">
                        <strong>Socios Activos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${processed.filter(p => p._status === 'Activo').length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${commFilterStatus === 'moroso' ? 'active' : ''}" data-segment="moroso" style="text-align:left; ${commFilterStatus === 'moroso' ? 'background:#f97316; color:white; border-color:#f97316;' : ''}">
                        <strong>Socios Morosos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${processed.filter(p => p._status === 'Moroso').length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${commFilterStatus === 'expiring' ? 'active' : ''}" data-segment="expiring" style="text-align:left; ${commFilterStatus === 'expiring' ? 'background:#fbbf24; color:white; border-color:#fbbf24;' : ''}">
                        <strong>Por vencer esta semana</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${processed.filter(p => p._status === 'Activo' && p._daysLeft !== null && p._daysLeft > 0 && p._daysLeft <= 7).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${commFilterStatus === 'noAttendance' ? 'active' : ''}" data-segment="noAttendance" style="text-align:left; ${commFilterStatus === 'noAttendance' ? 'background:#ef4444; color:white; border-color:#ef4444;' : ''}">
                        <strong>Sin asistir >14 días</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${processed.filter(p => p._status === 'Activo' && p._daysSinceLastAttendance > 14).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${commFilterStatus === 'inactive' ? 'active' : ''}" data-segment="inactive" style="text-align:left; ${commFilterStatus === 'inactive' ? 'background:#9ca3af; color:white; border-color:#9ca3af;' : ''}">
                        <strong>Socios Inactivos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${processed.filter(p => p._status === 'Inactivo').length} contactos</span>
                    </button>
                </div>

                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">📝 Mensaje</h4>
                <select id="comm-template" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:10px; border-radius:8px; font-size:0.8rem; margin-bottom:10px; outline:none;">
                    <option value="">Escribir mensaje personalizado...</option>
                    <option value="payment_reminder">📌 Recordatorio de pago</option>
                    <option value="expiry_reminder">⏰ Membresía por vencer</option>
                    <option value="comeback">💪 Te extrañamos en el gimnasio</option>
                    <option value="promo">🎉 Promoción especial</option>
                    <option value="class_cancel">🚫 Clase cancelada</option>
                </select>
                <textarea id="comm-message" rows="6" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:12px; border-radius:8px; font-size:0.85rem; outline:none; resize:vertical;" placeholder="Escribe tu mensaje aquí..."></textarea>

                <div style="margin-top:12px; margin-bottom:8px;">
                    <label style="font-size:0.75rem; font-weight:700; color:var(--text-gray); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">Canal de envío</label>
                    <div style="display:flex; gap:8px;">
                        <label style="flex:1; display:flex; align-items:center; gap:6px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-size:0.8rem;" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.channel-label').forEach(l=>l.style.borderColor='rgba(255,255,255,0.08)'); this.style.borderColor='var(--accent-purple)';">
                            <input type="radio" name="comm-channel" value="inapp" checked style="accent-color:var(--accent-purple);">
                            <span>📱 In-App</span>
                        </label>
                        <label style="flex:1; display:flex; align-items:center; gap:6px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-size:0.8rem;" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.channel-label').forEach(l=>l.style.borderColor='rgba(255,255,255,0.08)'); this.style.borderColor='var(--accent-purple)';">
                            <input type="radio" name="comm-channel" value="email" style="accent-color:var(--accent-purple);">
                            <span>✉️ Email</span>
                        </label>
                        <label style="flex:1; display:flex; align-items:center; gap:6px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-size:0.8rem;" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.channel-label').forEach(l=>l.style.borderColor='rgba(255,255,255,0.08)'); this.style.borderColor='var(--accent-purple)';">
                            <input type="radio" name="comm-channel" value="both" style="accent-color:var(--accent-purple);">
                            <span>🔄 Ambos</span>
                        </label>
                    </div>
                </div>

                <button id="btn-send-comm" class="btn-primary w-full mt-10" style="padding:12px;">
                    <i data-lucide="send" style="width:16px; vertical-align:middle; margin-right:6px;"></i> Enviar a ${filtered.length} socios
                </button>
            </div>

            <div>
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">📋 Vista previa de destinatarios</h4>
                <div style="max-height:500px; overflow-y:auto; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px;">
                    ${filtered.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem; text-align:center; padding:20px;">Selecciona un segmento para ver destinatarios.</p>'
            : filtered.slice(0, 50).map(p => `
                            <div style="display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid rgba(255,255,255,0.03);">
                                <img src="${p.photo_url || (typeof unknowAvatar !== 'undefined' ? unknowAvatar : '/app/images/icon-192.png')}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
                                <div style="flex:1; min-width:0;">
                                    <span style="font-size:0.8rem; font-weight:600;">${p.full_name || 'Sin nombre'}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">
                                        ${p.email && !p.email.includes('@amaru.local') ? p.email : '<span style="color:#fbbf24;">📵 Sin tecnología</span>'}
                                    </span>
                                </div>
                                <span class="tag" style="background:${p._statusBg}; color:${p._statusColor}; font-size:0.6rem; padding:1px 6px;">${p._status}</span>
                            </div>
                        `).join('')}
                    ${filtered.length > 50 ? `<p style="text-align:center; font-size:0.75rem; color:var(--text-gray); padding:10px;">...y ${filtered.length - 50} más</p>` : ''}
                </div>
            </div>
        </div>
    `;

    window.lucide && window.lucide.createIcons();

    // Segment buttons
    container.querySelectorAll('.comm-segment-btn').forEach(btn => {
        btn.onclick = () => {
            commFilterStatus = btn.getAttribute('data-segment');
            renderMembersDashboard();
        };
    });

    // Template selector
    const templateSelect = container.querySelector('#comm-template');
    const messageArea = container.querySelector('#comm-message');
    const templates = {
        payment_reminder: 'Hola {nombre},\n\nTe recordamos que tu membresía está pendiente de pago. Mantén tu entrenamiento al día y no pierdas tu progreso.\n\n¿Tienes dudas? Escríbenos.\n\nEquipo Amaru 🥋',
        expiry_reminder: 'Hola {nombre},\n\nTu membresía vence pronto. Renueva ahora para seguir entrenando sin interrupciones.\n\nEquipo Amaru 🥋',
        comeback: 'Hola {nombre},\n\nTe extrañamos en el dojo. ¿Todo bien? Tu progreso te está esperando. Ven a retomar tu entrenamiento esta semana.\n\nEquipo Amaru 🥋',
        promo: 'Hola {nombre},\n\n¡Tenemos una promoción especial para ti! Aprovecha descuentos exclusivos en tu próxima renovación.\n\nConsulta en recepción o responde este mensaje.\n\nEquipo Amaru 🥋',
        class_cancel: 'Hola {nombre},\n\nTe informamos que la clase de hoy ha sido cancelada. Disculpa las molestias.\n\nConsulta el horario actualizado en la app.\n\nEquipo Amaru 🥋'
    };

    if (templateSelect && messageArea) {
        templateSelect.onchange = () => {
            const tpl = templates[templateSelect.value];
            if (tpl) messageArea.value = tpl;
        };
    }

    // Send button
    const sendBtn = container.querySelector('#btn-send-comm');
    if (sendBtn) {
        sendBtn.onclick = async () => {
            if (!window.SupabaseService) {
                console.error('[Comunications] SupabaseService not available');
                window.showToast('El servicio de comunicaciones no está disponible. Recarga la página.', '#ef4444');
                return;
            }

            const msg = messageArea?.value?.trim();
            if (!msg) {
                window.showToast('Escribe un mensaje antes de enviar', '#ef4444');
                return;
            }
            const channel = container.querySelector('input[name="comm-channel"]:checked')?.value || 'inapp';
            const title = templateSelect?.value
                ? templateSelect.options[templateSelect.selectedIndex].text
                : 'Mensaje del equipo Amaru';

            const emails = [];
            const hasEmailChannel = channel === 'email' || channel === 'both';

            // Preparar emails (excluir socios sin tecnología — emails @amaru.local)
            if (hasEmailChannel) {
                filtered.forEach(user => {
                    if (user.email && user.email.includes('@') && !user.email.includes('@amaru.local')) {
                        emails.push(user.email);
                    }
                });
            }

            try {
                window.showToast(`Enviando a ${filtered.length} socios vía ${channel}...`, '#f59e0b');
                let sentInApp = 0;
                let sentEmail = 0;

                // In-App
                if (channel === 'inapp' || channel === 'both') {
                    const userIds = filtered.map(u => u.id);
                    // If no personalization is needed, we can send one message to all.
                    // But here we support {nombre}, so we build individual messages but send in one batch.
                    const notifications = filtered.map(user => ({
                        user_id: user.id,
                        title: title,
                        message: msg.replace(/{nombre}/g, user.full_name || 'Atleta'),
                        type: 'mass',
                        sender_id: window.appState?.user?.uid || null
                    }));

                    try {
                        const { error } = await window.supabase
                            .from('user_notifications')
                            .insert(notifications);
                        
                        if (error) throw error;
                        sentInApp = filtered.length;
                    } catch (e) {
                        console.error('[Comunicaciones] Fallo masivo In-App:', e);
                        // Fallback to individual if batch fails (optional, but RLS should be fixed now)
                    }
                }

                // Email
                if (hasEmailChannel && emails.length > 0) {
                    try {
                        const result = await window.SupabaseService.sendBulkEmail(
                            emails, title, msg.replace(/{nombre}/g, 'Atleta'), null
                        );
                        sentEmail = result?.totalSent || 0;
                        if (result?.totalFailed > 0) {
                            console.warn('[Comunicaciones] Emails fallados:', result.failed);
                        }
                    } catch (emailErr) {
                        console.error('[Comunicaciones] Error enviando emails:', emailErr);
                    }
                }

                let statusMsg = '';
                if (channel === 'both') {
                    statusMsg = `${sentInApp} In-App + ${sentEmail} Email ✅`;
                } else if (channel === 'email') {
                    statusMsg = `${sentEmail} emails enviados ✅`;
                } else {
                    statusMsg = `${sentInApp} notificaciones enviadas ✅`;
                }
                window.showToast(statusMsg, '#22c55e');
                messageArea.value = '';
            } catch (err) {
                console.error('[Comunicaciones] Error enviando:', err);
                window.showToast('Error al enviar notificaciones. Intenta de nuevo.', '#ef4444');
            }
        };
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// UTILIDADES COMPARTIDAS
// ═════════════════════════════════════════════════════════════════════════════
const processMemberData = (u, now, currentMonth, currentYear) => {
    const expiryDate = u.membership_expiry ? new Date(u.membership_expiry) : null;
    const diffTime = expiryDate ? expiryDate - now : null;
    const daysLeft = expiryDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

    const userRes = allReservations.filter(r => r.user_id === u.id);
    userRes.sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date));
    const lastAttendance = userRes.length > 0 ? new Date(userRes[0].reservation_date) : null;
    const daysSinceLastAttendance = lastAttendance ? Math.floor((now - lastAttendance) / (1000 * 60 * 60 * 24)) : -1;
    const monthRes = userRes.filter(r => {
        const rDate = new Date(r.reservation_date);
        return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
    }).length;

    let status = 'Activo';
    let statusColor = '#22c55e';
    let statusBg = 'rgba(34, 197, 94, 0.15)';

    if (u.is_frozen) {
        status = 'Congelado'; statusColor = '#3b82f6'; statusBg = 'rgba(59, 130, 246, 0.15)';
    } else if (u.membership_status === 'inactive') {
        status = 'Inactivo'; statusColor = '#ef4444'; statusBg = 'rgba(239, 68, 68, 0.15)';
    } else if (daysLeft !== null && daysLeft <= 0) {
        if (daysLeft > -30) { status = 'Moroso'; statusColor = '#f97316'; statusBg = 'rgba(249, 115, 22, 0.15)'; }
        else { status = 'Inactivo'; statusColor = '#ef4444'; statusBg = 'rgba(239, 68, 68, 0.15)'; }
    } else if (daysLeft === null && u.membership_status !== 'active') {
        status = 'Inactivo'; statusColor = '#ef4444'; statusBg = 'rgba(239, 68, 68, 0.15)';
    }

    return {
        ...u,
        _status: status,
        _statusColor: statusColor,
        _statusBg: statusBg,
        _expiryDate: expiryDate,
        _daysLeft: daysLeft,
        _lastAttendance: lastAttendance,
        _daysSinceLastAttendance: daysSinceLastAttendance,
        _monthRes: monthRes,
        _totalRes: userRes.length
    };
};

const quickRenew = async (uid) => {
    const user = membersData.find(u => u.id === uid);
    if (!user || !user.membership_plan_id) {
        window.showToast('El socio no tiene un plan asignado para renovar.', '#ef4444');
        return;
    }
    if (!confirm(`¿Renovar el plan de ${user.full_name} por 1 mes más?`)) return;
    try {
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + 1);
        await window.supabase.from('profiles').update({
            membership_expiry: newExpiry.toISOString(),
            membership_status: 'active',
            is_frozen: false
        }).eq('id', uid);
        window.showToast('Plan renovado exitosamente ✅', '#22c55e');
        renderAdminMembers();
    } catch (err) {
        console.error(err);
        window.showToast('Error al renovar plan.', '#ef4444');
    }
};
