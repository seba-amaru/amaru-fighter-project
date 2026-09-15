import { exportToFormat, exportUserData } from '../utils/exportUtils.js';
const unknowAvatar = '../images/unknow.png';

/* global Chart */

const Swal = window.Swal;

import { SupabaseService } from '../services/supabaseService.js';
import { openClassModal, openPlanModal, openMemberModal, deleteClass, deletePlan, deleteMember } from './adminModals.js';
import { renderAdminMembers } from './members.js';


const getAdminContent = () => document.getElementById('admin-content-area');

export const renderAdminActiveUsers = async () => {
    // Delegate to the new v2.0 members module
    await renderAdminMembers();
};

export const renderAdminClasses = async () => {
    getAdminContent().innerHTML = `
        <div class="glass-premium p-20" id="classes-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:180px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:120px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:100px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
                <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;

    try {
        const classes = await SupabaseService.getClasses();

        // Metrics
        const typeCounts = {};
        const dayCounts = {};
        classes.forEach(c => {
            typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
            let cDays = c.days;
            if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { cDays = []; } }
            (Array.isArray(cDays) ? cDays : []).forEach(d => { dayCounts[d] = (dayCounts[d] || 0) + 1; });
        });

        const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const typeColors = {
            'Striking': '#ef4444',
            'BJJ': '#8b5cf6',
            'MMA': '#f97316',
            'Funcional Fighter': '#22c55e',
            'BJJ Gi': '#8b5cf6',
            'No Gi': '#a855f7'
        };
        const typeIcons = {
            'Striking': 'swords',
            'BJJ': 'shield',
            'MMA': 'flame',
            'Funcional Fighter': 'zap',
            'BJJ Gi': 'shield-check',
            'No Gi': 'shield-off'
        };

        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" id="classes-main">
                <style>
                    @keyframes classFadeIn {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Gestión de Clases</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${classes.length} clases configuradas</p>
                    </div>
                    <button class="btn-action-glow" id="btn-add-class-admin"><i data-lucide="plus"></i> Clase</button>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:20px;">
                    ${Object.entries(typeCounts).map(([type, count]) => `
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px; text-align:center;">
                            <strong style="font-size:1.2rem; color:${typeColors[type] || 'var(--accent-cyan)'};">${count}</strong>
                            <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-top:4px;">${type}</span>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-gray); flex-shrink:0;"></i>
                        <input type="text" id="class-search-input" placeholder="Buscar clase por nombre..." style="flex:1; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;">
                    </div>
                </div>

                <div id="classes-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:14px;">
                    ${classes.map((c, idx) => {
            const color = typeColors[c.type] || 'var(--accent-cyan)';
            const icon = typeIcons[c.type] || 'activity';
            let cDays = c.days;
            if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { cDays = []; } }
            const daysArr = Array.isArray(cDays) ? cDays : [];
            return `
                        <div class="class-card-item" data-name="${c.name.toLowerCase()}" data-type="${c.type.toLowerCase()}"
                             style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:18px; opacity:0; animation: classFadeIn 0.4s ease forwards ${idx * 0.06}s; transition: all 0.3s;">
                            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                                <div style="width:40px; height:40px; border-radius:10px; background:${color}11; border:1px solid ${color}22; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="${icon}" style="width:20px; color:${color};"></i>
                                </div>
                                <div style="flex:1;">
                                    <h4 style="margin:0; font-size:1rem; font-weight:800;">${c.name}</h4>
                                    <span style="font-size:0.7rem; opacity:0.5; font-weight:600;">${c.time}</span>
                                </div>
                            </div>
                            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;">
                                ${daysArr.map(d => `
                                    <span style="font-size:0.6rem; font-weight:700; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:3px 8px; border-radius:6px; text-transform:uppercase;">${dayLabels[d] || d}</span>
                                `).join('')}
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="edit-class-btn btn-glass-small" data-id="${c.id}" style="flex:1; justify-content:center;">
                                    <i data-lucide="edit-3" style="width:14px; margin-right:4px;"></i> Editar
                                </button>
                                <button class="delete-class-btn btn-glass-small delete" data-id="${c.id}" style="width:40px; justify-content:center;">
                                    <i data-lucide="trash-2" style="width:14px;"></i>
                                </button>
                            </div>
                        </div>`;
        }).join('')}
                </div>
            </div>`;

        window.lucide.createIcons();

        // Search filter
        const searchInput = document.getElementById('class-search-input');
        if (searchInput) {
            searchInput.oninput = () => {
                const term = searchInput.value.toLowerCase();
                document.querySelectorAll('.class-card-item').forEach(card => {
                    const name = card.getAttribute('data-name');
                    const type = card.getAttribute('data-type');
                    card.style.display = (name.includes(term) || type.includes(term)) ? '' : 'none';
                });
            };
        }

        document.getElementById('btn-add-class-admin').onclick = () => openClassModal();
        document.querySelectorAll('.edit-class-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const targetClass = classes.find(c => c.id == id);
                if (targetClass) openClassModal(id, classes);
                else window.showToast("Clase no encontrada", "#ef4444");
            };
        });
        document.querySelectorAll('.delete-class-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                deleteClass(btn.getAttribute('data-id'));
            };
        });
    } catch (err) {
        console.error(err);
        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar clases</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${err.message || 'Ocurrió un problema al obtener los datos.'}</p>
                <button onclick="renderAdminClasses()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`;
        window.lucide.createIcons();
    }
};

const movePlanAdmin = async (planId, targetIdx) => {
    try {
        const plans = await SupabaseService.getMembershipPlans();
        const idx = plans.findIndex(p => p.id === planId);
        if (idx === -1 || targetIdx < 0 || targetIdx >= plans.length || idx === targetIdx) return;

        // Reorder array
        const [moved] = plans.splice(idx, 1);
        plans.splice(targetIdx, 0, moved);

        // Update all sort_orders
        for (let i = 0; i < plans.length; i++) {
            await SupabaseService.updatePlanOrder(plans[i].id, i);
        }

        window.showToast("Orden actualizado 🔄", "#8b5cf6");
        renderAdminPlans();
    } catch (err) {
        console.error(err);
        window.showToast("Error al reordenar plan", "#ef4444");
    }
};

