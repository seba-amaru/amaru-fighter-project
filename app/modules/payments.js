// app/modules/payments.js
// Módulo de Control de Pagos — Panel Administrativo v2.0
// 3 vistas: Resumen, Transacciones, Cobranza del Mes

import { exportToFormat } from '../utils/exportUtils.js';
import { handlePaymentAction } from './adminModals.js';

/* global Chart */

// ─── Estado local ───────────────────────────────────────────────────────────
let paymentsData = [];
let profilesData = [];
let plansData = [];
let currentView = 'resumen'; // 'resumen' | 'transacciones' | 'cobranza'
let txFilter = { search: '', status: ['pending', 'approved', 'rejected'], dateFrom: '', dateTo: '', method: '', minAmount: '', maxAmount: '' };
let txSort = { field: 'created_at', dir: 'desc' };
let txPage = 1;
let txPerPage = 25;
let coverageFilter = 'all'; // 'all' | 'ok' | 'warning' | 'overdue' | 'none'

const getAdminContent = () => document.getElementById('admin-content-area');

// ─── Utilidades ─────────────────────────────────────────────────────────────
const formatCurrency = (n) => {
    if (n === undefined || n === null) return '$0';
    return '$' + Math.round(n).toLocaleString('es-CL');
};

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

const parseCoverageMonth = (str) => {
    if (!str) return null;
    const names = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const lower = str.toLowerCase();
    const monthIdx = names.findIndex(n => lower.includes(n));
    const yearMatch = str.match(/(\d{4})/);
    if (monthIdx === -1 || !yearMatch) return null;
    return { month: monthIdx, year: parseInt(yearMatch[1]) };
};

// ─── Fetch unificado ────────────────────────────────────────────────────────
const fetchAllPaymentsData = async () => {
    try {
        const { data: payments, error: pErr } = await window.supabase
            .from('payments')
            .select('*, profiles(full_name, email, role, membership_status, membership_expiry, membership_plan_id)')
            .order('created_at', { ascending: false });
        if (pErr) throw pErr;

        const { data: profiles, error: prErr } = await window.supabase
            .from('profiles')
            .select('*');
        if (prErr) throw prErr;

        const { data: plans, error: plErr } = await window.supabase
            .from('membership_plans')
            .select('*');
        if (plErr) throw plErr;

        paymentsData = payments || [];
        profilesData = profiles || [];
        plansData = plans || [];
    } catch (err) {
        console.error('[Payments] Error fetching data:', err);
        window.showToast && window.showToast('Error cargando datos de pagos', '#ef4444');
    }
};

// ─── Entry point (compatible con admin.js) ──────────────────────────────────
export const renderAdminPayments = async () => {
    const adminContent = getAdminContent();
    const revSection = document.getElementById('admin-revenue-section');
    if (revSection) revSection.classList.add('hidden');

    adminContent.innerHTML = `
        <div class="glass-premium p-20">
            <div class="p-20 text-center">
                <i data-lucide="loader" class="spin"></i>
                <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">Cargando control de pagos...</p>
            </div>
        </div>`;
    window.lucide && window.lucide.createIcons();

    await fetchAllPaymentsData();
    renderPaymentsDashboard();
};

