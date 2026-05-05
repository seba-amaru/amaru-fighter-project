import { appState } from '../store/appState.js';
import { SupabaseService } from '../services/supabaseService.js';
import unknowAvatar from '../images/unknow.png';
import { renderAdminActiveUsers, renderAdminClasses, renderAdminPlans, renderAdminPayments } from './admin.js';

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
            const activeTab = document.getElementById('tab-approved-btn').style.background !== '' ? 'approved' : 'pending';
            renderAdminPayments(activeTab);
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
    export const openMemberModal = async (id = null, users = []) => {
        try {
            window.currentEditingMemberId = id;
            currentEditingUsers = users;
            const modal = document.getElementById('member-modal');
            if (!modal) { console.error("Modal 'member-modal' not found!"); return; }

            // Close other modals first
            document.querySelectorAll('.overlay').forEach(ov => ov.classList.remove('active'));
            
            // Show modal immediately
            modal.classList.add('active');
            modal.style.display = 'flex'; // Extra force
            window.lucide.createIcons();

            const title = document.getElementById('member-modal-title');
            const form = document.getElementById('member-form');
            const profileSummary = document.getElementById('mem-profile-summary');
            const tabsContainer = document.getElementById('mem-modal-tabs');
            const planSelect = document.getElementById('mem-plan');

            // Populate plans
            if (planSelect) {
                planSelect.innerHTML = '<option value="" style="color: black;">Sin Plan (Inactivo)</option>';
                (window.appState.plans || []).forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id; opt.text = p.name; opt.style.color = "black";
                    planSelect.appendChild(opt);
                });
            }

            // Tab switching logic
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            const switchMemberTab = (tabName) => {
                document.querySelectorAll('.mem-tab').forEach(t => {
                    t.style.background = 'rgba(255,255,255,0.05)';
                    t.style.color = 'var(--text-gray)';
                    t.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                const activeTab = document.querySelector(`.mem-tab[data-tab="${tabName}"]`);
                if (activeTab) {
                    activeTab.style.background = 'var(--accent-purple)';
                    activeTab.style.color = 'white';
                    activeTab.style.borderColor = 'var(--accent-purple)';
                }
                const tProfile = document.getElementById('mem-tab-profile');
                const tMemb = document.getElementById('mem-tab-membership');
                const tHist = document.getElementById('mem-tab-history');
                if (tProfile) tProfile.classList.toggle('hidden', tabName !== 'profile');
                if (tMemb) tMemb.classList.toggle('hidden', tabName !== 'membership');
                if (tHist) tHist.classList.toggle('hidden', tabName !== 'history');
            };

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
                
                const avatarPrev = document.getElementById('mem-avatar-preview');
                if (avatarPrev) avatarPrev.src = user.photo_url || (typeof unknowAvatar !== 'undefined' ? unknowAvatar : '');
                
                const dispName = document.getElementById('mem-display-name');
                if (dispName) dispName.textContent = user.full_name || 'Sin Nombre';
                
                const dispEmail = document.getElementById('mem-display-email');
                if (dispEmail) dispEmail.textContent = user.email || '';

                // Badges
                const badgesContainer = document.getElementById('mem-display-badges');
                if (badgesContainer) {
                    const expiryDate = user.membership_expiry ? new Date(user.membership_expiry) : null;
                    const now = new Date();
                    const daysLeft = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : 0;
                    let statusLabel = 'Inactivo'; let statusColor = '#ef4444';
                    if (user.is_frozen) { statusLabel = 'Congelado'; statusColor = '#3b82f6'; }
                    else if (daysLeft > 0) { statusLabel = 'Activo'; statusColor = '#22c55e'; }
                    else if (daysLeft > -30) { statusLabel = 'Moroso'; statusColor = '#f97316'; }

                    badgesContainer.innerHTML = `
                        <span style="font-size:0.6rem; background:${statusColor}20; color:${statusColor}; padding:2px 8px; border-radius:12px; font-weight:700; border:1px solid ${statusColor}40;">${statusLabel}</span>
                        <span style="font-size:0.6rem; background:rgba(139,92,246,0.15); color:var(--accent-purple); padding:2px 8px; border-radius:12px; font-weight:700;">LVL ${user.level || 0}</span>
                        <span style="font-size:0.6rem; background:rgba(255,255,255,0.05); color:var(--text-gray); padding:2px 8px; border-radius:12px; font-weight:700;">${user.membership_plans?.name || 'Sin Plan'}</span>`;
                }

                if (tabsContainer) {
                    tabsContainer.classList.remove('hidden');
                    tabsContainer.style.display = 'flex';
                }

                // Set values safely
                setVal('mem-name', user.full_name);
                setVal('mem-email', user.email);
                setVal('mem-phone', user.phone);
                setVal('mem-level', user.level || 0);
                setVal('mem-xp', user.xp || 0);
                setVal('mem-entry-date', user.created_at ? user.created_at.split('T')[0] : '');
                setVal('mem-birthdate', user.birthdate);
                setVal('mem-emergency-contact', user.emergency_contact);
                setVal('mem-admin-notes', user.admin_notes);
                setVal('mem-plan', user.membership_plan_id);
                
                const memStatusSelect = document.getElementById('mem-status');
                if (memStatusSelect) {
                    const expiryDate = user.membership_expiry ? new Date(user.membership_expiry) : null;
                    const daysLeft = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                    if (user.is_frozen) memStatusSelect.value = 'frozen';
                    else if (user.membership_status === 'active' && daysLeft > 0) memStatusSelect.value = 'active';
                    else memStatusSelect.value = 'inactive';
                }

                setVal('mem-expiry', user.membership_expiry ? user.membership_expiry.split('T')[0] : '');
                setVal('mem-class-limit', user.membership_limit || 2);
                setVal('mem-surcharge', user.surcharge_pct || 30);

                // Progress bar
                const statusDisplay = document.getElementById('mem-status-display');
                if (statusDisplay) {
                    const expiryDate = user.membership_expiry ? new Date(user.membership_expiry) : null;
                    if (expiryDate) {
                        statusDisplay.classList.remove('hidden');
                        const now = new Date();
                        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                        const daysLeftEl = document.getElementById('mem-days-left');
                        const progressBar = document.getElementById('mem-progress-bar');
                        if (daysLeftEl) {
                            daysLeftEl.textContent = daysLeft > 0 ? `${daysLeft} días restantes` : 'Expirado';
                            daysLeftEl.style.color = daysLeft <= 5 ? '#ef4444' : '#22c55e';
                        }
                        if (progressBar) {
                            const progress = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100));
                            progressBar.style.width = `${progress}%`;
                            progressBar.style.background = daysLeft <= 5 ? '#ef4444' : 'var(--accent-purple)';
                        }
                    } else { statusDisplay.classList.add('hidden'); }
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

                loadMemberHistory(user.id);
                switchMemberTab('profile');
            } else {
                if (title) title.innerText = "Nuevo Socio";
                if (form) form.reset();
                setVal('mem-entry-date', new Date().toISOString().split('T')[0]);
                setVal('mem-xp', 0);
                setVal('mem-level', 0);
                if (profileSummary) profileSummary.classList.add('hidden');
                if (tabsContainer) tabsContainer.classList.add('hidden');
                switchMemberTab('profile');
            }
        } catch (err) {
            console.error("Error opening member modal:", err);
            window.showToast("Error crítico al abrir editor ❌", "#ef4444");
        }
    };

    // Load member history (attendance + payments)
    export const loadMemberHistory = async (uid) => {
        const listContainer = document.getElementById('mem-attendance-list');
        const statTotal = document.getElementById('mem-stat-total');
        const statMonth = document.getElementById('mem-stat-month');
        const statPayments = document.getElementById('mem-stat-payments');
        listContainer.innerHTML = '<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>';
        window.lucide.createIcons();
        try {
            const [attendance, payments] = await Promise.all([SupabaseService.getAttendance(uid), SupabaseService.getPayments(uid)]);
            const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
            const totalAtt = attendance ? attendance.length : 0;
            const monthAtt = attendance ? attendance.filter(a => { const d = new Date(a.attended_at); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; }).length : 0;
            statTotal.textContent = totalAtt; statMonth.textContent = monthAtt; statPayments.textContent = payments ? payments.length : 0;

            const timeline = [];
            if (attendance) attendance.forEach(a => { timeline.push({ type: 'attendance', date: new Date(a.attended_at), label: a.class_name || 'Clase', icon: 'calendar-check' }); });
            if (payments) payments.forEach(p => { timeline.push({ type: 'payment', date: new Date(p.created_at), label: `$${p.amount || 0} — ${p.concept || 'Pago'}`, icon: p.status === 'approved' ? 'check-circle' : 'clock', color: p.status === 'approved' ? '#22c55e' : '#fbbf24', status: p.status }); });
            timeline.sort((a, b) => b.date - a.date);

            if (timeline.length === 0) {
                listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-gray);"><i data-lucide="inbox" style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;"></i><p style="font-size:0.85rem;">Sin actividad registrada</p></div>';
            } else {
                listContainer.innerHTML = timeline.slice(0, 50).map(item => {
                    const dateStr = item.date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeStr = item.date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                    const color = item.color || (item.type === 'attendance' ? 'var(--accent-cyan)' : '#22c55e');
                    const bgColor = item.type === 'attendance' ? 'rgba(6,182,212,0.08)' : 'rgba(34,197,94,0.08)';
                    const typeLabel = item.type === 'attendance' ? 'Asistencia' : (item.status === 'approved' ? 'Pago Aprobado' : 'Pago Pendiente');
                    return `<div style="display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; margin-bottom:6px; background:${bgColor}; border:1px solid rgba(255,255,255,0.04);">
                        <div style="width:32px; height:32px; border-radius:8px; background:${color}15; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="${item.icon}" style="width:14px; height:14px; color:${color};"></i></div>
                        <div style="flex:1; min-width:0;"><strong style="font-size:0.78rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.label}</strong><span style="font-size:0.65rem; color:var(--text-gray);">${typeLabel}</span></div>
                        <div style="text-align:right; flex-shrink:0;"><span style="font-size:0.7rem; color:var(--text-gray); display:block;">${dateStr}</span><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">${timeStr}</span></div></div>`;
                }).join('');
            }
            window.lucide.createIcons();
        } catch (err) { console.error("Error loading member history:", err); listContainer.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar historial</p>'; }
    };

    export const deleteMember = async (id) => {
        if (confirm('¿Eliminar socio definitivamente? Todo su progreso y reservas se borrarán.')) {
            try {
                await SupabaseService.softDeleteUser(id);
                window.showToast("Socio eliminado correctamente 🗑️", "#ef4444");
                renderAdminActiveUsers();
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
            const emailVal = document.getElementById('mem-email').value.trim();
            const phoneVal = document.getElementById('mem-phone').value.trim();
            const levelVal = parseInt(document.getElementById('mem-level').value) || 0;
            const xpVal = parseInt(document.getElementById('mem-xp').value) || 0;
            const entryDateVal = document.getElementById('mem-entry-date').value;
            const birthdateVal = document.getElementById('mem-birthdate').value;
            const emergencyVal = document.getElementById('mem-emergency-contact').value.trim();
            const notesVal = document.getElementById('mem-admin-notes').value.trim();
            const planId = document.getElementById('mem-plan').value;
            const statusVal = document.getElementById('mem-status').value;
            const expiryVal = document.getElementById('mem-expiry').value;
            const classLimitVal = parseInt(document.getElementById('mem-class-limit').value) || 2;
            const surchargeVal = parseInt(document.getElementById('mem-surcharge').value) || 30;

            if (!nameVal || !emailVal) {
                window.showToast("Nombre y Email son obligatorios ⚠️", "#eab308");
                return;
            }

            const memberData = {
                full_name: nameVal,
                email: emailVal,
                phone: phoneVal || null,
                level: levelVal,
                xp: xpVal,
                birthdate: birthdateVal || null,
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
                    await SupabaseService.updateProfile(window.currentEditingMemberId, memberData);
                    window.showToast("Datos de socio actualizados ✅", "#22c55e");
                } else {
                    window.showToast("Creando nuevo socio... 🥋", "#8b5cf6");
                    const { data: authData, error: authError } = await window.supabase.auth.signUp({
                        email: emailVal,
                        password: 'Amaru123!',
                        options: { data: { full_name: nameVal } }
                    });
                    if (authError) throw authError;
                    const newUser = { uid: authData.user.id, email: emailVal };
                    await SupabaseService.createProfile(newUser, nameVal);
                    await SupabaseService.updateProfile(authData.user.id, memberData);
                    window.showToast("Socio creado exitosamente ✅", "#22c55e");
                }
                document.getElementById('member-modal').classList.remove('active');
                renderAdminActiveUsers();
            } catch (err) {
                console.error(err);
                window.showToast("Error al guardar socio ❌", "#ef4444");
            }
        };
    }
};