export const renderAdminPlans = async () => {
    // Skeleton loading
    getAdminContent().innerHTML = `
        <div class="glass-premium p-20" id="plans-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:200px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:140px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:100px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
                <div style="height:220px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:220px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:220px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;

    try {
        const [plans, profiles] = await Promise.all([
            SupabaseService.getMembershipPlans(),
            SupabaseService.getAllProfiles()
        ]);

        // Calculate metrics per plan
        const planMetrics = plans.map(p => {
            const planUsers = profiles.filter(u => u.membership_plan_id === p.id || u.membership_plans?.name === p.name);
            const activeUsers = planUsers.filter(u => u.membership_status === 'active');
            const monthlyRevenue = activeUsers.length * Number(p.price || 0);
            const capacityUsed = p.monthly > 0 ? Math.round((activeUsers.length / Math.max(1, p.monthly)) * 100) : 0;
            const arpu = activeUsers.length > 0 ? monthlyRevenue / activeUsers.length : 0;

            return {
                ...p,
                _userCount: planUsers.length,
                _activeCount: activeUsers.length,
                _monthlyRevenue: monthlyRevenue,
                _capacityUsed: Math.min(capacityUsed, 100),
                _arpu: arpu,
                _features: Array.isArray(p.features) ? p.features : (p.features ? String(p.features).split(',').map(f => f.trim()).filter(f => f) : [])
            };
        });

        // Find most popular plan by active users
        const mostPopularPlan = planMetrics.length > 0
            ? planMetrics.reduce((max, p) => p._activeCount > max._activeCount ? p : max, planMetrics[0])
            : null;

        const themeColors = {
            bronze: { bg: 'rgba(205, 127, 50, 0.1)', border: 'rgba(205, 127, 50, 0.3)', accent: '#cd7f32', icon: 'shield', gradient: 'linear-gradient(135deg, rgba(205,127,50,0.15), rgba(205,127,50,0.05))' },
            silver: { bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.3)', accent: '#c0c0c0', icon: 'shield-check', gradient: 'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))' },
            gold: { bg: 'rgba(255, 215, 0, 0.08)', border: 'rgba(255, 215, 0, 0.25)', accent: '#ffd700', icon: 'crown', gradient: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))' }
        };

        const totalRevenue = planMetrics.reduce((a, p) => a + p._monthlyRevenue, 0);
        const totalUsers = planMetrics.reduce((a, p) => a + p._activeCount, 0);
        const avgArpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

        // Sort plans by active users desc for the donut chart
        const sortedForChart = [...planMetrics].sort((a, b) => b._activeCount - a._activeCount);

        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" id="plans-main">
                <style>
                    @keyframes planFadeIn {
                        from { opacity: 0; transform: translateY(20px) scale(0.96); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes planGlow {
                        0%, 100% { box-shadow: 0 0 0 rgba(139,92,246,0); }
                        50% { box-shadow: 0 0 20px rgba(139,92,246,0.15); }
                    }
                    .plan-block-card {
                        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: grab;
                    }
                    .plan-block-card:hover {
                        transform: translateY(-4px);
                    }
                    .plan-block-card:active { cursor: grabbing; }
                    .plan-block-card.drag-over {
                        border-color: var(--accent-purple) !important;
                        transform: scale(1.03);
                        box-shadow: 0 0 40px rgba(139,92,246,0.25);
                    }
                    .plan-block-card.dragging {
                        opacity: 0.4;
                    }
                    .plan-feature-chip {
                        display: inline-flex; align-items: center; gap: 4px;
                        font-size: 0.6rem; background: rgba(255,255,255,0.04);
                        border: 1px solid rgba(255,255,255,0.08);
                        padding: 2px 8px; border-radius: 20px;
                        color: var(--text-gray);
                    }
                    .plan-view-toggle.active {
                        background: var(--accent-purple) !important;
                        color: white !important;
                        border-color: var(--accent-purple) !important;
                    }
                    .compare-row:hover { background: rgba(255,255,255,0.03); }
                </style>

                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">💎 Planes de Membresía</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${plans.length} planes • $${totalRevenue.toLocaleString()}/mes • ARPU $${Math.round(avgArpu).toLocaleString()}</p>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:4px 12px;">
                            <i data-lucide="search" style="width:14px; color:var(--text-gray);"></i>
                            <input type="text" id="plan-search-input" placeholder="Buscar plan..." style="background:transparent; border:none; color:white; font-size:0.8rem; outline:none; width:140px;">
                        </div>
                        <button class="btn-action-glow" id="btn-add-plan-admin"><i data-lucide="plus"></i> Plan</button>
                    </div>
                </div>

                <!-- KPIs -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
                    <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${totalUsers}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SOCIOS ACTIVOS</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">$${totalRevenue.toLocaleString()}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">INGRESO MENSUAL</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#fbbf24;">${plans.length}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">PLANES</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-cyan);">$${Math.round(avgArpu).toLocaleString()}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">ARPU PROMEDIO</span>
                    </div>
                </div>

                <!-- Charts & Distribution -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:25px;">
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px;">
                        <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="pie-chart" style="width:14px; color:var(--accent-purple);"></i> Distribución de Socios
                        </h4>
                        <div style="height:160px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="plans-distribution-chart"></canvas>
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px;">
                        <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="bar-chart-2" style="width:14px; color:#22c55e;"></i> Ingreso por Plan
                        </h4>
                        <div style="height:160px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="plans-revenue-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- View Toggle -->
                <div style="display:flex; gap:8px; margin-bottom:16px; align-items:center;">
                    <span style="font-size:0.7rem; color:var(--text-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Vista:</span>
                    <button class="plan-view-toggle active btn-glass-small" data-view="cards" style="font-size:0.75rem; padding:6px 14px;">
                        <i data-lucide="layout-grid" style="width:12px; margin-right:4px;"></i> Tarjetas
                    </button>
                    <button class="plan-view-toggle btn-glass-small" data-view="compare" style="font-size:0.75rem; padding:6px 14px;">
                        <i data-lucide="columns" style="width:12px; margin-right:4px;"></i> Comparar
                    </button>
                    <div style="flex:1;"></div>
                    <span style="font-size:0.65rem; color:var(--text-gray); opacity:0.6;"><i data-lucide="move" style="width:10px; vertical-align:middle;"></i> Arrastra para reordenar</span>
                </div>

                <!-- Cards View -->
                <div id="plans-cards-view">
                    <div id="plans-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
                        ${planMetrics.map((p, idx) => {
            const theme = themeColors[p.theme] || themeColors.bronze;
            const isMostPopular = mostPopularPlan && p.id === mostPopularPlan.id;
            const popularBadge = p.popular || isMostPopular
                ? `<span style="position:absolute; top:-8px; right:12px; background:linear-gradient(135deg, #8b5cf6, #a855f7); color:white; font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 4px 15px rgba(139,92,246,0.4); display:flex; align-items:center; gap:4px;"><i data-lucide="flame" style="width:10px;"></i> ${isMostPopular && !p.popular ? 'Más Popular' : 'Popular'}</span>`
                : '';
            const featuresHtml = p._features.length > 0
                ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:14px;">${p._features.slice(0, 4).map(f => `<span class="plan-feature-chip"><i data-lucide="check" style="width:8px; color:${theme.accent};"></i> ${f}</span>`).join('')}${p._features.length > 4 ? `<span class="plan-feature-chip">+${p._features.length - 4}</span>` : ''}</div>`
                : '';
            const descriptionHtml = p.description
                ? `<p style="font-size:0.7rem; color:var(--text-gray); margin-bottom:12px; line-height:1.4; opacity:0.7;">${p.description}</p>`
                : '';
            return `
                            <div class="plan-block-card" draggable="true" data-plan-id="${p.id}" data-idx="${idx}" data-name="${p.name.toLowerCase()}"
                                 style="position:relative; background:${theme.gradient}; border:1px solid ${theme.border}; border-radius:20px; padding:22px; opacity:0; animation: planFadeIn 0.5s ease forwards ${idx * 0.08}s;">
                                ${popularBadge}
                                <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
                                    <div style="width:48px; height:48px; border-radius:14px; background:${theme.bg}; border:1px solid ${theme.border}; display:flex; align-items:center; justify-content:center;">
                                        <i data-lucide="${theme.icon}" style="width:24px; color:${theme.accent};"></i>
                                    </div>
                                    <div style="flex:1; min-width:0;">
                                        <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:${theme.accent}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</h4>
                                        <span style="font-size:0.7rem; opacity:0.5; font-weight:600;">${p.monthly || 0} clases/mes • Límite ${p.limit || '∞'}</span>
                                    </div>
                                    <div style="text-align:right; flex-shrink:0;">
                                        <div style="font-size:1.4rem; font-weight:900;">$${Number(p.price || 0).toLocaleString()}</div>
                                        <div style="font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700;">/MES</div>
                                    </div>
                                </div>

                                ${descriptionHtml}
                                ${featuresHtml}

                                <div style="margin-bottom:14px;">
                                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:5px; opacity:0.7;">
                                        <span>Ocupación</span>
                                        <span style="font-weight:700;">${p._capacityUsed}%</span>
                                    </div>
                                    <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                                        <div style="height:100%; width:${p._capacityUsed}%; background:linear-gradient(90deg, ${theme.accent}, ${theme.accent}88); border-radius:10px; transition:width 1s cubic-bezier(0.34,1.56,0.64,1);"></div>
                                    </div>
                                </div>

                                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:14px;">
                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                        <span style="display:block; font-size:0.55rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Socios</span>
                                        <strong style="font-size:1rem; color:white;">${p._activeCount}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                        <span style="display:block; font-size:0.55rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Ingreso</span>
                                        <strong style="font-size:1rem; color:#22c55e;">$${p._monthlyRevenue.toLocaleString()}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                        <span style="display:block; font-size:0.55rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">ARPU</span>
                                        <strong style="font-size:1rem; color:var(--accent-cyan);">$${Math.round(p._arpu).toLocaleString()}</strong>
                                    </div>
                                </div>

                                <div style="display:flex; gap:6px;">
                                    <button class="edit-plan-btn btn-glass-small" data-id="${p.id}" style="flex:1; justify-content:center; font-size:0.7rem;">
                                        <i data-lucide="edit-3" style="width:12px; margin-right:3px;"></i> Editar
                                    </button>
                                    <button class="view-plan-users-btn btn-glass-small" data-plan="${p.name}" style="flex:1; justify-content:center; font-size:0.7rem; border-color:var(--accent-purple); color:var(--accent-purple);">
                                        <i data-lucide="users" style="width:12px; margin-right:3px;"></i> Socios
                                    </button>
                                    <button class="delete-plan-btn btn-glass-small delete" data-id="${p.id}" style="width:36px; justify-content:center;">
                                        <i data-lucide="trash-2" style="width:12px;"></i>
                                    </button>
                                </div>
                            </div>`;
        }).join('')}
                    </div>
                </div>

                <!-- Compare View (Hidden by default) -->
                <div id="plans-compare-view" class="hidden" style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.8rem; min-width:600px;">
                        <thead>
                            <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
                                <th style="padding:12px; text-align:left; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Plan</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Precio</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Clases/mes</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Socios</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Ingreso</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Ocupación</th>
                                <th style="padding:12px; text-align:left; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Características</th>
                                <th style="padding:12px; text-align:right; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planMetrics.map(p => {
            const theme = themeColors[p.theme] || themeColors.bronze;
            return `
                                <tr class="compare-row" style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;">
                                    <td style="padding:12px;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="width:32px; height:32px; border-radius:8px; background:${theme.bg}; border:1px solid ${theme.border}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                                <i data-lucide="${theme.icon}" style="width:14px; color:${theme.accent};"></i>
                                            </div>
                                            <div>
                                                <strong style="font-size:0.85rem; color:${theme.accent};">${p.name}</strong>
                                                ${p.popular ? '<span style="font-size:0.6rem; background:linear-gradient(135deg,#8b5cf6,#a855f7); color:white; padding:1px 6px; border-radius:10px; margin-left:4px;">Popular</span>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding:12px; text-align:center; font-weight:800;">$${Number(p.price || 0).toLocaleString()}</td>
                                    <td style="padding:12px; text-align:center;">${p.monthly || 0}</td>
                                    <td style="padding:12px; text-align:center;"><strong style="color:white;">${p._activeCount}</strong></td>
                                    <td style="padding:12px; text-align:center; color:#22c55e; font-weight:700;">$${p._monthlyRevenue.toLocaleString()}</td>
                                    <td style="padding:12px; text-align:center;">
                                        <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                                            <div style="width:50px; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                                                <div style="width:${p._capacityUsed}%; height:100%; background:${theme.accent}; border-radius:2px;"></div>
                                            </div>
                                            <span style="font-size:0.7rem;">${p._capacityUsed}%</span>
                                        </div>
                                    </td>
                                    <td style="padding:12px;">
                                        <div style="display:flex; flex-wrap:wrap; gap:3px;">
                                            ${p._features.slice(0, 3).map(f => `<span class="plan-feature-chip">${f}</span>`).join('')}
                                            ${p._features.length > 3 ? `<span class="plan-feature-chip">+${p._features.length - 3}</span>` : ''}
                                        </div>
                                    </td>
                                    <td style="padding:12px; text-align:right;">
                                        <div style="display:flex; gap:4px; justify-content:flex-end;">
                                            <button class="edit-plan-btn btn-glass-small" data-id="${p.id}" style="padding:3px 8px; font-size:0.65rem;"><i data-lucide="edit-3" style="width:10px;"></i></button>
                                            <button class="delete-plan-btn btn-glass-small delete" data-id="${p.id}" style="padding:3px 8px; font-size:0.65rem;"><i data-lucide="trash-2" style="width:10px;"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        window.lucide.createIcons();

        // Render charts
        renderPlansCharts(sortedForChart, themeColors);

        // Search filter
        const searchInput = document.getElementById('plan-search-input');
        if (searchInput) {
            searchInput.oninput = () => {
                const term = searchInput.value.toLowerCase().trim();
                document.querySelectorAll('.plan-block-card').forEach(card => {
                    const name = card.getAttribute('data-name');
                    card.style.display = (!term || name.includes(term)) ? '' : 'none';
                });
            };
        }

        // View toggle
        document.querySelectorAll('.plan-view-toggle').forEach(btn => {
            btn.onclick = () => {
                const view = btn.getAttribute('data-view');
                document.querySelectorAll('.plan-view-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('plans-cards-view').classList.toggle('hidden', view !== 'cards');
                document.getElementById('plans-compare-view').classList.toggle('hidden', view !== 'compare');
                window.lucide.createIcons();
            };
        });

        document.getElementById('btn-add-plan-admin').onclick = () => openPlanModal();
        document.querySelectorAll('.edit-plan-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const targetPlan = plans.find(p => p.id == id);
                if (targetPlan) openPlanModal(id, plans);
                else window.showToast("Plan no encontrado", "#ef4444");
            };
        });
        document.querySelectorAll('.delete-plan-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                deletePlan(btn.getAttribute('data-id'));
            };
        });
        document.querySelectorAll('.view-plan-users-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const planName = btn.getAttribute('data-plan');
                // Trigger members view with plan filter
                import('./members.js').then(m => {
                    if (m.renderAdminMembers) {
                        // Set filter and render
                        window.showToast(`Filtrando socios del plan: ${planName}`, '#8b5cf6');
                        m.renderAdminMembers();
                    }
                });
            };
        });

        // Drag & Drop
        const grid = document.getElementById('plans-grid');
        let draggedIdx = null;

        grid.querySelectorAll('.plan-block-card').forEach(card => {
            card.ondragstart = (e) => {
                draggedIdx = parseInt(card.getAttribute('data-idx'));
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            };
            card.ondragend = () => {
                card.classList.remove('dragging');
                grid.querySelectorAll('.plan-block-card').forEach(c => c.classList.remove('drag-over'));
            };
            card.ondragover = (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            };
            card.ondragleave = () => {
                card.classList.remove('drag-over');
            };
            card.ondrop = (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const targetIdx = parseInt(card.getAttribute('data-idx'));
                if (draggedIdx !== null && draggedIdx !== targetIdx) {
                    const planId = plans[draggedIdx]?.id;
                    if (planId) movePlanAdmin(planId, targetIdx);
                }
            };
        });

    } catch (err) {
        console.error(err);
        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar planes</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${err.message || 'Ocurrió un problema al obtener los datos.'}</p>
                <button onclick="renderAdminPlans()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`;
        window.lucide.createIcons();
    }
};