// ─── Dashboard principal con tabs ───────────────────────────────────────────
const renderPaymentsDashboard = () => {
    const adminContent = getAdminContent();
    if (!adminContent) return;

    adminContent.innerHTML = `
        <div class="glass-premium p-20" id="payments-dashboard">
            <div class="header-split mb-20" style="align-items:flex-start;">
                <div>
                    <h3 style="font-size:1.3rem; margin-bottom:4px;">💰 Control de Pagos</h3>
                    <p class="subtitle">Gestión diaria de ingresos, transacciones y cobranza</p>
                </div>
                <a href="#" id="link-revenue-advanced" style="font-size:0.75rem; color:var(--accent-purple); text-decoration:none; display:flex; align-items:center; gap:4px;">
                    <i data-lucide="bar-chart-2" style="width:14px;"></i> Ver análisis avanzado →
                </a>
            </div>

            <!-- Tabs -->
            <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; flex-wrap:wrap;">
                <button id="tab-resumen" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'resumen' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="layout-dashboard" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Resumen
                </button>
                <button id="tab-transacciones" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'transacciones' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="list" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Transacciones
                </button>
                <button id="tab-cobranza" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${currentView === 'cobranza' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                    <i data-lucide="zap" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Cobranza del Mes
                </button>
            </div>

            <!-- Content area -->
            <div id="payments-view-content"></div>
        </div>
    `;

    window.lucide && window.lucide.createIcons();

    // Tab listeners
    document.getElementById('tab-resumen').onclick = () => { currentView = 'resumen'; renderPaymentsDashboard(); };
    document.getElementById('tab-transacciones').onclick = () => { currentView = 'transacciones'; renderPaymentsDashboard(); };
    document.getElementById('tab-cobranza').onclick = () => { currentView = 'cobranza'; renderPaymentsDashboard(); };

    // Link to revenue
    const revLink = document.getElementById('link-revenue-advanced');
    if (revLink) {
        revLink.onclick = (e) => {
            e.preventDefault();
            import('./revenue.js').then(m => {
                if (m.renderRevenueSection) m.renderRevenueSection();
            });
        };
    }

    // Render active view
    const contentArea = document.getElementById('payments-view-content');
    if (currentView === 'resumen') renderResumenView(contentArea);
    else if (currentView === 'transacciones') renderTransaccionesView(contentArea);
    else renderCobranzaView(contentArea);
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 1: RESUMEN
// ═════════════════════════════════════════════════════════════════════════════
const renderResumenView = (container) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Métricas mes actual
    const monthPayments = paymentsData.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth && p.status === 'approved';
    });
    const monthTotal = monthPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    const monthCount = monthPayments.length;
    const avgTicket = monthCount > 0 ? monthTotal / monthCount : 0;

    // Mes anterior para comparación
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevPayments = paymentsData.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === prevYear && d.getMonth() === prevMonth && p.status === 'approved';
    });
    const prevTotal = prevPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    const growth = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : (monthTotal > 0 ? 100 : 0);

    // Pendientes
    const pendingPayments = paymentsData.filter(p => p.status === 'pending');
    const pendingTotal = pendingPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);

    // Cobertura del mes
    const activeProfiles = profilesData.filter(p => p.membership_status === 'active');
    const activeCount = activeProfiles.length;
    const coveredCount = activeProfiles.filter(prof => {
        const lastPayment = paymentsData
            .filter(pay => pay.user_id === prof.id && pay.status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        if (!lastPayment) return false;
        const cov = parseCoverageMonth(lastPayment.coverage_month);
        if (!cov) return false;
        return cov.month === currentMonth && cov.year === currentYear;
    }).length;
    const coveragePct = activeCount > 0 ? ((coveredCount / activeCount) * 100).toFixed(0) : 0;

    // Acciones requeridas
    const recentPending = pendingPayments
        .filter(p => {
            const daysAgo = (now - new Date(p.created_at)) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
        })
        .slice(0, 5);

    const expiringSoon = activeProfiles.filter(prof => {
        if (!prof.membership_expiry) return false;
        const daysLeft = Math.ceil((new Date(prof.membership_expiry) - now) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 5;
    }).slice(0, 5);

    // Datos para gráfico últimos 7 días
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayPayments = paymentsData.filter(p => {
            return p.created_at && p.created_at.startsWith(dayStr) && p.status === 'approved';
        });
        last7Days.push({
            label: d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
            total: dayPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0),
            count: dayPayments.length
        });
    }

    container.innerHTML = `
        <!-- KPIs -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:25px;">
            <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ingresos ${getMonthName(currentMonth)}</span>
                <strong style="font-size:1.5rem; color:var(--accent-purple); font-weight:900;">${formatCurrency(monthTotal)}</strong>
                <span style="font-size:0.75rem; color:${growth >= 0 ? '#22c55e' : '#ef4444'}; display:block; margin-top:4px;">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs mes ant.</span>
            </div>
            <div class="stat-mini-premium ${pendingPayments.length > 0 ? 'pulse-warning' : ''}" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Pendientes por Aprobar</span>
                <strong style="font-size:1.5rem; color:#fbbf24; font-weight:900;">${pendingPayments.length}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${formatCurrency(pendingTotal)}</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Cobertura del Mes</span>
                <strong style="font-size:1.5rem; color:#22c55e; font-weight:900;">${coveredCount}/${activeCount}</strong>
                <div style="width:80%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; margin:6px auto 0;">
                    <div style="width:${coveragePct}%; height:100%; background:#22c55e; border-radius:3px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${coveragePct}% al día</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ticket Promedio</span>
                <strong style="font-size:1.5rem; color:#3b82f6; font-weight:900;">${formatCurrency(avgTicket)}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${monthCount} pagos</span>
            </div>
        </div>

        <!-- Gráfico últimos 7 días -->
        <div style="margin-bottom:25px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h4 style="font-size:0.9rem; font-weight:700;">📈 Ingresos últimos 7 días</h4>
            </div>
            <div class="chart-container" style="min-height:200px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:15px;">
                <canvas id="resumenChart"></canvas>
            </div>
        </div>

        <!-- Acciones requeridas -->
        <div style="margin-bottom:20px;">
            <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-circle" style="width:16px; color:#fbbf24;"></i> Acciones Requeridas
            </h4>
            ${recentPending.length === 0 && expiringSoon.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem; padding:15px;">🎉 No hay acciones pendientes. Todo está al día.</p>'
            : `<div style="display:flex; flex-direction:column; gap:8px;">
                    ${recentPending.map(p => {
                const name = p.profiles?.full_name || p.user_name || 'Usuario';
                const amount = formatCurrency(parseFloat(p.amount) || 0);
                const daysAgo = Math.floor((now - new Date(p.created_at)) / (1000 * 60 * 60 * 24));
                return `
                            <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:rgba(251,191,36,0.05); border-radius:10px; border:1px solid rgba(251,191,36,0.15);">
                                <div style="width:36px; height:36px; border-radius:50%; background:rgba(251,191,36,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="clock" style="width:16px; color:#fbbf24;"></i>
                                </div>
                                <div style="flex:1;">
                                    <strong style="font-size:0.9rem;">${name}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Pago pendiente ${amount} — hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}</span>
                                </div>
                                <button class="btn-quick-approve btn-glass-small" data-id="${p.id}" style="border-color:#22c55e; color:#22c55e;"><i data-lucide="check" style="width:14px;"></i> Aprobar</button>
                            </div>
                        `;
            }).join('')}
                    ${expiringSoon.map(prof => {
                const daysLeft = Math.ceil((new Date(prof.membership_expiry) - now) / (1000 * 60 * 60 * 24));
                const plan = plansData.find(pl => pl.id === prof.membership_plan_id);
                return `
                            <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:rgba(239,68,68,0.05); border-radius:10px; border:1px solid rgba(239,68,68,0.15);">
                                <div style="width:36px; height:36px; border-radius:50%; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="alert-triangle" style="width:16px; color:#ef4444;"></i>
                                </div>
                                <div style="flex:1;">
                                    <strong style="font-size:0.9rem;">${prof.full_name || 'Sin nombre'}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''} — ${plan?.name || 'Sin plan'}</span>
                                </div>
                                <button class="btn-quick-register btn-glass-small" data-uid="${prof.id}" style="border-color:var(--accent-purple); color:var(--accent-purple);"><i data-lucide="dollar-sign" style="width:14px;"></i> Registrar</button>
                            </div>
                        `;
            }).join('')}
                </div>`
        }
        </div>
    `;

    window.lucide && window.lucide.createIcons();
    renderResumenChart(last7Days);

    // Listeners
    container.querySelectorAll('.btn-quick-approve').forEach(btn => {
        btn.onclick = () => handlePaymentAction(btn.getAttribute('data-id'), 'approved');
    });
    container.querySelectorAll('.btn-quick-register').forEach(btn => {
        btn.onclick = () => openQuickPaymentModal(btn.getAttribute('data-uid'));
    });
};

