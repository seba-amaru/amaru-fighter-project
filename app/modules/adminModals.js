import { appState } from '../store/appState.js';
import { SupabaseService } from '../services/supabaseService.js';
import unknowAvatar from '../images/unknow.png';
import { renderAdminClasses, renderAdminPlans } from './admin.js';
import { renderAdminMembers } from './members.js';
import { renderAdminPayments } from './payments.js';
import { forceRefreshRevenue } from './revenue.js';

const formatCurrency = (n) => {
    if (n === undefined || n === null) return '$0';
    return '$' + Math.round(n).toLocaleString('es-CL');
};

window.currentEditingMemberId = null;

// --- Global Modal Close Utility ---
export const closeAllModals = () => {
    document.querySelectorAll('.overlay').forEach(m => {
        m.classList.remove('active');
        m.style.display = ''; // Force clear inline flex
    });
};

// Close when clicking X or Cancel buttons





export const handlePaymentAction = async (id, status) => {
    try {
        await SupabaseService.updatePaymentStatus(id, status);

        if (status === 'approved') {
            const payment = await SupabaseService.getPayment(id);

            if (payment && payment.user_id) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);

                await SupabaseService.updateProfile(payment.user_id, {
                    membership_status: 'active',
                    membership_expiry: expiryDate.toISOString(),
                    membership_plan_id: payment.plan_id || null,
                    updated_at: new Date().toISOString()
                });

                await SupabaseService.deletePendingPayments(payment.user_id);
            }
        }

        window.showToast(`Pago ${status === 'approved' ? 'aprobado' : 'rechazado'} ✅`, status === 'approved' ? "#22c55e" : "#ef4444");
        renderAdminPayments();
        forceRefreshRevenue();
    } catch (err) {
        console.error(err);
        window.showToast("Error al actualizar pago", "#ef4444");
    }
};
export const deleteClass = async (id) => {
    if (!confirm("¿Eliminar esta clase?")) return;
    try {
        await SupabaseService.deleteClass(id);
        window.showToast("Clase eliminada ✅", "#22c55e");
        renderAdminClasses();
    } catch (err) {
        console.error(err);
        window.showToast("Error al eliminar clase", "#ef4444");
    }
};

export const deletePlan = async (id) => {
    if (!confirm("¿Eliminar este plan?")) return;
    try {
        await SupabaseService.deletePlan(id);
        window.showToast("Plan eliminado ✅", "#22c55e");
        renderAdminPlans();
    } catch (err) {
        console.error(err);
        window.showToast("Error al eliminar plan", "#ef4444");
    }
};

export const openClassModal = (id = null, classes = []) => {
    const modal = document.getElementById('class-modal');
    const form = document.getElementById('class-form');
    const title = document.getElementById('class-modal-title');

    form.reset();
    title.innerText = id ? 'Editar Clase 🥋' : 'Nueva Clase 🥋';

    const cls = id ? (classes.find(c => c.id == id) || {}) : {};

    document.getElementById('cls-name').value = cls.name || '';
    document.getElementById('cls-coach').value = cls.coach || '';
    document.getElementById('cls-time').value = cls.time || '';
    document.getElementById('cls-type').value = cls.type || 'Striking';
    document.getElementById('cls-theme').value = cls.theme || 'smoke-purple';
    if (document.getElementById('cls-capacity')) document.getElementById('cls-capacity').value = cls.capacity || 20;

    // Handle days checkboxes (Mapping 0-6 to names)
    const daysContainer = document.getElementById('cls-days-container');
    if (daysContainer) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const selectedDays = cls.days || []; // Array of integers
        daysContainer.innerHTML = dayNames.map((name, idx) => `
                <label class="day-check" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <input type="checkbox" name="cls-day" value="${idx}" ${selectedDays.includes(idx) ? 'checked' : ''}>
                    <span>${name}</span>
                </label>
            `).join('');
    }

    modal.classList.add('active');

    form.onsubmit = async (e) => {
        e.preventDefault();
        const checkedDays = Array.from(form.querySelectorAll('input[name="cls-day"]:checked')).map(cb => parseInt(cb.value));

        // NOTE: 'capacity' column removed — not in Supabase schema
        const classObj = {
            name: document.getElementById('cls-name').value.trim(),
            coach: document.getElementById('cls-coach').value.trim(),
            time: document.getElementById('cls-time').value,
            type: document.getElementById('cls-type').value,
            theme: document.getElementById('cls-theme').value,
            days: checkedDays.length > 0 ? checkedDays : [1, 2, 3, 4, 5],
            img: cls.img || 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500'
        };
        classObj.id = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

        try {
            window.showLoading("Guardando clase...");
            await SupabaseService.upsertClass(classObj);
            window.hideLoading();
            window.showToast("Clase guardada ✅", "#22c55e");
            window.appState.classes = await SupabaseService.getClasses();
            modal.classList.remove('active');
            renderAdminClasses();
        } catch (err) {
            console.error(err);
            window.hideLoading();
            window.showToast("Fallo al guardar clase ❌", "#ef4444");
        }
    };
};

