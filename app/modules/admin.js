import { exportToFormat, exportUserData } from '../utils/exportUtils.js';
import unknowAvatar from '../images/unknow.png';
const Swal = window.Swal;
let coverageMonthStr = '';

import { SupabaseService } from '../services/supabaseService.js';
import { openClassModal, openPlanModal, openMemberModal, deleteClass, deletePlan, deleteMember } from './adminModals.js';
import { renderAdminMembers } from './members.js';


const getAdminContent = () => document.getElementById('admin-content-area');

export const renderAdminActiveUsers = async (filterType = 'active') => {
    // Delegate to the new v2.0 members module
    await renderAdminMembers();
};

const _renderAdminActiveUsersOld = async (filterType = 'active') => {
    const area = document.getElementById('admin-content-area');
    const revSection = document.getElementById('admin-revenue-section');
    if (revSection) revSection.classList.add('hidden');
    area.innerHTML = `<div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando socios...</div>`;
    window.lucide.createIcons();
    try {
        const users = await SupabaseService.getAllProfiles();
        const allReservations = await SupabaseService.getAllReservations();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Pre-compute logic for filtering
        const processedUsers = users.map(u => {
            const expiryDate = u.membership_expiry ? new Date(u.membership_expiry) : null;
            const diffTime = expiryDate ? expiryDate - now : null;
            const daysLeft = expiryDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;
            const totalDays = 30;
            const progress = expiryDate ? Math.max(0, Math.min(100, ((totalDays - (daysLeft || 0)) / totalDays) * 100)) : 0;
            const isNearExpiry = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;

            // Reservation Stats
            const userRes = allReservations.filter(r => r.user_id === u.id);
            userRes.sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date));
            const lastAttendance = userRes.length > 0 ? new Date(userRes[0].reservation_date) : null;
            const daysSinceLastAttendance = lastAttendance ? Math.floor((now - lastAttendance) / (1000 * 60 * 60 * 24)) : -1;

            const totalRes = userRes.length;
            const monthRes = userRes.filter(r => {
                const rDate = new Date(r.reservation_date);
                return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
            }).length;

            const planLimit = u.membership_plans?.monthly || 0;
            const remainingRes = Math.max(0, planLimit - monthRes);

            // Advanced Status Logic
            let status = "Activo";
            let statusColor = "#22c55e"; // Green
            let statusBg = "rgba(34, 197, 94, 0.15)";

            if (u.is_frozen) {
                status = "Congelado";
                statusColor = "#3b82f6";
                statusBg = "rgba(59, 130, 246, 0.15)";
            } else if (u.membership_status === 'inactive') {
                status = "Inactivo";
                statusColor = "#ef4444"; // Red
                statusBg = "rgba(239, 68, 68, 0.15)";
            } else if (daysLeft !== null && daysLeft <= 0) {
                if (daysLeft > -30) {
                    status = "Moroso";
                    statusColor = "#f97316"; // Orange
                    statusBg = "rgba(249, 115, 22, 0.15)";
                } else {
                    status = "Inactivo";
                    statusColor = "#ef4444"; // Red
                    statusBg = "rgba(239, 68, 68, 0.15)";
                }
            } else if (daysLeft === null && u.membership_status !== 'active') {
                status = "Inactivo";
                statusColor = "#ef4444"; // Red
                statusBg = "rgba(239, 68, 68, 0.15)";
            }

            return {
                ...u,
                _computedStatus: status,
                _statusColor: statusColor,
                _statusBg: statusBg,
                _expiryDate: expiryDate,
                _daysLeft: daysLeft,
                _progress: progress,
                _isNearExpiry: isNearExpiry,
                _userRes: userRes,
                _lastAttendance: lastAttendance,
                _daysSinceLastAttendance: daysSinceLastAttendance,
                _totalRes: totalRes,
                _monthRes: monthRes,
                _planLimit: planLimit,
                _remainingRes: remainingRes
            };
        });

        const filteredUsers = processedUsers.filter(u => {
            if (filterType === 'all') return true;
            if (filterType === 'active') return u._computedStatus === 'Activo';
            if (filterType === 'inactive') return u._computedStatus === 'Inactivo';
            if (filterType === 'debtor') return u._computedStatus === 'Moroso';
            if (filterType === 'frozen') return u._computedStatus === 'Congelado';
            if (filterType === 'migration') return !u.membership_plan_id || !u.membership_expiry;
            return true;
        });

        getAdminContent().innerHTML = `
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <h3>Control de Socios (${filteredUsers.length})</h3>
                        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                            <div style="display:flex; align-items:center; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px; border: 1px solid var(--glass-border);">
                                <i data-lucide="filter" style="width:14px; height:14px; color:var(--text-gray);"></i>
                                <select id="filter-status-users" style="background: transparent; color: white; border: none; font-size: 0.75rem; font-weight: 600; outline: none; cursor:pointer;">
                                    <option value="all" ${filterType === 'all' ? 'selected' : ''} style="color: black;">Todos</option>
                                    <option value="active" ${filterType === 'active' ? 'selected' : ''} style="color: black;">Activos</option>
                                    <option value="inactive" ${filterType === 'inactive' ? 'selected' : ''} style="color: black;">Inactivos</option>

                                    <option value="migration" ${filterType === 'migration' ? 'selected' : ''} style="color: black;">Migración (Revisar)</option>
                                    <option value="debtor" ${filterType === 'debtor' ? 'selected' : ''} style="color: black;">Morosos</option>
                                    <option value="frozen" ${filterType === 'frozen' ? 'selected' : ''} style="color: black;">Congelados</option>
                                </select>
                            </div>
                            
                            <div style="display:flex; align-items:center; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 8px; border: 1px solid var(--glass-border);">
                                <select id="export-format-users" style="background: transparent; color: var(--text-gray); border: none; font-size: 0.75rem; font-weight: 600; outline: none; padding-left: 5px; cursor:pointer;">
                                    <option value="csv" style="color: black;">CSV</option>
                                    <option value="xls" style="color: black;">XLS</option>
                                    <option value="pdf" style="color: black;">PDF</option>
                                </select>
                                <button id="btn-export-users" class="btn-primary" style="padding: 4px 12px; font-size: 0.70rem; border-radius: 6px;">
                                    Exportar
                                </button>
                            </div>
                            <button class="btn-action-glow" id="btn-add-member-admin" style="width: 32px; height: 32px;"><i data-lucide="user-plus" style="width: 16px;"></i></button>
                        </div>
                    </div>

                    <div class="admin-list-container">
                        ${filteredUsers.length === 0 ? '<p class="opacity-50">No hay socios que coincidan con el filtro.</p>' : filteredUsers.map(u => {
            const expiryDate = u._expiryDate;
            const daysLeft = u._daysLeft;
            const progress = u._progress;
            const isNearExpiry = u._isNearExpiry;
            const lastAttendance = u._lastAttendance;
            const daysSinceLastAttendance = u._daysSinceLastAttendance;
            const totalRes = u._totalRes;
            const monthRes = u._monthRes;
            const planLimit = u._planLimit;
            let status = u._computedStatus;
            let statusColor = u._statusColor;
            let statusBg = u._statusBg;
            // Churn Risk Logic
            let churnRisk = null;
            if (status === "Activo" || status === "Moroso") {
                if (daysSinceLastAttendance > 14 && daysSinceLastAttendance !== -1) {
                    churnRisk = "Riesgo de abandono: Ausente hace " + daysSinceLastAttendance + " días.";
                } else if (daysSinceLastAttendance === -1 && daysLeft > 0 && daysLeft < 15) {
                    churnRisk = "Riesgo: Pagó pero no asiste a clases.";
                } else if (monthRes <= 1 && now.getDate() > 15) {
                    churnRisk = "Riesgo: Baja frecuencia este mes.";
                }
            }

            return `
                            <div class="admin-item-card glass interactive-member-card" data-uid="${u.id}" style="flex-direction: column; align-items: stretch; gap:12px; padding:15px; cursor: pointer; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${statusColor};">
                                <div style="display:flex; align-items:center; gap:15px;">
                                    <img src="${u.photo_url || (typeof unknowAvatar !== 'undefined' ? unknowAvatar : '/app/images/icon-192.png')}" 
                                         style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">
                                    <div style="flex:1">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <strong style="display:block;">${u.full_name || 'Sin Nombre'}</strong>
                                            <div class="tag" style="background:${statusBg}; color:${statusColor}; font-size:9px; padding: 2px 6px;">${status}</div>
                                            <div class="tag" style="background:rgba(139, 92, 246, 0.2); color:var(--accent-purple); font-size:8px; padding: 2px 6px;">LVL ${u.level || 0}</div>
                                        </div>
                                        <span style="font-size:0.75rem; color:var(--text-gray); opacity: 0.7;">${u.email}</span>
                                        <div style="display:flex; gap:5px; align-items:center; margin-top:2px; flex-wrap:wrap;">
                                            <span class="tag" style="background:rgba(255,255,255,0.05); font-size:9px; border:1px solid rgba(255,255,255,0.1); display:inline-block;">${u.membership_plans?.name || 'Sin Plan'}</span>
                                            ${u.active_promo ? `<span class="tag" style="background:rgba(255, 215, 0, 0.1); color:#ffd700; font-size:9px; border:1px solid rgba(255, 215, 0, 0.3);"><i data-lucide="tag" style="width:10px;height:10px;margin-right:2px;"></i> ${u.active_promo}</span>` : ''}
                                            ${churnRisk ? `<span class="tag" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; font-size:9px; border:1px solid rgba(239, 68, 68, 0.3);"><i data-lucide="alert-triangle" style="width:10px;height:10px;margin-right:2px;"></i> ${churnRisk}</span>` : ''}
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                                        <i data-lucide="chevron-down" class="expand-icon" style="width:16px; opacity:0.5; transition: transform 0.3s ease;"></i>
                                    </div>
                                </div>
                                
                                <div class="membership-progress-container">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 5px;">
                                        <span>Progreso de Membresía</span>
                                        <span style="color: ${isNearExpiry ? '#ef4444' : 'var(--text-gray)'}; font-weight: bold;">
                                            ${expiryDate ? (daysLeft > 0 ? `${daysLeft} días restantes` : 'Expirado') : 'Sin Membresía'}
                                        </span>
                                    </div>
                                    <div class="lvl-bar" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                        <div class="lvl-fill" style="width: ${progress}%; height: 100%; transition: width 0.5s ease; background: ${isNearExpiry ? '#ef4444' : 'var(--accent-purple)'};"></div>
                                    </div>
                                </div>

                                <!-- Expanded Details (Hidden by default) -->
                                <div class="admin-user-details hidden" id="details-${u.id}" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 5px; animation: slideInUp 0.3s ease;">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div class="stat-box-mini" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                                            <span style="font-size: 0.65rem; color: var(--text-gray); display: block; margin-bottom: 4px;">Reservas Totales</span>
                                            <strong style="font-size: 1.1rem; color: var(--accent-cyan);">${totalRes}</strong>
                                        </div>
                                        <div class="stat-box-mini" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                                            <span style="font-size: 0.65rem; color: var(--text-gray); display: block; margin-bottom: 4px;">Última Asistencia</span>
                                            <strong style="font-size: 0.85rem; color: var(--accent-purple);">${lastAttendance ? lastAttendance.toLocaleDateString('es-CL') : 'Nunca'}</strong>
                                        </div>
                                    </div>
                                    <div style="margin-top: 10px; font-size: 0.7rem; color: var(--text-gray); display: flex; justify-content: space-between;">
                                        <span>Consumo mensual (${monthRes}/${planLimit}):</span>
                                        <span style="color: white; font-weight: 700;">${planLimit > 0 ? Math.round((monthRes / planLimit) * 100) : 0}%</span>
                                    </div>
                                    
                                    <div style="display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap;">
                                        <button class="btn-glass-small btn-quick-renew" data-id="${u.id}" style="border-color: #22c55e; color: #22c55e;"><i data-lucide="refresh-cw" style="width:14px;"></i> Renovar</button>
                                        <button class="btn-glass-small btn-freeze-member" data-id="${u.id}" data-frozen="${u.is_frozen || false}" style="border-color: #3b82f6; color: #3b82f6;"><i data-lucide="snowflake" style="width:14px;"></i> ${u.is_frozen ? 'Descongelar' : 'Congelar'}</button>
                                        <button class="btn-glass-small btn-toggle-active" data-id="${u.id}" data-active="${u.membership_status === 'active'}" style="border-color: ${u.membership_status === 'active' ? '#ef4444' : '#22c55e'}; color: ${u.membership_status === 'active' ? '#ef4444' : '#22c55e'};"><i data-lucide="${u.membership_status === 'active' ? 'power-off' : 'power'}" style="width:14px;"></i> ${u.membership_status === 'active' ? 'Inactivar' : 'Activar'}</button>
                                    </div>
                                </div>

                                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                                    <div class="item-actions">
                                        <button class="edit-member-btn btn-glass-small" data-id="${u.id}"><i data-lucide="edit-3" style="width:14px;"></i> Editar</button>
                                        <button class="delete-member-btn btn-glass-small delete" data-id="${u.id}"><i data-lucide="trash-2" style="width:14px;"></i></button>
                                    </div>
                                </div>
                            </div>
                            `;
        }).join('')}
                    </div>
                </div>
        `;
        window.lucide.createIcons();

        // Interactivity: Toggle Details
        document.querySelectorAll('.interactive-member-card').forEach(card => {
            card.onclick = (e) => {
                // Prevent toggle if clicking buttons or actions
                if (e.target.closest('.item-actions') || e.target.closest('button')) return;

                const uid = card.getAttribute('data-uid');
                const details = document.getElementById(`details-${uid}`);
                const icon = card.querySelector('.expand-icon');

                if (details.classList.contains('hidden')) {
                    details.classList.remove('hidden');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                    card.style.borderColor = 'rgba(182, 229, 247, 0.3)';
                    card.style.background = 'rgba(255,255,255,0.03)';
                } else {
                    details.classList.add('hidden');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                    card.style.borderColor = 'rgba(255,255,255,0.05)';
                    card.style.background = 'transparent';
                }
            };
        });

        // Filter Listener
        const filterSelect = document.getElementById('filter-status-users');
        if (filterSelect) {
            filterSelect.onchange = (e) => {
                renderAdminActiveUsers(e.target.value);
            };
        }

        // Export Users Listener
        document.getElementById('btn-export-users').onclick = () => {
            const format = document.getElementById('export-format-users').value;
            exportUserData(filteredUsers, format);
        };

        // Member CRUD Listeners
        document.getElementById('btn-add-member-admin').onclick = () => openMemberModal();
        document.querySelectorAll('.edit-member-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                openMemberModal(btn.getAttribute('data-id'), users);
            }
        });
        document.querySelectorAll('.delete-member-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                deleteMember(btn.getAttribute('data-id'));
            }
        });

        // Quick Actions
        document.querySelectorAll('.btn-quick-renew').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const uid = btn.getAttribute('data-id');
                const user = users.find(u => u.id === uid);
                if (!user || !user.membership_plan_id) {
                    window.showToast("El socio no tiene un plan asignado para renovar.", "#ef4444");
                    return;
                }
                const confirmRenew = confirm(`¿Estás seguro que deseas renovar el plan de ${user.full_name} por 1 mes más?`);
                if (confirmRenew) {
                    try {
                        const newExpiry = new Date();
                        newExpiry.setMonth(newExpiry.getMonth() + 1);
                        await SupabaseService.updateProfile(uid, {
                            membership_expiry: newExpiry.toISOString(),
                            membership_status: 'active',
                            is_frozen: false
                        });
                        window.showToast("Plan renovado exitosamente ✅", "#22c55e");
                        renderAdminActiveUsers();
                    } catch (err) {
                        window.showToast("Error al renovar plan.", "#ef4444");
                    }
                }
            }
        });

        document.querySelectorAll('.btn-toggle-active').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const uid = btn.getAttribute('data-id');
                const isActive = btn.getAttribute('data-active') === 'true';
                try {
                    const newStatus = isActive ? 'inactive' : 'active';
                    const updateData = { membership_status: newStatus };

                    if (!isActive) {
                        const newExpiry = new Date();
                        newExpiry.setDate(newExpiry.getDate() + 30);
                        updateData.membership_expiry = newExpiry.toISOString();
                    } else {
                        updateData.membership_expiry = null;
                    }

                    await SupabaseService.updateProfile(uid, updateData);
                    window.showToast(isActive ? "Socio Inactivado" : "Socio Activado (30 días)", isActive ? "#ef4444" : "#22c55e");
                    renderAdminActiveUsers();
                } catch (err) {
                    window.showToast("Error al procesar la acción.", "#ef4444");
                }
            }
        });

        document.querySelectorAll('.btn-freeze-member').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const uid = btn.getAttribute('data-id');
                const isFrozen = btn.getAttribute('data-frozen') === 'true';
                try {
                    await SupabaseService.updateProfile(uid, {
                        is_frozen: !isFrozen
                    });
                    window.showToast(isFrozen ? "Membresía Descongelada 🧊" : "Membresía Congelada ❄️", "#3b82f6");
                    renderAdminActiveUsers();
                } catch (err) {
                    window.showToast("Error al procesar la acción.", "#ef4444");
                }
            }
        });

    } catch (err) {
        console.error(err);
        window.showToast("Error al cargar socios ❌", "#ef4444");
    }
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
                <div style="height:180px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:180px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:180px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
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

            return {
                ...p,
                _userCount: planUsers.length,
                _activeCount: activeUsers.length,
                _monthlyRevenue: monthlyRevenue,
                _capacityUsed: Math.min(capacityUsed, 100)
            };
        });

        const themeColors = {
            bronze: { bg: 'rgba(205, 127, 50, 0.1)', border: 'rgba(205, 127, 50, 0.3)', accent: '#cd7f32', icon: 'shield' },
            silver: { bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.3)', accent: '#c0c0c0', icon: 'shield-check' },
            gold: { bg: 'rgba(255, 215, 0, 0.08)', border: 'rgba(255, 215, 0, 0.25)', accent: '#ffd700', icon: 'crown' }
        };

        const totalRevenue = planMetrics.reduce((a, p) => a + p._monthlyRevenue, 0);
        const totalUsers = planMetrics.reduce((a, p) => a + p._activeCount, 0);

        getAdminContent().innerHTML = `
            <div class="glass-premium p-20" id="plans-main">
                <style>
                    @keyframes planFadeIn {
                        from { opacity: 0; transform: translateY(16px) scale(0.97); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .plan-block-card {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: grab;
                    }
                    .plan-block-card:active { cursor: grabbing; }
                    .plan-block-card.drag-over {
                        border-color: var(--accent-purple) !important;
                        transform: scale(1.02);
                        box-shadow: 0 0 30px rgba(139,92,246,0.2);
                    }
                    .plan-block-card.dragging {
                        opacity: 0.5;
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Planes de Membresía</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${plans.length} planes activos • $${totalRevenue.toLocaleString()}/mes estimado</p>
                    </div>
                    <button class="btn-action-glow" id="btn-add-plan-admin"><i data-lucide="plus"></i> Plan</button>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:25px;">
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
                </div>

                <div id="plans-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">
                    ${planMetrics.map((p, idx) => {
            const theme = themeColors[p.theme] || themeColors.bronze;
            const popularBadge = p.popular ? `<span style="position:absolute; top:-8px; right:12px; background:linear-gradient(135deg, #8b5cf6, #a855f7); color:white; font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 4px 15px rgba(139,92,246,0.4);">Popular</span>` : '';
            return `
                        <div class="plan-block-card" draggable="true" data-plan-id="${p.id}" data-idx="${idx}"
                             style="position:relative; background:${theme.bg}; border:1px solid ${theme.border}; border-radius:20px; padding:22px; opacity:0; animation: planFadeIn 0.5s ease forwards ${idx * 0.08}s;">
                            ${popularBadge}
                            <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                                <div style="width:44px; height:44px; border-radius:12px; background:${theme.bg}; border:1px solid ${theme.border}; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="${theme.icon}" style="width:22px; color:${theme.accent};"></i>
                                </div>
                                <div style="flex:1;">
                                    <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:${theme.accent};">${p.name}</h4>
                                    <span style="font-size:0.75rem; opacity:0.5; font-weight:600;">${p.monthly || 0} clases/mes</span>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-size:1.3rem; font-weight:900;">$${Number(p.price || 0).toLocaleString()}</div>
                                    <div style="font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700;">/MES</div>
                                </div>
                            </div>

                            <div style="margin-bottom:16px;">
                                <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:5px; opacity:0.7;">
                                    <span>Ocupación del plan</span>
                                    <span style="font-weight:700;">${p._capacityUsed}%</span>
                                </div>
                                <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                                    <div style="height:100%; width:${p._capacityUsed}%; background:linear-gradient(90deg, ${theme.accent}, ${theme.accent}88); border-radius:10px; transition:width 1s cubic-bezier(0.34,1.56,0.64,1);"></div>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; text-align:center;">
                                    <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:4px;">Socios</span>
                                    <strong style="font-size:1.1rem; color:white;">${p._activeCount}</strong>
                                </div>
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; text-align:center;">
                                    <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:4px;">Ingreso</span>
                                    <strong style="font-size:1.1rem; color:#22c55e;">$${p._monthlyRevenue.toLocaleString()}</strong>
                                </div>
                            </div>

                            <div style="display:flex; gap:8px;">
                                <button class="edit-plan-btn btn-glass-small" data-id="${p.id}" style="flex:1; justify-content:center;">
                                    <i data-lucide="edit-3" style="width:14px; margin-right:4px;"></i> Editar
                                </button>
                                <button class="delete-plan-btn btn-glass-small delete" data-id="${p.id}" style="width:40px; justify-content:center;">
                                    <i data-lucide="trash-2" style="width:14px;"></i>
                                </button>
                            </div>
                        </div>`;
        }).join('')}
                </div>
            </div>`;

        window.lucide.createIcons();

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
                                <button class="btn-glass-small delete btn-delete-promo" data-id="${c.id}" style="width:40px; justify-content:center;">
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

        // Create
        document.getElementById('btn-create-promo').onclick = async () => {
            const code = document.getElementById('new-promo-code').value.trim().toUpperCase();
            const percent = parseInt(document.getElementById('new-promo-perc').value);
            const expStr = document.getElementById('new-promo-exp').value;
            const checked = document.querySelectorAll('.promo-plan-checkbox:checked');
            const selectedPlans = Array.from(checked).map(cb => cb.value);

            if (!code || isNaN(percent) || percent <= 0 || percent > 100) {
                return window.showToast("Código o porcentaje inválido", "#ef4444");
            }
            if (codes.find(c => c.code === code)) {
                return window.showToast("Ese código ya existe", "#ef4444");
            }
            try {
                const newDiscount = { code, percent, plans: selectedPlans.length > 0 ? selectedPlans : null, expiresAt: expStr ? new Date(expStr + 'T23:59:59').toISOString() : null };
                const { error: insErr } = await window.supabase.from('discounts').insert(newDiscount);
                if (insErr) throw insErr;
                window.showToast(`Código ${code} creado ✅`, "#22c55e");
                renderAdminDiscounts();
            } catch (err) {
                console.error(err);
                window.showToast("Error al crear código", "#ef4444");
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