const renderPlansCharts = (planMetrics, themeColors) => {
    const distCtx = document.getElementById('plans-distribution-chart');
    const revCtx = document.getElementById('plans-revenue-chart');

    if (distCtx && planMetrics.length > 0) {
        if (window._plansDistChart) window._plansDistChart.destroy();
        const colors = planMetrics.map(p => (themeColors[p.theme] || themeColors.bronze).accent);
        window._plansDistChart = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: planMetrics.map(p => p.name),
                datasets: [{
                    data: planMetrics.map(p => p._activeCount),
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,13,18,0.95)',
                        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} socios` }
                    }
                }
            }
        });
    }

    if (revCtx && planMetrics.length > 0) {
        if (window._plansRevChart) window._plansRevChart.destroy();
        const colors = planMetrics.map(p => (themeColors[p.theme] || themeColors.bronze).accent);
        window._plansRevChart = new Chart(revCtx, {
            type: 'bar',
            data: {
                labels: planMetrics.map(p => p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name),
                datasets: [{
                    label: 'Ingreso ($)',
                    data: planMetrics.map(p => p._monthlyRevenue),
                    backgroundColor: colors.map(c => c + '88'),
                    borderColor: colors,
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
                        callbacks: { label: (ctx) => ` Ingreso: $${ctx.raw.toLocaleString('es-CL')}` }
                    }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                    y: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 }, callback: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
};

export const renderAdminAttendance = async () => {
    // ── Skeleton Loading Screen ───────────────────────────────────────────
    getAdminContent().innerHTML = `
        <div class="glass-premium p-20" id="attendance-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:220px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:140px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:120px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:25px;">
                <div style="width:60px; height:32px; background:rgba(255,255,255,0.08); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="width:80px; height:32px; background:rgba(255,255,255,0.06); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="width:60px; height:32px; background:rgba(255,255,255,0.06); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="width:60px; height:32px; background:rgba(255,255,255,0.06); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:25px;">
                <div style="height:70px; background:rgba(255,255,255,0.05); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.05); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.05); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;

    try {
        // Fetch all reservations with profile join
        const { data: allReservations, error } = await window.supabase
            .from('reservations')
            .select('*, profiles(full_name, email)')
            .order('reservation_date', { ascending: false })
            .limit(800);
        if (error) throw error;

        // ---- Render a period view ----
        const renderPeriod = (period, searchTerm = '') => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentDayIndex = now.getDay();

            // 1. Filter reservations by period
            let filteredReservations = [];
            if (period === 'today') {
                filteredReservations = allReservations.filter(r => r.reservation_date === today);
            } else if (period === 'week') {
                const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
                filteredReservations = allReservations.filter(r => new Date(r.reservation_date) >= weekAgo);
            } else if (period === 'month') {
                const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
                filteredReservations = allReservations.filter(r => new Date(r.reservation_date) >= monthAgo);
            } else {
                filteredReservations = allReservations;
            }

            // 2. Grouping & Logic
            let displayGroups;

            if (period === 'today') {
                const todayClasses = window.appState.classes.filter(c => {
                    let cDays = c.days;
                    if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { console.warn('Caught empty error', e); } }
                    return Array.isArray(cDays) && cDays.includes(currentDayIndex);
                });

                displayGroups = todayClasses.map(cls => {
                    const attendees = filteredReservations
                        .filter(r => r.class_id === cls.id)
                        .map(r => ({
                            name: r.profiles?.full_name || r.user_name || 'Desconocido',
                            email: r.profiles?.email || ''
                        }));

                    return {
                        date: today,
                        classId: cls.id,
                        className: cls.name,
                        classTime: cls.time,
                        classType: cls.type,
                        classTheme: cls.theme,
                        attendees: attendees
                    };
                });
            } else {
                const groups = {};
                filteredReservations.forEach(r => {
                    const key = `${r.reservation_date}||${r.class_id}`;
                    if (!groups[key]) {
                        const cls = window.appState.classes.find(c => c.id === r.class_id) || {};
                        groups[key] = {
                            date: r.reservation_date,
                            classId: r.class_id,
                            className: r.class_name || cls.name || 'Clase',
                            classTime: r.class_time || cls.time || '',
                            classType: r.class_type || cls.type || '-',
                            classTheme: cls.theme || 'smoke-purple',
                            attendees: []
                        };
                    }
                    groups[key].attendees.push({
                        name: r.profiles?.full_name || r.user_name || 'Desconocido',
                        email: r.profiles?.email || ''
                    });
                });
                displayGroups = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
            }

            // Apply search filter to attendees
            const lowerSearch = searchTerm.toLowerCase().trim();
            if (lowerSearch) {
                displayGroups = displayGroups.map(g => ({
                    ...g,
                    attendees: g.attendees.filter(a =>
                        a.name.toLowerCase().includes(lowerSearch) ||
                        a.email.toLowerCase().includes(lowerSearch)
                    )
                })).filter(g => g.attendees.length > 0 || g.className.toLowerCase().includes(lowerSearch));
            }

            // 3. Stats Calculation
            const stats = {
                totalSessions: displayGroups.length,
                totalReservations: filteredReservations.length,
                uniqueSocio: new Set(filteredReservations.map(r => r.user_id)).size
            };

            // Average capacity calculation
            const avgCapacity = displayGroups.length > 0
                ? (displayGroups.reduce((a, g) => a + g.attendees.length, 0) / displayGroups.length).toFixed(1)
                : 0;

            // Top active users
            const userFreq = {};
            filteredReservations.forEach(r => {
                const name = r.profiles?.full_name || r.user_name || 'Desconocido';
                userFreq[name] = (userFreq[name] || 0) + 1;
            });
            const topUsers = Object.entries(userFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

            const typeColor = {
                'Striking': '#ef4444',
                'BJJ': '#8b5cf6',
                'MMA': '#f97316',
                'Funcional Fighter': '#22c55e',
                'BJJ Gi': '#8b5cf6',
                'No Gi': '#a855f7'
            };

            const avatar = (name) => {
                const parts = name.trim().split(' ');
                const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
                return initials.toUpperCase();
            };

            const formatDateHeader = (dateStr) => {
                const d = new Date(dateStr + 'T12:00:00');
                if (dateStr === today) return 'HOY';
                return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
            };

            // --- SMART INSIGHTS ---
            let insightsHTML = '';
            if ((period === 'month' || period === 'all') && filteredReservations.length > 0) {
                const userCounts = {};
                const dayCounts = {};
                let thisWeekCount = 0;
                let lastWeekCount = 0;

                const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                filteredReservations.forEach(r => {
                    const rd = new Date(r.reservation_date);
                    if (!userCounts[r.user_id]) userCounts[r.user_id] = 0;
                    userCounts[r.user_id]++;

                    const dIndex = rd.getDay();
                    if (!dayCounts[dIndex]) dayCounts[dIndex] = 0;
                    dayCounts[dIndex]++;

                    if (rd >= weekAgo) thisWeekCount++;
                    else if (rd >= twoWeeksAgo && rd < weekAgo) lastWeekCount++;
                });

                const daysArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                let bestDayIdx = Object.keys(dayCounts).sort((a, b) => dayCounts[b] - dayCounts[a])[0];
                const bestDay = daysArr[bestDayIdx] || '-';
                const avgMonth = stats.totalReservations / Math.max(1, stats.uniqueSocio);
                const avgWeek = (avgMonth / 4).toFixed(1);

                let alertHtml = '';
                if (lastWeekCount > 0 && thisWeekCount < lastWeekCount * 0.8) {
                    alertHtml = `<div style="display:flex; gap:8px;"><i data-lucide="alert-triangle" style="color:#ef4444; width:16px;"></i> <span><strong>¡Alerta!</strong> La asistencia bajó un ${Math.round((1 - thisWeekCount / lastWeekCount) * 100)}% esta semana.</span></div>`;
                } else if (lastWeekCount > 0 && thisWeekCount > lastWeekCount * 1.1) {
                    alertHtml = `<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px;"></i> <span><strong>¡Súper!</strong> La asistencia subió esta semana respecto a la anterior.</span></div>`;
                }

                insightsHTML = `
                    <div class="glass" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 5px; color: #3b82f6; font-size: 0.9rem;">
                            <i data-lucide="activity" style="width: 16px;"></i> Inteligencia de Asistencia
                        </h4>
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.5; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display:flex; gap:8px;"><i data-lucide="calendar" style="color:#a855f7; width:16px;"></i> <span>El día más concurrido es el <strong>${bestDay}</strong>.</span></div>
                            <div style="display:flex; gap:8px;"><i data-lucide="user-check" style="color:#fbbf24; width:16px;"></i> <span>Frecuencia promedio: <strong>${avgWeek} clases/sem</strong> por alumno activo.</span></div>
                            ${alertHtml}
                        </div>
                    </div>`;
            }

            // 4. Generate HTML
            let lastDate = '';
            const groupsHTML = displayGroups.length === 0
                ? `<div style="text-align:center; padding:60px 0; opacity:0.3;">
                        <i data-lucide="calendar-off" style="width:50px; height:50px; margin-bottom:15px; display:block; margin-inline:auto;"></i>
                        <p>${searchTerm ? 'Ningún alumno coincide con la búsqueda.' : 'No se encontraron actividades registradas.'}</p>
                     </div>`
                : displayGroups.map((g, idx) => {
                    let header = '';
                    if (g.date !== lastDate) {
                        lastDate = g.date;
                        header = `<div class="att-date-divider" style="font-size:0.65rem; color:var(--text-gray); font-weight:800; letter-spacing:1px; margin: 15px 0 10px;">${formatDateHeader(g.date)}</div>`;
                    }
                    const color = typeColor[g.classType] || 'var(--accent-cyan)';
                    const attList = g.attendees.map(a => `
                        <div class="attendee-row" data-name="${a.name.toLowerCase()}" style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                            <div style="width:34px;height:34px;border-radius:10px;background:${color}11;border:1px solid ${color}22;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:${color};flex-shrink:0;">
                                ${avatar(a.name)}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:0.85rem; font-weight:600;">${a.name}</div>
                                <div style="font-size:0.7rem; opacity:0.4;">${a.email || 'socio@amaru.app'}</div>
                            </div>
                            <div style="width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 10px #22c55e77;"></div>
                        </div>
                    `).join('') || '<p style="font-size:0.75rem; opacity:0.4; text-align:center; padding:15px 0;">Nadie registrado todavía</p>';

                    return `
                        ${header}
                        <div class="att-panel-card" data-idx="${idx}" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; margin-bottom:12px; transition:0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer; overflow:hidden; opacity:0; animation: staggerFadeIn 0.4s ease forwards ${idx * 0.05}s;">
                            <div class="att-panel-header" style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px;">
                                <div style="display:flex; align-items:center; gap:15px; flex:1;">
                                    <div style="width:4px; height:35px; background:${color}; border-radius:4px;"></div>
                                    <div>
                                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                            <span style="font-size:0.65rem; font-weight:800; background:${color}22; color:${color}; padding:2px 8px; border-radius:20px; text-transform:uppercase;">${g.classType}</span>
                                            <span style="font-size:0.75rem; opacity:0.4;">${g.classTime}</span>
                                        </div>
                                        <h4 style="margin:0; font-size:1.05rem; font-weight:700;">${g.className}</h4>
                                    </div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-size:1.4rem; font-weight:900; color:${color}; line-height:1;">${g.attendees.length}</div>
                                    <div style="font-size:0.6rem; opacity:0.4; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">SOCIOS</div>
                                </div>
                                <i data-lucide="chevron-right" class="chevron-${idx}" style="margin-left:15px; width:18px; opacity:0.2; transition:0.3s;"></i>
                            </div>
                            <div id="att-detail-${idx}" style="display:none; padding: 0 20px 20px; border-top:1px solid rgba(255,255,255,0.03);">
                                <div style="margin-top:15px;">
                                    ${attList}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

            // Render Summary UI
            document.getElementById('att-period-content').innerHTML = `
                    ${insightsHTML}
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:12px; margin-bottom:25px;">
                        <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${stats.totalSessions}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SESIONES</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-cyan);">${stats.totalReservations}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">RESERVAS</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">${stats.uniqueSocio}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SOCIOS ÚNICOS</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#fbbf24;">${avgCapacity}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">PROMEDIO/CLASE</span>
                        </div>
                    </div>
                    ${topUsers.length > 0 ? `
                    <div style="margin-bottom:20px; padding:12px 15px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
                        <span style="font-size:0.7rem; color:var(--text-gray); font-weight:700; text-transform:uppercase; letter-spacing:1px;">🏆 Socios más activos</span>
                        <div style="display:flex; gap:15px; margin-top:8px; flex-wrap:wrap;">
                            ${topUsers.map((u, i) => `
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="font-size:0.9rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                    <span style="font-size:0.8rem; font-weight:600;">${u[0]}</span>
                                    <span style="font-size:0.7rem; color:var(--accent-cyan); font-weight:700;">${u[1]} asist.</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}
                    ${groupsHTML}
                `;
            window.lucide.createIcons();

            // Interactive Panels
            document.querySelectorAll('.att-panel-card').forEach(card => {
                card.onclick = (e) => {
                    if (e.target.closest('.attendee-row')) return;
                    const idx = card.getAttribute('data-idx');
                    const detail = document.getElementById(`att-detail-${idx}`);
                    const chevron = card.querySelector(`.chevron-${idx}`);
                    const isOpen = detail.style.display === 'block';

                    detail.style.display = isOpen ? 'none' : 'block';
                    if (chevron) {
                        chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
                        chevron.style.opacity = isOpen ? '0.2' : '0.6';
                    }
                    card.style.background = isOpen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)';
                    card.style.borderColor = isOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)';
                };
            });

            window._attExportData = { reservations: filteredReservations, groups: displayGroups, periodLabel: period };
        };

        // Main UI Wrapper
        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" id="attendance-main">
                <style>
                    @keyframes staggerFadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Control de Asistencia</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${allReservations.length} asistencias en historial</p>
                    </div>
                    <button id="btn-manual-attendance" class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; background: var(--accent-cyan); color: #000;">
                        <i data-lucide="plus-circle" style="width:16px; margin-right:5px; vertical-align:middle;"></i> Ingreso Manual
                    </button>
                </div>

                <div style="display:flex; gap:8px; margin-bottom:20px; background:rgba(255,255,255,0.03); padding:6px; border-radius:14px; width:fit-content;">
                    <button class="att-period-btn active" data-period="today" style="border:none; background:var(--accent-purple); color:white; padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Hoy</button>
                    <button class="att-period-btn" data-period="week" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Semana</button>
                    <button class="att-period-btn" data-period="month" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Mes</button>
                    <button class="att-period-btn" data-period="all" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Todo</button>
                </div>

                <div style="margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-gray); flex-shrink:0;"></i>
                        <input type="text" id="att-search-input" placeholder="Buscar alumno por nombre o email..." style="flex:1; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;">
                    </div>
                </div>

                <div id="att-period-content"></div>

                <div style="margin-top:30px; display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:15px; padding:15px;">
                    <select id="att-export-format" style="flex:1; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px; font-weight:600; outline:none;">
                        <option value="csv" style="color:black">Formato CSV</option>
                        <option value="xls" style="color:black">Formato EXCEL</option>
                        <option value="pdf" style="color:black">Formato PDF</option>
                    </select>
                    <button id="btn-export-attendance" class="btn-primary" style="padding:10px 25px; font-weight:800;">
                        <i data-lucide="download" style="width:16px; margin-right:8px; vertical-align:middle;"></i> EXPORTAR
                    </button>
                </div>
            </div>`;

        // Manual Attendance Logic
        const btnManual = document.getElementById('btn-manual-attendance');
        if (btnManual) {
            btnManual.onclick = async () => {
                try {
                    const profiles = await SupabaseService.getAllProfiles();
                    const classes = await SupabaseService.getClasses();

                    const usersOpts = profiles.map(p => `<option value="${p.id}">${p.full_name || p.email}</option>`).join('');
                    const classesOpts = classes.map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`).join('');

                    const { value: formValues } = await Swal.fire({
                        title: 'Ingreso Manual',
                        html: `
                            <div style="text-align: left; font-size: 0.9rem;">
                                <label>Usuario</label>
                                <select id="swal-manual-user" class="swal2-input" style="width: 100%; height: 40px; margin-bottom: 15px; background: rgba(0,0,0,0.1); color: white;">
                                    <option value="" disabled selected>Seleccionar Atleta</option>
                                    ${usersOpts}
                                </select>
                                <label>Clase</label>
                                <select id="swal-manual-class" class="swal2-input" style="width: 100%; height: 40px; margin-bottom: 15px; background: rgba(0,0,0,0.1); color: white;">
                                    <option value="" disabled selected>Seleccionar Clase</option>
                                    ${classesOpts}
                                </select>
                                <label>Fecha</label>
                                <input type="date" id="swal-manual-date" class="swal2-input" style="width: 100%; height: 40px; background: rgba(0,0,0,0.1); color: white;" value="${new Date().toISOString().split('T')[0]}">
                            </div>`,
                        focusConfirm: false,
                        showCancelButton: true,
                        confirmButtonText: 'Registrar',
                        cancelButtonText: 'Cancelar',
                        background: '#1f1f2e',
                        color: '#fff',
                        preConfirm: () => {
                            const user = document.getElementById('swal-manual-user').value;
                            const cls = document.getElementById('swal-manual-class').value;
                            const clsName = document.getElementById('swal-manual-class').options[document.getElementById('swal-manual-class').selectedIndex]?.text;
                            const date = document.getElementById('swal-manual-date').value;
                            if (!user || !cls || !date) {
                                Swal.showValidationMessage('Por favor completa todos los campos');
                                return false;
                            }
                            return { user, classId: cls, className: clsName, date };
                        }
                    });

                    if (formValues) {
                        Swal.fire({
                            title: 'Procesando...',
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                                const loader = Swal.getPopup().querySelector('.swal2-loader');
                                if (loader) loader.style.borderColor = 'var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent';
                            },
                            background: '#1f1f2e', color: '#fff'
                        });
                        try {
                            await SupabaseService.createReservation(formValues.user, formValues.classId, formValues.className, formValues.date);
                            Swal.close();
                            window.showToast("✅ Asistencia manual registrada con éxito", "#22c55e");
                            renderAdminAttendance();
                        } catch (err) {
                            Swal.close();
                            console.error("Error registrando asistencia manual:", err);
                            window.showToast("Error al registrar asistencia: " + (err.message || 'Error desconocido'), "#ef4444");
                        }
                    }
                } catch (e) {
                    console.error(e);
                    window.showToast("Error al cargar datos para ingreso manual", "#ef4444");
                }
            };
        }

        window.lucide.createIcons();

        let currentPeriod = 'today';
        renderPeriod(currentPeriod);

        // Tab logic
        document.querySelectorAll('.att-period-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.att-period-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-gray)';
                });
                e.target.classList.add('active');
                e.target.style.background = 'var(--accent-purple)';
                e.target.style.color = 'white';
                currentPeriod = e.target.getAttribute('data-period');
                const searchVal = document.getElementById('att-search-input')?.value || '';
                renderPeriod(currentPeriod, searchVal);
            };
        });

        // Search logic
        const searchInput = document.getElementById('att-search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.oninput = () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    renderPeriod(currentPeriod, searchInput.value);
                }, 250);
            };
        }

        // Export listener
        document.getElementById('btn-export-attendance').onclick = () => {
            const format = document.getElementById('att-export-format').value;
            const d = window._attExportData;
            if (!d || d.reservations.length === 0) return window.showToast("No hay datos para exportar", "#ef4444");

            const headers = ['Fecha', 'Clase', 'Horario', 'Alumno', 'Email'];
            const rows = [];
            d.groups.forEach(g => {
                g.attendees.forEach(a => {
                    rows.push([g.date, g.className, g.classTime, a.name, a.email]);
                });
            });
            exportToFormat(format, rows, headers, `Asistencia_${d.periodLabel}_Amaru`);
        };

    } catch (err) {
        console.error(err);
        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar asistencia</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${err.message || 'Ocurrió un problema al obtener los datos.'}</p>
                <button onclick="renderAdminAttendance()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`;
        window.lucide.createIcons();
    }
};

export const renderAdminDiscounts = async () => {
    const revSection = document.getElementById('admin-revenue-section');
    if (revSection) revSection.classList.add('hidden');

    getAdminContent().innerHTML = `
        <div class="glass-premium p-20" id="discounts-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:200px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:140px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px;">
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="height:200px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;

    try {
        const { data: codesData, error } = await window.supabase
            .from('discounts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        let codes = codesData || [];

        const { data: profilesData } = await window.supabase
            .from('profiles')
            .select('id, full_name, active_promo')
            .not('active_promo', 'is', null);
        const usersWithPromo = profilesData || [];

        // Metrics
        const totalUsersWithPromo = usersWithPromo.length;
        const avgDiscount = codes.length > 0 ? Math.round(codes.reduce((a, c) => a + c.percent, 0) / codes.length) : 0;
        const expiredCodes = codes.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;
        const activeCodes = codes.length - expiredCodes;

        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" id="discounts-main">
                <style>
                    @keyframes discountFadeIn {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Códigos de Descuento</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${codes.length} códigos • ${totalUsersWithPromo} socios con promo activa</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:20px;">
                    <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${codes.length}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">CÓDIGOS</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">${activeCodes}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">ACTIVOS</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#fbbf24;">${avgDiscount}%</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">PROMEDIO</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#ef4444;">${expiredCodes}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">EXPIRADOS</span>
                    </div>
                </div>

                <div class="admin-form glass mb-20" style="padding:20px; border-radius:16px; border:1px solid rgba(255,255,255,0.06);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                        <input type="text" id="new-promo-code" placeholder="CÓDIGO (ej. AMOR20)" class="input-glass" style="text-transform: uppercase;">
                        <input type="number" id="new-promo-perc" placeholder="% Dcto" class="input-glass" min="1" max="100">
                    </div>
                    <input type="date" id="new-promo-exp" class="input-glass" style="margin-bottom:12px;" title="Expiración (opcional)">
                    <div id="promo-plans-checkboxes" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                        ${window.appState.plans.map(p => `
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem; cursor:pointer; background:rgba(255,255,255,0.03); padding:5px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <input type="checkbox" class="promo-plan-checkbox" value="${p.id}">
                                ${p.name}
                            </label>
                        `).join('')}
                    </div>
                    <button class="btn-primary w-full" id="btn-create-promo" style="padding:10px;">Crear Código</button>
                </div>

                <div style="margin-bottom:15px;">
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-gray); flex-shrink:0;"></i>
                        <input type="text" id="discount-search-input" placeholder="Buscar código..." style="flex:1; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;">
                    </div>
                </div>

                <div id="discounts-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px;">
                    ${codes.length === 0 ? '<p class="opacity-50" style="grid-column:1/-1; text-align:center; padding:40px 0;">No hay códigos creados.</p>' : ''}
                    ${codes.map((c, idx) => {
            const activeUsers = usersWithPromo.filter(u => u.active_promo === c.code);
            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const daysToExpiry = c.expiresAt ? Math.ceil((new Date(c.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const statusColor = isExpired ? '#ef4444' : daysToExpiry && daysToExpiry <= 7 ? '#f59e0b' : '#22c55e';
            const statusText = isExpired ? 'EXPIRADO' : daysToExpiry && daysToExpiry <= 7 ? `Vence en ${daysToExpiry}d` : 'ACTIVO';
            return `
                        <div class="discount-card-item" data-code="${c.code.toLowerCase()}"
                             style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:18px; opacity:0; animation: discountFadeIn 0.4s ease forwards ${idx * 0.06}s;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                <div>
                                    <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:var(--accent-purple);">${c.code}</h4>
                                    <span style="font-size:0.7rem; opacity:0.5; font-weight:600;">${c.percent}% de descuento</span>
                                </div>
                                <span style="font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; background:${statusColor}22; color:${statusColor}; border:1px solid ${statusColor}33;">${statusText}</span>
                            </div>

                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
                                ${c.plans && c.plans.length > 0 ? c.plans.map(pid => {
                const p = window.appState.plans.find(x => x.id === pid);
                return `<span style="font-size:0.6rem; background:rgba(139,92,246,0.1); color:var(--accent-purple); padding:2px 8px; border-radius:6px; font-weight:700;">${p ? p.name : pid}</span>`;
            }).join('') : '<span style="font-size:0.6rem; background:rgba(255,255,255,0.05); color:var(--text-gray); padding:2px 8px; border-radius:6px; font-weight:700;">Todos los planes</span>'}
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                    <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Usuarios</span>
                                    <strong style="font-size:1rem; color:white;">${activeUsers.length}</strong>
                                </div>
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                    <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Ahorro</span>
                                    <strong style="font-size:1rem; color:#22c55e;">${c.percent}%</strong>
                                </div>
                            </div>

                            <div style="display:flex; gap:8px;">
                                ${activeUsers.length > 0 ? `
                                <button class="btn-glass-small" style="flex:1; justify-content:center; font-size:0.7rem;" onclick="this.nextElementSibling.classList.toggle('hidden');">
                                    <i data-lucide="users" style="width:12px; margin-right:4px;"></i> Ver ${activeUsers.length}
                                </button>
                                <div class="hidden" style="position:absolute; background:rgba(13,13,18,0.95); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; z-index:100; max-width:220px; backdrop-filter:blur(20px);">
                                    <p style="font-size:0.7rem; font-weight:700; margin-bottom:6px;">Usando este código:</p>
                                    ${activeUsers.map(u => `<div style="font-size:0.75rem; padding:3px 0;">${u.full_name || 'Usuario'}</div>`).join('')}
                                </div>` : ''}
                                <button class="btn-glass-small btn-edit-promo" data-id="${c.id}" style="width:40px; justify-content:center; color:#60a5fa;" title="Editar código">
                                    <i data-lucide="edit-2" style="width:14px;"></i>
                                </button>
                                <button class="btn-glass-small delete btn-delete-promo" data-id="${c.id}" style="width:40px; justify-content:center;" title="Eliminar código">
                                    <i data-lucide="trash-2" style="width:14px;"></i>
                                </button>
                            </div>
                        </div>`;
        }).join('')}
                </div>
            </div>`;

        window.lucide.createIcons();

        // Search
        const searchInput = document.getElementById('discount-search-input');
        if (searchInput) {
            searchInput.oninput = () => {
                const term = searchInput.value.toLowerCase();
                document.querySelectorAll('.discount-card-item').forEach(card => {
                    card.style.display = card.getAttribute('data-code').includes(term) ? '' : 'none';
                });
            };
        }

        // Edit state
        let editingDiscountId = null;

        // Edit button click
        document.querySelectorAll('.btn-edit-promo').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const discount = codes.find(x => x.id === id);
                if (!discount) return;

                editingDiscountId = id;
                document.getElementById('new-promo-code').value = discount.code;
                document.getElementById('new-promo-perc').value = discount.percent;
                if (discount.expiresAt) {
                    try {
                        document.getElementById('new-promo-exp').value = new Date(discount.expiresAt).toISOString().split('T')[0];
                    } catch {
                        document.getElementById('new-promo-exp').value = '';
                    }
                } else {
                    document.getElementById('new-promo-exp').value = '';
                }

                const selected = Array.isArray(discount.plans) ? discount.plans : [];
                document.querySelectorAll('.promo-plan-checkbox').forEach(cb => {
                    cb.checked = selected.length === 0 || selected.includes(cb.value);
                });

                const createBtn = document.getElementById('btn-create-promo');
                createBtn.textContent = 'Actualizar Código';
                createBtn.style.background = 'var(--accent-emerald, #22c55e)';
                document.getElementById('new-promo-code').scrollIntoView({ behavior: 'smooth' });
            };
        });

        // Create / Update
        document.getElementById('btn-create-promo').onclick = async () => {
            const code = document.getElementById('new-promo-code').value.trim().toUpperCase();
            const percent = parseInt(document.getElementById('new-promo-perc').value);
            const expStr = document.getElementById('new-promo-exp').value;
            const checked = document.querySelectorAll('.promo-plan-checkbox:checked');
            const totalCbs = document.querySelectorAll('.promo-plan-checkbox').length;
            const selectedPlans = Array.from(checked).map(cb => cb.value);

            if (!code || isNaN(percent) || percent <= 0 || percent > 100) {
                return window.showToast("Código o porcentaje inválido", "#ef4444");
            }

            const payload = { 
                code, 
                percent, 
                plans: (selectedPlans.length > 0 && selectedPlans.length < totalCbs) ? selectedPlans : null, 
                expiresAt: expStr ? new Date(expStr + 'T23:59:59').toISOString() : null 
            };

            try {
                if (editingDiscountId) {
                    const { error: upErr } = await window.supabase.from('discounts').update(payload).eq('id', editingDiscountId);
                    if (upErr) throw upErr;
                    window.showToast(`Código ${code} actualizado ✅`, "#22c55e");
                } else {
                    if (codes.find(c => c.code === code)) {
                        return window.showToast("Ese código ya existe", "#ef4444");
                    }
                    const { error: insErr } = await window.supabase.from('discounts').insert(payload);
                    if (insErr) throw insErr;
                    window.showToast(`Código ${code} creado ✅`, "#22c55e");
                }
                editingDiscountId = null;
                renderAdminDiscounts();
            } catch (err) {
                console.error(err);
                window.showToast("Error al guardar código", "#ef4444");
            }
        };

        // Delete
        document.querySelectorAll('.btn-delete-promo').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm("¿Eliminar este código? Los usuarios perderán el descuento.")) {
                    try {
                        const { error: delErr } = await window.supabase.from('discounts').delete().eq('id', btn.getAttribute('data-id'));
                        if (delErr) throw delErr;
                        window.showToast("Código eliminado");
                        renderAdminDiscounts();
                    } catch (err) {
                        window.showToast("Error al eliminar", "#ef4444");
                    }
                }
            };
        });

    } catch (err) {
        console.error(err);
        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar descuentos</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${err.message || 'Ocurrió un problema.'}</p>
                <button onclick="renderAdminDiscounts()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`;
        window.lucide.createIcons();
    }
};