export const openPlanModal = (id = null, plans = []) => {
    const modal = document.getElementById('plan-modal');
    const form = document.getElementById('plan-form');
    const title = document.getElementById('plan-modal-title');

    form.reset();
    title.innerText = id ? 'Editar Plan 💎' : 'Nuevo Plan 💎';

    const p = id ? (plans.find(pl => pl.id == id) || {}) : {};

    document.getElementById('plan-name').value = p.name || '';
    document.getElementById('plan-price').value = p.price || '';
    document.getElementById('plan-limit').value = p.limit || 0;
    document.getElementById('plan-monthly').value = p.monthly || 0;
    if (document.getElementById('plan-subtitle')) document.getElementById('plan-subtitle').value = p.subtitle || '';
    document.getElementById('plan-theme').value = p.theme || 'bronze';
    if (document.getElementById('plan-features')) document.getElementById('plan-features').value = p.features ? p.features.join(', ') : '';
    if (document.getElementById('plan-popular')) document.getElementById('plan-popular').checked = p.popular || false;
    if (document.getElementById('plan-desc')) document.getElementById('plan-desc').value = p.description || '';

    // Handle days for plan
    const planDaysContainer = document.getElementById('plan-days-container');
    if (planDaysContainer) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        // Supabase plans might have days as array or string. Assume array of ints for consistency with classes.
        const selectedDays = Array.isArray(p.days) ? p.days : [];
        planDaysContainer.innerHTML = dayNames.map((name, idx) => `
                <label class="day-check" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <input type="checkbox" name="plan-day" value="${idx}" ${selectedDays.includes(idx) ? 'checked' : ''}>
                    <span>${name}</span>
                </label>
            `).join('');
    }

    modal.classList.add('active');

    form.onsubmit = async (e) => {
        e.preventDefault();
        const featuresInput = document.getElementById('plan-features');
        const features = featuresInput ? featuresInput.value.split(',').map(f => f.trim()).filter(f => f) : [];
        const checkedDays = Array.from(form.querySelectorAll('input[name="plan-day"]:checked')).map(cb => parseInt(cb.value));

        const planObj = {
            name: document.getElementById('plan-name').value.trim(),
            price: parseFloat(document.getElementById('plan-price').value),
            monthly: parseInt(document.getElementById('plan-monthly').value),
            limit: parseInt(document.getElementById('plan-limit').value),
            theme: document.getElementById('plan-theme').value.trim(),
            subtitle: document.getElementById('plan-subtitle') ? document.getElementById('plan-subtitle').value.trim() : '',
            features: features,
            popular: document.getElementById('plan-popular') ? document.getElementById('plan-popular').checked : false,
            days: checkedDays,
            description: document.getElementById('plan-desc') ? document.getElementById('plan-desc').value.trim() : ''
        };
        planObj.id = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
        planObj.sort_order = id ? (p.sort_order || 0) : plans.length;

        try {
            window.showLoading("Guardando plan...");
            await SupabaseService.upsertPlan(planObj);
            window.hideLoading();
            window.showToast("Plan guardado ✅", "#22c55e");
            modal.classList.remove('active');
            renderAdminPlans();
        } catch (err) {
            console.error(err);
            window.hideLoading();
            window.showToast("Fallo al guardar plan ❌", "#ef4444");
        }
    };
};


window.currentEditingMemberId = null;
let currentEditingUsers = [];

const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

