import { exportToFormat, exportUserData } from '../utils/exportUtils.js';
import unknowAvatar from '../images/unknow.png';
const Swal = window.Swal;
let coverageMonthStr = '';
let displayGroups = [];

import { SupabaseService } from '../services/supabaseService.js';
import { openClassModal, openPlanModal, openMemberModal, deleteClass, deletePlan, handlePaymentAction, deleteMember } from './adminModals.js';


const getAdminContent = () => document.getElementById('admin-content-area');

export const renderAdminActiveUsers = async (filterType = 'active') => {
    const area = document.getElementById('admin-content-area');
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
            userRes.sort((a,b) => new Date(b.reservation_date) - new Date(a.reservation_date));
            const lastAttendance = userRes.length > 0 ? new Date(userRes[0].reservation_date) : null;
            const daysSinceLastAttendance = lastAttendance ? Math.floor((now - lastAttendance)/(1000*60*60*24)) : -1;
            
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
    
    window.showToast("Configurando clases... 🥋");
    try {
        const classes = await SupabaseService.getClasses();
        getAdminContent().innerHTML = `
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <h3>Gestión de Clases</h3>
                        <button class="btn-action-glow" id="btn-add-class-admin"><i data-lucide="plus"></i> Clase</button>
                    </div>
                    <div class="admin-list-container">
                        ${classes.length === 0 ? '<p class="opacity-50">Configura tu primera clase.</p>' : classes.map(c => `
                            <div class="admin-item-card glass">
                                <div>
                                    <strong style="display:block;">${c.name}</strong>
                                    <span style="font-size:0.8rem; opacity:0.6;">${c.days.join(', ')} • ${c.time}</span>
                                </div>
                                <div class="item-actions">
                                    <button class="edit-class-btn btn-glass-small" data-id="${c.id}"><i data-lucide="edit-3"></i></button>
                                    <button class="delete-class-btn btn-glass-small delete" data-id="${c.id}"><i data-lucide="trash-2"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        window.lucide.createIcons();

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
    }
};

const movePlanAdmin = async (planId, direction) => {
    try {
        const plans = await SupabaseService.getMembershipPlans();
        const idx = plans.findIndex(p => p.id === planId);
        if (idx === -1) return;

        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= plans.length) return;

        const currentPlan = plans[idx];
        const otherPlan = plans[newIdx];

        // Swap sort_order
        const tempOrder = currentPlan.sort_order;
        await SupabaseService.updatePlanOrder(currentPlan.id, otherPlan.sort_order || newIdx);
        await SupabaseService.updatePlanOrder(otherPlan.id, tempOrder || idx);

        window.showToast("Orden actualizado 🔄", "#8b5cf6");
        renderAdminPlans();
    } catch (err) {
        console.error(err);
        window.showToast("Error al reordenar plan", "#ef4444");
    }
};

export const renderAdminPlans = async () => {
    try {
        const plans = await SupabaseService.getMembershipPlans();
        getAdminContent().innerHTML = `
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <div>
                            <h3>Planes de Membresía</h3>
                            <p class="subtitle">Ordena los planes a tu disposición</p>
                        </div>
                        <button class="btn-action-glow" id="btn-add-plan-admin"><i data-lucide="plus"></i> Plan</button>
                    </div>
                    <div class="admin-list-container">
                        ${plans.map((p, idx) => `
                            <div class="admin-item-card glass" style="display:flex; align-items:center; gap:15px; padding: 15px;">
                                <div class="sort-actions" style="display:flex; flex-direction:column; gap:4px;">
                                    <button class="move-plan-btn btn-glass-small" data-id="${p.id}" data-dir="up" ${idx === 0 ? 'disabled style="opacity:0.2;"' : ''}>
                                        <i data-lucide="chevron-up"></i>
                                    </button>
                                    <button class="move-plan-btn btn-glass-small" data-id="${p.id}" data-dir="down" ${idx === plans.length - 1 ? 'disabled style="opacity:0.2;"' : ''}>
                                        <i data-lucide="chevron-down"></i>
                                    </button>
                                </div>
                                <div style="flex:1;">
                                    <strong style="display:block; font-size:1.1rem;">${p.name}</strong>
                                    <span style="font-size:0.85rem; opacity:0.6; display:block; margin-top:2px;">$${Number(p.price).toLocaleString()} • ${p.monthly} cl/mes</span>
                                </div>
                                <div class="item-actions">
                                    <button class="edit-plan-btn btn-glass-small" data-id="${p.id}"><i data-lucide="edit-3"></i></button>
                                    <button class="delete-plan-btn btn-glass-small delete" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
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
        document.querySelectorAll('.move-plan-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                if (btn.disabled) return;
                const id = btn.getAttribute('data-id');
                const dir = btn.getAttribute('data-dir');
                movePlanAdmin(id, dir);
            };
        });
    } catch (err) {
        console.error(err);
        window.showToast("Error al cargar planes", "#ef4444");
    }
};