export const renderAdminNotifications = () => {
    const revSection = document.getElementById('admin-revenue-section');
    if (revSection) revSection.classList.add('hidden');

    getAdminContent().innerHTML = `
        <div class="glass-premium p-20" id="notifs-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:180px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:120px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:120px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="height:80px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:80px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:80px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;

    const loadAdminNotifs = async () => {
        try {
            const notices = await SupabaseService.getNotifications();

            // Metrics
            const typeCounts = {};
            notices.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });
            const totalNotifs = notices.length;
            const latestNotif = notices.length > 0 ? new Date(Math.max(...notices.map(n => new Date(n.created_at)))) : null;

            const typeConfig = {
                info: { color: 'var(--accent-cyan)', label: 'INFO', icon: 'bell', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
                alert: { color: '#ef4444', label: 'URGENTE', icon: 'alert-triangle', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
                calendar: { color: '#f59e0b', label: 'FECHA', icon: 'calendar', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' }
            };

            getAdminContent().innerHTML = `
                <div class="glass-premium p-20" id="notifs-main">
                    <style>
                        @keyframes notifFadeIn {
                            from { opacity: 0; transform: translateX(-10px); }
                            to { opacity: 1; transform: translateX(0); }
                        }
                    </style>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                        <div>
                            <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Avisos Globales</h2>
                            <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${totalNotifs} avisos publicados ${latestNotif ? '• Último: ' + latestNotif.toLocaleDateString() : ''}</p>
                        </div>
                        <button id="btn-create-notification" class="btn-primary" style="padding:8px 18px; font-size:0.85rem;">
                            <i data-lucide="plus" style="width:16px; margin-right:5px; vertical-align:middle;"></i> NUEVO AVISO
                        </button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:10px; margin-bottom:20px;">
                        <div class="stat-mini-premium" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-cyan);">${totalNotifs}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">TOTAL</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#ef4444;">${typeCounts.alert || 0}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">URGENTES</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#f59e0b;">${typeCounts.calendar || 0}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">FECHAS</span>
                        </div>
                    </div>

                    <div id="notifs-list" style="display:flex; flex-direction:column; gap:12px;">
                        ${notices.length === 0 ? '<p class="opacity-50" style="text-align:center; padding:40px 0;">No hay avisos globales activos.</p>' : ''}
                        ${notices.map((n, idx) => {
                const cfg = typeConfig[n.type] || typeConfig.info;
                const isLong = n.message && n.message.length > 120;
                return `
                            <div class="notif-card-item" data-notif-id="${n.id}"
                                 style="background:${cfg.bg}; border:1px solid ${cfg.border}; border-radius:16px; padding:18px; opacity:0; animation: notifFadeIn 0.4s ease forwards ${idx * 0.07}s; transition: all 0.3s; cursor:pointer;"
                                 onmouseover="this.style.transform='translateX(4px)'; this.style.borderColor='${cfg.color}55';"
                                 onmouseout="this.style.transform='translateX(0)'; this.style.borderColor='${cfg.border}';">
                                <div style="display:flex; align-items:flex-start; gap:14px;">
                                    <div style="width:40px; height:40px; border-radius:10px; background:${cfg.color}11; border:1px solid ${cfg.color}22; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                        <i data-lucide="${cfg.icon}" style="width:20px; color:${cfg.color};"></i>
                                    </div>
                                    <div style="flex:1; min-width:0;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                            <h4 style="margin:0; font-size:0.95rem; font-weight:800;">${n.title || 'Sin título'}</h4>
                                            <span style="font-size:0.6rem; font-weight:800; padding:2px 8px; border-radius:20px; background:${cfg.color}22; color:${cfg.color};">${cfg.label}</span>
                                        </div>
                                        <p class="notif-message" style="font-size:0.8rem; color:rgba(255,255,255,0.7); margin:0; line-height:1.4; ${isLong ? 'display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;' : ''}">${n.message || ''}</p>
                                        ${isLong ? `<span class="notif-expand" style="font-size:0.7rem; color:var(--accent-purple); cursor:pointer; margin-top:4px; display:inline-block;">Ver más...</span>` : ''}
                                        <span style="display:block; font-size:0.65rem; color:var(--text-gray); margin-top:8px; opacity:0.6;">${new Date(n.created_at).toLocaleString()}</span>
                                    </div>
                                    <button class="btn-delete-notif btn-glass-small delete" data-id="${n.id}" style="flex-shrink:0; width:36px; height:36px; justify-content:center; padding:0;">
                                        <i data-lucide="trash-2" style="width:14px;"></i>
                                    </button>
                                </div>
                            </div>`;
            }).join('')}
                    </div>
                </div>

                <!-- Modal -->
                <div id="modal-notif" class="overlay">
                    <div class="glass" style="max-width: 500px; padding: 30px; border-radius: 20px; width: 90%;">
                        <h3>Publicar Aviso Global</h3>
                        <div class="form-group mt-20">
                            <label>Título</label>
                            <input type="text" id="notif-title" placeholder="Ej: Clase Especial de Seminario">
                        </div>
                        <div class="form-group mt-15">
                            <label>Tipo</label>
                            <select id="notif-type" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                                <option value="info" style="color: black;">Aviso General</option>
                                <option value="calendar" style="color: black;">Recordatorio</option>
                                <option value="alert" style="color: black;">Alerta Urgente</option>
                            </select>
                        </div>
                        <div class="form-group mt-15">
                            <label>Mensaje</label>
                            <textarea id="notif-message" rows="4" placeholder="Detalles importantes..." style="resize: vertical; min-height: 80px;"></textarea>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 25px;">
                            <button id="btn-save-notif" class="btn-primary" style="flex:1;">PUBLICAR</button>
                            <button id="btn-close-notif" class="btn-secondary" style="flex:1;">CANCELAR</button>
                        </div>
                    </div>
                </div>`;

            window.lucide.createIcons();

            // Expand long messages
            document.querySelectorAll('.notif-expand').forEach(span => {
                span.onclick = () => {
                    const msg = span.previousElementSibling;
                    if (msg.style.webkitLineClamp === 'unset') {
                        msg.style.webkitLineClamp = '2';
                        span.textContent = 'Ver más...';
                    } else {
                        msg.style.webkitLineClamp = 'unset';
                        span.textContent = 'Ver menos';
                    }
                };
            });

            // Delete
            document.querySelectorAll('.btn-delete-notif').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    if (confirm('¿Eliminar este aviso global?')) {
                        window.showToast('Eliminando...', '#f59e0b');
                        await SupabaseService.deleteNotification(id);
                        window.showToast('Aviso eliminado.', '#ef4444');
                        loadAdminNotifs();
                    }
                };
            });

            // Modal
            const modal = document.getElementById('modal-notif');
            document.getElementById('btn-create-notification').onclick = () => {
                document.getElementById('notif-title').value = '';
                document.getElementById('notif-message').value = '';
                document.getElementById('notif-type').value = 'info';
                modal.classList.add('active');
            };
            document.getElementById('btn-close-notif').onclick = () => modal.classList.remove('active');
            document.getElementById('btn-save-notif').onclick = async () => {
                const title = document.getElementById('notif-title').value.trim();
                const msg = document.getElementById('notif-message').value.trim();
                const type = document.getElementById('notif-type').value;
                if (!title || !msg) return window.showToast("Completa título y mensaje.", "#ef4444");
                try {
                    window.showToast("Publicando...", "#f59e0b");
                    await SupabaseService.addNotification(title, msg, type);
                    window.showToast("Aviso publicado ✅", "#22c55e");
                    modal.classList.remove('active');
                    loadAdminNotifs();
                } catch (err) {
                    window.showToast("Error publicando", "#ef4444");
                }
            };

        } catch (err) {
            console.error(err);
            getAdminContent().innerHTML = `
                <div class="glass-premium p-20" style="text-align:center;">
                    <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                    <h3 style="margin-bottom:8px;">Error al cargar avisos</h3>
                    <p style="opacity:0.6; margin-bottom:20px;">${err.message || 'Ocurrió un problema.'}</p>
                    <button onclick="renderAdminNotifications()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
                </div>`;
            window.lucide.createIcons();
        }
    };

    loadAdminNotifs();
};