const renderResumenChart = (data) => {
    const ctx = document.getElementById('resumenChart');
    if (!ctx) return;
    if (window._resumenChart) window._resumenChart.destroy();

    window._resumenChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Ingresos ($)',
                data: data.map(d => d.total),
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(13,13,18,0.95)',
                    callbacks: { label: (ctx) => ` Ingresos: ${formatCurrency(ctx.raw)}` }
                }
            },
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
            }
        }
    });
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 2: TRANSACCIONES
// ═════════════════════════════════════════════════════════════════════════════
const renderTransaccionesView = (container) => {
    // Aplicar filtros
    let filtered = paymentsData.filter(p => {
        if (!txFilter.status.includes(p.status)) return false;
        if (txFilter.method && p.payment_method !== txFilter.method) return false;
        if (txFilter.dateFrom && p.created_at < txFilter.dateFrom + 'T00:00:00') return false;
        if (txFilter.dateTo && p.created_at > txFilter.dateTo + 'T23:59:59') return false;
        if (txFilter.minAmount && (parseFloat(p.amount) || 0) < parseFloat(txFilter.minAmount)) return false;
        if (txFilter.maxAmount && (parseFloat(p.amount) || 0) > parseFloat(txFilter.maxAmount)) return false;
        if (txFilter.search) {
            const term = txFilter.search.toLowerCase();
            const name = (p.profiles?.full_name || p.user_name || '').toLowerCase();
            const email = (p.profiles?.email || '').toLowerCase();
            const concept = (p.concept || p.plan_name || '').toLowerCase();
            return name.includes(term) || email.includes(term) || concept.includes(term);
        }
        return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
        let valA, valB;
        switch (txSort.field) {
            case 'amount': valA = parseFloat(a.amount) || 0; valB = parseFloat(b.amount) || 0; break;
            case 'name': valA = a.profiles?.full_name || ''; valB = b.profiles?.full_name || ''; break;
            case 'status': valA = a.status; valB = b.status; break;
            default: valA = new Date(a.created_at); valB = new Date(b.created_at);
        }
        if (txSort.dir === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });

    const totalFiltered = filtered.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    const totalPages = Math.max(1, Math.ceil(filtered.length / txPerPage));
    txPage = Math.min(txPage, totalPages);
    const startIdx = (txPage - 1) * txPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + txPerPage);

    const statusOptions = [
        { val: 'pending', label: 'Pendiente', color: '#fbbf24' },
        { val: 'approved', label: 'Aprobado', color: '#22c55e' },
        { val: 'rejected', label: 'Rechazado', color: '#ef4444' }
    ];

    container.innerHTML = `
        <!-- Filtros -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <input type="text" id="tx-search" placeholder="🔍 Buscar alumno, email o concepto..." value="${txFilter.search}" style="flex:1; min-width:180px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 12px; border-radius:8px; font-size:0.8rem; outline:none;">

            <select id="tx-date-preset" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="lastmonth">Mes pasado</option>
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                ${statusOptions.map(opt => `
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.7rem; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; border:1px solid ${txFilter.status.includes(opt.val) ? opt.color : 'rgba(255,255,255,0.1)'};">
                        <input type="checkbox" class="tx-status-check" value="${opt.val}" ${txFilter.status.includes(opt.val) ? 'checked' : ''} style="accent-color:${opt.color};">
                        <span style="color:${txFilter.status.includes(opt.val) ? opt.color : 'var(--text-gray)'};">${opt.label}</span>
                    </label>
                `).join('')}
            </div>

            <select id="tx-method" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todos los métodos</option>
                <option value="transferencia" ${txFilter.method === 'transferencia' ? 'selected' : ''}>Transferencia Bancaria</option>
                <option value="pasarela" ${txFilter.method === 'pasarela' ? 'selected' : ''}>Pasarela de Pago</option>
                <option value="efectivo" ${txFilter.method === 'efectivo' ? 'selected' : ''}>Efectivo</option>
                <option value="mercadopago" ${txFilter.method === 'mercadopago' ? 'selected' : ''}>Mercado Pago</option>
                <option value="webpay" ${txFilter.method === 'webpay' ? 'selected' : ''}>Webpay</option>
                <option value="manual" ${txFilter.method === 'manual' ? 'selected' : ''}>Transferencia/Manual (legado)</option>
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="tx-min" placeholder="Min $" value="${txFilter.minAmount}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <span style="opacity:0.5; font-size:0.75rem;">-</span>
                <input type="number" id="tx-max" placeholder="Max $" value="${txFilter.maxAmount}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
            </div>

            <button id="tx-clear-filters" class="btn-glass-small" style="font-size:0.7rem;"><i data-lucide="x" style="width:12px;"></i> Limpiar</button>
        </div>

        <!-- Totales -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.8rem; color:var(--text-gray);">Mostrando <strong style="color:white;">${filtered.length}</strong> transacciones | Total filtrado: <strong style="color:var(--accent-purple);">${formatCurrency(totalFiltered)}</strong></span>
            <div style="display:flex; gap:8px; align-items:center;">
                <select id="tx-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="csv">CSV</option>
                    <option value="xls">XLS</option>
                    <option value="pdf">PDF</option>
                </select>
                <button id="tx-export-btn" class="btn-primary" style="padding:6px 14px; font-size:0.75rem; border-radius:8px;"><i data-lucide="download" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Exportar</button>
            </div>
        </div>

        <!-- Tabla -->
        <div style="overflow-x:auto; border:1px solid rgba(255,255,255,0.06); border-radius:12px; margin-bottom:15px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="created_at">Fecha ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="name">Alumno ↕</th>
                        <th style="padding:10px 12px; text-align:left;">Concepto</th>
                        <th style="padding:10px 12px; text-align:right; cursor:pointer; white-space:nowrap;" data-sort="amount">Monto ↕</th>
                        <th style="padding:10px 12px; text-align:left;">Método</th>
                        <th style="padding:10px 12px; text-align:center; cursor:pointer; white-space:nowrap;" data-sort="status">Estado ↕</th>
                        <th style="padding:10px 12px; text-align:left;">Cobertura</th>
                        <th style="padding:10px 12px; text-align:right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageItems.length === 0
            ? `<tr><td colspan="8" style="padding:30px; text-align:center; opacity:0.5;">No hay transacciones que coincidan con los filtros.</td></tr>`
            : pageItems.map(p => {
                const name = p.profiles?.full_name || p.user_name || 'N/A';
                const email = p.profiles?.email || '';
                const concept = p.concept || p.plan_name || 'Membresía';
                const amount = parseFloat(p.amount) || 0;
                const method = p.payment_method || 'manual';
                const methodLabels = {
                    transferencia: 'Transferencia Bancaria',
                    pasarela: 'Pasarela de Pago',
                    efectivo: 'Efectivo',
                    mercadopago: 'Mercado Pago',
                    webpay: 'Webpay',
                    manual: 'Transferencia/Manual'
                };
                const methodLabel = methodLabels[method] || method;
                const statusColor = p.status === 'approved' ? '#22c55e' : p.status === 'pending' ? '#fbbf24' : '#ef4444';
                const statusLabel = p.status === 'approved' ? 'Aprobado' : p.status === 'pending' ? 'Pendiente' : 'Rechazado';
                const statusBg = p.status === 'approved' ? 'rgba(34,197,94,0.15)' : p.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)';
                return `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                <td style="padding:10px 12px; white-space:nowrap;">${formatDateShort(p.created_at)}</td>
                                <td style="padding:10px 12px;">
                                    <strong>${name}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${email}</span>
                                </td>
                                <td style="padding:10px 12px;">${concept}</td>
                                <td style="padding:10px 12px; text-align:right; font-weight:700;">${formatCurrency(amount)}</td>
                                <td style="padding:10px 12px;"><span style="font-size:0.7rem; opacity:0.7;">${methodLabel}</span></td>
                                <td style="padding:10px 12px; text-align:center;">
                                    <span style="font-size:0.7rem; background:${statusBg}; color:${statusColor}; padding:3px 10px; border-radius:20px; font-weight:700;">${statusLabel}</span>
                                </td>
                                <td style="padding:10px 12px; font-size:0.75rem; color:var(--text-gray);">${p.coverage_month || '—'}</td>
                                <td style="padding:10px 12px; text-align:right; white-space:nowrap;">
                                    ${p.status === 'pending'
                        ? `<button class="tx-approve-btn btn-glass-small" data-id="${p.id}" style="border-color:#22c55e; color:#22c55e; padding:3px 8px; font-size:0.7rem;"><i data-lucide="check" style="width:12px;"></i></button>
                                       <button class="tx-edit-btn btn-glass-small" data-id="${p.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>`
                        : `<button class="tx-revert-btn btn-glass-small" data-id="${p.id}" style="border-color:#fbbf24; color:#fbbf24; padding:3px 8px; font-size:0.7rem;"><i data-lucide="rotate-ccw" style="width:12px;"></i></button>`}
                                    <button class="tx-delete-btn btn-glass-small delete" data-id="${p.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="trash-2" style="width:12px;"></i></button>
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
                <select id="tx-per-page" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="25" ${txPerPage === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${txPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${txPerPage === 100 ? 'selected' : ''}>100</option>
                </select>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button id="tx-prev-page" class="btn-glass-small" ${txPage <= 1 ? 'disabled style="opacity:0.3;"' : ''} style="font-size:0.75rem;"><i data-lucide="chevron-left" style="width:14px;"></i></button>
                <span style="font-size:0.8rem;">Página <strong>${txPage}</strong> de ${totalPages}</span>
                <button id="tx-next-page" class="btn-glass-small" ${txPage >= totalPages ? 'disabled style="opacity:0.3;"' : ''} style="font-size:0.75rem;"><i data-lucide="chevron-right" style="width:14px;"></i></button>
            </div>
        </div>
    `;

    window.lucide && window.lucide.createIcons();
    attachTransaccionesListeners(container, filtered);
};

const attachTransaccionesListeners = (container, filteredList) => {
    // Búsqueda
    const searchInput = container.querySelector('#tx-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { txFilter.search = searchInput.value; txPage = 1; renderPaymentsDashboard(); }, 300);
        };
    }

    // Preset fechas
    const datePreset = container.querySelector('#tx-date-preset');
    if (datePreset) {
        datePreset.onchange = () => {
            const now = new Date();
            const preset = datePreset.value;
            txFilter.dateFrom = ''; txFilter.dateTo = '';
            if (preset === 'today') { txFilter.dateFrom = todayStr(); txFilter.dateTo = todayStr(); }
            else if (preset === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); txFilter.dateFrom = d.toISOString().split('T')[0]; txFilter.dateTo = todayStr(); }
            else if (preset === 'month') { txFilter.dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`; txFilter.dateTo = todayStr(); }
            else if (preset === 'lastmonth') { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); txFilter.dateFrom = d.toISOString().split('T')[0]; const e = new Date(now.getFullYear(), now.getMonth(), 0); txFilter.dateTo = e.toISOString().split('T')[0]; }
            txPage = 1; renderPaymentsDashboard();
        };
    }

    // Status checkboxes
    container.querySelectorAll('.tx-status-check').forEach(chk => {
        chk.onchange = () => {
            const vals = Array.from(container.querySelectorAll('.tx-status-check:checked')).map(c => c.value);
            txFilter.status = vals.length ? vals : ['pending', 'approved', 'rejected'];
            txPage = 1; renderPaymentsDashboard();
        };
    });

    // Método
    const methodSelect = container.querySelector('#tx-method');
    if (methodSelect) { methodSelect.onchange = () => { txFilter.method = methodSelect.value; txPage = 1; renderPaymentsDashboard(); }; }

    // Montos
    const minInput = container.querySelector('#tx-min');
    const maxInput = container.querySelector('#tx-max');
    if (minInput) { minInput.onchange = () => { txFilter.minAmount = minInput.value; txPage = 1; renderPaymentsDashboard(); }; }
    if (maxInput) { maxInput.onchange = () => { txFilter.maxAmount = maxInput.value; txPage = 1; renderPaymentsDashboard(); }; }

    // Limpiar filtros
    const clearBtn = container.querySelector('#tx-clear-filters');
    if (clearBtn) {
        clearBtn.onclick = () => {
            txFilter = { search: '', status: ['pending', 'approved', 'rejected'], dateFrom: '', dateTo: '', method: '', minAmount: '', maxAmount: '' };
            txPage = 1; renderPaymentsDashboard();
        };
    }

    // Sort headers
    container.querySelectorAll('th[data-sort]').forEach(th => {
        th.onclick = () => {
            const field = th.getAttribute('data-sort');
            if (txSort.field === field) txSort.dir = txSort.dir === 'asc' ? 'desc' : 'asc';
            else { txSort.field = field; txSort.dir = 'desc'; }
            renderPaymentsDashboard();
        };
    });

    // Paginación
    const prevBtn = container.querySelector('#tx-prev-page');
    const nextBtn = container.querySelector('#tx-next-page');
    const perPageSelect = container.querySelector('#tx-per-page');
    if (prevBtn) prevBtn.onclick = () => { if (txPage > 1) { txPage--; renderPaymentsDashboard(); } };
    if (nextBtn) nextBtn.onclick = () => { txPage++; renderPaymentsDashboard(); };
    if (perPageSelect) perPageSelect.onchange = () => { txPerPage = parseInt(perPageSelect.value); txPage = 1; renderPaymentsDashboard(); };

    // Acciones inline
    container.querySelectorAll('.tx-approve-btn').forEach(btn => {
        btn.onclick = () => handlePaymentAction(btn.getAttribute('data-id'), 'approved');
    });
    container.querySelectorAll('.tx-edit-btn').forEach(btn => {
        btn.onclick = async () => {
            const newAmount = prompt('Nuevo monto (deja vacío para cancelar):');
            if (newAmount !== null && newAmount.trim() !== '') {
                try {
                    await window.supabase.from('payments').update({ amount: parseFloat(newAmount) }).eq('id', btn.getAttribute('data-id'));
                    window.showToast('Monto actualizado ✅', '#22c55e');
                    await fetchAllPaymentsData(); renderPaymentsDashboard();
                } catch (e) { window.showToast('Error al editar', '#ef4444'); }
            }
        };
    });
    container.querySelectorAll('.tx-revert-btn').forEach(btn => {
        btn.onclick = () => handlePaymentAction(btn.getAttribute('data-id'), 'pending');
    });
    container.querySelectorAll('.tx-delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('¿Eliminar este registro de pago?')) {
                try {
                    await window.supabase.from('payments').delete().eq('id', btn.getAttribute('data-id'));
                    window.showToast('Registro eliminado ✅', '#22c55e');
                    await fetchAllPaymentsData(); renderPaymentsDashboard();
                } catch (e) { window.showToast('Error al eliminar', '#ef4444'); }
            }
        };
    });

    // Exportar
    const exportBtn = container.querySelector('#tx-export-btn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const format = container.querySelector('#tx-export-format')?.value || 'csv';
            const headers = ['Fecha', 'Alumno', 'Email', 'Concepto', 'Monto', 'Método', 'Estado', 'Cobertura'];
            const rows = filteredList.map(p => [
                formatDateShort(p.created_at),
                p.profiles?.full_name || p.user_name || 'N/A',
                p.profiles?.email || '',
                p.concept || p.plan_name || 'Membresía',
                parseFloat(p.amount || 0).toFixed(0),
                p.payment_method || 'manual',
                p.status === 'approved' ? 'Aprobado' : p.status === 'pending' ? 'Pendiente' : 'Rechazado',
                p.coverage_month || ''
            ]);
            const filename = `Transacciones_Amaru_${todayStr()}`;
            exportToFormat(format, rows, headers, filename);
            window.showToast && window.showToast(`Exportado (${format.toUpperCase()}) ✅`, '#22c55e');
        };
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// VISTA 3: COBRANZA DEL MES
// ═════════════════════════════════════════════════════════════════════════════
const renderCobranzaView = (container) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Procesar cada alumno activo
    const activeProfiles = profilesData.filter(p => p.membership_status === 'active' || p.membership_status === 'frozen');

    const coverageData = activeProfiles.map(prof => {
        const userPayments = paymentsData
            .filter(p => p.user_id === prof.id && p.status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const lastPayment = userPayments[0] || null;
        const cov = lastPayment ? parseCoverageMonth(lastPayment.coverage_month) : null;

        let status = 'none';
        let statusLabel = 'Sin registro';
        let statusColor = '#9ca3af';
        let statusBg = 'rgba(156,163,175,0.15)';

        if (!lastPayment) {
            // status ya es 'none' por defecto
        } else if (cov && cov.month === currentMonth && cov.year === currentYear) {
            status = 'ok';
            statusLabel = 'Al día';
            statusColor = '#22c55e';
            statusBg = 'rgba(34,197,94,0.15)';
        } else {
            // Verificar si está por vencer (membresía expira en <= 5 días)
            const expiry = prof.membership_expiry ? new Date(prof.membership_expiry) : null;
            const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;
            if (daysLeft !== null && daysLeft > 0 && daysLeft <= 5) {
                status = 'warning';
                statusLabel = 'Por vencer';
                statusColor = '#fbbf24';
                statusBg = 'rgba(251,191,36,0.15)';
            } else if (daysLeft !== null && daysLeft <= 0) {
                status = 'overdue';
                statusLabel = 'Moroso';
                statusColor = '#ef4444';
                statusBg = 'rgba(239,68,68,0.15)';
            } else {
                status = 'warning';
                statusLabel = 'Pendiente';
                statusColor = '#fbbf24';
                statusBg = 'rgba(251,191,36,0.15)';
            }
        }

        const plan = plansData.find(pl => pl.id === prof.membership_plan_id);
        return {
            profile: prof,
            lastPayment,
            coverageMonth: lastPayment?.coverage_month || '—',
            status,
            statusLabel,
            statusColor,
            statusBg,
            planName: plan?.name || 'Sin plan',
            planPrice: plan?.price || 0
        };
    });

    // Filtro
    let filtered = coverageData;
    if (coverageFilter !== 'all') filtered = coverageData.filter(d => d.status === coverageFilter);

    // KPIs
    const counts = { ok: 0, warning: 0, overdue: 0, none: 0 };
    coverageData.forEach(d => counts[d.status]++);
    const total = coverageData.length;
    const okPct = total > 0 ? ((counts.ok / total) * 100).toFixed(0) : 0;

    container.innerHTML = `
        <!-- KPIs Cobranza -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px;">
                <span style="font-size:1.2rem; font-weight:900; color:white;">${total}</span>
                <span style="font-size:0.8rem; color:var(--text-gray);">alumnos activos</span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="cov-filter-btn btn-glass-small ${coverageFilter === 'all' ? 'active' : ''}" data-filter="all" style="font-size:0.75rem; ${coverageFilter === 'all' ? 'background:rgba(255,255,255,0.1); color:white; border-color:white;' : ''}">
                    Todos (${total})
                </button>
                <button class="cov-filter-btn btn-glass-small ${coverageFilter === 'ok' ? 'active' : ''}" data-filter="ok" style="font-size:0.75rem; ${coverageFilter === 'ok' ? 'background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e;' : 'color:#22c55e; border-color:rgba(34,197,94,0.3);'}">
                    🟢 Al día (${counts.ok})
                </button>
                <button class="cov-filter-btn btn-glass-small ${coverageFilter === 'warning' ? 'active' : ''}" data-filter="warning" style="font-size:0.75rem; ${coverageFilter === 'warning' ? 'background:rgba(251,191,36,0.2); color:#fbbf24; border-color:#fbbf24;' : 'color:#fbbf24; border-color:rgba(251,191,36,0.3);'}">
                    🟡 Por vencer (${counts.warning})
                </button>
                <button class="cov-filter-btn btn-glass-small ${coverageFilter === 'overdue' ? 'active' : ''}" data-filter="overdue" style="font-size:0.75rem; ${coverageFilter === 'overdue' ? 'background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;' : 'color:#ef4444; border-color:rgba(239,68,68,0.3);'}">
                    🔴 Morosos (${counts.overdue})
                </button>
                <button class="cov-filter-btn btn-glass-small ${coverageFilter === 'none' ? 'active' : ''}" data-filter="none" style="font-size:0.75rem; ${coverageFilter === 'none' ? 'background:rgba(156,163,175,0.2); color:#9ca3af; border-color:#9ca3af;' : 'color:#9ca3af; border-color:rgba(156,163,175,0.3);'}">
                    ⚪ Sin registro (${counts.none})
                </button>
            </div>
            <div style="min-width:150px; text-align:right;">
                <div style="font-size:0.75rem; color:var(--text-gray); margin-bottom:4px;">Cobertura ${getMonthName(currentMonth)} ${currentYear}</div>
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                    <div style="width:${okPct}%; height:100%; background:linear-gradient(90deg, #22c55e, #4ade80); border-radius:4px;"></div>
                </div>
                <div style="font-size:0.75rem; color:#22c55e; font-weight:700; margin-top:2px;">${okPct}% al día</div>
            </div>
        </div>

        <!-- Lista -->
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${filtered.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem; padding:20px; text-align:center;">No hay alumnos en esta categoría.</p>'
            : filtered.map(d => {
                const prof = d.profile;
                const daysLeft = prof.membership_expiry ? Math.ceil((new Date(prof.membership_expiry) - now) / (1000 * 60 * 60 * 24)) : null;
                return `
                    <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid ${d.statusColor};">
                        <div style="width:36px; height:36px; border-radius:50%; background:${d.statusBg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <i data-lucide="user" style="width:16px; color:${d.statusColor};"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <strong style="font-size:0.9rem;">${prof.full_name || 'Sin nombre'}</strong>
                                <span class="tag" style="background:${d.statusBg}; color:${d.statusColor}; font-size:0.65rem; padding:2px 8px; font-weight:700;">${d.statusLabel}</span>
                                <span class="tag" style="background:rgba(255,255,255,0.05); font-size:0.65rem; padding:2px 8px;">${d.planName}</span>
                            </div>
                            <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:2px;">
                                ${prof.email && !prof.email.includes('@amaru.local') ? prof.email : '<span style="color:#fbbf24;">📵 Sin tecnología</span>'}
                                ${daysLeft !== null ? ` • Vence: ${daysLeft > 0 ? daysLeft + ' días' : 'Expirado'}` : ''}
                            </span>
                        </div>
                        <div style="text-align:right; flex-shrink:0; min-width:120px;">
                            <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Último pago</span>
                            <strong style="font-size:0.85rem; color:white;">${d.lastPayment ? formatCurrency(parseFloat(d.lastPayment.amount) || 0) : '—'}</strong>
                            <span style="font-size:0.65rem; color:var(--text-gray); display:block;">${d.coverageMonth}</span>
                        </div>
                        <div style="flex-shrink:0;">
                            <button class="btn-register-payment btn-glass-small" data-uid="${prof.id}" style="border-color:var(--accent-purple); color:var(--accent-purple);">
                                <i data-lucide="dollar-sign" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Registrar
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    window.lucide && window.lucide.createIcons();

    // Filtros
    container.querySelectorAll('.cov-filter-btn').forEach(btn => {
        btn.onclick = () => {
            coverageFilter = btn.getAttribute('data-filter');
            renderPaymentsDashboard();
        };
    });

    // Registrar pago
    container.querySelectorAll('.btn-register-payment').forEach(btn => {
        btn.onclick = () => openQuickPaymentModal(btn.getAttribute('data-uid'));
    });
};