const switchMemberTab = (tabName) => {
    document.querySelectorAll('.mem-tab').forEach(t => {
        t.style.background = 'transparent';
        t.style.color = 'var(--text-gray)';
        t.style.borderColor = 'transparent';
    });
    const activeTab = document.querySelector(`.mem-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.style.background = 'var(--accent-purple)';
        activeTab.style.color = 'white';
        activeTab.style.borderColor = 'var(--accent-purple)';
    }
    ['profile', 'membership', 'attendance', 'payments', 'notes'].forEach(t => {
        const el = document.getElementById(`mem-tab-${t}`);
        if (el) el.classList.toggle('hidden', t !== tabName);
    });
};

export const openMemberModal = async (id = null, users = []) => {
    try {
        window.currentEditingMemberId = id;
        currentEditingUsers = users;
        const modal = document.getElementById('member-modal');
        if (!modal) { console.error("Modal 'member-modal' not found!"); return; }

        document.querySelectorAll('.overlay').forEach(ov => ov.classList.remove('active'));
        modal.classList.add('active');
        modal.style.display = 'flex';
        window.lucide.createIcons();

        const title = document.getElementById('member-modal-title');
        const form = document.getElementById('member-form');
        const profileSummary = document.getElementById('mem-profile-summary');
        const tabsContainer = document.getElementById('mem-modal-tabs');
        const planSelect = document.getElementById('mem-plan');
        const riskBanner = document.getElementById('mem-risk-banner');

        // Populate plans
        if (planSelect) {
            planSelect.innerHTML = '<option value="" style="color: black;">Sin Plan (Inactivo)</option>';
            (window.appState.plans || []).forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id; opt.text = p.name; opt.style.color = "black";
                planSelect.appendChild(opt);
            });
        }

        document.querySelectorAll('.mem-tab').forEach(tab => {
            tab.onclick = (e) => { e.preventDefault(); switchMemberTab(tab.getAttribute('data-tab')); };
        });

        if (id) {
            const user = users.find(u => u.id === id);
            if (!user) {
                console.warn("User not found in array:", id);
                window.showToast("Socio no encontrado", "#ef4444");
                return;
            }

            if (title) title.innerText = "Editar Socio";
            if (profileSummary) {
                profileSummary.classList.remove('hidden');
                profileSummary.style.display = 'flex';
            }

            // Avatar + Status Indicator
            const avatarPrev = document.getElementById('mem-avatar-preview');
            if (avatarPrev) avatarPrev.src = user.photo_url || (typeof unknowAvatar !== 'undefined' ? unknowAvatar : '');

            const statusIndicator = document.getElementById('mem-status-indicator');
            const expiryDate = user.membership_expiry ? new Date(user.membership_expiry) : null;
            const now = new Date();
            const daysLeft = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : 0;
            let statusColor = '#ef4444';
            if (user.is_frozen) statusColor = '#3b82f6';
            else if (daysLeft > 0) statusColor = '#22c55e';
            else if (daysLeft > -30) statusColor = '#f97316';
            if (statusIndicator) statusIndicator.style.background = statusColor;

            const dispName = document.getElementById('mem-display-name');
            if (dispName) dispName.textContent = user.full_name || 'Sin Nombre';

            const dispEmail = document.getElementById('mem-display-email');
            if (dispEmail) dispEmail.textContent = user.email || '';

            // Status Badge
            const statusBadge = document.getElementById('mem-display-status-badge');
            if (statusBadge) {
                let statusLabel = 'Inactivo';
                if (user.is_frozen) statusLabel = 'Congelado';
                else if (daysLeft > 0) statusLabel = 'Activo';
                else if (daysLeft > -30) statusLabel = 'Moroso';
                statusBadge.textContent = statusLabel;
                statusBadge.style.background = `${statusColor}20`;
                statusBadge.style.color = statusColor;
                statusBadge.style.borderColor = `${statusColor}40`;
            }

            // Plan badge
            const planBadge = document.getElementById('mem-display-plan');
            if (planBadge) planBadge.textContent = user.membership_plans?.name || 'Sin Plan';

            // Level badge
            const levelBadge = document.getElementById('mem-display-level');
            if (levelBadge) levelBadge.textContent = `LVL ${user.level || 0}`;

            // Expiry badge
            const expiryBadge = document.getElementById('mem-display-expiry');
            if (expiryBadge) {
                if (daysLeft > 0) expiryBadge.textContent = `${daysLeft} días restantes`;
                else if (daysLeft > -30) expiryBadge.textContent = 'Moroso';
                else expiryBadge.textContent = 'Expirado';
                expiryBadge.style.color = daysLeft <= 5 ? '#ef4444' : '#fbbf24';
                expiryBadge.style.background = daysLeft <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)';
                expiryBadge.style.borderColor = daysLeft <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)';
            }

            // Risk Banner
            if (riskBanner) {
                const reasons = [];
                if (daysLeft !== null && daysLeft <= 5 && daysLeft > 0) reasons.push(`Vence en ${daysLeft} días`);
                if (daysLeft <= 0 && daysLeft > -30) reasons.push('Membresía vencida');
                const lastAtt = user._lastAttendance;
                const daysSinceAtt = lastAtt ? Math.floor((now - new Date(lastAtt)) / (1000 * 60 * 60 * 24)) : -1;
                if (daysSinceAtt > 14) reasons.push(`Sin asistir ${daysSinceAtt} días`);
                if (reasons.length > 0) {
                    riskBanner.classList.remove('hidden');
                    document.getElementById('mem-risk-text').textContent = `⚠️ ${reasons.join(' • ')}`;
                } else {
                    riskBanner.classList.add('hidden');
                }
            }

            // Quick Actions
            const quickActions = document.getElementById('mem-quick-actions');
            if (quickActions) {
                quickActions.style.display = 'flex';
                document.getElementById('btn-mem-renew').onclick = () => quickRenewMember(user.id);
                document.getElementById('btn-mem-freeze').onclick = () => toggleFreezeMember(user.id, !user.is_frozen);
                document.getElementById('btn-mem-message').onclick = async () => {
                    if (!window.SupabaseService) {
                        window.showToast('El servicio de comunicaciones no está disponible. Recarga la página.', '#ef4444');
                        return;
                    }
                    const channel = prompt(`Enviar mensaje a ${user.full_name}\n\nElige canal:\n1 = 📱 In-App\n2 = ✉️ Email\n3 = 🔄 Ambos`);
                    if (!channel) return;
                    const choice = channel.trim();
                    const sendInApp = choice === '1' || choice === '3';
                    const sendEmail = choice === '2' || choice === '3';
                    if (!sendInApp && !sendEmail) {
                        window.showToast('Opción inválida. Usa 1, 2 o 3.', '#ef4444');
                        return;
                    }
                    const msg = prompt(`Mensaje para ${user.full_name}:`);
                    if (!msg) return;
                    try {
                        window.showToast(`Enviando mensaje...`, "#f59e0b");
                        if (sendInApp) {
                            await window.SupabaseService.sendUserNotification(
                                user.id, 'Mensaje directo del equipo Amaru', msg, 'direct'
                            );
                        }
                        if (sendEmail && user.email && user.email.includes('@')) {
                            await window.SupabaseService.sendBulkEmail(
                                [user.email], 'Mensaje de Amaru', msg, null
                            );
                        }
                        window.showToast(`Mensaje enviado a ${user.full_name} ✅`, "#22c55e");
                    } catch (err) {
                        console.error('[adminModals] Error enviando mensaje:', err);
                        window.showToast('Error al enviar mensaje. Intenta de nuevo.', "#ef4444");
                    }
                };
                document.getElementById('btn-mem-delete').onclick = () => deleteMember(user.id);
            }

            if (tabsContainer) {
                tabsContainer.classList.remove('hidden');
                tabsContainer.style.display = 'flex';
            }

            // Set form values
            setVal('mem-name', user.full_name);
            setVal('mem-rut', user.rut);
            setVal('mem-email', user.email);
            setVal('mem-phone', user.phone);
            setVal('mem-level', user.level || 0);
            setVal('mem-xp', user.xp || 0);
            setVal('mem-entry-date', user.created_at ? user.created_at.split('T')[0] : '');
            setVal('mem-birthdate', user.birthdate);
            setVal('mem-address', user.address);
            setVal('mem-emergency-contact', user.emergency_contact);
            setVal('mem-admin-notes', user.admin_notes);
            setVal('mem-plan', user.membership_plan_id);

            const memStatusSelect = document.getElementById('mem-status');
            if (memStatusSelect) {
                if (user.is_frozen) memStatusSelect.value = 'frozen';
                else if (user.membership_status === 'active' && daysLeft > 0) memStatusSelect.value = 'active';
                else memStatusSelect.value = 'inactive';
            }

            setVal('mem-expiry', user.membership_expiry ? user.membership_expiry.split('T')[0] : '');
            setVal('mem-class-limit', user.membership_limit || 2);
            setVal('mem-surcharge', user.surcharge_pct || 30);

            // Progress bar v2
            const statusDisplay = document.getElementById('mem-status-display');
            if (statusDisplay) {
                if (expiryDate && user.membership_status === 'active') {
                    statusDisplay.classList.remove('hidden');
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    const daysLeftEl = document.getElementById('mem-days-left');
                    const progressBar = document.getElementById('mem-progress-bar');
                    const startEl = document.getElementById('mem-progress-start');
                    const endEl = document.getElementById('mem-progress-end');

                    if (daysLeftEl) {
                        daysLeftEl.textContent = daysLeft > 0 ? `${daysLeft} días restantes` : 'Expirado';
                        daysLeftEl.style.color = daysLeft <= 5 ? '#ef4444' : (daysLeft <= 10 ? '#fbbf24' : '#22c55e');
                    }
                    if (progressBar) {
                        const planDays = 30;
                        const progress = Math.max(0, Math.min(100, ((planDays - daysLeft) / planDays) * 100));
                        progressBar.style.width = `${progress}%`;
                        progressBar.style.background = daysLeft <= 5
                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                            : 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))';
                    }
                    if (startEl) {
                        const startDate = new Date(expiryDate);
                        startDate.setDate(startDate.getDate() - 30);
                        startEl.textContent = startDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
                    }
                    if (endEl) {
                        endEl.textContent = expiryDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
                    }
                } else { statusDisplay.classList.add('hidden'); }
            }

            // Extension buttons
            const btnExtend7 = document.getElementById('btn-mem-extend-7');
            const btnExtend30 = document.getElementById('btn-mem-extend-30');
            if (btnExtend7) {
                btnExtend7.onclick = () => extendMembership(user.id, 7);
            }
            if (btnExtend30) {
                btnExtend30.onclick = () => extendMembership(user.id, 30);
            }

            // Pass tools
            const passTools = document.getElementById('admin-pass-tools');
            if (passTools) {
                passTools.classList.remove('hidden');
                const btnReset = document.getElementById('btn-admin-reset-pass');
                if (btnReset) {
                    btnReset.onclick = async () => {
                        if (confirm(`¿Enviar email de restablecimiento a ${user.email}?`)) {
                            try {
                                const { error } = await window.supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/app/' });
                                if (error) throw error;
                                window.showToast("Email enviado correctamente 📧", "#22c55e");
                            } catch (err) { console.error(err); window.showToast("Error al enviar email ❌", "#ef4444"); }
                        }
                    };
                }
            }

            // Load data for tabs
            loadMemberAttendance(user.id);
            loadMemberPayments(user.id);
            switchMemberTab('profile');
        } else {
            if (title) title.innerText = "Nuevo Socio";
            if (form) form.reset();
            setVal('mem-entry-date', new Date().toISOString().split('T')[0]);
            setVal('mem-xp', 0);
            setVal('mem-level', 0);
            if (profileSummary) profileSummary.classList.add('hidden');
            if (tabsContainer) tabsContainer.classList.add('hidden');
            const riskBannerEl = document.getElementById('mem-risk-banner');
            if (riskBannerEl) riskBannerEl.classList.add('hidden');
            const quickActions = document.getElementById('mem-quick-actions');
            if (quickActions) quickActions.style.display = 'none';
            switchMemberTab('profile');
        }
    } catch (err) {
        console.error("Error opening member modal:", err);
        window.showToast("Error crítico al abrir editor ❌", "#ef4444");
    }
};

// Extend membership by N days
const extendMembership = async (uid, days) => {
    try {
        const user = currentEditingUsers.find(u => u.id === uid);
        const currentExpiry = user?.membership_expiry ? new Date(user.membership_expiry) : new Date();
        if (currentExpiry < new Date()) currentExpiry.setTime(Date.now());
        currentExpiry.setDate(currentExpiry.getDate() + days);
        await SupabaseService.updateProfile(uid, {
            membership_expiry: currentExpiry.toISOString(),
            membership_status: 'active',
            is_frozen: false
        });
        window.showToast(`Membresía extendida +${days} días ✅`, "#22c55e");
        const updatedUsers = await window.supabase.from('profiles').select('*');
        if (updatedUsers.data) {
            currentEditingUsers = updatedUsers.data;
            const updatedUser = updatedUsers.data.find(u => u.id === uid);
            if (updatedUser) openMemberModal(uid, updatedUsers.data);
        }
    } catch (err) {
        console.error(err);
        window.showToast("Error al extender membresía ❌", "#ef4444");
    }
};

const quickRenewMember = async (uid) => {
    const user = currentEditingUsers.find(u => u.id === uid);
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

        // Auto-register payment for renewal
        const plan = (window.appState.plans || []).find(p => p.id === user.membership_plan_id);
        const amount = plan?.price || plan?.monthly || 0;
        if (amount > 0) {
            const now = new Date();
            const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][now.getMonth()];
            const { error: payErr } = await window.supabase.from('payments').insert({
                user_id: uid,
                amount,
                concept: `Renovación ${plan?.name || 'Membresía'}`,
                status: 'approved',
                payment_method: 'efectivo',
                coverage_month: `${monthName} ${now.getFullYear()}`,
                created_at: new Date().toISOString()
            });
            if (payErr) console.warn('[AdminModals] Renewal payment insert failed:', payErr);
            else {
                window.showToast(`Pago de ${formatCurrency(amount)} registrado ✅`, '#22c55e');
                forceRefreshRevenue();
            }
        }

        window.showToast('Plan renovado exitosamente ✅', '#22c55e');
        const updatedUsers = await window.supabase.from('profiles').select('*');
        if (updatedUsers.data) openMemberModal(uid, updatedUsers.data);
    } catch (err) {
        console.error(err);
        window.showToast('Error al renovar plan.', '#ef4444');
    }
};

const toggleFreezeMember = async (uid, freeze) => {
    try {
        await window.supabase.from('profiles').update({ is_frozen: freeze }).eq('id', uid);
        window.showToast(freeze ? 'Membresía congelada 🧊' : 'Membresía descongelada ✅', freeze ? '#3b82f6' : '#22c55e');
        const updatedUsers = await window.supabase.from('profiles').select('*');
        if (updatedUsers.data) openMemberModal(uid, updatedUsers.data);
    } catch (err) {
        console.error(err);
        window.showToast('Error al cambiar estado ❌', '#ef4444');
    }
};

// Load member attendance data + heatmap
export const loadMemberAttendance = async (uid) => {
    const listContainer = document.getElementById('mem-attendance-list');
    const statTotal = document.getElementById('mem-stat-total');
    const statMonth = document.getElementById('mem-stat-month');
    const statWeek = document.getElementById('mem-stat-week');
    const heatmapContainer = document.getElementById('mem-attendance-heatmap');

    if (listContainer) listContainer.innerHTML = '<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>';
    window.lucide.createIcons();

    try {
        const attendance = await SupabaseService.getAttendance(uid);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const totalAtt = attendance ? attendance.length : 0;
        const monthAtt = attendance ? attendance.filter(a => { const d = new Date(a.attended_at); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; }).length : 0;

        // Week count (last 7 days)
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAtt = attendance ? attendance.filter(a => new Date(a.attended_at) >= weekAgo).length : 0;

        if (statTotal) statTotal.textContent = totalAtt;
        if (statMonth) statMonth.textContent = monthAtt;
        if (statWeek) statWeek.textContent = weekAtt;

        // Render heatmap (last 28 days)
        if (heatmapContainer) {
            const days = [];
            for (let i = 27; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                const count = attendance ? attendance.filter(a => a.attended_at && a.attended_at.startsWith(dStr)).length : 0;
                days.push({ date: d, count });
            }
            heatmapContainer.innerHTML = days.map(d => {
                const opacity = d.count === 0 ? 0.05 : (d.count === 1 ? 0.3 : (d.count === 2 ? 0.6 : 1));
                const tooltip = `${d.date.toLocaleDateString('es-CL')} — ${d.count} asistencia${d.count !== 1 ? 's' : ''}`;
                return `<div title="${tooltip}" style="aspect-ratio:1; border-radius:4px; background:rgba(139,92,246,${opacity}); cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>`;
            }).join('');
        }

        // Render attendance list
        if (attendance && attendance.length > 0) {
            const sorted = [...attendance].sort((a, b) => new Date(b.attended_at) - new Date(a.attended_at));
            if (listContainer) {
                listContainer.innerHTML = sorted.slice(0, 50).map(a => {
                    const date = new Date(a.attended_at);
                    const dateStr = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeStr = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                    const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' });
                    return `<div style="display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; margin-bottom:6px; background:rgba(6,182,212,0.06); border:1px solid rgba(255,255,255,0.04);">
                        <div style="width:36px; height:36px; border-radius:8px; background:var(--accent-cyan)15; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="calendar-check" style="width:14px; color:var(--accent-cyan);"></i></div>
                        <div style="flex:1; min-width:0;"><strong style="font-size:0.85rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.class_name || 'Clase'}</strong><span style="font-size:0.7rem; color:var(--text-gray);">${dayName} — ${dateStr}</span></div>
                        <span style="font-size:0.7rem; color:rgba(255,255,255,0.4); flex-shrink:0;">${timeStr}</span>
                    </div>`;
                }).join('');
            }
        } else {
            if (listContainer) {
                listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-gray);"><i data-lucide="inbox" style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;"></i><p style="font-size:0.85rem;">Sin asistencias registradas</p></div>';
            }
        }
        window.lucide.createIcons();
    } catch (err) {
        console.error("Error loading member attendance:", err);
        if (listContainer) listContainer.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar asistencias</p>';
    }
};

