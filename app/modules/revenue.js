// app/modules/revenue.js
// Módulo de Evolución de Ingresos — Panel Administrativo

import { exportToFormat } from '../utils/exportUtils.js';
/* global Chart */

// ─── Estado local del módulo ────────────────────────────────────────────────
let revenueChartInstance = null;
let currentRevenueData = [];
let currentFilter = { year: new Date().getFullYear(), month: new Date().getMonth() };
let compareFilter = null; // null = compara con periodo anterior
let displayLimit = 20;

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

const getMonthYearKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// ─── Fetch principal ────────────────────────────────────────────────────────
const fetchRevenueData = async () => {
    try {
        // Traemos TODOS los pagos aprobados con datos del usuario
        const { data: payments, error } = await window.supabase
            .from('payments')
            .select(`
                *,
                profiles:profiles(id, full_name, email, membership_plan_id, membership_status, membership_expiry)
            `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Los planes no tienen FK directa desde payments, los cargamos por separado
        const { data: plans } = await window.supabase.from('membership_plans').select('*');
        const plansMap = new Map((plans || []).map(p => [p.id, p]));

        // Enriquecer cada pago con el plan correspondiente (por concepto o por perfil)
        const enriched = (payments || []).map(p => {
            // Intentar match por concepto/plan_name primero
            let matchedPlan = null;
            const concept = (p.concept || p.plan_name || '').toLowerCase();
            if (concept && plans) {
                matchedPlan = plans.find(pl => concept.includes((pl.name || '').toLowerCase()));
            }
            // Fallback: usar el plan del perfil
            if (!matchedPlan && p.profiles?.membership_plan_id) {
                matchedPlan = plansMap.get(p.profiles.membership_plan_id) || null;
            }
            return { ...p, plan: matchedPlan };
        });

        return enriched;
    } catch (err) {
        console.error('[Revenue] Error fetching data:', err);
        window.showToast && window.showToast('Error cargando ingresos', '#ef4444');
        return [];
    }
};

// ─── Render principal ───────────────────────────────────────────────────────
export const renderRevenueSection = async () => {
    const revSection = document.getElementById('admin-revenue-section');
    const adminContent = document.getElementById('admin-content-area');

    // Asegurar que solo se muestre el dashboard renderizado dinámicamente en admin-content-area
    if (revSection) revSection.classList.add('hidden');
    if (adminContent) adminContent.innerHTML = `<div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando inteligencia financiera...</div>`;
    window.lucide && window.lucide.createIcons();

    currentRevenueData = await fetchRevenueData();
    renderRevenueDashboard();
};

// ─── Dashboard completo ─────────────────────────────────────────────────────
const renderRevenueDashboard = () => {
    const adminContent = document.getElementById('admin-content-area');
    if (!adminContent) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // ── Filtros por defecto ──
    if (!currentFilter) currentFilter = { year: currentYear, month: currentMonth };

    // ── Calcular métricas del periodo seleccionado ──
    const selPayments = filterByPeriod(currentRevenueData, currentFilter.year, currentFilter.month);
    const prevPayments = compareFilter
        ? filterByPeriod(currentRevenueData, compareFilter.year, compareFilter.month)
        : getPreviousPeriodPayments(currentRevenueData, currentFilter.year, currentFilter.month);

    const selTotal = selPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    const prevTotal = prevPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
    const growth = prevTotal > 0 ? ((selTotal - prevTotal) / prevTotal) * 100 : (selTotal > 0 ? 100 : 0);
    const uniquePayers = new Set(selPayments.map(p => p.user_id)).size;
    const avgTicket = selPayments.length > 0 ? selTotal / selPayments.length : 0;

    // ── Datos por plan ──
    const byPlan = {};
    selPayments.forEach(p => {
        const planName = p.plan?.name || p.concept || 'Otro';
        if (!byPlan[planName]) byPlan[planName] = { count: 0, total: 0 };
        byPlan[planName].count++;
        byPlan[planName].total += parseFloat(p.amount) || 0;
    });

    // ── Datos históricos para gráfico (últimos 6 meses) ──
    const historical = getHistoricalData(currentRevenueData, 6);

    // ── HTML del dashboard ──
    adminContent.innerHTML = `
        <div class="glass-premium p-20">
            <div class="header-split mb-20">
                <div>
                    <h3 style="font-size:1.3rem; margin-bottom:4px;">💰 Evolución de Ingresos</h3>
                    <p class="subtitle">Análisis detallado de pagos y membresías</p>
                </div>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); padding:6px 12px; border-radius:10px; border:1px solid var(--glass-border);">
                        <i data-lucide="calendar" style="width:14px; color:var(--accent-purple);"></i>
                        <select id="rev-filter-month" style="background:transparent; color:white; border:none; font-size:0.75rem; font-weight:600; outline:none; cursor:pointer;">
                            ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => `<option value="${m}" ${m === currentFilter.month ? 'selected' : ''} style="color:black;">${getMonthName(m)}</option>`).join('')}
                        </select>
                        <select id="rev-filter-year" style="background:transparent; color:white; border:none; font-size:0.75rem; font-weight:600; outline:none; cursor:pointer;">
                            ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentFilter.year ? 'selected' : ''} style="color:black;">${y}</option>`).join('')}
                        </select>
                    </div>
                    <button id="btn-compare-prev" class="btn-glass" style="padding:6px 14px; font-size:0.7rem; ${compareFilter ? 'background:var(--accent-purple); color:white; border-color:var(--accent-purple);' : ''}">
                        <i data-lucide="git-compare" style="width:12px;"></i> Comparar
                    </button>
                </div>
            </div>

            <!-- KPIs -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
                <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ingresos ${getMonthName(currentFilter.month)}</span>
                    <strong style="font-size:1.4rem; color:var(--accent-purple); font-weight:900;">${formatCurrency(selTotal)}</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Crecimiento</span>
                    <strong style="font-size:1.4rem; color:${growth >= 0 ? '#22c55e' : '#ef4444'}; font-weight:900;">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Pagadores</span>
                    <strong style="font-size:1.4rem; color:#3b82f6; font-weight:900;">${uniquePayers}</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ticket Promedio</span>
                    <strong style="font-size:1.4rem; color:#fbbf24; font-weight:900;">${formatCurrency(avgTicket)}</strong>
                </div>
            </div>

            <!-- Gráfico histórico -->
            <div style="margin-bottom:25px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="font-size:0.9rem; font-weight:700;">📈 Histórico de Ingresos (últimos 6 meses)</h4>
                </div>
                <div class="chart-container" style="min-height:220px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:15px;">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- Desglose por plan -->
            <div style="margin-bottom:25px;">
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">🥋 Ingresos por Plan / Concepto</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${Object.keys(byPlan).length === 0
            ? '<p style="opacity:0.5; font-size:0.8rem;">Sin ingresos registrados en este periodo.</p>'
            : Object.entries(byPlan).sort((a, b) => b[1].total - a[1].total).map(([name, d]) => {
                const pct = selTotal > 0 ? ((d.total / selTotal) * 100).toFixed(1) : 0;
                return `
                                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="flex:1;">
                                        <strong style="font-size:0.85rem;">${name}</strong>
                                        <span style="font-size:0.7rem; color:var(--text-gray); margin-left:8px;">${d.count} pago${d.count !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div style="width:100px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                        <div style="width:${pct}%; height:100%; background:var(--accent-purple); border-radius:3px;"></div>
                                    </div>
                                    <strong style="font-size:0.9rem; min-width:70px; text-align:right;">${formatCurrency(d.total)}</strong>
                                    <span style="font-size:0.7rem; color:var(--accent-purple); min-width:40px; text-align:right;">${pct}%</span>
                                </div>
                            `;
            }).join('')}
                </div>
            </div>

            <!-- Lista detallada de pagadores -->
            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                    <h4 style="font-size:0.9rem; font-weight:700;">👥 Detalle de Pagos — ${getMonthName(currentFilter.month)} ${currentFilter.year}</h4>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <input type="text" id="rev-search-input" placeholder="Buscar alumno..." style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:6px 12px; border-radius:8px; font-size:0.75rem; outline:none; width:160px;">
                        <select id="rev-sort-select" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:6px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                            <option value="date-desc" style="color:black;">Más reciente</option>
                            <option value="date-asc" style="color:black;">Más antiguo</option>
                            <option value="amount-desc" style="color:black;">Mayor monto</option>
                            <option value="amount-asc" style="color:black;">Menor monto</option>
                            <option value="name-asc" style="color:black;">Nombre A-Z</option>
                        </select>
                    </div>
                </div>
                <div id="revenue-payments-list" style="display:flex; flex-direction:column; gap:8px;">
                    ${buildPaymentRows(selPayments)}
                </div>
                ${selPayments.length > displayLimit ? `
                    <div style="text-align:center; margin-top:15px;">
                        <button id="btn-load-more-rev" class="btn-glass" style="padding:8px 20px; font-size:0.75rem;">
                            Ver más (${selPayments.length - displayLimit} restantes)
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- Insights automáticos -->
            <div class="glass" style="background:rgba(139,92,246,0.05); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:12px; margin-bottom:20px;">
                <h4 style="margin-bottom:10px; display:flex; align-items:center; gap:5px; color:var(--accent-purple); font-size:0.9rem;">
                    <i data-lucide="brain" style="width:16px;"></i> Análisis Inteligente
                </h4>
                <div id="revenue-insights-dynamic" style="font-size:0.85rem; color:rgba(255,255,255,0.8); line-height:1.5; display:flex; flex-direction:column; gap:8px;">
                    ${buildInsights(selPayments, prevPayments, selTotal, prevTotal, growth, byPlan)}
                </div>
            </div>

            <!-- Exportar -->
            <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end; border-top:1px solid rgba(255,255,255,0.1); padding-top:15px;">
                <span style="font-size:0.75rem; color:var(--text-gray); font-weight:600;">Exportar periodo:</span>
                <select id="rev-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:6px 12px; border-radius:8px; font-size:0.75rem; outline:none;">
                    <option value="csv" style="color:black;">CSV</option>
                    <option value="xls" style="color:black;">XLS</option>
                    <option value="pdf" style="color:black;">PDF</option>
                </select>
                <button id="btn-export-revenue" class="btn-primary" style="padding:8px 16px; font-size:0.75rem; border-radius:8px;">
                    <i data-lucide="download" style="width:14px; height:14px; margin-right:4px; vertical-align:middle;"></i> Exportar
                </button>
            </div>
        </div>
    `;

    window.lucide && window.lucide.createIcons();

    // ── Renderizar gráfico histórico ──
    renderHistoricalChart(historical);

    // ── Attach listeners ──
    attachListeners(selPayments);
};