// ═════════════════════════════════════════════════════════════════════════════
// MODAL RÁPIDO DE REGISTRO DE PAGO
// ═════════════════════════════════════════════════════════════════════════════
export const openQuickPaymentModal = (userId) => {
    const prof = profilesData.find(p => p.id === userId);
    const plan = plansData.find(pl => pl.id === prof?.membership_plan_id);
    const defaultAmount = plan?.price || '';
    const defaultConcept = plan?.name || 'Membresía';
    const now = new Date();
    const currentMonthName = getMonthName(now.getMonth());
    const currentYear = now.getFullYear();

    const modal = document.createElement('div');
    modal.className = 'glass-container';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; padding: 20px; transition: opacity 0.3s ease;
    `;

    modal.innerHTML = `
        <div class="glass-premium" style="max-width:420px; width:100%; padding:30px; border-radius:24px; animation: slideUp 0.3s ease; box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0; font-size:1.2rem; display:flex; align-items:center; gap:10px;">
                    <i data-lucide="dollar-sign" style="color:var(--accent-purple);"></i> Registrar Pago
                </h3>
                <button class="close-quick-modal" style="background:none; border:none; color:white; opacity:0.5; cursor:pointer;"><i data-lucide="x"></i></button>
            </div>
            <p style="font-size:0.9rem; opacity:0.7; margin-bottom:20px;">Alumno: <strong>${prof?.full_name || 'Sin nombre'}</strong></p>

            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Monto ($)</label>
                <input type="number" id="qp-amount" value="${defaultAmount}" class="login-input" style="width:100%; padding:12px 15px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Concepto</label>
                <input type="text" id="qp-concept" value="${defaultConcept}" class="login-input" style="width:100%; padding:12px 15px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Método de Pago</label>
                <select id="qp-method" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                    <option value="transferencia" style="background:#111; color:white;">🏦 Transferencia Bancaria</option>
                    <option value="pasarela" style="background:#111; color:white;">💳 Pasarela de Pago (Webpay/Mercado Pago)</option>
                    <option value="efectivo" style="background:#111; color:white;">💵 Efectivo</option>
                </select>
            </div>
            <div style="display:flex; gap:15px; margin-bottom:25px;">
                <div style="flex:2;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Mes de Cobertura</label>
                    <select id="qp-month" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                        ${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => `<option value="${m}" ${m === currentMonthName ? 'selected' : ''} style="background:#111; color:white;">${m}</option>`).join('')}
                    </select>
                </div>
                <div style="flex:1;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Año</label>
                    <select id="qp-year" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                        ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''} style="background:#111; color:white;">${y}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button class="btn-glass close-quick-modal" style="padding:10px 20px;">Cancelar</button>
                <button id="qp-save-btn" class="btn-primary" style="padding:10px 25px; display:flex; align-items:center; gap:8px;">
                    Guardar <i data-lucide="check" style="width:16px; height:16px;"></i>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    window.lucide && window.lucide.createIcons();

    const close = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
    modal.querySelectorAll('.close-quick-modal').forEach(b => { b.onclick = close; });

    document.getElementById('qp-save-btn').onclick = async () => {
        const amount = parseFloat(document.getElementById('qp-amount').value);
        const concept = document.getElementById('qp-concept').value.trim();
        const method = document.getElementById('qp-method').value;
        const month = document.getElementById('qp-month').value;
        const year = document.getElementById('qp-year').value;
        if (!amount || amount <= 0) { window.showToast('Ingresa un monto válido', '#ef4444'); return; }

        try {
            window.showToast('Registrando pago...');
            const { error } = await window.supabase.from('payments').insert({
                user_id: userId,
                amount,
                concept,
                status: 'approved',
                payment_method: method,
                coverage_month: `${month} ${year}`,
                created_at: new Date().toISOString()
            });
            if (error) throw error;

            // Actualizar membresía
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 30);
            await window.supabase.from('profiles').update({
                membership_status: 'active',
                membership_expiry: newExpiry.toISOString(),
                is_frozen: false
            }).eq('id', userId);

            window.showToast('Pago registrado ✅', '#22c55e');
            close();
            await fetchAllPaymentsData();
            renderPaymentsDashboard();
        } catch (e) {
            console.error(e);
            window.showToast('Error al registrar pago', '#ef4444');
        }
    };
};