// Load member payments data
export const loadMemberPayments = async (uid) => {
    const listContainer = document.getElementById('mem-payments-list');
    const statTotal = document.getElementById('mem-pay-total');
    const statPending = document.getElementById('mem-pay-pending');
    const statAmount = document.getElementById('mem-pay-amount');

    if (listContainer) listContainer.innerHTML = '<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>';
    window.lucide.createIcons();

    try {
        const payments = await SupabaseService.getPayments(uid);
        const totalPayments = payments ? payments.length : 0;
        const pendingPayments = payments ? payments.filter(p => p.status === 'pending').length : 0;
        const totalAmount = payments ? payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) : 0;

        if (statTotal) statTotal.textContent = totalPayments;
        if (statPending) statPending.textContent = pendingPayments;
        if (statAmount) statAmount.textContent = `$${totalAmount.toLocaleString('es-CL')}`;

        if (payments && payments.length > 0) {
            const sorted = [...payments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            if (listContainer) {
                listContainer.innerHTML = sorted.map(p => {
                    const date = new Date(p.created_at);
                    const dateStr = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
                    const isApproved = p.status === 'approved';
                    const color = isApproved ? '#22c55e' : '#fbbf24';
                    const bgColor = isApproved ? 'rgba(34,197,94,0.06)' : 'rgba(251,191,36,0.06)';
                    const icon = isApproved ? 'check-circle' : 'clock';
                    const statusLabel = isApproved ? 'Aprobado' : 'Pendiente';
                    const amount = parseFloat(p.amount) || 0;
                    const methodLabels = {
                        transferencia: 'Transferencia Bancaria',
                        pasarela: 'Pasarela de Pago',
                        efectivo: 'Efectivo',
                        mercadopago: 'Mercado Pago',
                        webpay: 'Webpay',
                        manual: 'Transferencia/Manual'
                    };
                    const methodLabel = methodLabels[p.payment_method] || methodLabels[p.method] || 'Transferencia';
                    return `<div style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:10px; margin-bottom:6px; background:${bgColor}; border:1px solid rgba(255,255,255,0.04);">
                        <div style="width:36px; height:36px; border-radius:8px; background:${color}15; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="${icon}" style="width:14px; color:${color};"></i></div>
                        <div style="flex:1; min-width:0;">
                            <strong style="font-size:0.85rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.concept || 'Pago'}</strong>
                            <span style="font-size:0.7rem; color:var(--text-gray);">${statusLabel} — ${dateStr}</span>
                        </div>
                        <div style="text-align:right; flex-shrink:0;">
                            <span style="font-size:0.9rem; font-weight:800; color:${color}; display:block;">$${amount.toLocaleString('es-CL')}</span>
                            <span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">${methodLabel}</span>
                        </div>
                    </div>`;
                }).join('');
            }
        } else {
            if (listContainer) {
                listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-gray);"><i data-lucide="inbox" style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;"></i><p style="font-size:0.85rem;">Sin pagos registrados</p></div>';
            }
        }
        window.lucide.createIcons();
    } catch (err) {
        console.error("Error loading member payments:", err);
        if (listContainer) listContainer.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar pagos</p>';
    }
};