// ─── Construir filas de pagos ───────────────────────────────────────────────
const buildPaymentRows = (payments) => {
    const search = (document.getElementById('rev-search-input')?.value || '').toLowerCase();
    const sort = document.getElementById('rev-sort-select')?.value || 'date-desc';

    let filtered = [...payments];
    if (search) {
        filtered = filtered.filter(p => {
            const name = (p.profiles?.full_name || '').toLowerCase();
            const email = (p.profiles?.email || '').toLowerCase();
            const concept = (p.concept || '').toLowerCase();
            return name.includes(search) || email.includes(search) || concept.includes(search);
        });
    }

    filtered.sort((a, b) => {
        switch (sort) {
            case 'date-desc': return new Date(b.created_at) - new Date(a.created_at);
            case 'date-asc': return new Date(a.created_at) - new Date(b.created_at);
            case 'amount-desc': return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
            case 'amount-asc': return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
            case 'name-asc': return (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
            default: return 0;
        }
    });

    const display = filtered.slice(0, displayLimit);

    if (display.length === 0) {
        return `<div style="text-align:center; padding:30px; opacity:0.4;">
            <i data-lucide="inbox" style="width:40px; height:40px; margin-bottom:10px; display:block; margin-inline:auto;"></i>
            <p style="font-size:0.85rem;">No hay pagos que coincidan con los filtros.</p>
        </div>`;
    }

    return display.map((p, idx) => {
        const name = p.profiles?.full_name || 'Usuario sin nombre';
        const email = p.profiles?.email || '';
        const planName = p.plan?.name || p.concept || '—';
        const amount = parseFloat(p.amount) || 0;
        const date = formatDateShort(p.created_at);
        const method = p.payment_method || 'manual';
        const methodLabel = method === 'mercadopago' ? 'Mercado Pago' : method === 'webpay' ? 'Webpay' : 'Transferencia/Manual';

        return `
            <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid var(--accent-purple); animation: slideInUp 0.3s ease ${idx * 0.03}s both;">
                <div style="width:36px; height:36px; border-radius:50%; background:rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="user" style="width:16px; color:var(--accent-purple);"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <strong style="font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</strong>
                        <span class="tag" style="background:rgba(139,92,246,0.15); color:var(--accent-purple); font-size:0.65rem; padding:2px 8px;">${planName}</span>
                    </div>
                    <span style="font-size:0.7rem; color:var(--text-gray); opacity:0.7;">${email}</span>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <strong style="font-size:1rem; color:white; display:block;">${formatCurrency(amount)}</strong>
                    <span style="font-size:0.65rem; color:var(--text-gray);">${date}</span>
                </div>
                <div style="text-align:right; flex-shrink:0; min-width:90px;">
                    <span class="tag" style="background:rgba(34,197,94,0.15); color:#22c55e; font-size:0.65rem; padding:2px 8px;">Aprobado</span>
                    <span style="font-size:0.6rem; color:var(--text-gray); display:block; margin-top:2px;">${methodLabel}</span>
                </div>
            </div>
        `;
    }).join('');
};

// ─── Insights automáticos ───────────────────────────────────────────────────
const buildInsights = (current, previous, curTotal, prevTotal, growth, byPlan) => {
    const insights = [];

    // 1. Crecimiento
    if (growth > 10) {
        insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px; flex-shrink:0;"></i> <span>¡Excelente crecimiento! Ingresos subieron un <strong>${growth.toFixed(1)}%</strong> vs periodo anterior.</span></div>`);
    } else if (growth < -10) {
        insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-down" style="color:#ef4444; width:16px; flex-shrink:0;"></i> <span>Alerta: ingresos bajaron un <strong>${Math.abs(growth).toFixed(1)}%</strong>. Considera una promoción o campaña de reactivación.</span></div>`);
    } else if (growth !== 0) {
        insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:#fbbf24; width:16px; flex-shrink:0;"></i> <span>Ingresos estables con variación del <strong>${growth.toFixed(1)}%</strong>.</span></div>`);
    } else {
        insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:var(--text-gray); width:16px; flex-shrink:0;"></i> <span>No hay datos suficientes para comparar con el periodo anterior.</span></div>`);
    }

    // 2. Plan más vendido
    const topPlan = Object.entries(byPlan).sort((a, b) => b[1].total - a[1].total)[0];
    if (topPlan) {
        insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="award" style="color:#fbbf24; width:16px; flex-shrink:0;"></i> <span>El plan más rentable es <strong>${topPlan[0]}</strong> con ${formatCurrency(topPlan[1].total)} (${topPlan[1].count} pagos).</span></div>`);
    }

    // 3. Concentración (Pareto)
    if (current.length > 5) {
        const userTotals = {};
        current.forEach(p => {
            const uid = p.user_id;
            if (!userTotals[uid]) userTotals[uid] = 0;
            userTotals[uid] += parseFloat(p.amount) || 0;
        });
        const values = Object.values(userTotals).sort((a, b) => b - a);
        const top20Count = Math.max(1, Math.ceil(values.length * 0.2));
        const top20Sum = values.slice(0, top20Count).reduce((a, b) => a + b, 0);
        const pct = curTotal > 0 ? ((top20Sum / curTotal) * 100).toFixed(0) : 0;
        if (pct > 50) {
            insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="users" style="color:#3b82f6; width:16px; flex-shrink:0;"></i> <span>El <strong>${pct}%</strong> de ingresos proviene del 20% de tus alumnos (alta concentración).</span></div>`);
        }
    }

    // 4. Comparación directa de montos
    if (prevTotal > 0) {
        const diff = curTotal - prevTotal;
        insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="scale" style="color:#8b5cf6; width:16px; flex-shrink:0;"></i> <span>Diferencia vs anterior: <strong style="color:${diff >= 0 ? '#22c55e' : '#ef4444'}">${diff >= 0 ? '+' : ''}${formatCurrency(diff)}</strong></span></div>`);
    }

    return insights.join('') || '<p style="opacity:0.5;">Sin insights disponibles para este periodo.</p>';
};

// ─── Gráfico histórico (Chart.js) ───────────────────────────────────────────
const renderHistoricalChart = (data) => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChartInstance) revenueChartInstance.destroy();

    const labels = data.map(d => `${getMonthName(d.month).substring(0, 3)} ${String(d.year).slice(2)}`);
    const values = data.map(d => d.total);
    const counts = data.map(d => d.count);

    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Ingresos ($)',
                    data: values,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Cant. Pagos',
                    data: counts,
                    type: 'line',
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#22c55e',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(13,13,18,0.95)',
                    titleColor: '#fff',
                    bodyColor: '#ccc',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.dataset.label === 'Ingresos ($)') {
                                return ` Ingresos: ${formatCurrency(ctx.raw)}`;
                            }
                            return ` ${ctx.dataset.label}: ${ctx.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        color: 'rgba(255,255,255,0.4)',
                        font: { size: 10 },
                        callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
                    },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: 'rgba(34,197,94,0.6)', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
};