export const renderAdminPayments = async (activeTab = 'pending') => {
    getAdminContent().innerHTML = `<div class="glass-premium p-20"><div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando pagos...</div></div>`;
    window.lucide.createIcons();
    try {
        // Fetch ALL payments with profile join
        const { data: allPayments, error } = await window.supabase
            .from('payments')
            .select('*, profiles(full_name, role, membership_status)')
            .order('created_at', { ascending: false });
        if (error) throw error;

        const pending = allPayments.filter(p => p.status === 'pending' && (!p.profiles || p.profiles.role !== 'admin'));

        // Logic for Aprobados vs Historial
        const approved = [];
        const history = [];

        const latestApprovedPerUser = new Map();
        const allApproved = allPayments.filter(p => p.status === 'approved' && (!p.profiles || p.profiles.role !== 'admin'));

        allApproved.forEach(p => {
            if (!latestApprovedPerUser.has(p.user_id)) {
                latestApprovedPerUser.set(p.user_id, p);
                if (p.profiles?.membership_status === 'active') {
                    approved.push(p);
                } else {
                    history.push(p);
                }
            } else {
                history.push(p);
            }
        });

        // Track which list is currently visible for export
        let currentList = activeTab === 'pending' ? pending : (activeTab === 'approved' ? approved : history);
        let currentLabel = activeTab === 'pending' ? 'Pendientes' : (activeTab === 'approved' ? 'Aprobados' : 'Historial');

        const buildCards = (list, showActions) => {
            if (list.length === 0) return `<p class="opacity-50" style="padding:20px 0;">No hay registros aquí. ✅</p>`;
            return list.map(p => {
                const userName = p.profiles?.full_name || p.user_name || 'Usuario';
                const concept = p.concept || p.plan_name || 'Membresía';
                const amount = parseFloat(p.amount || 0).toLocaleString('es-CL');
                const dateStr = p.created_at
                    ? new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';

                let monthCoverageStr = '';
                
                if (p.created_at && !showActions) {
                    const paymentDate = new Date(p.created_at);
                    const isProportional = (concept || '').toLowerCase().includes('proporcional');
                    // Fix for isNextMonth: If date >= 15 and not proportional, assume it's for next month
                    const isNextMonth = paymentDate.getDate() >= 15 && !isProportional;

                    coverageMonthStr = p.coverage_month;
                    if (!coverageMonthStr) {
                        const targetDate = isNextMonth ? new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1) : paymentDate;
                        coverageMonthStr = targetDate.toLocaleString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());
                    }

                    monthCoverageStr = `<span class="edit-coverage-btn" data-id="${p.id}" data-current="${coverageMonthStr}" title="Editar Mes de Cobertura" style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; background:rgba(139, 92, 246, 0.15); color:#a78bfa; padding:4px 10px; border-radius:8px; margin-top:4px; border: 1px solid rgba(139, 92, 246, 0.3); cursor: pointer; transition: all 0.2s;">
                        <i data-lucide="calendar" style="width:12px; height:12px;"></i> Cobertura: <strong>${coverageMonthStr}</strong> <i data-lucide="edit-3" style="width:10px; height:10px; opacity:0.5;"></i></span>`;
                }

                const statusBadge = p.status === 'approved'
                    ? `<span style="font-size:0.7rem; background:rgba(34,197,94,0.15); color:#22c55e; padding:3px 8px; border-radius:20px; font-weight:700; display:inline-flex; align-items:center; gap:4px; border: 1px solid rgba(34,197,94,0.2); letter-spacing:0.5px;">
                            <i data-lucide="check-circle-2" style="width:12px; height:12px;"></i> Aprobado</span>`
                    : `<span style="font-size:0.7rem; background:rgba(251,191,36,0.15); color:#fbbf24; padding:3px 8px; border-radius:20px; font-weight:700; display:inline-flex; align-items:center; gap:4px; border: 1px solid rgba(251,191,36,0.2); letter-spacing:0.5px;">
                            <i data-lucide="clock" style="width:12px; height:12px;"></i> Pendiente</span>`;

                return `
                    <div class="admin-item-card glass" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; position:relative; overflow:hidden;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 4px;">
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                    <strong style="font-size: 1.05rem; letter-spacing: 0.5px;">${userName}</strong>
                                    ${statusBadge}
                                </div>
                                <span style="font-size:0.8rem; color:var(--text-gray); display:block; margin-bottom:2px;">$${amount} • ${concept}</span>
                                <span style="font-size:0.65rem; color:rgba(255,255,255,0.4); display:block;">Fecha de Registro: ${dateStr}</span>
                            </div>
                        </div>
                        
                        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 4px;">
                            <div>
                                ${monthCoverageStr}
                            </div>
                            <div class="item-actions" style="display:flex; gap:6px;">
                                ${showActions ? `
                                <button class="approve-pay-btn" data-id="${p.id}" style="background:var(--accent-purple); color:white; border:none; padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; transition:0.2s;"><i data-lucide="check" style="width:12px; height:12px;"></i> Aprobar</button>
                                <button class="reject-pay-btn" data-id="${p.id}" style="background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.1); padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; transition:0.2s;"><i data-lucide="edit-2" style="width:12px; height:12px;"></i> Editar</button>
                                ` : `
                                <button class="revert-pay-btn" data-id="${p.id}" style="background:rgba(251,191,36,0.1); color:#fbbf24; border:1px solid rgba(251,191,36,0.2); padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; transition:0.2s;"><i data-lucide="rotate-ccw" style="width:12px; height:12px;"></i> A Pendiente</button>
                                `}
                                <button class="delete-pay-btn delete" data-id="${p.id}" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; transition:0.2s;" title="Borrar Factura"><i data-lucide="trash-2" style="width:14px; height:14px;"></i> Eliminar</button>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        };

        getAdminContent().innerHTML = `
                <div class="glass-premium p-20">
                    <h3 class="mb-20">Control de Pagos</h3>

                    <!-- Tab buttons -->
                    <div style="display:flex; gap:8px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                        <button id="tab-pending-btn" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${activeTab === 'pending' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                            Pendientes <span style="background:rgba(251,191,36,0.25); color:#fbbf24; border-radius:20px; padding:1px 8px; font-size:0.75rem; margin-left:4px;">${pending.length}</span>
                        </button>
                        <button id="tab-approved-btn" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${activeTab === 'approved' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                            Aprobados <span style="background:rgba(34,197,94,0.2); color:#22c55e; border-radius:20px; padding:1px 8px; font-size:0.75rem; margin-left:4px;">${approved.length}</span>
                        </button>
                        <button id="tab-history-btn" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${activeTab === 'history' ? 'background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);' : ''}">
                            Historial <span style="background:rgba(255,255,255,0.1); color:#fff; border-radius:20px; padding:1px 8px; font-size:0.75rem; margin-left:4px;">${history.length}</span>
                        </button>
                    </div>

                    <!-- Export bar -->
                    <div style="display:flex; gap:8px; align-items:center; margin-bottom:16px; padding:10px 12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
                        <i data-lucide="download" style="width:14px; height:14px; opacity:0.5;"></i>
                        <span style="font-size:0.75rem; color:var(--text-gray); font-weight:600; flex:1;">Exportar vista actual</span>
                        <select id="pay-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                            <option value="csv">CSV</option>
                            <option value="xls">XLS</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button id="btn-export-payments" class="btn-primary" style="padding:6px 14px; font-size:0.75rem; border-radius:8px;">
                            Exportar
                        </button>
                    </div>

                    <!-- Tab content -->
                    <div id="payments-tab-content" class="admin-list-container">
                        ${activeTab === 'pending' ? buildCards(pending, true) : (activeTab === 'approved' ? buildCards(approved, false) : buildCards(history, false))}
                    </div>
                </div>
            `;
        window.lucide.createIcons();

        // Tab switching
        document.getElementById('tab-pending-btn').onclick = () => {
            currentList = pending;
            currentLabel = 'Pendientes';
            document.getElementById('tab-pending-btn').style.cssText += ';background:var(--accent-purple);color:#fff;border-color:var(--accent-purple);';
            document.getElementById('tab-approved-btn').style.background = '';
            document.getElementById('tab-approved-btn').style.color = '';
            document.getElementById('tab-history-btn').style.background = '';
            document.getElementById('tab-history-btn').style.color = '';
            document.getElementById('payments-tab-content').innerHTML = buildCards(pending, true);
            attachPaymentActions();
        };
        document.getElementById('tab-approved-btn').onclick = () => {
            window.adminPaymentLimit = 20;
            currentList = approved;
            currentLabel = 'Aprobados';
            document.getElementById('tab-approved-btn').style.cssText += ';background:var(--accent-purple);color:#fff;border-color:var(--accent-purple);';
            document.getElementById('tab-pending-btn').style.background = '';
            document.getElementById('tab-pending-btn').style.color = '';
            document.getElementById('tab-history-btn').style.background = '';
            document.getElementById('tab-history-btn').style.color = '';
            document.getElementById('payments-tab-content').innerHTML = buildCards(approved, false);
            attachPaymentActions();
        };
        document.getElementById('tab-history-btn').onclick = () => {
            window.adminPaymentLimit = 20;
            currentList = history;
            currentLabel = 'Historial';
            document.getElementById('tab-history-btn').style.cssText += ';background:var(--accent-purple);color:#fff;border-color:var(--accent-purple);';
            document.getElementById('tab-pending-btn').style.background = '';
            document.getElementById('tab-pending-btn').style.color = '';
            document.getElementById('tab-approved-btn').style.background = '';
            document.getElementById('tab-approved-btn').style.color = '';
            document.getElementById('payments-tab-content').innerHTML = buildCards(history, false);
            attachPaymentActions();
        };

        // Export button
        document.getElementById('btn-export-payments').onclick = () => {
            const format = document.getElementById('pay-export-format').value;
            const headers = ['Fecha', 'Alumno', 'Monto ($)', 'Concepto', 'Estado'];
            const rows = currentList.map(p => [
                p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : '-',
                p.profiles?.full_name || p.user_name || 'N/A',
                parseFloat(p.amount || 0).toFixed(0),
                p.concept || p.plan_name || 'Membresía',
                p.status === 'approved' ? 'Aprobado' : 'Pendiente'
            ]);
            const filename = `Pagos_${currentLabel}_Amaru_${new Date().toISOString().split('T')[0]}`;
            exportToFormat(format, rows, headers, filename);
            window.showToast(`Reporte exportado (${format.toUpperCase()}) ✅`, '#22c55e');
        };

        const openCoverageModal = (paymentId, currentMonth, callback) => {
            const modal = document.createElement('div');
            modal.className = 'glass-container';
            modal.style.cssText = `
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(10px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10000; padding: 20px;
                    transition: opacity 0.3s ease;
                `;

            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const currentYear = new Date().getFullYear();
            const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

            let defaultMonth = months[new Date().getMonth()];
            let defaultYear = currentYear;
            if (currentMonth) {
                months.forEach(m => { if (currentMonth.toLowerCase().includes(m.toLowerCase())) defaultMonth = m; });
                years.forEach(y => { if (currentMonth.includes(y.toString())) defaultYear = y; });
            }

            modal.innerHTML = `
                    <div class="glass-premium" style="max-width:400px; width:100%; padding:30px; border-radius:24px; animation: slideUp 0.3s ease; box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <h3 style="margin:0; font-size:1.3rem; display:flex; align-items:center; gap:10px;">
                                <i data-lucide="calendar-days" style="color:var(--accent-purple);"></i> Mes de Cobertura
                            </h3>
                            <button class="close-coverage-btn" style="background:none; border:none; color:white; opacity:0.5; cursor:pointer; transition: 0.2s;"><i data-lucide="x"></i></button>
                        </div>
                        <p style="font-size:0.9rem; opacity:0.7; margin-bottom:25px; line-height: 1.5;">Selecciona el mes y año que cubrirá este pago para el estudiante.</p>
                        
                        <div style="display:flex; gap:15px; margin-bottom:30px;">
                            <div style="flex:2;">
                                <label style="display:block; font-size:0.8rem; margin-bottom:8px; opacity:0.8; font-weight: 600;">Mes</label>
                                <select id="cov-month-select" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding: 12px 15px;">
                                    ${months.map(m => `<option value="${m}" ${m === defaultMonth ? 'selected' : ''} style="background:#111; color:white;">${m}</option>`).join('')}
                                </select>
                            </div>
                            <div style="flex:1;">
                                <label style="display:block; font-size:0.8rem; margin-bottom:8px; opacity:0.8; font-weight: 600;">Año</label>
                                <select id="cov-year-select" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding: 12px 15px;">
                                    ${years.map(y => `<option value="${y}" ${y === defaultYear ? 'selected' : ''} style="background:#111; color:white;">${y}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                            <button class="btn-glass close-coverage-btn" style="padding:10px 20px;">Cancelar</button>
                            <button id="save-coverage-btn" class="btn-primary" style="padding:10px 25px; display:flex; align-items:center; gap:8px;">
                                Guardar <i data-lucide="check" style="width:16px; height:16px;"></i>
                            </button>
                        </div>
                    </div>
                `;

            document.body.appendChild(modal);
            window.lucide.createIcons();

            const close = () => {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            };

            modal.querySelectorAll('.close-coverage-btn').forEach(btn => {
                btn.onclick = close;
                btn.onmouseover = () => btn.style.opacity = '1';
                btn.onmouseleave = () => btn.style.opacity = '0.5';
            });

            document.getElementById('save-coverage-btn').onclick = () => {
                const m = document.getElementById('cov-month-select').value;
                const y = document.getElementById('cov-year-select').value;
                const finalValue = `${m} ${y}`;
                close();
                if (callback) callback(finalValue);
            };
        };

        const attachPaymentActions = () => {
            const loadMoreBtn = document.getElementById('btn-load-more-payments');
            if (loadMoreBtn) {
                loadMoreBtn.onclick = () => {
                    window.adminPaymentLimit += 20;
                    document.getElementById('payments-tab-content').innerHTML = activeTab === 'pending' ? buildCards(pending, true) : (activeTab === 'approved' ? buildCards(approved, false) : buildCards(history, false));
                    attachPaymentActions();
                };
            }

            document.querySelectorAll('.approve-pay-btn').forEach(btn => {
                btn.onclick = () => handlePaymentAction(btn.getAttribute('data-id'), 'approved');
            });
            document.querySelectorAll('.reject-pay-btn').forEach(btn => {
                btn.onclick = async () => {
                    const newAmount = prompt("Si deseas editar el monto, ingresa el nuevo valor, o deja vacío para mantenerlo:");
                    if (newAmount !== null && newAmount.trim() !== "") {
                        try {
                            await window.supabase.from('payments').update({ amount: parseFloat(newAmount) }).eq('id', btn.getAttribute('data-id'));
                            renderAdminPayments(activeTab);
                        } catch (e) {
                            window.showToast("Error al editar", "#ef4444");
                        }
                    } else if (newAmount !== null) {
                        handlePaymentAction(btn.getAttribute('data-id'), 'rejected');
                    }
                };
            });
            document.querySelectorAll('.revert-pay-btn').forEach(btn => {
                btn.onclick = () => handlePaymentAction(btn.getAttribute('data-id'), 'pending');
            });
            document.querySelectorAll('.edit-coverage-btn').forEach(btn => {
                btn.onclick = () => {
                    const paymentId = btn.getAttribute('data-id');
                    const currentMonth = btn.getAttribute('data-current');
                    
                    openCoverageModal(paymentId, currentMonth, async (newMonth) => {
                        if (newMonth && newMonth !== currentMonth) {
                            try {
                                window.showToast("Actualizando mes de cobertura...");
                                await window.supabase.from('payments').update({ coverage_month: newMonth }).eq('id', paymentId);
                                window.showToast("Mes de cobertura actualizado ✅", "#22c55e");
                                renderAdminPayments(activeTab);
                            } catch (e) {
                                window.showToast("Error al actualizar mes", "#ef4444");
                            }
                        }
                    });
                };
            });
            document.querySelectorAll('.delete-pay-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm("¿Seguro que deseas eliminar este registro de pago?")) {
                        try {
                            await window.supabase.from('payments').delete().eq('id', btn.getAttribute('data-id'));
                            window.showToast("Registro eliminado ✅", "#22c55e");
                            renderAdminPayments(activeTab);
                        } catch (e) {
                            window.showToast("Error al eliminar", "#ef4444");
                        }
                    }
                };
            });
        };
        attachPaymentActions();

    } catch (err) {
        console.error(err);
        getAdminContent().innerHTML = `<div class="glass-premium p-20"><p class="opacity-50">Error al cargar pagos: ${err.message}</p></div>`;
    }
};

export const renderAdminAttendance = async () => {
        getAdminContent().innerHTML = `<div class="glass-premium p-20"><div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando asistencia...</div></div>`;
        window.lucide.createIcons();
        try {
            // Fetch all reservations with profile join
            const { data: allReservations, error } = await window.supabase
                .from('reservations')
                .select('*, profiles(full_name, email)')
                .order('reservation_date', { ascending: false })
                .limit(800);
            if (error) throw error;

            // ---- Render a period view ----
            const renderPeriod = (period) => {
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
                

                if (period === 'today') {
                    // For "Today", we want to see ALL scheduled classes for today, even with 0 attendees
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
                    // Grouping for historical periods: group by date then class_id
                    const groups = {};
                    filteredReservations.forEach(r => {
                        const key = `${r.reservation_date}||${r.class_id}`;
                        if (!groups[key]) {
                            // Find class info if possible for visual consistency
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
                    displayGroups = Object.values(groups).sort((a,b) => b.date.localeCompare(a.date));
                }

                // 3. Stats Calculation
                const stats = {
                    totalSessions: displayGroups.length,
                    totalReservations: filteredReservations.length,
                    uniqueSocio: new Set(filteredReservations.map(r => r.user_id)).size
                };

                const typeColor = {
                    'Striking':  '#ef4444',
                    'BJJ':       '#8b5cf6',
                    'MMA':       '#f97316',
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
                if (period === 'month' && filteredReservations.length > 0) {
                    const userCounts = {};
                    const dayCounts = {};
                    let thisWeekCount = 0;
                    let lastWeekCount = 0;
                    
                    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                    filteredReservations.forEach(r => {
                        const rd = new Date(r.reservation_date);
                        // Frequency
                        if (!userCounts[r.user_id]) userCounts[r.user_id] = 0;
                        userCounts[r.user_id]++;
                        
                        // Days
                        const dIndex = rd.getDay();
                        if (!dayCounts[dIndex]) dayCounts[dIndex] = 0;
                        dayCounts[dIndex]++;

                        // Drops
                        if (rd >= weekAgo) thisWeekCount++;
                        else if (rd >= twoWeeksAgo && rd < weekAgo) lastWeekCount++;
                    });

                    // Best Day
                    const daysArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    let bestDayIdx = Object.keys(dayCounts).sort((a,b) => dayCounts[b] - dayCounts[a])[0];
                    const bestDay = daysArr[bestDayIdx];

                    // Average frequency
                    const avgMonth = stats.totalReservations / Math.max(1, stats.uniqueSocio);
                    const avgWeek = (avgMonth / 4).toFixed(1);

                    // Drop alert
                    let alertHtml = '';
                    if (thisWeekCount < lastWeekCount * 0.8) {
                        alertHtml = `<div style="display:flex; gap:8px;"><i data-lucide="alert-triangle" style="color:#ef4444; width:16px;"></i> <span><strong>¡Alerta!</strong> La asistencia bajó un ${Math.round((1 - thisWeekCount/lastWeekCount)*100)}% esta semana.</span></div>`;
                    } else if (thisWeekCount > lastWeekCount * 1.1) {
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
                        </div>
                    `;
                }

                // 4. Generate HTML
                let lastDate = '';
                const groupsHTML = displayGroups.length === 0 
                  ? `<div style="text-align:center; padding:60px 0; opacity:0.3;">
                        <i data-lucide="calendar-off" style="width:50px; height:50px; margin-bottom:15px; display:block; margin-inline:auto;"></i>
                        <p>No se encontraron actividades registradas.</p>
                     </div>`
                  : displayGroups.map((g, idx) => {
                    let header = '';
                    if (g.date !== lastDate) {
                        lastDate = g.date;
                        header = `<div class="att-date-divider" style="font-size:0.65rem; color:var(--text-gray); font-weight:800; letter-spacing:1px; margin: 15px 0 10px;">${formatDateHeader(g.date)}</div>`;
                    }
                    const color = typeColor[g.classType] || 'var(--accent-cyan)';
                    const attList = g.attendees.map(a => `
                        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
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
                        <div class="att-panel-card" data-idx="${idx}" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; margin-bottom:12px; transition:0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer; overflow:hidden;">
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
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:25px;">
                        <div class="stat-mini-premium" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.6rem; font-weight:900; color:var(--accent-purple);">${stats.totalSessions}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SESIONES</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.6rem; font-weight:900; color:var(--accent-cyan);">${stats.totalReservations}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">RESERVAS</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.6rem; font-weight:900; color:#22c55e;">${stats.uniqueSocio}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SOCIOS</span>
                        </div>
                    </div>
                    ${groupsHTML}
                `;
                window.lucide.createIcons();

                // Interactive Panels
                document.querySelectorAll('.att-panel-card').forEach(card => {
                    card.onclick = () => {
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
                <div class="glass-premium p-20">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <div>
                            <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Control de Asistencia</h2>
                            <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${allReservations.length} asistencias en historial</p>
                        </div>
                        <button id="btn-manual-attendance" class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; background: var(--accent-cyan); color: #000;">
                            <i data-lucide="plus-circle" style="width:16px; margin-right:5px; vertical-align:middle;"></i> Ingreso Manual
                        </button>
                    </div>

                    <div style="display:flex; gap:8px; margin-bottom:25px; background:rgba(255,255,255,0.03); padding:6px; border-radius:14px; width:fit-content;">
                        <button class="att-period-btn" data-period="today" style="border:none; background:var(--accent-purple); color:white; padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Hoy</button>
                        <button class="att-period-btn" data-period="week" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Semana</button>
                        <button class="att-period-btn" data-period="month" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Mes</button>
                        <button class="att-period-btn" data-period="all" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Todo</button>
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
                </div>
            `;

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
                                </div>
                            `,
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
                                    if(loader) loader.style.borderColor = 'var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent';
                                }, 
                                background: '#1f1f2e', color: '#fff' 
                            });
                            await SupabaseService.createReservation(formValues.user, formValues.classId, formValues.className, formValues.date);
                            window.showToast("✅ Asistencia manual registrada con éxito", "#22c55e");
                            renderAdminAttendance(); // Reload the whole view to fetch new data
                        }
                    } catch (e) {
                        console.error(e);
                        window.showToast("Error al cargar datos para ingreso manual", "#ef4444");
                    }
                };
            }

            window.lucide.createIcons();
            renderPeriod('today');

            // Tab logic
            document.querySelectorAll('.att-period-btn').forEach(btn => {
                btn.onclick = (e) => {
                    document.querySelectorAll('.att-period-btn').forEach(b => {
                        b.style.background = 'transparent';
                        b.style.color = 'var(--text-gray)';
                    });
                    e.target.style.background = 'var(--accent-purple)';
                    e.target.style.color = 'white';
                    renderPeriod(e.target.getAttribute('data-period'));
                };
            });

            // Export listener
            document.getElementById('btn-export-attendance').onclick = () => {
                const format = document.getElementById('att-export-format').value;
                const d = window._attExportData;
                if (!d || d.reservations.length === 0) return window.showToast("No hay datos para exportar", "#ef4444");
                
                const headers = ['Fecha', 'Clase', 'Horario', 'Alumno', 'Email'];
                const rows = [];
                d.groups.forEach(g => {
                    g.attendees.forEach(a => {
                        rows.push([ g.date, g.className, g.classTime, a.name, a.email ]);
                    });
                });
                exportToFormat(format, rows, headers, `Asistencia_${d.periodLabel}_Amaru`);
            };

        } catch (err) {
            console.error(err);
            getAdminContent().innerHTML = `<div class="glass-premium p-20"><p class="opacity-50">Error al cargar asistencia: ${err.message}</p></div>`;
        }
    };

export const renderAdminDiscounts = async () => {
        const revSection = document.getElementById('admin-revenue-section');
        if (revSection) revSection.classList.add('hidden');
        window.showToast("Cargando códigos de descuento...");

        try {
            // Fetch discounts
            const { data: codesData, error } = await window.supabase
                .from('discounts')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            let codes = codesData || [];

            // Fetch users to see who is using the active promo
            const { data: profilesData } = await window.supabase
                .from('profiles')
                .select('id, full_name, active_promo')
                .not('active_promo', 'is', null);
            
            const usersWithPromo = profilesData || [];
            const adminContent = document.getElementById('admin-content-area');

            adminContent.innerHTML = `
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <h3>Códigos de Descuento</h3>
                        <p class="subtitle">Crear promociones y alianzas con influencers</p>
                    </div>

                    <div class="admin-form glass mb-20">
                        <input type="text" id="new-promo-code" placeholder="CÓDIGO (ej. AMOR20, INFLUENCERX)" class="input-glass" style="text-transform: uppercase;">
                        <input type="number" id="new-promo-perc" placeholder="% de Descuento (ej. 20)" class="input-glass mt-10" min="1" max="100">
                        <label class="mt-10 mb-5 text-sm opacity-70" style="display:block;">Fecha de expiración (opcional):</label>
                        <input type="date" id="new-promo-exp" class="input-glass" title="Fecha de expiración (opcional)">
                        
                        <label class="mt-10 mb-5 text-sm opacity-70" style="display:block;">Planes aplicables (opcional, si no se marca ninguno se aplica a todos):</label>
                        <div id="promo-plans-checkboxes" class="mt-5" style="display: flex; flex-direction: column; gap: 5px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            ${window.appState.plans.map(p => `
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9em; cursor: pointer;">
                                    <input type="checkbox" class="promo-plan-checkbox" value="${p.id}">
                                    ${p.name}
                                </label>
                            `).join('')}
                        </div>
                        <button class="btn-primary mt-10 w-full" id="btn-create-promo">Crear Código</button>
                    </div>

                    <h4>Códigos Activos</h4>
                    <div id="promo-list" class="admin-list-container mt-10">
                        ${codes.length === 0 ? '<p class="opacity-50">No hay códigos creados.</p>' : ''}
                        ${codes.map(c => {
                            const activeUsers = usersWithPromo.filter(u => u.active_promo === c.code);
                            return `
                            <div class="admin-item-card glass" style="flex-direction: column; align-items: stretch; padding: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div>
                                        <strong style="font-size: 1.1em; color: var(--accent-purple); display: block;">${c.code}</strong>
                                        <span class="tag mt-5" style="background: rgba(34, 197, 94, 0.2); color: #22c55e; display: inline-block;">${c.percent}% Dcto</span>
                                        ${c.expiresAt ? `<span class="tag mt-5 ml-5" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; display: inline-block;">Vence: ${new Date(c.expiresAt).toLocaleDateString()}</span>` : '<span class="tag mt-5 ml-5" style="background: rgba(156, 163, 175, 0.2); color: #9ca3af; display: inline-block;">Sin caducidad</span>'}
                                        ${c.plans && c.plans.length > 0 ? `<span class="tag mt-5 ml-5" style="background: rgba(147, 51, 234, 0.2); color: #c084fc; display: inline-block;">Planes: ${c.plans.map(pid => {
                                            const p = window.appState.plans.find(x => x.id === pid);
                                            return p ? p.name : pid;
                                        }).join(', ')}</span>` : '<span class="tag mt-5 ml-5" style="background: rgba(156, 163, 175, 0.2); color: #9ca3af; display: inline-block;">Todos los planes</span>'}
                                    </div>
                                    <button class="btn-glass btn-delete-promo" data-id="${c.id}" style="border-color: #ef4444; color: #ef4444; padding: 5px 10px;">Eliminar</button>
                                </div>
                                <div style="font-size: 0.9em; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                                    <strong>Usuarios usando este código: ${activeUsers.length}</strong>
                                    ${activeUsers.length > 0 ? `
                                        <ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
                                            ${activeUsers.map(u => `<li>${u.full_name || 'Usuario ' + u.id.substring(0, 5)}</li>`).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>
            `;

            window.lucide.createIcons();

            const createBtn = document.getElementById('btn-create-promo');
            if (createBtn) {
                createBtn.onclick = async () => {
                    const code = document.getElementById('new-promo-code').value.trim().toUpperCase();
                    const percent = parseInt(document.getElementById('new-promo-perc').value);
                    const expStr = document.getElementById('new-promo-exp').value;

                    const checkedPlanBoxes = document.querySelectorAll('.promo-plan-checkbox:checked');
                    const selectedPlans = Array.from(checkedPlanBoxes).map(cb => cb.value);
                    
                    if (!code || isNaN(percent) || percent <= 0 || percent > 100) {
                        return window.showToast("Código o porcentaje inválido", "#ef4444");
                    }
                    if (codes.find(c => c.code === code)) {
                        return window.showToast("Ese código ya existe", "#ef4444");
                    }
                    try {
                        const newDiscount = { 
                            code, 
                            percent, 
                            plans: selectedPlans.length > 0 ? selectedPlans : null,
                            expiresAt: expStr ? new Date(expStr + 'T23:59:59').toISOString() : null 
                        };
                        const { error: insErr } = await window.supabase.from('discounts').insert(newDiscount);
                        if (insErr) throw insErr;
                        window.showToast(`Código ${code} creado exitosamente`, "#22c55e");
                        renderAdminDiscounts(); // refresh view
                    } catch (err) {
                        console.error(err);
                        window.showToast("Error al crear código", "#ef4444");
                    }
                };
            }

            const deleteBtns = document.querySelectorAll('.btn-delete-promo');
            deleteBtns.forEach(btn => {
                btn.onclick = async (e) => {
                    if (confirm("¿Estás seguro de eliminar este código? (Los usuarios dejarán de tener el descuento)")) {
                        try {
                            const { error: delErr } = await window.supabase.from('discounts').delete().eq('id', e.target.getAttribute('data-id'));
                            if (delErr) throw delErr;
                            window.showToast("Código eliminado");
                            renderAdminDiscounts();
                        } catch (err) {
                            console.error(err);
                            window.showToast("Error al eliminar", "#ef4444");
                        }
                    }
                };
            });

        } catch (err) {
            console.error("Error loading discounts", err);
            window.showToast("Error cargando sección de descuentos", "#ef4444");
        }
    };

    
export const renderAdminNotifications = () => {
        const revSection = document.getElementById('admin-revenue-section');
        if (revSection) revSection.classList.add('hidden');

        const area = document.getElementById('admin-content-area');
        area.innerHTML = `
            <div class="admin-header-flex">
                <h3>Avisos Globales</h3>
                <button id="btn-create-notification" class="btn-primary">NUEVO AVISO</button>
            </div>
            <div id="admin-notifications-list" class="mt-20 user-list">
                <div style="text-align: center; color: var(--text-gray); padding: 20px;">Cargando avisos...</div>
            </div>

            <!-- Modal Nuevo Aviso -->
            <div id="modal-notif" class="overlay">
                <div class="glass" style="max-width: 500px; padding: 30px; border-radius: 20px; width: 90%;">
                    <h3>Publicar Aviso Global</h3>
                    <div class="form-group mt-20">
                        <label>Título del Aviso</label>
                        <input type="text" id="notif-title" placeholder="Ej: Clase Especial de Seminario">
                    </div>
                    <div class="form-group mt-15">
                        <label>Tipo de Aviso</label>
                        <select id="notif-type" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                            <option value="info" style="color: black;">Aviso General</option>
                            <option value="calendar" style="color: black;">Recordatorio (Aniversario, Seminario, Competencia)</option>
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
            </div>
        `;

        window.lucide.createIcons();

        const loadAdminNotifs = async () => {
            try {
                const notices = await SupabaseService.getNotifications();
                const listEl = document.getElementById('admin-notifications-list');

                if (notices.length === 0) {
                    listEl.innerHTML = '<div style="text-align: center; color: var(--text-gray); padding: 20px;">No hay avisos globales activos.</div>';
                    return;
                }

                listEl.innerHTML = notices.map(n => {
                    let color = 'var(--accent-cyan)';
                    let typeLabel = 'INFO';
                    if (n.type === 'alert') { color = '#ef4444'; typeLabel = 'URGENTE'; }
                    if (n.type === 'calendar') { color = '#f59e0b'; typeLabel = 'FECHA IMPORTANTE'; }

                    return `
                    <div class="user-card glass" style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${color};">
                        <div>
                            <h4>${n.title || ''}</h4>
                            <p style="font-size:0.85rem; color:var(--text-gray); margin-top:5px;">${n.message}</p>
                            <span style="font-size:0.75rem; color:${color};"><strong>[${typeLabel}]</strong> ${new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <button class="btn-secondary btn-delete-notif" data-id="${n.id}" style="padding: 8px;">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `}).join('');

                window.lucide.createIcons();

                document.querySelectorAll('.btn-delete-notif').forEach(btn => {
                    btn.onclick = async (e) => {
                        const id = e.currentTarget.dataset.id;
                        if (confirm('¿Seguro que deseas eliminar este aviso global?')) {
                            window.showToast('Eliminando aviso...', '#f59e0b');
                            await SupabaseService.deleteNotification(id);
                            window.showToast('Aviso eliminado exitosamente.', '#ef4444');
                            loadAdminNotifs();
                        }
                    };
                });
            } catch (err) {
                console.error(err);
                document.getElementById('admin-notifications-list').innerHTML = `<div style="color:#ef4444;">Error cargando avisos</div>`;
            }
        };

        const modal = document.getElementById('modal-notif');
        document.getElementById('btn-create-notification').onclick = () => {
            document.getElementById('notif-title').value = '';
            document.getElementById('notif-message').value = '';
            document.getElementById('notif-type').value = 'info';
            modal.classList.add('active');
        };

        document.getElementById('btn-close-notif').onclick = () => {
            modal.classList.remove('active');
        };

        document.getElementById('btn-save-notif').onclick = async () => {
            const title = document.getElementById('notif-title').value.trim();
            const msg = document.getElementById('notif-message').value.trim();
            const type = document.getElementById('notif-type').value;

            if (!title || !msg) {
                window.showToast("Por favor completa el título y mensaje.", "#ef4444");
                return;
            }

            try {
                window.showToast("Publicando aviso...", "#f59e0b");
                await SupabaseService.addNotification(title, msg, type);

                window.showToast("Aviso global publicado con éxito ✅", "#22c55e");
                modal.classList.remove('active');
                loadAdminNotifs();
            } catch (err) {
                console.error(err);
                window.showToast("Error publicando aviso", "#ef4444");
            }
        };

        loadAdminNotifs();
    };

    