export const deleteMember = async (id) => {
    if (confirm('¿Eliminar socio definitivamente? Todo su progreso y reservas se borrarán.')) {
        try {
            await SupabaseService.softDeleteUser(id);
            window.showToast("Socio eliminado correctamente 🗑️", "#ef4444");
            renderAdminMembers();
            closeAllModals();
        } catch (err) {
            console.error(err);
            window.showToast("Error al eliminar socio ❌", "#ef4444");
        }
    }
};






export const initModals = () => {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-close-modal') || e.target.closest('.btn-close') || e.target.closest('.btn-action-cancel')) {
            closeAllModals();
        }
        if (e.target.classList.contains('overlay')) {
            closeAllModals();
        }
    });

    const memberForm = document.getElementById('member-form');
    if (memberForm) {
        memberForm.onsubmit = async (e) => {
            e.preventDefault();
            const nameVal = document.getElementById('mem-name').value.trim();
            const rutVal = document.getElementById('mem-rut')?.value.trim() || '';
            const emailVal = document.getElementById('mem-email').value.trim();
            const phoneVal = document.getElementById('mem-phone').value.trim();
            const levelVal = parseInt(document.getElementById('mem-level').value) || 0;
            const xpVal = parseInt(document.getElementById('mem-xp').value) || 0;
            const entryDateVal = document.getElementById('mem-entry-date').value;
            const birthdateVal = document.getElementById('mem-birthdate').value;
            const addressVal = document.getElementById('mem-address')?.value.trim() || '';
            const emergencyVal = document.getElementById('mem-emergency-contact').value.trim();
            const notesVal = document.getElementById('mem-admin-notes').value.trim();
            const planId = document.getElementById('mem-plan').value;
            const statusVal = document.getElementById('mem-status').value;
            const expiryVal = document.getElementById('mem-expiry').value;
            const classLimitVal = parseInt(document.getElementById('mem-class-limit').value) || 2;
            const surchargeVal = parseInt(document.getElementById('mem-surcharge').value) || 30;

            if (!nameVal) {
                window.showToast("El nombre completo es obligatorio ⚠️", "#eab308");
                return;
            }

            // Si no hay email, generar uno automáticamente para socios sin tecnología
            let finalEmail = emailVal;
            if (!finalEmail) {
                const timestamp = Date.now();
                const safeName = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
                finalEmail = `socio.${safeName}.${timestamp}@amaru.local`;
            }

            const memberData = {
                full_name: nameVal,
                rut: rutVal || null,
                email: finalEmail,
                phone: phoneVal || null,
                level: levelVal,
                xp: xpVal,
                birthdate: birthdateVal || null,
                address: addressVal || null,
                emergency_contact: emergencyVal || null,
                admin_notes: notesVal || null,
                membership_plan_id: planId || null,
                membership_limit: classLimitVal,
                surcharge_pct: surchargeVal,
                is_frozen: statusVal === 'frozen'
            };

            if (entryDateVal) {
                memberData.created_at = new Date(entryDateVal).toISOString();
            }

            if (statusVal === 'active') {
                memberData.membership_status = 'active';
                if (expiryVal) {
                    memberData.membership_expiry = new Date(expiryVal).toISOString();
                } else {
                    const dateObj = new Date();
                    dateObj.setDate(dateObj.getDate() + 30);
                    memberData.membership_expiry = dateObj.toISOString();
                }
            } else if (statusVal === 'frozen') {
                memberData.membership_status = 'active';
                if (expiryVal) memberData.membership_expiry = new Date(expiryVal).toISOString();
            } else {
                memberData.membership_status = 'inactive';
                memberData.membership_expiry = expiryVal ? new Date(expiryVal).toISOString() : null;
            }

            try {
                if (window.currentEditingMemberId) {
                    // Get previous state to detect activation without payment
                    const prevUser = currentEditingUsers.find(u => u.id === window.currentEditingMemberId);
                    const wasInactive = !prevUser || prevUser.membership_status !== 'active';
                    const nowActive = memberData.membership_status === 'active';
                    const nowHasPlan = !!memberData.membership_plan_id;

                    await SupabaseService.updateProfile(window.currentEditingMemberId, memberData);

                    // Auto-register payment if user became active with a plan
                    if (wasInactive && nowActive && nowHasPlan) {
                        const plan = (window.appState.plans || []).find(p => p.id === memberData.membership_plan_id);
                        const amount = plan?.price || plan?.monthly || 0;
                        if (amount > 0) {
                            const now = new Date();
                            const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][now.getMonth()];
                            const { error: payErr } = await window.supabase.from('payments').insert({
                                user_id: window.currentEditingMemberId,
                                amount,
                                concept: plan?.name || 'Membresía',
                                status: 'approved',
                                payment_method: 'efectivo',
                                coverage_month: `${monthName} ${now.getFullYear()}`,
                                created_at: new Date().toISOString()
                            });
                            if (payErr) console.warn('[AdminModals] Auto-payment insert failed:', payErr);
                            else {
                                window.showToast(`Pago de ${formatCurrency(amount)} registrado ✅`, '#22c55e');
                                forceRefreshRevenue();
                            }
                        }
                    }

                    window.showToast("Datos de socio actualizados ✅", "#22c55e");
                } else {
                    window.showToast("Creando nuevo socio... 🥋", "#8b5cf6");
                    const { data: funcData, error: funcError } = await window.supabase.functions.invoke('create-user', {
                        body: {
                            email: finalEmail,
                            password: 'Amaru123!',
                            full_name: nameVal,
                            memberData: {
                                rut: rutVal || null,
                                phone: phoneVal || null,
                                level: levelVal,
                                xp: xpVal,
                                birthdate: birthdateVal || null,
                                address: addressVal || null,
                                emergency_contact: emergencyVal || null,
                                admin_notes: notesVal || null,
                                membership_plan_id: planId || null,
                                membership_limit: classLimitVal,
                                surcharge_pct: surchargeVal,
                                is_frozen: statusVal === 'frozen',
                                membership_status: memberData.membership_status,
                                membership_expiry: memberData.membership_expiry,
                                created_at: memberData.created_at
                            }
                        }
                    });
                    if (funcError) throw funcError;
                    if (!funcData || !funcData.success) {
                        throw new Error(funcData?.error || 'Error al crear socio via Edge Function');
                    }

                    // Auto-register payment for new active members with a plan
                    if (funcData.userId && statusVal === 'active' && planId) {
                        const plan = (window.appState.plans || []).find(p => p.id === planId);
                        const amount = plan?.price || plan?.monthly || 0;
                        if (amount > 0) {
                            const now = new Date();
                            const monthName = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][now.getMonth()];
                            const { error: payErr } = await window.supabase.from('payments').insert({
                                user_id: funcData.userId,
                                amount,
                                concept: plan?.name || 'Membresía',
                                status: 'approved',
                                payment_method: 'efectivo',
                                coverage_month: `${monthName} ${now.getFullYear()}`,
                                created_at: new Date().toISOString()
                            });
                            if (payErr) console.warn('[AdminModals] Auto-payment insert failed:', payErr);
                            else {
                                window.showToast(`Pago de ${formatCurrency(amount)} registrado ✅`, '#22c55e');
                                forceRefreshRevenue();
                            }
                        }
                    }

                    window.showToast("Socio creado exitosamente ✅", "#22c55e");
                }
                document.getElementById('member-modal').classList.remove('active');
                renderAdminMembers();
            } catch (err) {
                console.error(err);
                window.showToast("Error al guardar socio ❌", "#ef4444");
            }
        };
    }

    // Guardar y Notificar button
    const btnSaveNotify = document.getElementById('btn-mem-save-notify');
    if (btnSaveNotify) {
        btnSaveNotify.onclick = () => {
            const form = document.getElementById('member-form');
            if (form) {
                form.dataset.notify = 'true';
                form.dispatchEvent(new Event('submit'));
                form.dataset.notify = '';
            }
        };
    }
};