// ─── Helpers de filtrado ────────────────────────────────────────────────────
const filterByPeriod = (payments, year, month) => {
    return payments.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
    });
};

const getPreviousPeriodPayments = (payments, year, month) => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return filterByPeriod(payments, prevYear, prevMonth);
};

const getHistoricalData = (payments, monthsBack) => {
    const result = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthPayments = filterByPeriod(payments, d.getFullYear(), d.getMonth());
        result.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            total: monthPayments.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0),
            count: monthPayments.length
        });
    }
    return result;
};

// ─── Listeners ──────────────────────────────────────────────────────────────
const attachListeners = (selPayments) => {
    // Filtro mes
    const monthSelect = document.getElementById('rev-filter-month');
    const yearSelect = document.getElementById('rev-filter-year');
    if (monthSelect) {
        monthSelect.onchange = () => {
            currentFilter.month = parseInt(monthSelect.value);
            currentFilter.year = parseInt(yearSelect.value);
            displayLimit = 20;
            renderRevenueDashboard();
        };
    }
    if (yearSelect) {
        yearSelect.onchange = () => {
            currentFilter.month = parseInt(monthSelect.value);
            currentFilter.year = parseInt(yearSelect.value);
            displayLimit = 20;
            renderRevenueDashboard();
        };
    }

    // Comparar
    const compareBtn = document.getElementById('btn-compare-prev');
    if (compareBtn) {
        compareBtn.onclick = () => {
            if (compareFilter) {
                compareFilter = null;
            } else {
                // Pre-seleccionar mes anterior
                const prevMonth = currentFilter.month === 0 ? 11 : currentFilter.month - 1;
                const prevYear = currentFilter.month === 0 ? currentFilter.year - 1 : currentFilter.year;
                compareFilter = { year: prevYear, month: prevMonth };
            }
            renderRevenueDashboard();
        };
    }

    // Búsqueda
    const searchInput = document.getElementById('rev-search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const listEl = document.getElementById('revenue-payments-list');
                if (listEl) listEl.innerHTML = buildPaymentRows(selPayments);
                window.lucide && window.lucide.createIcons();
            }, 300);
        };
    }

    // Ordenamiento
    const sortSelect = document.getElementById('rev-sort-select');
    if (sortSelect) {
        sortSelect.onchange = () => {
            const listEl = document.getElementById('revenue-payments-list');
            if (listEl) listEl.innerHTML = buildPaymentRows(selPayments);
            window.lucide && window.lucide.createIcons();
        };
    }

    // Load more
    const loadMoreBtn = document.getElementById('btn-load-more-rev');
    if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
            displayLimit += 20;
            renderRevenueDashboard();
        };
    }

    // Exportar
    const exportBtn = document.getElementById('btn-export-revenue');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const format = document.getElementById('rev-export-format')?.value || 'csv';
            const search = (document.getElementById('rev-search-input')?.value || '').toLowerCase();
            const sort = document.getElementById('rev-sort-select')?.value || 'date-desc';

            let filtered = [...selPayments];
            if (search) {
                filtered = filtered.filter(p => {
                    const name = (p.profiles?.full_name || '').toLowerCase();
                    const email = (p.profiles?.email || '').toLowerCase();
                    const concept = (p.concept || '').toLowerCase();
                    return name.includes(search) || email.includes(search) || concept.includes(search);
                });
            }
            filtered.sort((a, b) => {
                switch (sort) {
                    case 'date-desc': return new Date(b.created_at) - new Date(a.created_at);
                    case 'date-asc': return new Date(a.created_at) - new Date(b.created_at);
                    case 'amount-desc': return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
                    case 'amount-asc': return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
                    case 'name-asc': return (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
                    default: return 0;
                }
            });

            const headers = ['Fecha', 'Alumno', 'Email', 'Plan/Concepto', 'Monto', 'Método', 'Estado'];
            const rows = filtered.map(p => [
                formatDateShort(p.created_at),
                p.profiles?.full_name || 'N/A',
                p.profiles?.email || '',
                p.plan?.name || p.concept || '—',
                parseFloat(p.amount || 0).toFixed(0),
                p.payment_method || 'manual',
                p.status === 'approved' ? 'Aprobado' : p.status
            ]);

            const filename = `Ingresos_${getMonthName(currentFilter.month)}_${currentFilter.year}_Amaru`;
            exportToFormat(format, rows, headers, filename);
            window.showToast && window.showToast(`Exportado (${format.toUpperCase()}) ✅`, '#22c55e');
        };
    }
};
