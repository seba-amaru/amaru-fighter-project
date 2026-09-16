import { supabase, getCurrentSession, verifyAdminRole } from './supabaseClient.js';

// ============================================================================
// ESTADO LOCAL DE LA APLICACIÓN DE ESCRITORIO
// ============================================================================
const adminState = {
    user: null,
    profile: null,
    currentSection: 'overview',
    kpis: {
        activeMembers: 0,
        pendingPayments: 0,
        todayClasses: 0,
        monthRevenue: 0
    },
    activeDrawerMember: null
};

// ============================================================================
// INICIALIZACIÓN Y SEGURIDAD (ROUTE GUARD)
// ============================================================================
async function bootAdminApp() {
    initLucideIcons();
    initNavigation();
    initCommandPalette();
    initQuickActions();
    initDrawerAndModals();

    // Verificación de Autenticación y Rol
    await checkAdminAuth();

    // Carga de todas las secciones principales
    await loadInitialData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdminApp);
} else {
    bootAdminApp();
}

function initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

/**
 * Control de acceso para la aplicación de administración
 */
async function checkAdminAuth() {
    try {
        const session = await getCurrentSession();

        if (!session) {
            console.warn('[Admin] No se detectó sesión activa en este puerto/origen.');
            showDevelopmentNotice();
            return;
        }

        adminState.user = session.user;
        const { isAdmin, profile } = await verifyAdminRole(session.user.id);

        if (!isAdmin) {
            console.warn('[Admin] Usuario autenticado pero sin rol admin explícito.');
            // En desarrollo local mostramos aviso sin bloquear totalmente
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                showDevelopmentNotice();
                return;
            }
            if (window.Swal) {
                await window.Swal.fire({
                    icon: 'error',
                    title: 'Acceso Denegado',
                    text: 'Esta área es exclusiva para administradores de Amarufighter.',
                    background: '#09090B',
                    color: '#FFFFFF',
                    confirmButtonColor: '#ef4444'
                });
            }
            window.location.href = '/app/index.html';
            return;
        }

        adminState.profile = profile;
        updateAdminProfileUI(profile);

    } catch (err) {
        console.error('[Admin] Error en control de autenticación:', err);
        showDevelopmentNotice();
    }
}

function showDevelopmentNotice() {
    const nameEl = document.getElementById('admin-user-name');
    const avatarEl = document.getElementById('admin-avatar');
    if (nameEl) nameEl.textContent = 'Admin Dojo (Activo)';
    if (avatarEl) avatarEl.textContent = 'A';
}

function updateAdminProfileUI(profile) {
    if (!profile) return;
    const nameEl = document.getElementById('admin-user-name');
    const avatarEl = document.getElementById('admin-avatar');

    if (nameEl) {
        nameEl.textContent = profile.full_name || profile.username || 'Administrador';
    }
    if (avatarEl) {
        const initial = (profile.full_name || profile.username || 'A')[0].toUpperCase();
        avatarEl.textContent = initial;
    }
}

// Carga simultánea de datos para fluidez total al navegar entre pestañas
async function loadInitialData() {
    await Promise.allSettled([
        loadDashboardKPIs(),
        loadClassesWeekGrid(),
        loadAttendanceModule(),
        loadMembersModule(),
        loadPaymentsModule(),
        loadPlansGrid(),
        loadDiscountsTable(),
        loadRevenueSection(),
        loadNotificationsTable()
    ]);
}

// ============================================================================
// ENRUTAMIENTO Y NAVEGACIÓN DESKTOP
// ============================================================================
const SECTION_TITLES = {
    overview: 'Vista General',
    classes: 'Gestión de Clases',
    attendance: 'Control de Asistencia',
    members: 'Control de Socios',
    payments: 'Control de Pagos',
    plans: 'Membresías y Planes',
    discounts: 'Descuentos y Cupones',
    revenue: 'Ingresos y Métricas',
    notifications: 'Avisos Globales'
};

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn[data-section]');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.getAttribute('data-section');
            navigateToSection(targetSection);
        });
    });

    // Botón de refrescar datos
    const refreshBtn = document.getElementById('btn-refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('rotating');
            await loadInitialData();
            setTimeout(() => refreshBtn.classList.remove('rotating'), 600);
            if (window.Swal) {
                window.Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Datos sincronizados',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#101014',
                    color: '#fff'
                });
            }
        });
    }

    // Botón de logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.Swal) {
                const res = await window.Swal.fire({
                    title: '¿Cerrar sesión?',
                    text: 'Saldrás del panel de administración de Amarufighter.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, salir',
                    cancelButtonText: 'Cancelar',
                    background: '#09090B',
                    color: '#FFFFFF',
                    confirmButtonColor: '#ef4444'
                });
                if (!res.isConfirmed) return;
            }
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn(e);
            }
            window.location.href = '../app/index.html';
        });
    }

    // Toggle para mobile/tablet si aplica
    const mobileBtn = document.getElementById('btn-mobile-sidebar');
    const sidebar = document.getElementById('admin-sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Exportación CSV
    const btnExpMembers = document.getElementById('btn-export-members');
    if (btnExpMembers) btnExpMembers.addEventListener('click', exportMembersToCSV);

    const btnExpRevenue = document.getElementById('btn-export-revenue-csv');
    if (btnExpRevenue) btnExpRevenue.addEventListener('click', exportRevenueToCSV);

    // Filtros de período para el gráfico de recaudación
    const btnMonth = document.getElementById('rev-filter-month');
    const btnQuarter = document.getElementById('rev-filter-quarter');
    const btnYear = document.getElementById('rev-filter-year');

    if (btnMonth) btnMonth.addEventListener('click', () => { setActiveRevFilter(btnMonth); loadRevenueSection('month'); });
    if (btnQuarter) btnQuarter.addEventListener('click', () => { setActiveRevFilter(btnQuarter); loadRevenueSection('quarter'); });
    if (btnYear) btnYear.addEventListener('click', () => { setActiveRevFilter(btnYear); loadRevenueSection('year'); });
}

function setActiveRevFilter(activeBtn) {
    document.querySelectorAll('#section-revenue .filter-bar .btn-secondary-action').forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
}

export function navigateToSection(sectionKey) {
    if (!sectionKey) return;
    adminState.currentSection = sectionKey;

    // Actualizar botones de navegación en sidebar
    document.querySelectorAll('.nav-btn[data-section]').forEach(b => {
        if (b.getAttribute('data-section') === sectionKey) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // Actualizar secciones visibles en el viewport
    document.querySelectorAll('.admin-section').forEach(sec => {
        if (sec.id === `section-${sectionKey}`) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });

    // Actualizar título en topbar
    const titleEl = document.getElementById('topbar-page-title');
    if (titleEl && SECTION_TITLES[sectionKey]) {
        titleEl.textContent = SECTION_TITLES[sectionKey];
    }

    // Cerrar sidebar en pantallas táctiles tras selección
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
    }

    // Recargar módulos según la sección activa
    if (sectionKey === 'payments') {
        loadPaymentsModule();
    }
    if (sectionKey === 'attendance') {
        loadAttendanceModule();
    }
    if (sectionKey === 'members') {
        loadMembersModule();
    }
    if (sectionKey === 'revenue') {
        loadRevenueSection();
    }

    // Actualizar iconos
    initLucideIcons();
}

// ============================================================================
// COMMAND PALETTE (CTRL + K)
// ============================================================================
function initCommandPalette() {
    const palette = document.getElementById('command-palette');
    const openBtn = document.getElementById('btn-open-palette');
    const searchInput = document.getElementById('palette-search-input');
    const resultsContainer = document.getElementById('palette-results');

    if (!palette || !searchInput) return;

    function openPalette() {
        palette.classList.add('open');
        searchInput.value = '';
        filterPalette('');
        setTimeout(() => searchInput.focus(), 50);
    }

    function closePalette() {
        palette.classList.remove('open');
    }

    if (openBtn) openBtn.addEventListener('click', openPalette);

    // Atajo global Ctrl + K / Cmd + K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            palette.classList.contains('open') ? closePalette() : openPalette();
        }
        if (e.key === 'Escape' && palette.classList.contains('open')) {
            closePalette();
        }
    });

    // Cerrar haciendo clic en el fondo
    palette.addEventListener('click', (e) => {
        if (e.target === palette) closePalette();
    });

    // Filtrar opciones
    searchInput.addEventListener('input', (e) => {
        filterPalette(e.target.value);
    });

    function filterPalette(term) {
        const items = resultsContainer.querySelectorAll('.palette-item');
        const q = term.toLowerCase().trim();
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
        });
    }

    // Clic en elementos de la paleta
    resultsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.palette-item');
        if (!item) return;
        const target = item.getAttribute('data-goto');
        if (target) {
            navigateToSection(target);
            closePalette();
        }
    });
}

// ============================================================================
// ACCIONES RÁPIDAS DEL DASHBOARD
// ============================================================================
function initQuickActions() {
    const actClass = document.getElementById('qa-new-class');
    const actMember = document.getElementById('qa-new-member');
    const actPayments = document.getElementById('qa-view-payments');
    const actBroadcast = document.getElementById('qa-broadcast');

    if (actClass) actClass.addEventListener('click', () => {
        navigateToSection('classes');
        const modal = document.getElementById('class-modal-overlay');
        if (modal) modal.classList.add('open');
    });
    if (actMember) actMember.addEventListener('click', () => {
        navigateToSection('members');
        openCreateMemberModal();
    });
    if (actPayments) actPayments.addEventListener('click', () => navigateToSection('payments'));
    if (actBroadcast) actBroadcast.addEventListener('click', () => {
        navigateToSection('notifications');
        const modal = document.getElementById('broadcast-modal-overlay');
        if (modal) modal.classList.add('open');
    });
}

// ============================================================================
// CARGA DE KPIS DEL DASHBOARD DESDE SUPABASE
// ============================================================================
async function loadDashboardKPIs() {
    try {
        // 1. Total Socios Activos en profiles
        const { count: membersCount, error: errMem } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (!errMem && membersCount !== null) {
            adminState.kpis.activeMembers = membersCount;
            const el = document.getElementById('kpi-active-members');
            const badge = document.getElementById('badge-total-members');
            if (el) el.textContent = membersCount;
            if (badge) badge.textContent = membersCount;
        }

        // 2. Pagos Pendientes de Verificación
        const { count: pendingCount, error: errPay } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (!errPay && pendingCount !== null) {
            adminState.kpis.pendingPayments = pendingCount;
            const el = document.getElementById('kpi-pending-payments');
            const badge = document.getElementById('badge-pending-payments');
            if (el) el.textContent = pendingCount;
            if (badge) {
                badge.textContent = pendingCount;
                badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
            }
        }

        // 3. Clases de Hoy
        const { data: classesData, error: errClass } = await supabase
            .from('classes')
            .select('*');

        if (!errClass && classesData) {
            const todayDay = new Date().getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
            const todayClasses = classesData.filter(cls => {
                if (Array.isArray(cls.days)) {
                    return cls.days.includes(todayDay);
                }
                return false;
            });
            const displayCount = todayClasses.length > 0 ? todayClasses.length : classesData.length;
            adminState.kpis.todayClasses = displayCount;
            const el = document.getElementById('kpi-today-classes');
            if (el) el.textContent = displayCount;

            const previewCount = document.getElementById('today-classes-count-preview');
            if (previewCount) previewCount.textContent = `${displayCount} clases`;
        }

        // 4. Recaudación total acumulada de pagos aprobados
        const { data: approvedPayments, error: errRev } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'approved');

        if (!errRev && approvedPayments) {
            const sum = approvedPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            adminState.kpis.monthRevenue = sum;
            const el = document.getElementById('kpi-month-revenue');
            if (el) {
                el.textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(sum);
            }
        }

    } catch (err) {
        console.error('[Admin] Error cargando KPIs de Supabase:', err);
    }
}

// ============================================================================
// MODALES Y SLIDE-OVER DRAWER
// ============================================================================
function initDrawerAndModals() {
    // 1. Slide-over Drawer de Socios
    const drawerBackdrop = document.getElementById('member-drawer-backdrop');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    const tabBtns = document.querySelectorAll('.drawer-tab-btn');

    if (closeDrawerBtn && drawerBackdrop) {
        closeDrawerBtn.addEventListener('click', closeMemberDrawer);
        drawerBackdrop.addEventListener('click', (e) => {
            if (e.target === drawerBackdrop) closeMemberDrawer();
        });
    }

    // Pestañas del Drawer
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetTabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.drawer-body .tab-pane').forEach(pane => {
                if (pane.id === targetTabId) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
            initLucideIcons();
        });
    });

    // Guardar Notas de Admin
    const btnSaveNotes = document.getElementById('btn-save-member-notes');
    if (btnSaveNotes) {
        btnSaveNotes.addEventListener('click', async () => {
            if (!adminState.activeDrawerMember) return;
            const notesEl = document.getElementById('drawer-admin-notes');
            const newNotes = notesEl ? notesEl.value : '';

            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ admin_notes: newNotes, updated_at: new Date().toISOString() })
                    .eq('id', adminState.activeDrawerMember.id);

                if (error) throw error;

                adminState.activeDrawerMember.admin_notes = newNotes;
                if (window.Swal) {
                    window.Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Notas guardadas',
                        showConfirmButton: false,
                        timer: 1500,
                        background: '#101014',
                        color: '#fff'
                    });
                }
            } catch (err) {
                console.error('[Admin] Error guardando notas:', err);
                if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
            }
        });
    }

    // 2. Modal de Clases (Creación y Edición)
    const classModal = document.getElementById('class-modal-overlay');
    const openClassBtn = document.getElementById('btn-open-class-modal');
    const closeClassBtn = document.getElementById('btn-close-class-modal');
    const cancelClassBtn = document.getElementById('btn-cancel-class-modal');
    const classForm = document.getElementById('class-form');
    const deleteClassModalBtn = document.getElementById('btn-delete-class-modal');
    const filterDisciplineEl = document.getElementById('filter-classes-discipline');

    // Gestor de Disciplinas
    const btnManageDiscTrigger = document.getElementById('btn-manage-disciplines-trigger');
    const btnQuickManageDisc = document.getElementById('btn-quick-manage-disciplines');
    const btnCloseDisc = document.getElementById('btn-close-disciplines-modal');
    const btnDoneDisc = document.getElementById('btn-done-disciplines-modal');
    const btnResetDisc = document.getElementById('btn-reset-disciplines-default');
    const btnAddDisc = document.getElementById('btn-add-discipline-submit');
    const inputNewDisc = document.getElementById('new-discipline-input-name');

    if (btnManageDiscTrigger) btnManageDiscTrigger.addEventListener('click', () => openDisciplinesModal());
    if (btnQuickManageDisc) btnQuickManageDisc.addEventListener('click', () => openDisciplinesModal());
    if (btnCloseDisc) btnCloseDisc.addEventListener('click', () => closeDisciplinesModal());
    if (btnDoneDisc) btnDoneDisc.addEventListener('click', () => closeDisciplinesModal());
    if (btnResetDisc) {
        btnResetDisc.addEventListener('click', () => {
            saveDisciplinesList([...DEFAULT_DISCIPLINES]);
            renderDisciplinesListModal();
            populateDisciplinesSelects();
            renderFilteredClassesGrid();
        });
    }
    if (btnAddDisc && inputNewDisc) {
        const handleAdd = () => {
            const val = inputNewDisc.value.trim();
            if (!val) return;
            const list = getDisciplinesList();
            if (!list.some(d => d.toLowerCase() === val.toLowerCase())) {
                list.push(val);
                saveDisciplinesList(list);
                inputNewDisc.value = '';
                renderDisciplinesListModal();
                populateDisciplinesSelects();
                renderFilteredClassesGrid();
            } else {
                if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Disciplina ya existe', text: `"${val}" ya está en la lista.`, background: '#09090B', color: '#fff' });
            }
        };
        btnAddDisc.addEventListener('click', handleAdd);
        inputNewDisc.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
            }
        });
    }

    if (openClassBtn) {
        openClassBtn.addEventListener('click', () => openCreateClassModal());
    }
    if (closeClassBtn && classModal) {
        closeClassBtn.addEventListener('click', () => classModal.classList.remove('open'));
    }
    if (cancelClassBtn && classModal) {
        cancelClassBtn.addEventListener('click', () => classModal.classList.remove('open'));
    }
    if (deleteClassModalBtn) {
        deleteClassModalBtn.addEventListener('click', () => {
            const classId = document.getElementById('class-input-id')?.value;
            const disc = document.getElementById('class-input-discipline')?.value || 'esta clase';
            if (classId) confirmDeleteClass(classId, disc);
        });
    }

    if (filterDisciplineEl) {
        filterDisciplineEl.addEventListener('change', (e) => {
            activeDisciplineFilter = e.target.value;
            renderFilteredClassesGrid();
        });
    }

    if (classForm) {
        classForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classId = document.getElementById('class-input-id')?.value?.trim();
            const discipline = document.getElementById('class-input-discipline').value;
            const dayOfWeek = document.getElementById('class-input-day').value;
            const startTime = document.getElementById('class-input-start').value;
            const endTime = document.getElementById('class-input-end').value;
            const instructor = document.getElementById('class-input-instructor').value;

            const dayNumbersMap = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
            const dayNum = dayNumbersMap[dayOfWeek.toLowerCase()] || 1;

            const dUpper = discipline.toUpperCase();
            let classType = 'Striking';
            if (dUpper.includes('BJJ') || dUpper.includes('GI') || dUpper.includes('NOGI')) classType = 'BJJ';
            else if (dUpper.includes('MMA')) classType = 'MMA';

            try {
                if (classId) {
                    // MODO EDICIÓN
                    const { error } = await supabase.from('classes').update({
                        name: discipline,
                        coach: instructor,
                        time: `${startTime} - ${endTime}`,
                        type: classType,
                        days: [dayNum]
                    }).eq('id', classId);

                    if (error) throw error;

                    if (window.Swal) {
                        window.Swal.fire({
                            icon: 'success',
                            title: 'Clase Actualizada',
                            text: `Los cambios en ${discipline} se guardaron con éxito.`,
                            background: '#09090B',
                            color: '#fff',
                            timer: 1800,
                            showConfirmButton: false
                        });
                    }
                } else {
                    // MODO CREACIÓN
                    const newId = 'c' + Date.now();
                    const { error } = await supabase.from('classes').insert([{
                        id: newId,
                        name: discipline,
                        coach: instructor,
                        time: `${startTime} - ${endTime}`,
                        type: discipline.includes('BJJ') ? 'BJJ' : (discipline.includes('MMA') ? 'MMA' : 'Striking'),
                        days: [dayNum],
                        created_at: new Date().toISOString()
                    }]);

                    if (error) throw error;

                    if (window.Swal) {
                        window.Swal.fire({
                            icon: 'success',
                            title: 'Clase Creada',
                            text: `${discipline} programada con éxito.`,
                            background: '#09090B',
                            color: '#fff',
                            timer: 1800,
                            showConfirmButton: false
                        });
                    }
                }

                if (classModal) classModal.classList.remove('open');
                classForm.reset();
                await loadClassesWeekGrid();
                await loadDashboardKPIs();

            } catch (err) {
                console.error('[Admin] Error guardando clase:', err);
                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'error',
                        title: 'Error al guardar clase',
                        text: err.message || 'No se pudo procesar la solicitud.',
                        background: '#09090B',
                        color: '#fff'
                    });
                }
            }
        });
    }

    // 2.1 Modal de Membresías y Tarifas (Creación y Edición)
    const planModal = document.getElementById('plan-modal-overlay');
    const openPlanBtn = document.getElementById('btn-create-plan');
    const closePlanBtn = document.getElementById('btn-close-plan-modal');
    const cancelPlanBtn = document.getElementById('btn-cancel-plan-modal');
    const planForm = document.getElementById('plan-form');
    const btnExpPlans = document.getElementById('btn-export-plans');

    if (openPlanBtn) {
        openPlanBtn.addEventListener('click', () => openCreatePlanModal());
    }
    if (closePlanBtn && planModal) {
        closePlanBtn.addEventListener('click', () => planModal.classList.remove('open'));
    }
    if (cancelPlanBtn && planModal) {
        cancelPlanBtn.addEventListener('click', () => planModal.classList.remove('open'));
    }
    if (btnExpPlans) {
        btnExpPlans.addEventListener('click', exportPlansToMultiformat);
    }

    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const planId = document.getElementById('plan-input-id')?.value?.trim();
            const name = document.getElementById('plan-input-name').value.trim();
            const price = parseInt(document.getElementById('plan-input-price').value, 10) || 0;
            const monthly = parseInt(document.getElementById('plan-input-monthly').value, 10) || 0;
            const type = document.getElementById('plan-input-type').value;
            const description = document.getElementById('plan-input-description').value.trim();

            try {
                if (planId) {
                    // MODO EDICIÓN
                    const { error } = await supabase.from('membership_plans').update({
                        name,
                        price,
                        monthly: monthly > 0 ? monthly : null,
                        type,
                        description
                    }).eq('id', planId);

                    if (error) throw error;

                    if (window.Swal) {
                        window.Swal.fire({
                            icon: 'success',
                            title: 'Membresía Actualizada',
                            text: `La tarifa de "${name}" se actualizó a $${price.toLocaleString('es-CL')}.`,
                            background: '#09090B',
                            color: '#fff',
                            timer: 1800,
                            showConfirmButton: false
                        });
                    }
                } else {
                    // MODO CREACIÓN
                    const newPlanId = 'plan_' + Date.now();
                    const { error } = await supabase.from('membership_plans').insert([{
                        id: newPlanId,
                        name,
                        price,
                        monthly: monthly > 0 ? monthly : null,
                        type,
                        description
                    }]);

                    if (error) throw error;

                    if (window.Swal) {
                        window.Swal.fire({
                            icon: 'success',
                            title: 'Plan Creado',
                            text: `El plan "${name}" ya está disponible en el tarifario.`,
                            background: '#09090B',
                            color: '#fff',
                            timer: 1800,
                            showConfirmButton: false
                        });
                    }
                }

                if (planModal) planModal.classList.remove('open');
                planForm.reset();
                await loadPlansGrid();

            } catch (err) {
                console.error('[Admin] Error guardando plan:', err);
                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'error',
                        title: 'Error al guardar plan',
                        text: err.message || 'No se pudo guardar la membresía.',
                        background: '#09090B',
                        color: '#fff'
                    });
                }
            }
        });
    }

    // 3. Modal de Avisos Globales
    const broadcastModal = document.getElementById('broadcast-modal-overlay');
    const openBroadcastBtn = document.getElementById('btn-open-broadcast-modal');
    const closeBroadcastBtn = document.getElementById('btn-close-broadcast-modal');
    const cancelBroadcastBtn = document.getElementById('btn-cancel-broadcast-modal');
    const broadcastForm = document.getElementById('broadcast-form');

    if (openBroadcastBtn && broadcastModal) {
        openBroadcastBtn.addEventListener('click', () => broadcastModal.classList.add('open'));
        if (closeBroadcastBtn) closeBroadcastBtn.addEventListener('click', () => broadcastModal.classList.remove('open'));
        if (cancelBroadcastBtn) cancelBroadcastBtn.addEventListener('click', () => broadcastModal.classList.remove('open'));
    }

    if (broadcastForm) {
        broadcastForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('broadcast-input-title').value;
            const message = document.getElementById('broadcast-input-message').value;
            const type = document.getElementById('broadcast-input-type').value;

            try {
                const { error } = await supabase.from('global_notifications').insert([{
                    title,
                    message,
                    type,
                    created_at: new Date().toISOString()
                }]);

                if (error) throw error;

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Aviso Publicado',
                        text: 'El aviso se ha emitido a todos los alumnos.',
                        background: '#09090B',
                        color: '#fff',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
                broadcastModal.classList.remove('open');
                broadcastForm.reset();
                await loadNotificationsTable();
            } catch (err) {
                console.error('[Admin] Error enviando aviso:', err);
                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'error',
                        title: 'Error al emitir',
                        text: err.message || 'No se pudo publicar el aviso.',
                        background: '#09090B',
                        color: '#fff'
                    });
                }
            }
        });
    }

    // 4. Inicializar handlers de módulos y modales
    initPaymentsUIHandlers();
    initAttendanceUIHandlers();
    initMembersCRMUIHandlers();

    window.openCreateMemberModal = openCreateMemberModal;
    window.closeEditMemberModal = closeEditMemberModal;
    window.openEditMemberModal = openEditMemberModal;
}

export function openMemberDrawer(member) {
    if (!member) return;
    adminState.activeDrawerMember = member;

    const backdrop = document.getElementById('member-drawer-backdrop');
    if (!backdrop) return;

    // Cabecera
    const avatarEl = document.getElementById('drawer-avatar');
    const nameEl = document.getElementById('drawer-user-name');
    const emailEl = document.getElementById('drawer-user-email');

    const displayName = member.full_name || member.username || 'Sin Nombre';
    if (avatarEl) avatarEl.textContent = displayName[0].toUpperCase();
    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = member.email || 'Sin correo';

    // Pestaña Perfil
    const kvName = document.getElementById('drawer-kv-name');
    const kvPhone = document.getElementById('drawer-kv-phone');
    const kvRut = document.getElementById('drawer-kv-rut');
    const kvBelt = document.getElementById('drawer-kv-belt');
    const kvEmer = document.getElementById('drawer-kv-emergency');
    const btnWhatsapp = document.getElementById('drawer-btn-whatsapp');

    if (kvName) kvName.textContent = displayName;
    if (kvPhone) kvPhone.textContent = member.phone || 'No registrado';
    if (kvRut) kvRut.textContent = member.rut || 'No registrado';
    const belt = member.combat_style ? `${member.combat_style.toUpperCase()}` : (member.belt_rank || 'Iniciado');
    if (kvBelt) kvBelt.textContent = belt;
    if (kvEmer) kvEmer.textContent = member.emergency_contact || 'No especificado';

    if (btnWhatsapp && member.phone) {
        const cleanPhone = member.phone.replace(/\D/g, '');
        btnWhatsapp.href = `https://wa.me/${cleanPhone}`;
        btnWhatsapp.style.display = 'inline-flex';
    } else if (btnWhatsapp) {
        btnWhatsapp.style.display = 'none';
    }

    // Pestaña Membresía
    const kvPlan = document.getElementById('drawer-kv-plan');
    const kvStatus = document.getElementById('drawer-kv-plan-status');
    const kvExpiry = document.getElementById('drawer-kv-plan-expiry');
    const kvClasses = document.getElementById('drawer-kv-plan-classes');

    const planName = member.plan_name || member.membership_plan_name || (member.membership_plan_id ? 'Plan Asignado' : 'Sin Plan');
    if (kvPlan) kvPlan.textContent = planName;
    if (kvStatus) kvStatus.textContent = (member.membership_status || 'Inactivo').toUpperCase();
    const expiry = member.membership_expiry || member.plan_expiry;
    if (kvExpiry) kvExpiry.textContent = expiry ? new Date(expiry).toLocaleDateString('es-CL') : 'Sin fecha';
    if (kvClasses) kvClasses.textContent = `${member.membership_limit || 2} clases/día`;

    // Pestaña Notas
    const notesEl = document.getElementById('drawer-admin-notes');
    if (notesEl) notesEl.value = member.admin_notes || '';

    // Cargar historial de asistencia y pagos
    loadMemberDrawerHistory(member.id);

    const btnDrawerEdit = document.getElementById('drawer-btn-edit-member');
    if (btnDrawerEdit) {
        btnDrawerEdit.onclick = () => openEditMemberModal(member.id);
    }

    backdrop.classList.add('open');
    initLucideIcons();
}

export function closeMemberDrawer() {
    const backdrop = document.getElementById('member-drawer-backdrop');
    if (backdrop) backdrop.classList.remove('open');
    adminState.activeDrawerMember = null;
}

async function loadMemberDrawerHistory(userId) {
    if (!userId) return;

    // Asistencia
    const attList = document.getElementById('drawer-attendance-list');
    if (attList) {
        try {
            const { data: attendance } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (attendance && attendance.length > 0) {
                attList.innerHTML = attendance.map(a => `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                        <div>
                            <div style="font-weight: 600; color: #fff;">${a.class_name || 'Clase Regular'}</div>
                            <div style="color: var(--text-muted); font-size: 0.7rem;">${new Date(a.created_at).toLocaleDateString('es-CL')}</div>
                        </div>
                        <span class="status-pill active" style="font-size: 0.65rem;">Asistió</span>
                    </div>
                `).join('');
            } else {
                attList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">Sin registros de asistencia recientes.</p>';
            }
        } catch (e) {
            attList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">No hay asistencias registradas.</p>';
        }
    }

    // Pagos
    const payList = document.getElementById('drawer-payments-list');
    if (payList) {
        try {
            const { data: payments } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (payments && payments.length > 0) {
                payList.innerHTML = payments.map(p => `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                        <div>
                            <div style="font-weight: 600; color: #fff;">${p.concept || p.plan_name || 'Mensualidad'}</div>
                            <div style="color: var(--text-muted); font-size: 0.7rem;">${new Date(p.created_at).toLocaleDateString('es-CL')}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: var(--accent-emerald);">${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(p.amount || 0)}</div>
                            <span class="status-pill ${p.status || 'pending'}">${p.status || 'Pendiente'}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                payList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">Sin historial de pagos.</p>';
            }
        } catch (e) {
            payList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">Sin historial de pagos.</p>';
        }
    }
}

// ============================================================================
// MÓDULO 1: CLASES EN CUADRÍCULA SEMANAL (WEEK GRID) & GESTOR DE DISCIPLINAS
// ============================================================================
let cachedRawClasses = [];
let activeDisciplineFilter = 'all';

export const DEFAULT_DISCIPLINES = [
    'NOGI 🤼‍♂️',
    'MMA ⛓️',
    'GI 🥋',
    'Kick Boxing - K1 🥊'
];

export function getDisciplinesList() {
    try {
        const stored = localStorage.getItem('amarufighter_disciplines');
        let list = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list) || list.length === 0) {
            list = [...DEFAULT_DISCIPLINES];
        }
        if (Array.isArray(cachedRawClasses)) {
            cachedRawClasses.forEach(c => {
                const discName = c.name || c.discipline;
                if (discName && !list.some(d => d.toLowerCase() === discName.toLowerCase())) {
                    list.push(discName);
                }
            });
        }
        return list;
    } catch {
        return [...DEFAULT_DISCIPLINES];
    }
}

export function saveDisciplinesList(list) {
    try {
        localStorage.setItem('amarufighter_disciplines', JSON.stringify(list));
    } catch (e) {
        console.warn('No se pudo guardar disciplinas en localStorage', e);
    }
}

export function populateDisciplinesSelects() {
    const disciplines = getDisciplinesList();

    // 1. Selector en modal de clase
    const classInput = document.getElementById('class-input-discipline');
    if (classInput) {
        const currentVal = classInput.value;
        classInput.innerHTML = disciplines.map(d => `<option value="${d}">${d}</option>`).join('');
        if (currentVal && disciplines.includes(currentVal)) {
            classInput.value = currentVal;
        }
    }

    // 2. Filtro en vista de clases
    const filterInput = document.getElementById('filter-classes-discipline');
    if (filterInput) {
        const currentFilter = filterInput.value;
        filterInput.innerHTML = '<option value="all">Todas las disciplinas</option>' + disciplines.map(d => `
            <option value="${d}">${d}</option>
        `).join('');
        if (currentFilter) {
            filterInput.value = currentFilter;
        }
    }
}

export function openDisciplinesModal() {
    const modal = document.getElementById('disciplines-modal-overlay');
    renderDisciplinesListModal();
    initLucideIcons();
    if (modal) modal.classList.add('open');
}

export function closeDisciplinesModal() {
    const modal = document.getElementById('disciplines-modal-overlay');
    if (modal) modal.classList.remove('open');
    populateDisciplinesSelects();
}

export function renderDisciplinesListModal() {
    const container = document.getElementById('disciplines-list-container');
    if (!container) return;

    const disciplines = getDisciplinesList();
    if (disciplines.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 12px;">No hay disciplinas registradas.</p>';
        return;
    }

    container.innerHTML = disciplines.map((disc, idx) => `
        <div class="discipline-tag-row">
            <div class="discipline-tag-info">
                <span>${disc}</span>
            </div>
            <div class="discipline-tag-actions">
                <button type="button" class="btn-icon-xs btn-edit-discipline" data-index="${idx}" title="Modificar nombre">
                    <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                </button>
                <button type="button" class="btn-icon-xs danger btn-delete-discipline" data-index="${idx}" title="Eliminar disciplina">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.btn-edit-discipline').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const list = getDisciplinesList();
            const currentName = list[idx];
            if (!currentName) return;

            if (window.Swal) {
                const { value: newName } = await window.Swal.fire({
                    title: 'Modificar Disciplina',
                    input: 'text',
                    inputValue: currentName,
                    showCancelButton: true,
                    confirmButtonText: 'Guardar',
                    cancelButtonText: 'Cancelar',
                    background: '#09090B',
                    color: '#fff',
                    inputValidator: (value) => {
                        if (!value || !value.trim()) return 'El nombre no puede estar vacío';
                    }
                });

                if (newName && newName.trim()) {
                    list[idx] = newName.trim();
                    saveDisciplinesList(list);
                    renderDisciplinesListModal();
                    populateDisciplinesSelects();
                    renderFilteredClassesGrid();
                }
            }
        };
    });

    container.querySelectorAll('.btn-delete-discipline').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const list = getDisciplinesList();
            const discName = list[idx];
            if (!discName) return;

            if (window.Swal) {
                const confirm = await window.Swal.fire({
                    icon: 'warning',
                    title: `¿Eliminar "${discName}"?`,
                    text: 'Se quitará del listado de opciones de clases.',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#ef4444',
                    background: '#09090B',
                    color: '#fff'
                });
                if (!confirm.isConfirmed) return;
            }

            list.splice(idx, 1);
            saveDisciplinesList(list);
            renderDisciplinesListModal();
            populateDisciplinesSelects();
            renderFilteredClassesGrid();
        };
    });

    initLucideIcons();
}

export async function loadClassesWeekGrid() {
    try {
        const { data: classes, error } = await supabase
            .from('classes')
            .select('*')
            .order('time', { ascending: true });

        if (error) throw error;
        cachedRawClasses = classes || [];

        populateDisciplinesSelects();
        renderFilteredClassesGrid();
    } catch (err) {
        console.error('[Admin] Error cargando cuadrícula de clases:', err);
    }
}

export function renderFilteredClassesGrid() {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayNumberToKey = { 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };

    // Limpiar cada columna
    days.forEach(day => {
        const listEl = document.getElementById(`day-list-${day}`);
        const countEl = document.getElementById(`count-${day}`);
        if (listEl) listEl.innerHTML = '';
        if (countEl) countEl.textContent = '0';
    });

    if (!cachedRawClasses || cachedRawClasses.length === 0) {
        days.forEach(day => {
            const listEl = document.getElementById(`day-list-${day}`);
            if (listEl) listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.75rem; text-align: center; padding: 15px 0;">Sin clases</div>';
        });
        return;
    }

    const counts = { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0 };

    cachedRawClasses.forEach(cls => {
        const discipline = cls.name || cls.discipline || 'Striking';

        // Filtrado por disciplina si no es 'all'
        if (activeDisciplineFilter !== 'all') {
            const fLower = activeDisciplineFilter.toLowerCase();
            const dLower = discipline.toLowerCase();
            if (!dLower.includes(fLower)) return;
        }

        // Un registro de clase puede aplicarse a varios días
        let targetDays;
        if (Array.isArray(cls.days) && cls.days.length > 0) {
            targetDays = cls.days.map(d => dayNumberToKey[d]).filter(Boolean);
        } else if (cls.day_of_week) {
            targetDays = [cls.day_of_week.toLowerCase().trim()];
        } else {
            targetDays = ['lunes'];
        }

        const coach = cls.coach || cls.instructor || 'Sensei';
        const timeStr = cls.time || `${cls.start_time || '00:00'} - ${cls.end_time || '00:00'}`;
        const capacity = cls.capacity || 20;

        let borderClass = 'border-striking';
        const dUpper = discipline.toUpperCase();
        if (dUpper.includes('NOGI')) borderClass = 'border-bjj';
        else if (dUpper.includes('GI') || dUpper.includes('BJJ') || dUpper.includes('JIU')) borderClass = 'border-bjj';
        else if (dUpper.includes('MMA')) borderClass = 'border-mma';
        else if (dUpper.includes('KICK') || dUpper.includes('K1') || dUpper.includes('STRIKING') || dUpper.includes('BOX')) borderClass = 'border-striking';
        else if (dUpper.includes('FUNCIONAL')) borderClass = 'border-funcional';

        targetDays.forEach(dayKey => {
            const listEl = document.getElementById(`day-list-${dayKey}`);
            if (!listEl) return;

            counts[dayKey] = (counts[dayKey] || 0) + 1;

            const card = document.createElement('div');
            card.className = `class-card-desktop ${borderClass}`;
            card.setAttribute('data-class-id', cls.id);
            card.innerHTML = `
                <div class="class-time-row">
                    <span>${timeStr}</span>
                    <div class="class-card-header-actions">
                        <span style="color: var(--accent-gold); font-weight: 600; font-size: 0.72rem; margin-right: 4px;">${capacity} cupos</span>
                        <button type="button" class="btn-icon-xs btn-card-edit-class" data-class-id="${cls.id}" title="Editar horario y datos de la clase">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                        </button>
                        <button type="button" class="btn-icon-xs danger btn-card-delete-class" data-class-id="${cls.id}" data-class-name="${discipline}" title="Eliminar clase">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>
                </div>
                <div class="class-discipline-name">${discipline}</div>
                <div class="class-coach-badge">
                    <i data-lucide="user" style="width: 12px; height: 12px;"></i>
                    <span>${coach}</span>
                </div>
            `;

            // Click en acciones o tarjeta
            card.addEventListener('click', (e) => {
                const delBtn = e.target.closest('.btn-card-delete-class');
                if (delBtn) {
                    e.stopPropagation();
                    const cid = delBtn.dataset.classId;
                    const cname = delBtn.dataset.className;
                    confirmDeleteClass(cid, cname);
                    return;
                }
                openEditClassModal(cls.id);
            });

            listEl.appendChild(card);
        });
    });

    // Actualizar contadores
    days.forEach(day => {
        const countEl = document.getElementById(`count-${day}`);
        if (countEl) countEl.textContent = counts[day] || 0;
    });

    initLucideIcons();
}

export function openCreateClassModal() {
    const classModal = document.getElementById('class-modal-overlay');
    const classForm = document.getElementById('class-form');
    const classIdInput = document.getElementById('class-input-id');
    const titleEl = document.getElementById('class-modal-title');
    const deleteBtn = document.getElementById('btn-delete-class-modal');
    const submitBtn = document.getElementById('btn-save-class-submit');

    if (classForm) classForm.reset();
    if (classIdInput) classIdInput.value = '';
    if (titleEl) titleEl.textContent = 'Crear Horario de Clase';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Guardar Clase';

    if (classModal) classModal.classList.add('open');
}

export function openEditClassModal(clsId) {
    const cls = (cachedRawClasses || []).find(c => c.id === clsId);
    if (!cls) return;

    const classModal = document.getElementById('class-modal-overlay');
    const classIdInput = document.getElementById('class-input-id');
    const titleEl = document.getElementById('class-modal-title');
    const deleteBtn = document.getElementById('btn-delete-class-modal');
    const submitBtn = document.getElementById('btn-save-class-submit');

    if (classIdInput) classIdInput.value = cls.id;
    if (titleEl) titleEl.textContent = 'Editar Horario de Clase';
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios';

    const discSelect = document.getElementById('class-input-discipline');
    const daySelect = document.getElementById('class-input-day');
    const startInput = document.getElementById('class-input-start');
    const endInput = document.getElementById('class-input-end');
    const coachInput = document.getElementById('class-input-instructor');
    const capInput = document.getElementById('class-input-capacity');

    if (discSelect) {
        const discVal = cls.name || cls.discipline || 'NOGI 🤼‍♂️';
        const exists = Array.from(discSelect.options).some(opt => opt.value.toLowerCase() === discVal.toLowerCase());
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = discVal;
            opt.textContent = discVal;
            discSelect.appendChild(opt);
        }
        discSelect.value = discVal;
    }

    const dayNumbersMap = { 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };
    let dayKey = 'lunes';
    if (Array.isArray(cls.days) && cls.days[0]) {
        dayKey = dayNumbersMap[cls.days[0]] || 'lunes';
    } else if (cls.day_of_week) {
        dayKey = cls.day_of_week.toLowerCase().trim();
    }
    if (daySelect) daySelect.value = dayKey;

    let startTime = '18:00';
    let endTime = '19:00';
    if (cls.time && cls.time.includes('-')) {
        const parts = cls.time.split('-').map(s => s.trim());
        startTime = parts[0] || '18:00';
        endTime = parts[1] || '19:00';
    } else if (cls.start_time) {
        startTime = cls.start_time;
        endTime = cls.end_time || '19:00';
    }
    if (startInput) startInput.value = startTime;
    if (endInput) endInput.value = endTime;

    if (coachInput) coachInput.value = cls.coach || cls.instructor || 'Sensei';
    if (capInput) capInput.value = cls.capacity || 20;

    initLucideIcons();
    if (classModal) classModal.classList.add('open');
}

export async function confirmDeleteClass(clsId, clsName = 'esta clase') {
    if (window.Swal) {
        const res = await window.Swal.fire({
            icon: 'warning',
            title: '¿Eliminar horario de clase?',
            text: `¿Estás seguro de eliminar "${clsName}" del calendario? Esta acción no se puede deshacer.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            background: '#09090B',
            color: '#fff'
        });
        if (!res.isConfirmed) return;
    }

    try {
        const { error } = await supabase.from('classes').delete().eq('id', clsId);
        if (error) throw error;

        const classModal = document.getElementById('class-modal-overlay');
        if (classModal) classModal.classList.remove('open');

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Clase Eliminada',
                timer: 1500,
                showConfirmButton: false,
                background: '#09090B',
                color: '#fff'
            });
        }

        await loadClassesWeekGrid();
        await loadDashboardKPIs();
    } catch (err) {
        console.error('[Admin] Error eliminando clase:', err);
        if (window.Swal) {
            window.Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: err.message || 'No se pudo eliminar la clase.',
                background: '#09090B',
                color: '#fff'
            });
        }
    }
}

// ============================================================================
// MÓDULO DE CONTROL DE ASISTENCIA (TATAMI COCKPIT)
// ============================================================================
let cachedAttendance = [];
let cachedReservations = [];
let cachedClassesForAtt = [];
let currentAttendanceSubTab = 'roster'; // 'roster' | 'ledger' | 'analytics'
let attRosterDate = new Date().toISOString().split('T')[0];
let attRosterDiscipline = 'all';

// Filtros para la subpestaña 2 (Ledger)
const attLedgerFilter = {
    search: '',
    datePreset: 'week',
    method: 'all'
};
let attLedgerCurrentPage = 1;
const attLedgerPerPage = 12;

export async function loadAttendanceModule() {
    try {
        const [attRes, resRes, clsRes, profRes] = await Promise.all([
            supabase.from('attendance').select('*'),
            supabase.from('reservations').select('*').order('reservation_date', { ascending: false }),
            supabase.from('classes').select('*').order('time', { ascending: true }),
            supabase.from('profiles').select('*').order('created_at', { ascending: false })
        ]);

        if (attRes.error) {
            console.warn('[Admin] Aviso en consulta attendance (se continuará con reservas y clases):', attRes.error);
        }

        const profiles = profRes.data || [];
        cachedClassesForAtt = clsRes.data || [];
        cachedReservations = resRes.data || [];

        const userMap = new Map(profiles.map(p => [p.id, p]));

        cachedAttendance = (attRes.data || []).map(a => {
            const member = userMap.get(a.user_id);
            const attDate = a.attended_at || a.created_at || a.date || new Date().toISOString();
            return {
                ...a,
                attended_at: attDate,
                created_at: attDate,
                student_name: a.user_name || member?.full_name || member?.username || 'Atleta Amarufighter',
                student_email: a.user_email || member?.email || '',
                student_phone: member?.phone || '',
                student_rut: member?.rut || '',
                student_plan: plansMap[member?.membership_plan_id] || 'Membresía Dojo',
                student_status: member?.membership_status || 'active',
                student_profile: member || null
            };
        });

        // Ordenar asistencias por fecha descendente
        cachedAttendance.sort((a, b) => new Date(b.attended_at) - new Date(a.attended_at));

        // 1. Actualizar Top 4 KPIs
        updateAttendanceTopKPIs(profiles);

        // 2. Renderizar Sub-pestaña activa
        if (currentAttendanceSubTab === 'roster') {
            renderAttendanceRoster();
        } else if (currentAttendanceSubTab === 'ledger') {
            renderAttendanceLedger();
        } else if (currentAttendanceSubTab === 'analytics') {
            renderAttendanceAnalytics(profiles);
        }

        // 3. Poblar modal de check-in manual
        populateManualCheckinSelects(profiles);

        initLucideIcons();

    } catch (err) {
        console.error('[Admin] Error cargando módulo de asistencia:', err);
    }
}

function updateAttendanceTopKPIs(profiles) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // 1. Asistencias de hoy
    const todayAtt = cachedAttendance.filter(a => {
        const d = a.created_at || a.attended_at || '';
        return d.startsWith(today);
    });

    let appCount = 0;
    let manualCount = 0;
    todayAtt.forEach(a => {
        const m = (a.method || '').toLowerCase();
        if (m === 'manual' || m === 'admin-manual') manualCount++;
        else appCount++;
    });

    const elTodayCnt = document.getElementById('akpi-today-count');
    const elTodayBrd = document.getElementById('akpi-today-breakdown');
    if (elTodayCnt) elTodayCnt.textContent = todayAtt.length;
    if (elTodayBrd) elTodayBrd.textContent = `${appCount} App • ${manualCount} Manual`;

    // 2. Ocupación Dojo (Fill Rate)
    const currentDayIndex = now.getDay();
    const todayClasses = cachedClassesForAtt.filter(c => {
        let cDays = c.days;
        if (typeof cDays === 'string') {
            try { cDays = JSON.parse(cDays); } catch (e) { cDays = []; }
        }
        return Array.isArray(cDays) && cDays.includes(currentDayIndex);
    });

    const totalCapacity = todayClasses.reduce((sum, c) => sum + (Number(c.capacity) || 20), 0) || 40;
    const fillRate = Math.min(100, Math.round((todayAtt.length / totalCapacity) * 100));

    const elFillRate = document.getElementById('akpi-fill-rate');
    const elFillBar = document.getElementById('akpi-fill-bar');
    const elFillSub = document.getElementById('akpi-fill-sub');

    if (elFillRate) elFillRate.textContent = `${fillRate}%`;
    if (elFillBar) elFillBar.style.width = `${fillRate}%`;
    if (elFillSub) elFillSub.textContent = `${todayAtt.length} / ${totalCapacity} cupos ocupados`;

    // 3. Atletas Únicos (7 días)
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const recentAtt = cachedAttendance.filter(a => new Date(a.created_at || a.attended_at) >= sevenDaysAgo);
    const uniqueIds = new Set(recentAtt.map(a => a.user_id));
    const activeProfiles = profiles.filter(p => p.membership_status === 'active');
    const uniquePct = activeProfiles.length > 0 ? Math.round((uniqueIds.size / activeProfiles.length) * 100) : 0;

    const elUniqCnt = document.getElementById('akpi-unique-athletes');
    const elUniqSub = document.getElementById('akpi-unique-sub');
    if (elUniqCnt) elUniqCnt.textContent = `${uniqueIds.size} atletas`;
    if (elUniqSub) elUniqSub.textContent = `${uniquePct}% del padrón activo`;

    // 4. Tendencia & Ausentismo
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    const thisWeekAtt = recentAtt.length;
    const prevWeekAtt = cachedAttendance.filter(a => {
        const d = new Date(a.created_at || a.attended_at);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length || 1;

    const trendRatio = (thisWeekAtt - prevWeekAtt) / prevWeekAtt;
    const elTrendStat = document.getElementById('akpi-trend-status');
    const elTrendSub = document.getElementById('akpi-trend-sub');

    if (elTrendStat) {
        if (trendRatio < -0.2) {
            elTrendStat.textContent = `🔴 Caída ${(Math.abs(trendRatio) * 100).toFixed(0)}%`;
            elTrendStat.style.color = '#ef4444';
            if (elTrendSub) elTrendSub.textContent = 'Alerta de deserción semanal';
        } else if (trendRatio > 0.05) {
            elTrendStat.textContent = `🟢 +${(trendRatio * 100).toFixed(0)}% asistencias`;
            elTrendStat.style.color = 'var(--accent-emerald)';
            if (elTrendSub) elTrendSub.textContent = 'Crecimiento de concurrencia';
        } else {
            elTrendStat.textContent = '🟢 Afluencia Estable';
            elTrendStat.style.color = '#fff';
            if (elTrendSub) elTrendSub.textContent = 'Sin alertas de caída';
        }
    }

    const bTotal = document.getElementById('badge-att-total-count');
    if (bTotal) bTotal.textContent = cachedAttendance.length;
}

function renderAttendanceRoster() {
    const container = document.getElementById('att-roster-cards-container');
    const dateInput = document.getElementById('att-roster-date');
    if (dateInput && dateInput.value !== attRosterDate) {
        dateInput.value = attRosterDate;
    }

    if (!container) return;

    // Calcular día de la semana para la fecha seleccionada
    const targetDateObj = new Date(attRosterDate + 'T12:00:00');
    const dayNum = targetDateObj.getDay();

    // Clases programadas para este día
    let classesOfDay = cachedClassesForAtt.filter(c => {
        let cDays = c.days;
        if (typeof cDays === 'string') {
            try { cDays = JSON.parse(cDays); } catch (e) { cDays = []; }
        }
        return Array.isArray(cDays) && cDays.includes(dayNum);
    });

    if (classesOfDay.length === 0 && cachedClassesForAtt.length > 0) {
        classesOfDay = cachedClassesForAtt.slice(0, 4);
    }

    if (attRosterDiscipline !== 'all') {
        classesOfDay = classesOfDay.filter(c => {
            const d = (c.name || c.discipline || c.type || '').toLowerCase();
            return d.includes(attRosterDiscipline.toLowerCase());
        });
    }

    if (classesOfDay.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px; font-size: 0.85rem;">No hay clases programadas para esta fecha o disciplina.</div>';
        return;
    }

    container.innerHTML = classesOfDay.map(cls => {
        const timeStr = cls.time || `${cls.start_time || '00:00'} - ${cls.end_time || '00:00'}`;
        const className = cls.name || cls.discipline || 'Entrenamiento';
        const coach = cls.coach || cls.instructor || 'Sensei';
        const capacity = Number(cls.capacity) || 20;

        // Asistencias ya marcadas para esta clase y fecha
        const confirmedAttendees = cachedAttendance.filter(a => {
            const d = (a.created_at || a.attended_at || '').slice(0, 10);
            return (a.class_id === cls.id || a.class_name === className) && d === attRosterDate;
        });

        // Reservas para esta clase y fecha
        const reservedAttendees = cachedReservations.filter(r => {
            return (r.class_id === cls.id || r.class_name === className) && r.reservation_date === attRosterDate;
        });

        // Combinar lista única de alumnos
        const studentMap = new Map();
        reservedAttendees.forEach(r => {
            studentMap.set(r.user_id, {
                id: r.user_id,
                name: r.user_name || 'Alumno',
                status: 'reserved'
            });
        });

        confirmedAttendees.forEach(a => {
            studentMap.set(a.user_id, {
                id: a.user_id,
                name: a.student_name || 'Alumno',
                status: 'attended'
            });
        });

        const studentsList = Array.from(studentMap.values());
        const attendedCount = confirmedAttendees.length;
        const fillPct = Math.min(100, Math.round((attendedCount / capacity) * 100));

        let disciplineBadgeClass = 'transferencia';
        if (className.includes('BJJ') || className.includes('Grappling')) disciplineBadgeClass = 'pasarela';
        else if (className.includes('MMA')) disciplineBadgeClass = 'efectivo';

        return `
            <div class="roster-class-card" data-class-id="${cls.id}">
                <div class="roster-card-header">
                    <div>
                        <span class="roster-time-tag">⏰ ${timeStr}</span>
                        <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-top: 6px;">${className}</h3>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Sensei: <strong style="color: #fff;">${coach}</strong></div>
                    </div>
                    <span class="badge-method ${disciplineBadgeClass}">${cls.type || 'Tatami'}</span>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 3px;">
                        <span style="color: var(--text-muted);">Asistencia Confirmada:</span>
                        <strong style="color: ${fillPct >= 90 ? 'var(--accent-red)' : 'var(--accent-emerald)'};">${attendedCount} / ${capacity} cupos (${fillPct}%)</strong>
                    </div>
                    <div class="roster-capacity-track">
                        <div class="roster-capacity-fill" style="width: ${fillPct}%;"></div>
                    </div>
                </div>

                <div style="font-size: 0.75rem; font-weight: 700; color: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 6px;">
                    <span>Alumnos en Lista (${studentsList.length})</span>
                    <button class="btn-secondary-action btn-add-student-to-class" data-class-id="${cls.id}" style="padding: 2px 8px; font-size: 0.68rem;">
                        + Check-in
                    </button>
                </div>

                <div class="roster-students-list">
                    ${studentsList.length === 0 ? `
                        <div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 15px 0;">
                            Sin reservas ni check-ins registrados aún.
                        </div>
                    ` : studentsList.map(st => {
                        const isAtt = st.status === 'attended';
                        const initial = (st.name || 'A')[0].toUpperCase();
                        return `
                            <div class="roster-student-item ${isAtt ? 'attended' : ''}">
                                <div class="table-avatar" style="width: 28px; height: 28px; font-size: 0.72rem;">${initial}</div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-size: 0.78rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.name}</div>
                                    <div style="font-size: 0.68rem; color: ${isAtt ? 'var(--accent-emerald)' : 'var(--accent-gold)'};">
                                        ${isAtt ? '✓ Presente en Tatami' : '⏳ Reserva Pendiente'}
                                    </div>
                                </div>
                                <div>
                                    ${!isAtt ? `
                                        <button class="btn-primary-action btn-mark-present" data-uid="${st.id}" data-cid="${cls.id}" data-cname="${className}" style="padding: 3px 8px; font-size: 0.68rem; background: var(--accent-emerald); color: #000; font-weight: 800;">
                                            Presente
                                        </button>
                                    ` : `
                                        <span style="font-size: 0.68rem; color: var(--accent-emerald); font-weight: 700; padding: 2px 6px; background: rgba(16,185,129,0.1); border-radius: 4px;">OK</span>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Listeners del Roster
    container.querySelectorAll('.btn-mark-present').forEach(btn => {
        btn.onclick = () => {
            const uid = btn.getAttribute('data-uid');
            const cid = btn.getAttribute('data-cid');
            const cname = btn.getAttribute('data-cname');
            confirmStudentAttendance(uid, cid, cname);
        };
    });

    container.querySelectorAll('.btn-add-student-to-class').forEach(btn => {
        btn.onclick = () => {
            const cid = btn.getAttribute('data-class-id');
            openManualCheckinModal(null, cid);
        };
    });

    initLucideIcons();
}

async function confirmStudentAttendance(userId, classId, className) {
    try {
        const payload = {
            user_id: userId,
            class_id: classId,
            class_name: className
        };
        const { error } = await supabase.from('attendance').insert([payload]);

        if (error) throw error;

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Asistencia Confirmada',
                text: 'El alumno ha sido marcado como presente en el tatami.',
                background: '#09090B',
                color: '#fff',
                timer: 1400,
                showConfirmButton: false
            });
        }

        await loadAttendanceModule();

    } catch (err) {
        console.error('[Admin] Error confirmando asistencia:', err);
        if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
    }
}

function renderAttendanceLedger() {
    const tableBody = document.getElementById('att-ledger-table-body');
    const pageInfo = document.getElementById('att-ledger-pagination-info');
    const btnPrev = document.getElementById('btn-att-ledger-prev');
    const btnNext = document.getElementById('btn-att-ledger-next');

    if (!tableBody) return;

    let list = cachedAttendance.filter(a => {
        // Método
        if (attLedgerFilter.method !== 'all') {
            const m = (a.method || 'check-in').toLowerCase();
            if (attLedgerFilter.method === 'check-in' && (m === 'manual' || m === 'admin-manual')) return false;
            if (attLedgerFilter.method === 'manual' && m !== 'manual' && m !== 'admin-manual') return false;
        }

        // Fecha preset
        if (attLedgerFilter.datePreset !== 'all') {
            const d = new Date(a.created_at || a.attended_at);
            const now = new Date();
            if (attLedgerFilter.datePreset === 'today') {
                if (d.toDateString() !== now.toDateString()) return false;
            } else if (attLedgerFilter.datePreset === 'week') {
                const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
                if (diffDays > 7) return false;
            } else if (attLedgerFilter.datePreset === 'month') {
                if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return false;
            }
        }

        // Búsqueda
        if (attLedgerFilter.search) {
            const term = attLedgerFilter.search.toLowerCase();
            const name = (a.student_name || '').toLowerCase();
            const cname = (a.class_name || '').toLowerCase();
            const email = (a.student_email || '').toLowerCase();
            return name.includes(term) || cname.includes(term) || email.includes(term);
        }

        return true;
    });

    const totalRows = list.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / attLedgerPerPage));
    attLedgerCurrentPage = Math.min(attLedgerCurrentPage, totalPages);
    const startIndex = (attLedgerCurrentPage - 1) * attLedgerPerPage;
    const pageRows = list.slice(startIndex, startIndex + attLedgerPerPage);

    if (pageInfo) {
        pageInfo.textContent = `Mostrando ${startIndex + 1} - ${Math.min(startIndex + attLedgerPerPage, totalRows)} de ${totalRows} registros`;
    }
    if (btnPrev) btnPrev.disabled = (attLedgerCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (attLedgerCurrentPage >= totalPages);

    if (pageRows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No se encontraron asistencias que coincidan con los filtros.</td></tr>';
        return;
    }

    tableBody.innerHTML = pageRows.map(a => {
        const dateStr = new Date(a.created_at || a.attended_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
        const m = (a.method || 'check-in').toLowerCase();
        const isManual = (m === 'manual' || m === 'admin-manual');

        return `
            <tr>
                <td style="font-size: 0.78rem; color: var(--text-muted);">${dateStr}</td>
                <td>
                    <div style="font-weight: 700; color: #fff;">${a.student_name}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${a.student_email || 'Sin correo'}</div>
                </td>
                <td style="font-size: 0.82rem; font-weight: 600; color: #fff;">${a.class_name || 'Clase Regular'}</td>
                <td><span class="badge-method pasarela">${a.discipline || 'Tatami'}</span></td>
                <td>
                    <span class="badge-method ${isManual ? 'transferencia' : 'efectivo'}">
                        ${isManual ? '🥋 Manual' : '📱 App'}
                    </span>
                </td>
                <td style="font-size: 0.78rem; color: var(--accent-gold); font-weight: 600;">${a.student_plan}</td>
                <td style="text-align: right;">
                    <button class="btn-secondary-action btn-inspect-student" data-id="${a.user_id}" style="padding: 4px 8px; font-size: 0.72rem;" title="Ver Ficha">
                        <i data-lucide="eye" style="width: 12px; height: 12px;"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.querySelectorAll('.btn-inspect-student').forEach(btn => {
        btn.onclick = () => {
            const uid = btn.getAttribute('data-id');
            const member = cachedMembers.find(m => m.id === uid);
            if (member) openMemberDrawer(member);
        };
    });

    initLucideIcons();
}

function renderAttendanceAnalytics(profiles) {
    // 1. Barras de afluencia por día de la semana
    const barsContainer = document.getElementById('att-weekly-bars-container');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const shortDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    cachedAttendance.forEach(a => {
        const d = new Date(a.created_at || a.attended_at);
        if (d >= thirtyDaysAgo) {
            dayCounts[d.getDay()]++;
        }
    });

    const maxDayCount = Math.max(1, ...dayCounts.slice(1, 7)); // lunes a sabado

    if (barsContainer) {
        barsContainer.innerHTML = [1, 2, 3, 4, 5, 6].map(i => {
            const count = dayCounts[i];
            const pct = Math.round((count / maxDayCount) * 100);
            return `
                <div class="weekly-bar-row">
                    <span class="weekly-bar-day">${shortDays[i]}</span>
                    <div class="weekly-bar-track">
                        <div class="weekly-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span class="weekly-bar-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    // 2. Top 5 Atletas Más Activos
    const topContainer = document.getElementById('att-top-athletes-container');
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const userCountMap = new Map();
    cachedAttendance.forEach(a => {
        const d = new Date(a.created_at || a.attended_at);
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
            userCountMap.set(a.user_id, (userCountMap.get(a.user_id) || 0) + 1);
        }
    });

    const userProfileMap = new Map(profiles.map(p => [p.id, p]));
    const sortedAthletes = Array.from(userCountMap.entries())
        .map(([uid, cnt]) => {
            const p = userProfileMap.get(uid);
            return {
                id: uid,
                count: cnt,
                name: p?.full_name || p?.username || 'Atleta',
                plan: plansMap[p?.membership_plan_id] || 'Plan Dojo'
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    if (topContainer) {
        if (sortedAthletes.length === 0) {
            topContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px;">Sin datos de asistencia en este mes.</div>';
        } else {
            const medals = ['🥇', '🥈', '🥉', '4°', '5°'];
            const badgeClasses = ['gold', 'silver', 'bronze', 'neutral', 'neutral'];

            topContainer.innerHTML = sortedAthletes.map((ath, idx) => `
                <div class="athlete-rank-card">
                    <div class="rank-badge ${badgeClasses[idx]}">${medals[idx]}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 700; color: #fff; font-size: 0.82rem;">${ath.name}</div>
                        <div style="font-size: 0.68rem; color: var(--text-muted);">${ath.plan}</div>
                    </div>
                    <div style="font-weight: 800; color: var(--accent-emerald); font-size: 0.88rem;">
                        ${ath.count} clases
                    </div>
                </div>
            `).join('');
        }
    }

    // 3. Alumnos en Riesgo por Inasistencia (>14 días)
    const riskContainer = document.getElementById('att-inactivity-list-container');
    const riskBadge = document.getElementById('att-inactivity-count-badge');

    const activeMembers = profiles.filter(p => p.membership_status === 'active');
    const inactiveRiskList = [];

    activeMembers.forEach(mem => {
        const studentAtt = cachedAttendance
            .filter(a => a.user_id === mem.id)
            .sort((a, b) => new Date(b.created_at || b.attended_at) - new Date(a.created_at || a.attended_at));

        if (studentAtt.length > 0) {
            const lastDate = new Date(studentAtt[0].created_at || studentAtt[0].attended_at);
            const daysSince = Math.ceil((now - lastDate) / (1000 * 60 * 60 * 24));
            if (daysSince > 14) {
                inactiveRiskList.push({
                    profile: mem,
                    daysSince,
                    lastDateStr: lastDate.toLocaleDateString('es-CL'),
                    plan: plansMap[mem.membership_plan_id] || 'Plan Dojo'
                });
            }
        } else {
            // Nunca ha asistido
            inactiveRiskList.push({
                profile: mem,
                daysSince: 99,
                lastDateStr: 'Sin registros',
                plan: plansMap[mem.membership_plan_id] || 'Plan Dojo'
            });
        }
    });

    inactiveRiskList.sort((a, b) => b.daysSince - a.daysSince);

    if (riskBadge) riskBadge.textContent = `${inactiveRiskList.length} en riesgo`;
    const bSubRisk = document.getElementById('badge-att-risk-count');
    if (bSubRisk) bSubRisk.textContent = inactiveRiskList.length;

    if (riskContainer) {
        if (inactiveRiskList.length === 0) {
            riskContainer.innerHTML = '<div style="text-align: center; color: var(--accent-emerald); font-size: 0.82rem; padding: 20px;">🎉 ¡Excelente! No hay alumnos activos con más de 14 días sin asistir.</div>';
        } else {
            riskContainer.innerHTML = inactiveRiskList.slice(0, 8).map(item => {
                const p = item.profile;
                const phone = p.phone ? p.phone.replace(/\D/g, '') : null;
                const name = p.full_name || p.username || 'Atleta';
                const initial = name[0].toUpperCase();

                return `
                    <div class="crm-alert-item" style="border-left: 3px solid var(--accent-red);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="table-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${initial}</div>
                            <div>
                                <div style="font-weight: 700; color: #fff; font-size: 0.82rem;">${name}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${item.plan} • Última: ${item.lastDateStr}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="status-pill overdue" style="font-size: 0.7rem;">
                                ${item.daysSince === 99 ? 'Sin check-ins' : `Ausente ${item.daysSince} días`}
                            </span>
                            ${phone ? `
                                <button class="btn-whatsapp-action btn-wa-comeback" data-phone="${phone}" data-name="${name}" data-days="${item.daysSince}">
                                    <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i>
                                    <span>Motivar</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            riskContainer.querySelectorAll('.btn-wa-comeback').forEach(btn => {
                btn.onclick = () => {
                    const phone = btn.getAttribute('data-phone');
                    const name = btn.getAttribute('data-name');
                    const days = btn.getAttribute('data-days');
                    const msg = `Hola ${name}! Te saludamos del dojo Amarufighter 🥋. Hace ${days} días que no te vemos en el tatami. ¿Todo bien con tus entrenamientos? ¡Te esperamos esta semana para retomar el ritmo! 💪`;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                };
            });
        }
    }

    initLucideIcons();
}

function switchAttendanceSubTab(targetTab) {
    currentAttendanceSubTab = targetTab;

    document.querySelectorAll('.attendance-subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-atab') === targetTab);
    });

    document.querySelectorAll('.attendance-tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `atab-content-${targetTab}`);
    });

    if (targetTab === 'roster') renderAttendanceRoster();
    else if (targetTab === 'ledger') renderAttendanceLedger();
    else if (targetTab === 'analytics') renderAttendanceAnalytics(cachedMembers);

    initLucideIcons();
}

function initAttendanceUIHandlers() {
    // 1. Subpestañas
    document.querySelectorAll('.attendance-subtab-btn[data-atab]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchAttendanceSubTab(btn.getAttribute('data-atab'));
        });
    });

    // 2. Refrescar
    const btnRef = document.getElementById('btn-refresh-attendance');
    if (btnRef) {
        btnRef.addEventListener('click', async () => {
            btnRef.classList.add('rotating');
            await loadAttendanceModule();
            setTimeout(() => btnRef.classList.remove('rotating'), 600);
        });
    }

    // 3. Botón Modal Check-in Manual
    const btnOpenMC = document.getElementById('btn-open-manual-checkin');
    if (btnOpenMC) {
        btnOpenMC.addEventListener('click', () => openManualCheckinModal());
    }

    // 4. Roster: Controles de fecha
    const btnPrevDay = document.getElementById('btn-roster-prev-day');
    const btnToday = document.getElementById('btn-roster-today');
    const btnNextDay = document.getElementById('btn-roster-next-day');
    const dateInput = document.getElementById('att-roster-date');
    const discSelect = document.getElementById('att-roster-discipline');

    if (btnPrevDay) {
        btnPrevDay.onclick = () => {
            const d = new Date(attRosterDate + 'T12:00:00');
            d.setDate(d.getDate() - 1);
            attRosterDate = d.toISOString().split('T')[0];
            renderAttendanceRoster();
        };
    }

    if (btnToday) {
        btnToday.onclick = () => {
            attRosterDate = new Date().toISOString().split('T')[0];
            renderAttendanceRoster();
        };
    }

    if (btnNextDay) {
        btnNextDay.onclick = () => {
            const d = new Date(attRosterDate + 'T12:00:00');
            d.setDate(d.getDate() + 1);
            attRosterDate = d.toISOString().split('T')[0];
            renderAttendanceRoster();
        };
    }

    if (dateInput) {
        dateInput.onchange = () => {
            attRosterDate = dateInput.value;
            renderAttendanceRoster();
        };
    }

    if (discSelect) {
        discSelect.onchange = () => {
            attRosterDiscipline = discSelect.value;
            renderAttendanceRoster();
        };
    }

    // 5. Ledger: Filtros reactivos
    const ledSearch = document.getElementById('att-ledger-search');
    const ledDate = document.getElementById('att-ledger-date-preset');
    const ledMethod = document.getElementById('att-ledger-method');
    const btnExport = document.getElementById('btn-export-attendance-csv');
    const btnPrevPage = document.getElementById('btn-att-ledger-prev');
    const btnNextPage = document.getElementById('btn-att-ledger-next');

    const updateLedger = () => {
        attLedgerFilter.search = ledSearch?.value || '';
        attLedgerFilter.datePreset = ledDate?.value || 'week';
        attLedgerFilter.method = ledMethod?.value || 'all';
        attLedgerCurrentPage = 1;
        renderAttendanceLedger();
    };

    if (ledSearch) ledSearch.oninput = updateLedger;
    if (ledDate) ledDate.onchange = updateLedger;
    if (ledMethod) ledMethod.onchange = updateLedger;
    if (btnExport) btnExport.onclick = exportAttendanceCSV;

    if (btnPrevPage) {
        btnPrevPage.onclick = () => {
            if (attLedgerCurrentPage > 1) { attLedgerCurrentPage--; renderAttendanceLedger(); }
        };
    }

    if (btnNextPage) {
        btnNextPage.onclick = () => {
            attLedgerCurrentPage++;
            renderAttendanceLedger();
        };
    }

    // 6. Modal handlers
    initManualCheckinModalHandlers();
}

function populateManualCheckinSelects(profiles) {
    const studentSelect = document.getElementById('mcheckin-student-select');
    const classSelect = document.getElementById('mcheckin-class-select');
    const dateInput = document.getElementById('mcheckin-date-input');
    const timeInput = document.getElementById('mcheckin-time-input');

    if (studentSelect && profiles.length > 0) {
        studentSelect.innerHTML = '<option value="">Selecciona alumno...</option>' + profiles.map(p => `
            <option value="${p.id}">${p.full_name || p.username || 'Sin nombre'} (${p.email || 'Sin email'})</option>
        `).join('');
    }

    if (classSelect && cachedClassesForAtt.length > 0) {
        classSelect.innerHTML = '<option value="">Selecciona clase...</option>' + cachedClassesForAtt.map(c => `
            <option value="${c.id}" data-name="${c.name || 'Clase'}">${c.name || c.discipline || 'Clase'} — ${c.time || 'Horario regular'}</option>
        `).join('');
    }

    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (timeInput && !timeInput.value) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hh}:${mm}`;
    }
}

function openManualCheckinModal(preselectedStudentId = null, preselectedClassId = null) {
    const modal = document.getElementById('manual-checkin-modal-overlay');
    if (!modal) return;

    populateManualCheckinSelects(cachedMembers);

    const studentSelect = document.getElementById('mcheckin-student-select');
    const classSelect = document.getElementById('mcheckin-class-select');
    const dateInput = document.getElementById('mcheckin-date-input');

    if (preselectedStudentId && studentSelect) studentSelect.value = preselectedStudentId;
    if (preselectedClassId && classSelect) classSelect.value = preselectedClassId;
    if (dateInput) dateInput.value = attRosterDate;

    modal.classList.add('open');
}

function initManualCheckinModalHandlers() {
    const modal = document.getElementById('manual-checkin-modal-overlay');
    const btnClose = document.getElementById('btn-close-manual-checkin');
    const btnCancel = document.getElementById('btn-cancel-manual-checkin');
    const form = document.getElementById('manual-checkin-form');

    if (btnClose && modal) btnClose.onclick = () => modal.classList.remove('open');
    if (btnCancel && modal) btnCancel.onclick = () => modal.classList.remove('open');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const studentId = document.getElementById('mcheckin-student-select')?.value;
            const classSelect = document.getElementById('mcheckin-class-select');
            const classId = classSelect?.value;
            const className = classSelect?.options[classSelect.selectedIndex]?.getAttribute('data-name') || 'Clase Regular';
            const dateVal = document.getElementById('mcheckin-date-input')?.value;
            const timeVal = document.getElementById('mcheckin-time-input')?.value || '12:00';
            const notes = document.getElementById('mcheckin-notes-input')?.value || '';

            if (!studentId || !classId) return;

            try {
                const attendedAt = (dateVal && timeVal) ? new Date(`${dateVal}T${timeVal}:00`).toISOString() : new Date().toISOString();

                const payload = {
                    user_id: studentId,
                    class_id: classId,
                    class_name: notes ? `${className} [${notes}]` : className
                };

                const { error } = await supabase.from('attendance').insert([payload]);

                if (error) throw error;

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Check-in Registrado',
                        text: 'La asistencia ha sido guardada exitosamente.',
                        background: '#09090B',
                        color: '#fff',
                        timer: 1600,
                        showConfirmButton: false
                    });
                }

                modal.classList.remove('open');
                form.reset();

                await loadAttendanceModule();

            } catch (err) {
                console.error('[Admin] Error en check-in manual:', err);
                if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
            }
        };
    }
}

function exportAttendanceCSV() {
    if (!cachedAttendance || cachedAttendance.length === 0) {
        if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay registros de asistencia para exportar.', background: '#09090B', color: '#fff' });
        return;
    }

    const headers = ['ID', 'Fecha', 'Hora', 'Alumno', 'Email', 'Clase', 'Disciplina', 'Método', 'Plan'];
    const rows = cachedAttendance.map(a => {
        const d = new Date(a.created_at || a.attended_at);
        return [
            a.id,
            d.toLocaleDateString('es-CL'),
            d.toLocaleTimeString('es-CL'),
            a.student_name || 'Alumno',
            a.student_email || '',
            a.class_name || 'Clase',
            a.discipline || 'Tatami',
            a.method || 'check-in',
            a.student_plan || 'Sin plan'
        ];
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    showExportFormatDialog({
        title: 'Exportar Registro de Asistencia',
        pdfTitle: 'Auditoría y Libro de Asistencias Tatami',
        filename: `asistencia_amarufighter_${dateStr}`,
        headers,
        rows,
        summaryCards: [{ label: 'Total Asistencias', value: rows.length }]
    });
}

// ============================================================================
// MÓDULO 2: SOCIOS CRM v2.0 (DASHBOARD, DIRECTORIO, RETENCIÓN & COMUNICACIONES)
// ============================================================================
let cachedMembers = [];
let plansMap = {};
let currentMembersSubTab = 'dashboard'; // 'dashboard' | 'directory' | 'retention' | 'communications'

// Filtros Directorio
const dirFilter = {
    search: '',
    status: 'all',
    plan: 'all'
};
let dirCurrentPage = 1;
const dirPerPage = 15;

// Filtros Retención
let currentRiskFilter = 'all'; // 'all' | 'high' | 'medium' | 'low' | 'inactive'

// Comunicaciones
let commSegment = 'all';
let commTemplate = 'custom';

// Mantiene compatibilidad con llamadas existentes
export async function loadMembersTable() {
    return loadMembersModule();
}

export async function loadMembersModule() {
    try {
        const [profRes, planRes, attRes, payRes] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('membership_plans').select('*').order('price', { ascending: true }),
            supabase.from('attendance').select('*'),
            supabase.from('payments').select('id, user_id, amount, status, created_at')
        ]);

        if (profRes.error) throw profRes.error;

        const rawPlans = planRes.data || [];
        rawPlans.forEach(p => { plansMap[p.id] = p.name; });

        const rawAtt = attRes.data || [];
        const rawPayments = payRes.data || [];

        const now = new Date();

        // Enriquecer datos de miembros
        cachedMembers = (profRes.data || []).map(m => {
            const planName = plansMap[m.membership_plan_id] || (m.membership_status === 'active' ? 'Plan Activo' : 'Sin Plan');

            // Última asistencia
            const userAtt = rawAtt
                .filter(a => a.user_id === m.id)
                .map(a => ({ ...a, effDate: a.attended_at || a.created_at || a.date }))
                .filter(a => a.effDate)
                .sort((a, b) => new Date(b.effDate) - new Date(a.effDate));

            let daysSinceAttendance = null;
            let lastAttendanceDateStr = 'Sin registros';
            if (userAtt.length > 0) {
                const lastDate = new Date(userAtt[0].effDate);
                daysSinceAttendance = Math.ceil((now - lastDate) / (1000 * 60 * 60 * 24));
                lastAttendanceDateStr = lastDate.toLocaleDateString('es-CL');
            }

            // Días restantes de membresía
            let daysLeft = null;
            if (m.membership_expiry) {
                const expDate = new Date(m.membership_expiry);
                daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            }

            // Pagos del usuario
            const userPays = rawPayments.filter(p => p.user_id === m.id && p.status === 'approved');
            const totalPaid = userPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            // Churn Risk Score (0 - 100)
            let churnScore = 15; // base
            if (m.membership_status === 'inactive') churnScore = 90;
            else if (m.membership_status === 'frozen') churnScore = 40;
            else {
                // Inasistencia prolongada
                if (daysSinceAttendance === null) churnScore += 25;
                else if (daysSinceAttendance > 21) churnScore += 45;
                else if (daysSinceAttendance > 14) churnScore += 30;
                else if (daysSinceAttendance > 7) churnScore += 10;
                else churnScore -= 10;

                // Vencimiento o cuota vencida
                if (daysLeft !== null) {
                    if (daysLeft < 0) churnScore += 35;
                    else if (daysLeft <= 5) churnScore += 20;
                    else churnScore -= 5;
                }
            }
            churnScore = Math.max(5, Math.min(100, churnScore));

            let riskCategory = 'low';
            if (m.membership_status === 'inactive' || m.membership_status === 'frozen') riskCategory = 'inactive';
            else if (churnScore >= 60) riskCategory = 'high';
            else if (churnScore >= 30) riskCategory = 'medium';

            const emailStr = m.email || '';
            const isGeneratedEmail = emailStr.endsWith('@amaru.local') || !emailStr.includes('@');

            return {
                ...m,
                plan_name: planName,
                days_since_attendance: daysSinceAttendance,
                last_attendance_str: lastAttendanceDateStr,
                days_left: daysLeft,
                total_paid: totalPaid,
                churn_score: churnScore,
                risk_category: riskCategory,
                is_generated_email: isGeneratedEmail
            };
        });

        // 1. Top 4 KPIs
        updateMembersTopKPIs();

        // 2. Renderizar Sub-pestaña activa
        if (currentMembersSubTab === 'dashboard') {
            renderMembersCrmDashboard(rawPlans);
        } else if (currentMembersSubTab === 'directory') {
            renderMembersDirectory();
        } else if (currentMembersSubTab === 'retention') {
            renderMembersRetention();
        } else if (currentMembersSubTab === 'communications') {
            renderMembersCommunications();
        }

        // 3. Poblar dropdown de planes en directorio
        populateDirectoryPlanFilter(rawPlans);

        initLucideIcons();

    } catch (err) {
        console.error('[Admin] Error cargando módulo de socios CRM:', err);
    }
}

function updateMembersTopKPIs() {
    const totalMembers = cachedMembers.length;
    const activeMembers = cachedMembers.filter(m => m.membership_status === 'active');
    const warningMembers = activeMembers.filter(m => m.days_left !== null && m.days_left >= 0 && m.days_left <= 5);
    const overdueMembers = cachedMembers.filter(m => m.membership_status === 'expired' || (m.days_left !== null && m.days_left < 0));

    const activePct = totalMembers > 0 ? Math.round((activeMembers.length / totalMembers) * 100) : 0;

    const elTot = document.getElementById('mkpi-total-members');
    const elAct = document.getElementById('mkpi-active-members');
    const elActPct = document.getElementById('mkpi-active-pct');
    const elWarn = document.getElementById('mkpi-warning-members');
    const elOver = document.getElementById('mkpi-overdue-members');

    if (elTot) elTot.textContent = totalMembers;
    if (elAct) elAct.textContent = activeMembers.length;
    if (elActPct) elActPct.textContent = `${activePct}% del padrón total`;
    if (elWarn) elWarn.textContent = warningMembers.length;
    if (elOver) elOver.textContent = overdueMembers.length;

    const bDir = document.getElementById('badge-dir-total-count');
    if (bDir) bDir.textContent = totalMembers;
}

function renderMembersCrmDashboard(plans) {
    // 1. Distribución por Plan
    const planDistContainer = document.getElementById('crm-plan-distribution-container');
    const planTotalBadge = document.getElementById('crm-plans-total-badge');

    if (planTotalBadge) planTotalBadge.textContent = `${plans.length} Planes Activos`;

    if (planDistContainer) {
        const activeMembers = cachedMembers.filter(m => m.membership_status === 'active');
        const totalActive = activeMembers.length || 1;

        planDistContainer.innerHTML = plans.map(p => {
            const membersInPlan = activeMembers.filter(m => m.membership_plan_id === p.id);
            const count = membersInPlan.length;
            const pct = Math.round((count / totalActive) * 100);
            const estRevenue = count * (Number(p.price) || 0);
            const fmtCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(estRevenue);

            return `
                <div class="crm-plan-row">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
                        <strong style="color: #fff;">${p.name}</strong>
                        <span style="color: var(--accent-emerald); font-weight: 700;">${fmtCLP}</span>
                    </div>
                    <div class="roster-capacity-track">
                        <div class="roster-capacity-fill" style="width: ${pct}%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted);">
                        <span>${count} alumnos (${pct}%)</span>
                        <span>$${(Number(p.price) || 0).toLocaleString('es-CL')} c/u</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 2. Alertas Críticas Inmediatas
    const alertsContainer = document.getElementById('crm-critical-alerts-container');
    const alertsBadge = document.getElementById('crm-critical-count-badge');

    const warningList = cachedMembers.filter(m => m.membership_status === 'active' && m.days_left !== null && m.days_left >= 0 && m.days_left <= 5);
    const absentList = cachedMembers.filter(m => m.membership_status === 'active' && m.days_since_attendance !== null && m.days_since_attendance > 14);

    const totalAlerts = warningList.length + absentList.length;
    if (alertsBadge) alertsBadge.textContent = `${totalAlerts} Alertas`;

    if (alertsContainer) {
        if (totalAlerts === 0) {
            alertsContainer.innerHTML = '<div style="text-align: center; color: var(--accent-emerald); font-size: 0.82rem; padding: 25px;">🎉 Sin alertas críticas. Todos los socios activos están al día y asistiendo.</div>';
        } else {
            const htmlWarn = warningList.map(m => `
                <div class="crm-alert-item" style="border-left: 3px solid var(--accent-gold);">
                    <div>
                        <div style="font-weight: 700; color: #fff; font-size: 0.82rem;">${m.full_name || m.username}</div>
                        <div style="font-size: 0.7rem; color: var(--accent-gold);">Vence en ${m.days_left} días • ${m.plan_name}</div>
                    </div>
                    <button class="btn-secondary-action btn-quick-renew-30d" data-id="${m.id}" style="padding: 4px 8px; font-size: 0.72rem; color: var(--accent-emerald);">
                        +30 Días
                    </button>
                </div>
            `).join('');

            const htmlAbsent = absentList.map(m => {
                const phone = m.phone ? m.phone.replace(/\D/g, '') : null;
                return `
                    <div class="crm-alert-item" style="border-left: 3px solid var(--accent-red);">
                        <div>
                            <div style="font-weight: 700; color: #fff; font-size: 0.82rem;">${m.full_name || m.username}</div>
                            <div style="font-size: 0.7rem; color: #ef4444;">Sin asistir hace ${m.days_since_attendance} días • ${m.plan_name}</div>
                        </div>
                        ${phone ? `
                            <button class="btn-whatsapp-action btn-quick-wa-alert" data-phone="${phone}" data-name="${m.full_name || 'Alumno'}">
                                <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i>
                                <span>WhatsApp</span>
                            </button>
                        ` : '<span style="font-size: 0.68rem; color: var(--text-muted);">Sin fono</span>'}
                    </div>
                `;
            }).join('');

            alertsContainer.innerHTML = htmlWarn + htmlAbsent;

            alertsContainer.querySelectorAll('.btn-quick-renew-30d').forEach(btn => {
                btn.onclick = () => quickRenewMember(btn.getAttribute('data-id'));
            });

            alertsContainer.querySelectorAll('.btn-quick-wa-alert').forEach(btn => {
                btn.onclick = () => {
                    const phone = btn.getAttribute('data-phone');
                    const name = btn.getAttribute('data-name');
                    const msg = `Hola ${name}! Te saludamos de Amarufighter 🥋. Queríamos saber cómo estás y cuándo te sumas a entrenar al tatami. ¡Te esperamos!`;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                };
            });
        }
    }

    initLucideIcons();
}

function renderMembersDirectory() {
    const tableBody = document.getElementById('dir-table-body');
    const paginationInfo = document.getElementById('dir-pagination-info');
    const btnPrev = document.getElementById('btn-dir-prev-page');
    const btnNext = document.getElementById('btn-dir-next-page');

    if (!tableBody) return;

    let list = cachedMembers.filter(m => {
        // Estado
        if (dirFilter.status !== 'all') {
            if (dirFilter.status === 'active' && m.membership_status !== 'active') return false;
            if (dirFilter.status === 'warning' && !(m.days_left !== null && m.days_left >= 0 && m.days_left <= 5)) return false;
            if (dirFilter.status === 'overdue' && !(m.membership_status === 'expired' || (m.days_left !== null && m.days_left < 0))) return false;
            if (dirFilter.status === 'frozen' && m.membership_status !== 'frozen') return false;
            if (dirFilter.status === 'inactive' && m.membership_status !== 'inactive') return false;
        }

        // Plan
        if (dirFilter.plan !== 'all' && m.membership_plan_id !== dirFilter.plan) {
            return false;
        }

        // Búsqueda
        if (dirFilter.search) {
            const term = dirFilter.search.toLowerCase();
            const name = (m.full_name || m.username || '').toLowerCase();
            const email = (m.email || '').toLowerCase();
            const rut = (m.rut || '').toLowerCase();
            const phone = (m.phone || '').toLowerCase();
            return name.includes(term) || email.includes(term) || rut.includes(term) || phone.includes(term);
        }

        return true;
    });

    const totalRows = list.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / dirPerPage));
    dirCurrentPage = Math.min(dirCurrentPage, totalPages);
    const startIndex = (dirCurrentPage - 1) * dirPerPage;
    const pageRows = list.slice(startIndex, startIndex + dirPerPage);

    if (paginationInfo) {
        paginationInfo.textContent = `Mostrando ${startIndex + 1} - ${Math.min(startIndex + dirPerPage, totalRows)} de ${totalRows} socios`;
    }
    if (btnPrev) btnPrev.disabled = (dirCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (dirCurrentPage >= totalPages);

    if (pageRows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No se encontraron socios con los filtros aplicados.</td></tr>';
        return;
    }

    tableBody.innerHTML = pageRows.map(m => {
        const name = m.full_name || m.username || 'Sin Nombre';
        const initial = name[0].toUpperCase();
        const expiryDate = m.membership_expiry ? new Date(m.membership_expiry).toLocaleDateString('es-CL') : 'Sin fecha';
        const cleanPhone = m.phone ? m.phone.replace(/\D/g, '') : null;

        let statusClass = m.membership_status || 'active';
        let statusLabel = (m.membership_status || 'activo').toUpperCase();

        if (m.membership_status === 'active') {
            if (m.days_left !== null && m.days_left <= 0) {
                statusClass = 'overdue';
                statusLabel = 'VENCIDO';
            } else if (m.days_left !== null && m.days_left <= 5) {
                statusClass = 'warning';
                statusLabel = `VENCE EN ${m.days_left}D`;
            } else {
                statusClass = 'active';
                statusLabel = 'AL DÍA';
            }
        }

        return `
            <tr>
                <td>
                    <div class="user-meta-cell">
                        <div class="table-avatar">${initial}</div>
                        <div>
                            <div class="user-text-name">${name}</div>
                            <div style="display: flex; gap: 4px; margin-top: 2px;">
                                ${m.is_generated_email ? `
                                    <span class="tech-badge noapp" title="Email de sistema auto-generado">📵 Sin App</span>
                                ` : `
                                    <span class="tech-badge app" title="Usuario con App y email personal">📱 App Activa</span>
                                `}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="color: #fff; font-size: 0.8rem;">${m.email || 'Sin correo'}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                        <span>${m.phone || 'Sin fono'}</span>
                        ${cleanPhone ? `
                            <a href="https://wa.me/${cleanPhone}" target="_blank" style="color: #25d366; text-decoration: none;" title="Abrir WhatsApp">
                                <i data-lucide="message-circle" style="width: 12px; height: 12px; vertical-align: middle;"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span style="font-weight: 600; color: #fff; font-size: 0.82rem;">${m.plan_name}</span>
                </td>
                <td>
                    <span class="status-pill ${statusClass}">${statusLabel}</span>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${expiryDate}</td>
                <td style="font-size: 0.78rem; color: var(--text-muted);">${m.last_attendance_str}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-secondary-action btn-view-member" data-id="${m.id}" style="padding: 4px 8px; font-size: 0.72rem;" title="Ver Ficha Completa">
                        <i data-lucide="eye" style="width: 12px; height: 12px;"></i>
                    </button>
                    <button class="btn-secondary-action btn-edit-member" data-id="${m.id}" style="padding: 4px 8px; font-size: 0.72rem; color: #a855f7;" title="Editar Datos del Socio">
                        <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                    </button>
                    <button class="btn-secondary-action btn-dir-renew" data-id="${m.id}" style="padding: 4px 8px; font-size: 0.72rem; color: var(--accent-emerald);" title="Renovar +30 Días">
                        +30d
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.querySelectorAll('.btn-view-member').forEach(btn => {
        btn.onclick = () => {
            const memberId = btn.getAttribute('data-id');
            const member = cachedMembers.find(x => x.id === memberId);
            if (member) openMemberDrawer(member);
        };
    });

    tableBody.querySelectorAll('.btn-edit-member').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            openEditMemberModal(btn.getAttribute('data-id'));
        };
    });

    tableBody.querySelectorAll('.btn-dir-renew').forEach(btn => {
        btn.onclick = () => quickRenewMember(btn.getAttribute('data-id'));
    });

    initLucideIcons();
}

export function openEditMemberModal(memberId) {
    const member = (cachedMembers || []).find(m => m.id === memberId);
    if (!member) return;

    const modal = document.getElementById('edit-member-modal-overlay');
    const inputId = document.getElementById('edit-member-input-id');
    const inputName = document.getElementById('edit-member-input-name');
    const inputEmail = document.getElementById('edit-member-input-email');
    const inputPhone = document.getElementById('edit-member-input-phone');
    const inputRut = document.getElementById('edit-member-input-rut');
    const inputPlan = document.getElementById('edit-member-input-plan');
    const inputStatus = document.getElementById('edit-member-input-status');
    const inputExpiry = document.getElementById('edit-member-input-expiry');
    const inputBelt = document.getElementById('edit-member-input-belt');
    const inputEmergency = document.getElementById('edit-member-input-emergency');
    const inputNotes = document.getElementById('edit-member-input-notes');
    const avatarEl = document.getElementById('edit-member-avatar');
    const titleEl = document.getElementById('edit-member-modal-title');
    const toggleBtnText = document.getElementById('btn-toggle-active-member-text');

    const displayName = member.full_name || member.username || 'Sin Nombre';

    if (inputId) inputId.value = member.id;
    if (inputName) inputName.value = displayName;
    if (inputEmail) inputEmail.value = member.email || '';
    if (inputPhone) inputPhone.value = member.phone || '';
    if (inputRut) inputRut.value = member.rut || '';
    if (inputBelt) inputBelt.value = member.belt_rank || member.combat_style || '';
    if (inputEmergency) inputEmergency.value = member.emergency_contact || '';
    if (inputNotes) inputNotes.value = member.admin_notes || '';

    if (avatarEl) avatarEl.textContent = displayName[0].toUpperCase();
    if (titleEl) titleEl.textContent = `Editar: ${displayName}`;

    // Llenar selector de planes con los planes actuales
    if (inputPlan) {
        const plans = cachedPlans || [];
        inputPlan.innerHTML = '<option value="">Sin Plan Asignado</option>' + plans.map(p => `
            <option value="${p.id}" ${p.id === member.membership_plan_id ? 'selected' : ''}>${p.name} ($${(p.price || 0).toLocaleString('es-CL')})</option>
        `).join('');
    }

    if (inputStatus) {
        inputStatus.value = member.membership_status || 'active';
    }

    if (inputExpiry) {
        const exp = member.membership_expiry || member.plan_expiry;
        if (exp) {
            try {
                inputExpiry.value = new Date(exp).toISOString().split('T')[0];
            } catch {
                inputExpiry.value = '';
            }
        } else {
            inputExpiry.value = '';
        }
    }

    if (toggleBtnText) {
        toggleBtnText.textContent = (member.membership_status === 'inactive') ? 'Reactivar Socio' : 'Desactivar Socio';
    }

    // Asegurar que los botones de acción para editar estén visibles
    const btnToggleActive = document.getElementById('btn-toggle-active-member-modal');
    const btnDeleteMember = document.getElementById('btn-delete-member-modal');
    const subtitleEl = document.getElementById('edit-member-modal-subtitle');
    const submitBtnSpan = document.querySelector('#edit-member-form button[type="submit"] span');

    if (btnToggleActive) btnToggleActive.style.display = '';
    if (btnDeleteMember) btnDeleteMember.style.display = '';
    if (submitBtnSpan) submitBtnSpan.textContent = 'Guardar Cambios';
    if (subtitleEl) subtitleEl.textContent = 'Actualiza datos personales, contacto y membresía';

    initLucideIcons();
    if (modal) modal.classList.add('open');
}

export function openCreateMemberModal() {
    const modal = document.getElementById('edit-member-modal-overlay');
    const inputId = document.getElementById('edit-member-input-id');
    const inputName = document.getElementById('edit-member-input-name');
    const inputEmail = document.getElementById('edit-member-input-email');
    const inputPhone = document.getElementById('edit-member-input-phone');
    const inputRut = document.getElementById('edit-member-input-rut');
    const inputPlan = document.getElementById('edit-member-input-plan');
    const inputStatus = document.getElementById('edit-member-input-status');
    const inputExpiry = document.getElementById('edit-member-input-expiry');
    const inputBelt = document.getElementById('edit-member-input-belt');
    const inputEmergency = document.getElementById('edit-member-input-emergency');
    const inputNotes = document.getElementById('edit-member-input-notes');
    const avatarEl = document.getElementById('edit-member-avatar');
    const titleEl = document.getElementById('edit-member-modal-title');
    const subtitleEl = document.getElementById('edit-member-modal-subtitle');
    const btnToggleActive = document.getElementById('btn-toggle-active-member-modal');
    const btnDeleteMember = document.getElementById('btn-delete-member-modal');
    const submitBtnSpan = document.querySelector('#edit-member-form button[type="submit"] span');

    if (inputId) inputId.value = '';
    if (inputName) inputName.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputPhone) inputPhone.value = '';
    if (inputRut) inputRut.value = '';
    if (inputBelt) inputBelt.value = '';
    if (inputEmergency) inputEmergency.value = '';
    if (inputNotes) inputNotes.value = '';

    if (avatarEl) avatarEl.textContent = '+';
    if (titleEl) titleEl.textContent = 'Registrar Nuevo Socio';
    if (subtitleEl) subtitleEl.textContent = 'Ingresa los datos personales y asigna su membresía inicial';

    // Ocultar botones de acciones destructivas al crear nuevo
    if (btnToggleActive) btnToggleActive.style.display = 'none';
    if (btnDeleteMember) btnDeleteMember.style.display = 'none';
    if (submitBtnSpan) submitBtnSpan.textContent = 'Crear Socio';

    // Llenar selector de planes con los planes actuales
    if (inputPlan) {
        const plans = cachedPlans || [];
        inputPlan.innerHTML = '<option value="">Sin Plan Asignado</option>' + plans.map(p => `
            <option value="${p.id}">${p.name} ($${(p.price || 0).toLocaleString('es-CL')})</option>
        `).join('');
    }

    if (inputStatus) inputStatus.value = 'active';

    if (inputExpiry) {
        // Por defecto vencimiento en 30 días
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 30);
        inputExpiry.value = expDate.toISOString().split('T')[0];
    }

    initLucideIcons();
    if (modal) modal.classList.add('open');
}

export function closeEditMemberModal() {
    const modal = document.getElementById('edit-member-modal-overlay');
    if (modal) modal.classList.remove('open');
}

export async function handleEditMemberSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-member-input-id')?.value;
    const name = document.getElementById('edit-member-input-name')?.value?.trim();
    const email = document.getElementById('edit-member-input-email')?.value?.trim();
    const phone = document.getElementById('edit-member-input-phone')?.value?.trim();
    const rut = document.getElementById('edit-member-input-rut')?.value?.trim();
    const planId = document.getElementById('edit-member-input-plan')?.value || null;
    const status = document.getElementById('edit-member-input-status')?.value || 'active';
    const expiry = document.getElementById('edit-member-input-expiry')?.value || null;
    const belt = document.getElementById('edit-member-input-belt')?.value?.trim();
    const emergency = document.getElementById('edit-member-input-emergency')?.value?.trim();
    const notes = document.getElementById('edit-member-input-notes')?.value?.trim();

    // --- CASO 1: CREAR NUEVO SOCIO ---
    if (!id) {
        if (!name) {
            if (window.Swal) window.Swal.fire({ icon: 'warning', title: 'Campo Requerido', text: 'El nombre completo es obligatorio.', background: '#09090B', color: '#fff' });
            return;
        }
        if (!email) {
            if (window.Swal) window.Swal.fire({ icon: 'warning', title: 'Campo Requerido', text: 'El correo electrónico es obligatorio.', background: '#09090B', color: '#fff' });
            return;
        }

        try {
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Creando Socio...',
                    text: 'Registrando perfil en la plataforma.',
                    allowOutsideClick: false,
                    didOpen: () => window.Swal.showLoading(),
                    background: '#09090B',
                    color: '#fff'
                });
            }

            const expiryIso = expiry ? new Date(expiry + 'T23:59:59').toISOString() : null;
            let newUserId = null;

            // 1. Intentar registrar a través de Edge Function create-user
            try {
                const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('create-user', {
                    body: {
                        email,
                        password: 'Amaru' + Math.floor(1000 + Math.random() * 9000) + '!',
                        full_name: name,
                        memberData: {
                            phone: phone || null,
                            rut: rut || null,
                            membership_plan_id: planId,
                            membership_status: status,
                            membership_expiry: expiryIso,
                            combat_style: belt || null,
                            emergency_contact: emergency || null,
                            admin_notes: notes || null
                        }
                    }
                });

                if (!edgeErr && edgeData && edgeData.userId) {
                    newUserId = edgeData.userId;
                }
            } catch (efErr) {
                console.warn('[Admin] Edge Function no disponible, usando fallback directo:', efErr);
            }

            // 2. Fallback: inserción directa en tabla profiles
            if (!newUserId) {
                newUserId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('user_' + Date.now());
                const insertPayload = {
                    id: newUserId,
                    full_name: name,
                    email: email,
                    phone: phone || null,
                    rut: rut || null,
                    membership_plan_id: planId,
                    membership_status: status,
                    membership_expiry: expiryIso,
                    combat_style: belt || null,
                    emergency_contact: emergency || null,
                    admin_notes: notes || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: insErr } = await supabase.from('profiles').insert(insertPayload);
                if (insErr) throw insErr;
            }

            closeEditMemberModal();
            await loadMembersModule();
            if (typeof loadDashboardKPIs === 'function') await loadDashboardKPIs();

            if (window.Swal) {
                window.Swal.fire({
                    icon: 'success',
                    title: '¡Socio Registrado!',
                    text: `Se ha creado el perfil de ${name} con éxito.`,
                    background: '#09090B',
                    color: '#fff',
                    timer: 2200,
                    showConfirmButton: false
                });
            }
            return;
        } catch (createErr) {
            console.error('[Admin] Error al registrar socio:', createErr);
            if (window.Swal) {
                window.Swal.fire({
                    icon: 'error',
                    title: 'Error al Registrar',
                    text: createErr.message || 'No se pudo crear el socio. Verifica los datos.',
                    background: '#09090B',
                    color: '#fff'
                });
            }
            return;
        }
    }

    try {
        const updatePayload = {
            full_name: name,
            email: email,
            phone: phone,
            rut: rut,
            membership_plan_id: planId,
            membership_status: status,
            membership_expiry: expiry ? new Date(expiry + 'T23:59:59').toISOString() : null,
            combat_style: belt,
            emergency_contact: emergency,
            admin_notes: notes,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;

        // Actualizar datos en memoria cachedMembers
        const member = (cachedMembers || []).find(m => m.id === id);
        if (member) {
            member.full_name = name;
            member.email = email;
            member.phone = phone;
            member.rut = rut;
            member.membership_plan_id = planId;
            member.membership_status = status;
            member.membership_expiry = updatePayload.membership_expiry;
            member.combat_style = belt;
            member.belt_rank = belt;
            member.emergency_contact = emergency;
            member.admin_notes = notes;

            // Actualizar nombre del plan mostrado
            const selectedPlan = (cachedPlans || []).find(p => p.id === planId);
            member.plan_name = selectedPlan ? selectedPlan.name : 'Sin Plan';

            // Recalcular días restantes si hay vencimiento
            if (member.membership_expiry) {
                const diffMs = new Date(member.membership_expiry) - new Date();
                member.days_left = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }
        }

        closeEditMemberModal();

        // Si el drawer está abierto con este socio, refrescarlo
        if (adminState.activeDrawerMember && adminState.activeDrawerMember.id === id) {
            openMemberDrawer(member);
        }

        renderMembersDirectory();
        renderMembersCrmDashboard(cachedPlans);

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Socio Actualizado',
                text: `Los datos de ${name} se guardaron exitosamente.`,
                background: '#09090B',
                color: '#fff',
                timer: 2000,
                showConfirmButton: false
            });
        }
    } catch (err) {
        console.error('Error al actualizar socio:', err);
        if (window.Swal) {
            window.Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: err.message || 'No se pudieron guardar los cambios en el socio.',
                background: '#09090B',
                color: '#fff'
            });
        }
    }
}

export async function toggleMemberActiveStatus() {
    const id = document.getElementById('edit-member-input-id')?.value;
    const member = (cachedMembers || []).find(m => m.id === id);
    if (!member) return;

    const isCurrentlyInactive = (member.membership_status === 'inactive');
    const newStatus = isCurrentlyInactive ? 'active' : 'inactive';
    const actionText = isCurrentlyInactive ? 'reactivar' : 'desactivar';

    if (window.Swal) {
        const confirm = await window.Swal.fire({
            icon: 'warning',
            title: `¿Deseas ${actionText} a este socio?`,
            text: `El socio ${member.full_name || member.username} pasará al estado ${newStatus.toUpperCase()}.`,
            showCancelButton: true,
            confirmButtonText: `Sí, ${actionText}`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: isCurrentlyInactive ? '#10b981' : '#ef4444',
            background: '#09090B',
            color: '#fff'
        });
        if (!confirm.isConfirmed) return;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ membership_status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        member.membership_status = newStatus;
        closeEditMemberModal();

        if (adminState.activeDrawerMember && adminState.activeDrawerMember.id === id) {
            openMemberDrawer(member);
        }

        renderMembersDirectory();
        renderMembersCrmDashboard(cachedPlans);

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: `Socio ${isCurrentlyInactive ? 'Reactivado' : 'Desactivado'}`,
                timer: 1800,
                showConfirmButton: false,
                background: '#09090B',
                color: '#fff'
            });
        }
    } catch (err) {
        console.error('Error al cambiar estado del socio:', err);
    }
}

export async function deleteMemberPermanently(targetId) {
    const id = targetId || document.getElementById('edit-member-input-id')?.value;
    const member = (cachedMembers || []).find(m => m.id === id);
    if (!member) return;

    const memberName = member.full_name || member.username || 'este socio';

    if (window.Swal) {
        const confirm = await window.Swal.fire({
            icon: 'warning',
            title: '¿Eliminar socio definitivamente?',
            text: `El socio "${memberName}" será dado de baja del sistema y se cancelarán sus reservas futuras asociadas.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            background: '#09090B',
            color: '#fff'
        });
        if (!confirm.isConfirmed) return;
    }

    try {
        // Soft delete y cambio a inactivo en profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
                is_deleted: true, 
                membership_status: 'inactive', 
                updated_at: new Date().toISOString() 
            })
            .eq('id', id);

        if (profileError) throw profileError;

        // Cancelar reservas futuras
        const todayStr = new Date().toISOString().split('T')[0];
        try {
            await supabase
                .from('reservations')
                .delete()
                .eq('user_id', id)
                .gte('reservation_date', todayStr);
        } catch (resErr) {
            console.warn('[Admin] Advertencia al limpiar reservas futuras:', resErr);
        }

        // Quitar de cachedMembers
        const memberIdx = (cachedMembers || []).findIndex(m => m.id === id);
        if (memberIdx !== -1) {
            cachedMembers.splice(memberIdx, 1);
        }

        closeEditMemberModal();
        closeMemberDrawer();

        renderMembersDirectory();
        renderMembersCrmDashboard(cachedPlans);
        if (typeof loadDashboardKPIs === 'function') {
            await loadDashboardKPIs();
        }

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Socio Eliminado',
                text: `Se dio de baja a ${memberName} correctamente.`,
                timer: 2000,
                showConfirmButton: false,
                background: '#09090B',
                color: '#fff'
            });
        }
    } catch (err) {
        console.error('Error al eliminar socio:', err);
        if (window.Swal) {
            window.Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: err.message || 'No se pudo eliminar al socio.',
                background: '#09090B',
                color: '#fff'
            });
        }
    }
}

function renderMembersRetention() {
    const container = document.getElementById('retention-cards-grid');
    if (!container) return;

    const counts = { all: 0, high: 0, medium: 0, low: 0, inactive: 0 };
    cachedMembers.forEach(m => {
        counts.all++;
        counts[m.risk_category] = (counts[m.risk_category] || 0) + 1;
    });

    const setCnt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setCnt('risk-cnt-all', counts.all);
    setCnt('risk-cnt-high', counts.high);
    setCnt('risk-cnt-medium', counts.medium);
    setCnt('risk-cnt-low', counts.low);
    setCnt('risk-cnt-inactive', counts.inactive);

    const bRisk = document.getElementById('badge-ret-risk-count');
    if (bRisk) bRisk.textContent = counts.high;

    let filtered = cachedMembers;
    if (currentRiskFilter !== 'all') {
        filtered = filtered.filter(m => m.risk_category === currentRiskFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 0.85rem;">No hay socios en esta categoría de riesgo.</div>';
        return;
    }

    // Ordenar por score descendente
    filtered.sort((a, b) => b.churn_score - a.churn_score);

    container.innerHTML = filtered.map(m => {
        const name = m.full_name || m.username || 'Socio';
        const initial = name[0].toUpperCase();
        const phone = m.phone ? m.phone.replace(/\D/g, '') : null;

        // Diagnóstico de riesgo
        const reasons = [];
        if (m.days_since_attendance === null) reasons.push('⚠️ Sin asistencia registrada');
        else if (m.days_since_attendance > 14) reasons.push(`⚠️ ${m.days_since_attendance} días sin asistir`);

        if (m.days_left !== null && m.days_left < 0) reasons.push(`🔴 Cuota vencida (${Math.abs(m.days_left)}d)`);
        else if (m.days_left !== null && m.days_left <= 5) reasons.push(`🟡 Vence en ${m.days_left}d`);

        if (m.membership_status === 'inactive') reasons.push('⚪ Membresía inactiva');
        if (m.membership_status === 'frozen') reasons.push('❄️ Membresía congelada');

        return `
            <div class="churn-risk-card ${m.risk_category}">
                <div class="churn-score-circle ${m.risk_category}">
                    <span style="font-size: 1rem; line-height: 1;">${m.churn_score}</span>
                    <span style="font-size: 0.55rem; text-transform: uppercase; color: var(--text-muted);">Score</span>
                </div>
                <div class="table-avatar" style="width: 38px; height: 38px; font-size: 0.9rem;">${initial}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong style="font-size: 0.92rem; color: #fff;">${name}</strong>
                        <span style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 600;">${m.plan_name}</span>
                    </div>
                    <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                        ${reasons.map(r => `<span style="font-size: 0.7rem; color: #e4e4e7; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${r}</span>`).join('')}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    ${phone ? `
                        <button class="btn-whatsapp-action btn-wa-rescue" data-phone="${phone}" data-name="${name}">
                            <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i>
                            <span>Rescatar</span>
                        </button>
                    ` : ''}
                    <button class="btn-quickpay-action btn-ret-pay" data-uid="${m.id}" data-planid="${m.membership_plan_id || ''}">
                        <i data-lucide="dollar-sign" style="width: 12px; height: 12px;"></i>
                        <span>Cobrar</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-wa-rescue').forEach(btn => {
        btn.onclick = () => {
            const phone = btn.getAttribute('data-phone');
            const name = btn.getAttribute('data-name');
            const msg = `Hola ${name}! Te saludamos de la directiva de Amarufighter 🥋. Vemos que hace un tiempo no vienes a entrenar y queremos saber si podemos apoyarte con tus horarios o membresía. ¡Nos encantaría tenerte de vuelta en el tatami!`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    });

    container.querySelectorAll('.btn-ret-pay').forEach(btn => {
        btn.onclick = () => {
            const uid = btn.getAttribute('data-uid');
            const pid = btn.getAttribute('data-planid');
            openQuickPaymentModal(uid, pid);
        };
    });

    initLucideIcons();
}

function renderMembersCommunications() {
    const segmentSelect = document.getElementById('comm-segment-select');
    const templateSelect = document.getElementById('comm-template-select');
    const messageArea = document.getElementById('comm-message-text');
    const previewContent = document.getElementById('comm-preview-content');
    const recipientsList = document.getElementById('comm-recipients-list');
    const targetBadge = document.getElementById('comm-target-badge');

    if (!segmentSelect || !messageArea) return;

    // Obtener alumnos del segmento seleccionado
    let recipients = cachedMembers;
    if (commSegment === 'active') recipients = cachedMembers.filter(m => m.membership_status === 'active');
    else if (commSegment === 'warning') recipients = cachedMembers.filter(m => m.membership_status === 'active' && m.days_left !== null && m.days_left >= 0 && m.days_left <= 5);
    else if (commSegment === 'overdue') recipients = cachedMembers.filter(m => m.membership_status === 'expired' || (m.days_left !== null && m.days_left < 0));
    else if (commSegment === 'no_attendance') recipients = cachedMembers.filter(m => m.membership_status === 'active' && m.days_since_attendance !== null && m.days_since_attendance > 14);

    if (targetBadge) targetBadge.textContent = `${recipients.length} alumnos`;

    // Plantillas de texto
    const templates = {
        custom: messageArea.value || 'Estimado {nombre}, te recordamos que en Amarufighter seguimos entrenando con la máxima intensidad. ¡Nos vemos en el tatami!',
        vencimiento: 'Hola {nombre}! Te saludamos cordialmente del dojo Amarufighter 🥋. Te recordamos que tu cuota de {plan} está próxima a vencer ({vencimiento}). Puedes renovar en caja o por transferencia bancaria.',
        comeback: 'Hola {nombre}! Hace días que no te vemos en el tatami de Amarufighter 🥋. Te extrañamos en los entrenamientos. ¿Todo bien? ¡Te esperamos con todo esta semana!',
        moroso: 'Estimado/a {nombre}, le informamos de administración de Amarufighter que su membresía {plan} se encuentra vencida. Le solicitamos regularizar a la brevedad para mantener su cupo activo.',
        seminario: '¡Atención {nombre}! Te invitamos cordialmente al próximo seminario y graduación de cinturones en Amarufighter 🥋. Confirma tu asistencia en recepción. ¡Oss!'
    };

    if (commTemplate !== 'custom' && templates[commTemplate]) {
        messageArea.value = templates[commTemplate];
    }

    // Actualizar vista previa para el primer alumno
    const sample = recipients[0] || { full_name: 'Juan Pérez', plan_name: 'Plan Mensual', membership_expiry: new Date().toISOString() };
    const sampleText = (messageArea.value || '')
        .replace(/{nombre}/g, sample.full_name || 'Atleta')
        .replace(/{plan}/g, sample.plan_name || 'Membresía')
        .replace(/{vencimiento}/g, sample.membership_expiry ? new Date(sample.membership_expiry).toLocaleDateString('es-CL') : 'Fin de mes');

    if (previewContent) previewContent.textContent = sampleText;

    // Lista de destinatarios
    if (recipientsList) {
        if (recipients.length === 0) {
            recipientsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px;">No hay alumnos en este segmento.</div>';
        } else {
            recipientsList.innerHTML = recipients.map(m => {
                const phone = m.phone ? m.phone.replace(/\D/g, '') : null;
                const personalizedMsg = (messageArea.value || '')
                    .replace(/{nombre}/g, m.full_name || m.username || 'Atleta')
                    .replace(/{plan}/g, m.plan_name || 'Membresía')
                    .replace(/{vencimiento}/g, m.membership_expiry ? new Date(m.membership_expiry).toLocaleDateString('es-CL') : 'Próxima fecha');

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; margin-bottom: 6px; font-size: 0.78rem;">
                        <div>
                            <div style="font-weight: 700; color: #fff;">${m.full_name || m.username}</div>
                            <div style="font-size: 0.68rem; color: var(--text-muted);">${m.phone ? `📞 ${m.phone}` : '📵 Sin teléfono'}</div>
                        </div>
                        <div>
                            ${phone ? `
                                <button class="btn-whatsapp-action btn-send-wa-individual" data-phone="${phone}" data-text="${encodeURIComponent(personalizedMsg)}" style="padding: 4px 8px; font-size: 0.7rem;">
                                    <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i>
                                    <span>Enviar</span>
                                </button>
                            ` : '<span style="font-size: 0.68rem; color: var(--text-muted);">No disponible</span>'}
                        </div>
                    </div>
                `;
            }).join('');

            recipientsList.querySelectorAll('.btn-send-wa-individual').forEach(btn => {
                btn.onclick = () => {
                    const phone = btn.getAttribute('data-phone');
                    const text = btn.getAttribute('data-text');
                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                };
            });
        }
    }

    initLucideIcons();
}

async function quickRenewMember(memberId) {
    if (!memberId) return;

    try {
        const member = cachedMembers.find(m => m.id === memberId);
        const now = new Date();
        let baseDate = now;

        if (member?.membership_expiry) {
            const currentExp = new Date(member.membership_expiry);
            if (currentExp > now) baseDate = currentExp;
        }

        const newExpiry = new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

        const { error } = await supabase
            .from('profiles')
            .update({
                membership_status: 'active',
                membership_expiry: newExpiry,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId);

        if (error) throw error;

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Membresía Renovada (+30 Días)',
                html: `Se renovó exitosamente a <strong>${member?.full_name || 'Socio'}</strong>.<br>Nueva fecha: ${new Date(newExpiry).toLocaleDateString('es-CL')}`,
                background: '#09090B',
                color: '#fff',
                timer: 2000,
                showConfirmButton: false
            });
        }

        await loadMembersModule();
        await loadDashboardKPIs();

    } catch (err) {
        console.error('[Admin] Error renovando membresía:', err);
        if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
    }
}

function populateDirectoryPlanFilter(plans) {
    const select = document.getElementById('dir-plan-filter');
    if (!select) return;

    select.innerHTML = '<option value="all">Todos los planes</option>' + plans.map(p => `
        <option value="${p.id}">${p.name}</option>
    `).join('');
}

function switchMembersSubTab(targetTab) {
    currentMembersSubTab = targetTab;

    document.querySelectorAll('.crm-subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mtab') === targetTab);
    });

    document.querySelectorAll('.crm-tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `mtab-content-${targetTab}`);
    });

    if (targetTab === 'dashboard') renderMembersCrmDashboard(cachedPlans);
    else if (targetTab === 'directory') renderMembersDirectory();
    else if (targetTab === 'retention') renderMembersRetention();
    else if (targetTab === 'communications') renderMembersCommunications();

    initLucideIcons();
}

function initMembersCRMUIHandlers() {
    // 1. Subpestañas
    document.querySelectorAll('.crm-subtab-btn[data-mtab]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchMembersSubTab(btn.getAttribute('data-mtab'));
        });
    });

    // 2. Refrescar y Nuevo Socio
    const btnRef = document.getElementById('btn-refresh-members');
    if (btnRef) {
        btnRef.addEventListener('click', async () => {
            btnRef.classList.add('rotating');
            await loadMembersModule();
            setTimeout(() => btnRef.classList.remove('rotating'), 600);
        });
    }

    const btnCreateMember = document.getElementById('btn-create-member');
    if (btnCreateMember) {
        btnCreateMember.addEventListener('click', () => {
            openCreateMemberModal();
        });
    }

    // 3. Directorio: Filtros y Exportación
    const dirSearch = document.getElementById('dir-search-input');
    const dirStatus = document.getElementById('dir-status-filter');
    const dirPlan = document.getElementById('dir-plan-filter');
    const btnExpDir = document.getElementById('btn-export-directory-csv');
    const btnPrevDir = document.getElementById('btn-dir-prev-page');
    const btnNextDir = document.getElementById('btn-dir-next-page');

    const updateDir = () => {
        dirFilter.search = dirSearch?.value || '';
        dirFilter.status = dirStatus?.value || 'all';
        dirFilter.plan = dirPlan?.value || 'all';
        dirCurrentPage = 1;
        renderMembersDirectory();
    };

    if (dirSearch) dirSearch.oninput = updateDir;
    if (dirStatus) dirStatus.onchange = updateDir;
    if (dirPlan) dirPlan.onchange = updateDir;
    if (btnExpDir) btnExpDir.onclick = exportMembersDirectoryCSV;

    if (btnPrevDir) {
        btnPrevDir.onclick = () => {
            if (dirCurrentPage > 1) { dirCurrentPage--; renderMembersDirectory(); }
        };
    }

    if (btnNextDir) {
        btnNextDir.onclick = () => {
            dirCurrentPage++;
            renderMembersDirectory();
        };
    }

    // 4. Retención: Píldoras de riesgo
    document.querySelectorAll('.cov-filter-pill[data-risk]').forEach(pill => {
        pill.onclick = () => {
            document.querySelectorAll('.cov-filter-pill[data-risk]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentRiskFilter = pill.getAttribute('data-risk');
            renderMembersRetention();
        };
    });

    // 5. Comunicaciones: Selectores y eventos
    const commSegSelect = document.getElementById('comm-segment-select');
    const commTplSelect = document.getElementById('comm-template-select');
    const commTextArea = document.getElementById('comm-message-text');
    const btnCopyComm = document.getElementById('btn-copy-comm-text');

    if (commSegSelect) {
        commSegSelect.onchange = () => {
            commSegment = commSegSelect.value;
            renderMembersCommunications();
        };
    }

    if (commTplSelect) {
        commTplSelect.onchange = () => {
            commTemplate = commTplSelect.value;
            renderMembersCommunications();
        };
    }

    if (commTextArea) {
        commTextArea.oninput = () => {
            commTemplate = 'custom';
            if (commTplSelect) commTplSelect.value = 'custom';
            renderMembersCommunications();
        };
    }

    if (btnCopyComm) {
        btnCopyComm.onclick = () => {
            if (commTextArea && commTextArea.value) {
                navigator.clipboard.writeText(commTextArea.value);
                if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Copiado al portapapeles', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false, background: '#09090B', color: '#fff' });
            }
        };
    }

    // 6. Modal de Edición de Socio (Directorio Maestro)
    const btnCloseEditMember = document.getElementById('btn-close-edit-member-modal');
    const btnCancelEditMember = document.getElementById('btn-cancel-edit-member-modal');
    const formEditMember = document.getElementById('edit-member-form');
    const btnToggleActiveMember = document.getElementById('btn-toggle-active-member-modal');
    const btnDeleteMemberModal = document.getElementById('btn-delete-member-modal');
    const btnDeleteDrawerMember = document.getElementById('drawer-btn-delete-member');

    if (btnCloseEditMember) btnCloseEditMember.addEventListener('click', closeEditMemberModal);
    if (btnCancelEditMember) btnCancelEditMember.addEventListener('click', closeEditMemberModal);
    if (formEditMember) formEditMember.addEventListener('submit', handleEditMemberSubmit);
    if (btnToggleActiveMember) btnToggleActiveMember.addEventListener('click', toggleMemberActiveStatus);
    if (btnDeleteMemberModal) btnDeleteMemberModal.addEventListener('click', () => deleteMemberPermanently());
    if (btnDeleteDrawerMember) btnDeleteDrawerMember.addEventListener('click', () => {
        if (adminState.activeDrawerMember) deleteMemberPermanently(adminState.activeDrawerMember.id);
    });
    const btnCreateMemberModal = document.getElementById('btn-create-member');
    if (btnCreateMemberModal) btnCreateMemberModal.addEventListener('click', openCreateMemberModal);
}

function exportMembersDirectoryCSV() {
    if (!cachedMembers || cachedMembers.length === 0) {
        if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay socios para exportar.', background: '#09090B', color: '#fff' });
        return;
    }

    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'RUT', 'Plan', 'Estado', 'Vencimiento', 'Días Restantes', 'Última Asistencia', 'Riesgo Churn'];
    const rows = cachedMembers.map(m => [
        m.id,
        m.full_name || m.username || 'Sin nombre',
        m.email || '',
        m.phone || '',
        m.rut || '',
        m.plan_name || 'Sin plan',
        m.membership_status || 'active',
        m.membership_expiry ? new Date(m.membership_expiry).toLocaleDateString('es-CL') : 'N/A',
        m.days_left !== null ? m.days_left : '',
        m.last_attendance_str || 'Sin asistencia',
        m.churn_score || 'Bajo'
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    showExportFormatDialog({
        title: 'Exportar Directorio CRM de Socios',
        pdfTitle: 'Directorio de Socios y Análisis de Retención',
        filename: `directorio_socios_amarufighter_${dateStr}`,
        headers,
        rows,
        summaryCards: [{ label: 'Total Registros', value: rows.length }]
    });
}

// ============================================================================
// MÓDULO 3: COCKPIT OPERATIVO DE PAGOS Y COBRANZA (v2.0)
// ============================================================================
let cachedPayments = [];
let cachedPlans = [];
let currentPaymentsSubTab = 'split'; // 'split' | 'table' | 'cobranza'
let activePaymentItem = null;
let paymentToReject = null;
let paymentToEdit = null;

// Filtros para la pestaña 2 (Transacciones)
const txFilter = {
    search: '',
    datePreset: 'month',
    method: 'all',
    status: ['approved', 'pending']
};
let txCurrentPage = 1;
const txItemsPerPage = 12;
let txSortField = 'created_at';
let txSortDir = 'desc';

// Filtros para la pestaña 3 (Cobranza)
let currentCobranzaFilter = 'all'; // 'all' | 'ok' | 'warning' | 'overdue' | 'none'
let cobranzaSearchQuery = '';

export async function loadPaymentsModule() {
    try {
        const [payRes, profRes, planRes] = await Promise.all([
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('membership_plans').select('*').order('price', { ascending: true })
        ]);

        if (payRes.error) throw payRes.error;

        cachedMembers = profRes.data || [];
        cachedPlans = planRes.data || [];

        // Mapear nombres de planes
        cachedPlans.forEach(p => { plansMap[p.id] = p.name; });

        // Enriquecer pagos con información del perfil
        const userMap = new Map(cachedMembers.map(m => [m.id, m]));
        cachedPayments = (payRes.data || []).map(p => {
            const member = userMap.get(p.user_id);
            return {
                ...p,
                user_display_name: p.user_name || p.username || member?.full_name || member?.email || 'Socio Amarufighter',
                user_phone: member?.phone || '',
                user_email: member?.email || '',
                user_status: member?.membership_status || 'active',
                user_expiry: member?.membership_expiry || null,
                user_profile: member || null
            };
        });

        // 1. Actualizar las 4 tarjetas de KPIs
        updatePaymentsTopKPIs();

        // 2. Renderizar la sub-pestaña actualmente activa
        if (currentPaymentsSubTab === 'split') {
            renderPaymentsSplitView();
        } else if (currentPaymentsSubTab === 'table') {
            renderPaymentsTable();
        } else if (currentPaymentsSubTab === 'cobranza') {
            renderPaymentsCobranza();
        }

        // 3. Poblar listas en modales
        populateQuickPaySelects();

        initLucideIcons();

    } catch (err) {
        console.error('[Admin] Error cargando cockpit de pagos:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ACTUALIZACIÓN DE KPIS DE CABECERA
// ─────────────────────────────────────────────────────────────────────────────
function updatePaymentsTopKPIs() {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    // Pagos del mes actual aprobados
    const currentMonthApproved = cachedPayments.filter(p => {
        if (p.status !== 'approved') return false;
        const d = new Date(p.created_at);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });

    const monthRevenueTotal = currentMonthApproved.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    // Desglose por método de pago
    let sumTransfer = 0;
    let sumCash = 0;
    let sumGateway = 0;

    currentMonthApproved.forEach(p => {
        const m = (p.payment_method || 'transferencia').toLowerCase();
        const amt = Number(p.amount) || 0;
        if (m === 'efectivo') sumCash += amt;
        else if (m === 'pasarela' || m === 'mercadopago' || m === 'webpay') sumGateway += amt;
        else sumTransfer += amt; // transferencia / manual
    });

    const fmtCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

    const elRev = document.getElementById('pkpi-month-revenue');
    const elSubT = document.getElementById('pkpi-sub-transfer');
    const elSubC = document.getElementById('pkpi-sub-cash');
    const elSubG = document.getElementById('pkpi-sub-gateway');

    if (elRev) elRev.textContent = fmtCLP(monthRevenueTotal);
    if (elSubT) elSubT.textContent = fmtCLP(sumTransfer);
    if (elSubC) elSubC.textContent = fmtCLP(sumCash);
    if (elSubG) elSubG.textContent = fmtCLP(sumGateway);

    // KPI 2: Pendientes
    const pendingList = cachedPayments.filter(p => p.status === 'pending');
    const pendingSum = pendingList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const elPendCnt = document.getElementById('pkpi-pending-count');
    const elPendAmt = document.getElementById('pkpi-pending-amount');
    const bSubPend = document.getElementById('badge-subtab-pending');

    if (elPendCnt) elPendCnt.textContent = pendingList.length;
    if (elPendAmt) elPendAmt.textContent = `${fmtCLP(pendingSum)} por revisar`;
    if (bSubPend) bSubPend.textContent = pendingList.length;

    // KPI 3: Cobertura del Mes (Socios activos con pago del mes)
    const activeMembers = cachedMembers.filter(m => m.membership_status === 'active' || m.membership_status === 'frozen');
    const totalActive = activeMembers.length || 1;

    let coveredCount = 0;
    activeMembers.forEach(m => {
        const hasPaidThisMonth = cachedPayments.some(p => {
            if (p.user_id !== m.id || p.status !== 'approved') return false;
            const pd = new Date(p.created_at);
            return pd.getFullYear() === curYear && pd.getMonth() === curMonth;
        });
        if (hasPaidThisMonth) coveredCount++;
    });

    const coveragePct = Math.round((coveredCount / totalActive) * 100);
    const elCovRatio = document.getElementById('pkpi-coverage-ratio');
    const elCovBar = document.getElementById('pkpi-coverage-bar');
    const elCovPct = document.getElementById('pkpi-coverage-pct');

    if (elCovRatio) elCovRatio.textContent = `${coveredCount} / ${activeMembers.length} socios`;
    if (elCovBar) elCovBar.style.width = `${coveragePct}%`;
    if (elCovPct) elCovPct.textContent = `${coveragePct}% de socios al día`;

    // KPI 4: Ticket Promedio y Operaciones
    const allApproved = cachedPayments.filter(p => p.status === 'approved');
    const totalApprovedAmt = allApproved.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const avgTicket = allApproved.length > 0 ? Math.round(totalApprovedAmt / allApproved.length) : 0;

    const elAvg = document.getElementById('pkpi-avg-ticket');
    const elOps = document.getElementById('pkpi-total-operations');
    const bSubTot = document.getElementById('badge-subtab-total');

    if (elAvg) elAvg.textContent = fmtCLP(avgTicket);
    if (elOps) elOps.textContent = `${cachedPayments.length} transacciones en libro`;
    if (bSubTot) bSubTot.textContent = cachedPayments.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUB-PESTAÑA 1: AUDITORÍA SPLIT-VIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderPaymentsSplitView() {
    const listContainer = document.getElementById('payments-list-container');
    if (!listContainer) return;

    const filterStatus = document.getElementById('filter-payments-status')?.value || 'pending';
    const searchQuery = (document.getElementById('split-search-input')?.value || '').toLowerCase().trim();

    let items = cachedPayments;

    if (filterStatus !== 'all') {
        items = items.filter(p => (p.status || 'pending') === filterStatus);
    }

    if (searchQuery) {
        items = items.filter(p => {
            const name = (p.user_display_name || '').toLowerCase();
            const email = (p.user_email || '').toLowerCase();
            const concept = (p.concept || '').toLowerCase();
            return name.includes(searchQuery) || email.includes(searchQuery) || concept.includes(searchQuery);
        });
    }

    if (items.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 0.82rem;">No hay pagos en esta vista.</div>';
        resetPaymentPreviewPanel();
        return;
    }

    listContainer.innerHTML = items.map(p => {
        const method = (p.payment_method || 'transferencia').toLowerCase();
        let badgeIcon = '🏦';
        let badgeLabel = 'Transferencia';
        let badgeClass = 'transferencia';

        if (method === 'efectivo') {
            badgeIcon = '💵';
            badgeLabel = 'Efectivo';
            badgeClass = 'efectivo';
        } else if (method === 'pasarela' || method === 'mercadopago' || method === 'webpay') {
            badgeIcon = '💳';
            badgeLabel = 'Digital';
            badgeClass = 'pasarela';
        }

        const dateStr = new Date(p.created_at).toLocaleDateString('es-CL');
        const formattedAmount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(p.amount || 0);
        const concept = p.concept || p.plan_name || 'Membresía Dojo';
        const isSelected = activePaymentItem && activePaymentItem.id === p.id;

        return `
            <div class="payment-item-card ${isSelected ? 'selected' : ''}" data-payment-id="${p.id}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div>
                        <div style="font-weight: 700; color: #fff; font-size: 0.88rem;">${p.user_display_name}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${concept} • ${dateStr}</div>
                    </div>
                    <span class="badge-method ${badgeClass}">${badgeIcon} ${badgeLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <span style="font-size: 1rem; font-weight: 800; color: var(--accent-emerald);">${formattedAmount}</span>
                    <span class="status-pill ${p.status || 'pending'}">${(p.status || 'pending').toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');

    // Listener de clic
    listContainer.querySelectorAll('.payment-item-card').forEach(card => {
        card.addEventListener('click', () => {
            listContainer.querySelectorAll('.payment-item-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const pid = card.getAttribute('data-payment-id');
            const payment = cachedPayments.find(x => x.id === pid);
            if (payment) selectPaymentForPreview(payment);
        });
    });

    // Auto-seleccionar primer elemento
    if (!activePaymentItem && items.length > 0) {
        selectPaymentForPreview(items[0]);
    } else if (activePaymentItem) {
        const stillInList = items.find(x => x.id === activePaymentItem.id);
        if (stillInList) selectPaymentForPreview(stillInList);
        else if (items.length > 0) selectPaymentForPreview(items[0]);
    }
}

function selectPaymentForPreview(payment) {
    activePaymentItem = payment;

    const nameEl = document.getElementById('preview-payer-name');
    const metaEl = document.getElementById('preview-payer-meta');
    const pillEl = document.getElementById('preview-status-pill');
    const amountValEl = document.getElementById('preview-amount-val');
    const btnMember = document.getElementById('btn-preview-view-member');

    const receiptBox = document.getElementById('receipt-empty-state');
    const receiptCash = document.getElementById('receipt-cash-state');
    const receiptWrapper = document.getElementById('receipt-img-wrapper');
    const receiptImg = document.getElementById('receipt-image-el');
    const btnOpenFull = document.getElementById('btn-open-receipt-full');

    const btnApprove = document.getElementById('btn-approve-current-payment');
    const btnReject = document.getElementById('btn-reject-current-payment');

    if (nameEl) nameEl.textContent = payment.user_display_name;
    const concept = payment.concept || payment.plan_name || 'Membresía Dojo';
    const coverage = payment.coverage_month ? ` • Cobertura: ${payment.coverage_month}` : '';
    if (metaEl) metaEl.textContent = `${concept}${coverage} • ${new Date(payment.created_at).toLocaleString('es-CL')}`;

    if (pillEl) {
        pillEl.className = `status-pill ${payment.status || 'pending'}`;
        pillEl.textContent = (payment.status || 'pending').toUpperCase();
    }

    if (amountValEl) {
        amountValEl.textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(payment.amount || 0);
    }

    if (btnMember && payment.user_profile) {
        btnMember.style.display = 'inline-flex';
        btnMember.onclick = () => openMemberDrawer(payment.user_profile);
    } else if (btnMember) {
        btnMember.style.display = 'none';
    }

    // Comprobante
    const method = (payment.payment_method || '').toLowerCase();
    if (method === 'efectivo') {
        if (receiptBox) receiptBox.style.display = 'none';
        if (receiptWrapper) receiptWrapper.style.display = 'none';
        if (receiptCash) receiptCash.style.display = 'block';
    } else if (payment.receipt_url) {
        if (receiptBox) receiptBox.style.display = 'none';
        if (receiptCash) receiptCash.style.display = 'none';
        if (receiptWrapper) receiptWrapper.style.display = 'flex';
        if (receiptImg) receiptImg.src = payment.receipt_url;
        if (btnOpenFull) {
            btnOpenFull.onclick = () => window.open(payment.receipt_url, '_blank');
        }
    } else {
        if (receiptCash) receiptCash.style.display = 'none';
        if (receiptWrapper) receiptWrapper.style.display = 'none';
        if (receiptBox) receiptBox.style.display = 'block';
    }

    // Botones de auditoría
    const isPending = (payment.status === 'pending');
    if (btnApprove) btnApprove.disabled = !isPending;
    if (btnReject) btnReject.disabled = !isPending;

    // Ficha de metadatos de auditoría
    const detailConcept = document.getElementById('audit-detail-concept');
    const detailMethod = document.getElementById('audit-detail-method');
    const detailDate = document.getElementById('audit-detail-date');
    const detailStatus = document.getElementById('audit-detail-member-status');

    if (detailConcept) detailConcept.textContent = concept;
    if (detailMethod) detailMethod.textContent = (payment.payment_method || 'transferencia').toUpperCase();
    if (detailDate) detailDate.textContent = new Date(payment.created_at).toLocaleString('es-CL');
    if (detailStatus) {
        const memStatus = payment.user_profile?.membership_status || 'activo';
        detailStatus.textContent = memStatus.toUpperCase();
    }
}

function resetPaymentPreviewPanel() {
    activePaymentItem = null;
    const nameEl = document.getElementById('preview-payer-name');
    const metaEl = document.getElementById('preview-payer-meta');
    const amountValEl = document.getElementById('preview-amount-val');
    const receiptBox = document.getElementById('receipt-empty-state');
    const receiptCash = document.getElementById('receipt-cash-state');
    const receiptWrapper = document.getElementById('receipt-img-wrapper');
    const btnApprove = document.getElementById('btn-approve-current-payment');
    const btnReject = document.getElementById('btn-reject-current-payment');

    const detailConcept = document.getElementById('audit-detail-concept');
    const detailMethod = document.getElementById('audit-detail-method');
    const detailDate = document.getElementById('audit-detail-date');
    const detailStatus = document.getElementById('audit-detail-member-status');

    if (nameEl) nameEl.textContent = 'Selecciona un comprobante';
    if (metaEl) metaEl.textContent = 'Haz clic en un ítem de la lista para auditar';
    if (amountValEl) amountValEl.textContent = '$0';
    if (receiptCash) receiptCash.style.display = 'none';
    if (receiptWrapper) receiptWrapper.style.display = 'none';
    if (receiptBox) receiptBox.style.display = 'block';
    if (btnApprove) btnApprove.disabled = true;
    if (btnReject) btnReject.disabled = true;

    if (detailConcept) detailConcept.textContent = '-';
    if (detailMethod) detailMethod.textContent = '-';
    if (detailDate) detailDate.textContent = '-';
    if (detailStatus) detailStatus.textContent = '-';
}

// Aprobación con Renovación Automática de Membresía
async function approvePaymentAndRenew(payment) {
    if (!payment) return;

    try {
        // 1. Actualizar estado del pago a 'approved'
        const { error: errPay } = await supabase
            .from('payments')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', payment.id);

        if (errPay) throw errPay;

        // 2. Renovar la membresía en profiles (+30 días)
        if (payment.user_id) {
            const member = cachedMembers.find(m => m.id === payment.user_id);
            const now = new Date();
            let baseDate = now;

            if (member?.membership_expiry) {
                const currentExp = new Date(member.membership_expiry);
                if (currentExp > now) baseDate = currentExp;
            }

            const newExpiry = new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

            await supabase
                .from('profiles')
                .update({
                    membership_status: 'active',
                    membership_expiry: newExpiry,
                    updated_at: new Date().toISOString()
                })
                .eq('id', payment.user_id);
        }

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Pago Aprobado y Membresía Renovada',
                html: `Se acreditó el pago de <strong>${payment.user_display_name}</strong>.<br><span style="color:#10b981;">Membresía extendida +30 días con éxito.</span>`,
                background: '#09090B',
                color: '#fff',
                timer: 2200,
                showConfirmButton: false
            });
        }

        await loadPaymentsModule();
        await loadDashboardKPIs();

    } catch (err) {
        console.error('[Admin] Error aprobando pago:', err);
        if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SUB-PESTAÑA 2: LIBRO DE TRANSACCIONES
// ─────────────────────────────────────────────────────────────────────────────
function renderPaymentsTable() {
    const tableBody = document.getElementById('tx-table-body');
    const paginationInfo = document.getElementById('tx-pagination-info');
    const btnPrev = document.getElementById('btn-tx-prev-page');
    const btnNext = document.getElementById('btn-tx-next-page');

    if (!tableBody) return;

    // Aplicar filtros
    let list = cachedPayments.filter(p => {
        // Estado
        if (!txFilter.status.includes(p.status || 'pending')) return false;

        // Método
        if (txFilter.method !== 'all') {
            const m = (p.payment_method || 'transferencia').toLowerCase();
            if (txFilter.method === 'transferencia' && m !== 'transferencia' && m !== 'manual') return false;
            if (txFilter.method === 'efectivo' && m !== 'efectivo') return false;
            if (txFilter.method === 'pasarela' && m !== 'pasarela' && m !== 'mercadopago' && m !== 'webpay') return false;
        }

        // Rango de fechas
        if (txFilter.datePreset !== 'all') {
            const d = new Date(p.created_at);
            const now = new Date();
            if (txFilter.datePreset === 'today') {
                if (d.toDateString() !== now.toDateString()) return false;
            } else if (txFilter.datePreset === 'week') {
                const diffTime = Math.abs(now - d);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 7) return false;
            } else if (txFilter.datePreset === 'month') {
                if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return false;
            } else if (txFilter.datePreset === 'prevmonth') {
                const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                if (d.getFullYear() !== prevYear || d.getMonth() !== prevMonth) return false;
            }
        }

        // Búsqueda
        if (txFilter.search) {
            const term = txFilter.search.toLowerCase();
            const name = (p.user_display_name || '').toLowerCase();
            const email = (p.user_email || '').toLowerCase();
            const concept = (p.concept || '').toLowerCase();
            return name.includes(term) || email.includes(term) || concept.includes(term);
        }

        return true;
    });

    // Paginación
    const totalRows = list.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / txItemsPerPage));
    txCurrentPage = Math.min(txCurrentPage, totalPages);
    const startIndex = (txCurrentPage - 1) * txItemsPerPage;
    const pageRows = list.slice(startIndex, startIndex + txItemsPerPage);

    if (paginationInfo) {
        paginationInfo.textContent = `Mostrando ${startIndex + 1} - ${Math.min(startIndex + txItemsPerPage, totalRows)} de ${totalRows} transacciones`;
    }
    if (btnPrev) btnPrev.disabled = (txCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (txCurrentPage >= totalPages);

    if (pageRows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 35px;">No hay transacciones que coincidan con los filtros aplicados.</td></tr>';
        return;
    }

    tableBody.innerHTML = pageRows.map(p => {
        const method = (p.payment_method || 'transferencia').toLowerCase();
        let badgeIcon = '🏦';
        let badgeLabel = 'Transferencia';
        let badgeClass = 'transferencia';

        if (method === 'efectivo') {
            badgeIcon = '💵';
            badgeLabel = 'Efectivo';
            badgeClass = 'efectivo';
        } else if (method === 'pasarela' || method === 'mercadopago' || method === 'webpay') {
            badgeIcon = '💳';
            badgeLabel = 'Digital';
            badgeClass = 'pasarela';
        }

        const dateStr = new Date(p.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
        const formattedAmount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(p.amount || 0);

        return `
            <tr>
                <td style="font-size: 0.78rem; color: var(--text-muted);">${dateStr}</td>
                <td>
                    <div style="font-weight: 700; color: #fff;">${p.user_display_name}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${p.user_email || 'Sin correo'}</div>
                </td>
                <td style="font-size: 0.82rem; color: #fff;">${p.concept || p.plan_name || 'Membresía'}</td>
                <td style="text-align: right; font-weight: 800; color: var(--accent-emerald);">${formattedAmount}</td>
                <td><span class="badge-method ${badgeClass}">${badgeIcon} ${badgeLabel}</span></td>
                <td><span class="status-pill ${p.status || 'pending'}">${(p.status || 'pending').toUpperCase()}</span></td>
                <td style="font-size: 0.78rem; color: var(--text-secondary);">${p.coverage_month || '—'}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-secondary-action btn-tx-inspect" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.72rem;" title="Auditar en Split-View">
                        <i data-lucide="eye" style="width: 12px; height: 12px;"></i>
                    </button>
                    <button class="btn-secondary-action btn-tx-edit" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.72rem;" title="Corregir monto">
                        <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Listeners de acciones de tabla
    tableBody.querySelectorAll('.btn-tx-inspect').forEach(b => {
        b.onclick = () => {
            const id = b.getAttribute('data-id');
            const item = cachedPayments.find(x => x.id === id);
            if (item) {
                switchPaymentsSubTab('split');
                selectPaymentForPreview(item);
            }
        };
    });

    tableBody.querySelectorAll('.btn-tx-edit').forEach(b => {
        b.onclick = () => {
            const id = b.getAttribute('data-id');
            const item = cachedPayments.find(x => x.id === id);
            if (item) openEditAmountModal(item);
        };
    });

    initLucideIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUB-PESTAÑA 3: COBRANZA Y MOROSIDAD DEL MES
// ─────────────────────────────────────────────────────────────────────────────
function renderPaymentsCobranza() {
    const container = document.getElementById('cobranza-list-container');
    if (!container) return;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    // Cruzar los socios registrados con sus pagos
    const activeProfiles = cachedMembers.filter(m => m.membership_status === 'active' || m.membership_status === 'frozen' || m.membership_status === 'inactive');

    const counts = { all: 0, ok: 0, warning: 0, overdue: 0, none: 0 };

    const cobranzaItems = activeProfiles.map(prof => {
        // Buscar último pago aprobado
        const userPayments = cachedPayments
            .filter(p => p.user_id === prof.id && p.status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const lastPayment = userPayments[0] || null;

        let status = 'none';
        let statusLabel = 'Sin registro';

        // 1. ¿Tiene pago aprobado de este mes?
        const hasPaidThisMonth = userPayments.some(p => {
            const d = new Date(p.created_at);
            return d.getFullYear() === curYear && d.getMonth() === curMonth;
        });

        if (hasPaidThisMonth) {
            status = 'ok';
            statusLabel = 'Al día';
        } else if (prof.membership_expiry) {
            const expiry = new Date(prof.membership_expiry);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 5) {
                status = 'warning';
                statusLabel = `Vence en ${daysLeft} d`;
            } else if (daysLeft <= 0) {
                status = 'overdue';
                statusLabel = `Vencido (${Math.abs(daysLeft)} d)`;
            } else {
                status = 'warning';
                statusLabel = 'Pendiente cuota';
            }
        }

        counts.all++;
        counts[status] = (counts[status] || 0) + 1;

        const planName = plansMap[prof.membership_plan_id] || (prof.membership_plan_name || 'Plan General');

        return {
            profile: prof,
            status,
            statusLabel,
            lastPayment,
            planName
        };
    });

    // Actualizar contadores en píldoras
    const setCnt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setCnt('cov-cnt-all', counts.all);
    setCnt('cov-cnt-ok', counts.ok);
    setCnt('cov-cnt-warning', counts.warning);
    setCnt('cov-cnt-overdue', counts.overdue);
    setCnt('cov-cnt-none', counts.none);

    const bSubOverdue = document.getElementById('badge-subtab-overdue');
    if (bSubOverdue) bSubOverdue.textContent = counts.overdue;

    // Filtrar lista
    let filtered = cobranzaItems;
    if (currentCobranzaFilter !== 'all') {
        filtered = filtered.filter(x => x.status === currentCobranzaFilter);
    }

    if (cobranzaSearchQuery) {
        filtered = filtered.filter(x => {
            const n = (x.profile.full_name || x.profile.username || '').toLowerCase();
            const e = (x.profile.email || '').toLowerCase();
            return n.includes(cobranzaSearchQuery) || e.includes(cobranzaSearchQuery);
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 0.85rem;">No hay alumnos en esta categoría de cobranza.</div>';
        return;
    }

    container.innerHTML = filtered.map(item => {
        const p = item.profile;
        const initial = (p.full_name || p.username || 'A')[0].toUpperCase();
        const lastPayAmt = item.lastPayment ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.lastPayment.amount || 0) : 'Sin pagos';
        const lastPayDate = item.lastPayment ? new Date(item.lastPayment.created_at).toLocaleDateString('es-CL') : '—';
        const phone = p.phone ? p.phone.replace(/\D/g, '') : null;

        return `
            <div class="cobranza-student-card ${item.status}">
                <div class="table-avatar" style="width: 40px; height: 40px; font-size: 0.95rem;">${initial}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong style="font-size: 0.92rem; color: #fff;">${p.full_name || p.username || 'Alumno'}</strong>
                        <span class="status-pill ${item.status}">${item.statusLabel}</span>
                        <span style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 600;">${item.planName}</span>
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                        ${p.phone ? `📞 ${p.phone}` : '📵 Sin teléfono registrado'} • Vencimiento: ${p.membership_expiry ? new Date(p.membership_expiry).toLocaleDateString('es-CL') : 'Sin fecha'}
                    </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                    <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Último Pago</div>
                    <div style="font-weight: 700; color: #fff; font-size: 0.85rem;">${lastPayAmt}</div>
                    <div style="font-size: 0.68rem; color: var(--text-muted);">${lastPayDate}</div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    ${phone ? `
                        <button class="btn-whatsapp-action btn-wa-notify" data-phone="${phone}" data-name="${p.full_name || 'Alumno'}" data-plan="${item.planName}" data-date="${p.membership_expiry ? new Date(p.membership_expiry).toLocaleDateString('es-CL') : 'próxima fecha'}">
                            <i data-lucide="message-circle" style="width: 13px; height: 13px;"></i>
                            <span>WhatsApp</span>
                        </button>
                    ` : ''}
                    <button class="btn-quickpay-action btn-quick-pay-student" data-uid="${p.id}" data-planid="${p.membership_plan_id || ''}">
                        <i data-lucide="dollar-sign" style="width: 13px; height: 13px;"></i>
                        <span>Registrar Pago</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Listeners WhatsApp
    container.querySelectorAll('.btn-wa-notify').forEach(btn => {
        btn.onclick = () => {
            const phone = btn.getAttribute('data-phone');
            const name = btn.getAttribute('data-name');
            const plan = btn.getAttribute('data-plan');
            const date = btn.getAttribute('data-date');
            const msg = `Hola ${name}! Te saludamos del dojo Amarufighter 🥋. Te recordamos cordialmente que tu cuota de ${plan} vence el ${date}. Si ya realizaste tu transferencia bancaria, por favor envíanos tu comprobante o súbelo en la app. ¡Nos vemos en el tatami!`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    });

    // Listeners Registrar Pago Rápido
    container.querySelectorAll('.btn-quick-pay-student').forEach(btn => {
        btn.onclick = () => {
            const uid = btn.getAttribute('data-uid');
            const planId = btn.getAttribute('data-planid');
            openQuickPaymentModal(uid, planId);
        };
    });

    initLucideIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MODALES Y EVENT HANDLERS DE PAGOS
// ─────────────────────────────────────────────────────────────────────────────
function switchPaymentsSubTab(targetTab) {
    currentPaymentsSubTab = targetTab;

    document.querySelectorAll('.payments-subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-ptab') === targetTab);
    });

    document.querySelectorAll('.payments-tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `ptab-content-${targetTab}`);
    });

    if (targetTab === 'split') renderPaymentsSplitView();
    else if (targetTab === 'table') renderPaymentsTable();
    else if (targetTab === 'cobranza') renderPaymentsCobranza();

    initLucideIcons();
}

function initPaymentsUIHandlers() {
    // 1. Sub-pestañas
    document.querySelectorAll('.payments-subtab-btn[data-ptab]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchPaymentsSubTab(btn.getAttribute('data-ptab'));
        });
    });

    // 2. Refrescar pagos
    const btnRef = document.getElementById('btn-refresh-payments');
    if (btnRef) {
        btnRef.addEventListener('click', async () => {
            btnRef.classList.add('rotating');
            await loadPaymentsModule();
            setTimeout(() => btnRef.classList.remove('rotating'), 600);
        });
    }

    // 3. Botón Superior: Registrar Pago Presencial
    const btnOpenQP = document.getElementById('btn-open-quick-payment');
    if (btnOpenQP) {
        btnOpenQP.addEventListener('click', () => openQuickPaymentModal());
    }

    // 4. Split-view: Filtros y búsqueda
    const filterStatus = document.getElementById('filter-payments-status');
    const searchSplit = document.getElementById('split-search-input');
    if (filterStatus) filterStatus.onchange = () => renderPaymentsSplitView();
    if (searchSplit) searchSplit.oninput = () => renderPaymentsSplitView();

    // 5. Split-view: Botones Aprobar / Rechazar
    const btnApprove = document.getElementById('btn-approve-current-payment');
    const btnReject = document.getElementById('btn-reject-current-payment');

    if (btnApprove) {
        btnApprove.onclick = () => {
            if (activePaymentItem) approvePaymentAndRenew(activePaymentItem);
        };
    }

    if (btnReject) {
        btnReject.onclick = () => {
            if (activePaymentItem) openRejectPaymentModal(activePaymentItem);
        };
    }

    // 6. Transacciones: Filtros reactivos
    const txSearch = document.getElementById('tx-search-input');
    const txDate = document.getElementById('tx-date-preset');
    const txMethod = document.getElementById('tx-method-filter');
    const chkApp = document.getElementById('tx-chk-approved');
    const chkPend = document.getElementById('tx-chk-pending');
    const chkRej = document.getElementById('tx-chk-rejected');
    const btnClear = document.getElementById('btn-clear-tx-filters');
    const btnExport = document.getElementById('btn-export-tx-csv');
    const btnPrevPage = document.getElementById('btn-tx-prev-page');
    const btnNextPage = document.getElementById('btn-tx-next-page');

    const updateTxFilters = () => {
        txFilter.search = txSearch?.value || '';
        txFilter.datePreset = txDate?.value || 'all';
        txFilter.method = txMethod?.value || 'all';
        txFilter.status = [];
        if (chkApp?.checked) txFilter.status.push('approved');
        if (chkPend?.checked) txFilter.status.push('pending');
        if (chkRej?.checked) txFilter.status.push('rejected');
        txCurrentPage = 1;
        renderPaymentsTable();
    };

    if (txSearch) txSearch.oninput = updateTxFilters;
    if (txDate) txDate.onchange = updateTxFilters;
    if (txMethod) txMethod.onchange = updateTxFilters;
    if (chkApp) chkApp.onchange = updateTxFilters;
    if (chkPend) chkPend.onchange = updateTxFilters;
    if (chkRej) chkRej.onchange = updateTxFilters;

    if (btnClear) {
        btnClear.onclick = () => {
            if (txSearch) txSearch.value = '';
            if (txDate) txDate.value = 'all';
            if (txMethod) txMethod.value = 'all';
            if (chkApp) chkApp.checked = true;
            if (chkPend) chkPend.checked = true;
            if (chkRej) chkRej.checked = false;
            updateTxFilters();
        };
    }

    if (btnExport) btnExport.onclick = exportFilteredTransactionsCSV;

    if (btnPrevPage) {
        btnPrevPage.onclick = () => {
            if (txCurrentPage > 1) { txCurrentPage--; renderPaymentsTable(); }
        };
    }
    if (btnNextPage) {
        btnNextPage.onclick = () => {
            txCurrentPage++;
            renderPaymentsTable();
        };
    }

    // 7. Cobranza: Píldoras de filtro y búsqueda
    document.querySelectorAll('.cov-filter-pill[data-cov]').forEach(pill => {
        pill.onclick = () => {
            document.querySelectorAll('.cov-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCobranzaFilter = pill.getAttribute('data-cov');
            renderPaymentsCobranza();
        };
    });

    const cobranzaSearch = document.getElementById('cobranza-search-input');
    if (cobranzaSearch) {
        cobranzaSearch.oninput = () => {
            cobranzaSearchQuery = cobranzaSearch.value.toLowerCase().trim();
            renderPaymentsCobranza();
        };
    }

    // 8. Inicializar Modales
    initQuickPaymentModalHandlers();
    initRejectPaymentModalHandlers();
    initEditAmountModalHandlers();
}

function exportFilteredTransactionsCSV() {
    if (!cachedPayments || cachedPayments.length === 0) {
        if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay transacciones para exportar.', background: '#09090B', color: '#fff' });
        return;
    }

    const headers = ['ID', 'Fecha / Hora', 'Alumno', 'Email', 'Concepto', 'Monto ($)', 'Método', 'Estado', 'Mes Cobertura'];
    const rows = cachedPayments.map(p => [
        p.id,
        new Date(p.created_at).toLocaleString('es-CL'),
        p.user_display_name || 'Socio',
        p.user_email || '',
        p.concept || p.plan_name || 'Membresía',
        p.amount ? `$${Number(p.amount).toLocaleString('es-CL')}` : '$0',
        p.payment_method || 'transferencia',
        p.status || 'pending',
        p.coverage_month || ''
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    showExportFormatDialog({
        title: 'Exportar Transacciones de Pago',
        pdfTitle: 'Libro Operativo de Pagos y Cobranza',
        filename: `transacciones_amarufighter_${dateStr}`,
        headers,
        rows,
        summaryCards: [{ label: 'Total Transacciones', value: rows.length }]
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MODAL: REGISTRO RÁPIDO PRESENCIAL
// ─────────────────────────────────────────────────────────────────────────────
function populateQuickPaySelects() {
    const userSelect = document.getElementById('qp-input-user');
    const planSelect = document.getElementById('qp-input-plan');
    const covInput = document.getElementById('qp-input-coverage');

    if (userSelect && cachedMembers.length > 0) {
        userSelect.innerHTML = '<option value="">Selecciona un socio...</option>' + cachedMembers.map(m => `
            <option value="${m.id}">${m.full_name || m.username || 'Sin nombre'} (${m.email || 'Sin email'})</option>
        `).join('');
    }

    if (planSelect && cachedPlans.length > 0) {
        planSelect.innerHTML = '<option value="">Selecciona plan...</option>' + cachedPlans.map(p => `
            <option value="${p.id}" data-price="${p.price}" data-name="${p.name}">${p.name} — $${p.price.toLocaleString('es-CL')}</option>
        `).join('');
    }

    if (covInput && !covInput.value) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const now = new Date();
        covInput.value = `${months[now.getMonth()]} ${now.getFullYear()}`;
    }
}

function openQuickPaymentModal(preselectedUserId = null, preselectedPlanId = null) {
    const modal = document.getElementById('quick-pay-modal-overlay');
    if (!modal) return;

    populateQuickPaySelects();

    const userSelect = document.getElementById('qp-input-user');
    const planSelect = document.getElementById('qp-input-plan');
    const amountInput = document.getElementById('qp-input-amount');
    const conceptInput = document.getElementById('qp-input-concept');

    if (preselectedUserId && userSelect) {
        userSelect.value = preselectedUserId;
    }

    if (preselectedPlanId && planSelect) {
        planSelect.value = preselectedPlanId;
        const opt = planSelect.options[planSelect.selectedIndex];
        if (opt) {
            if (amountInput) amountInput.value = opt.getAttribute('data-price') || '';
            if (conceptInput) conceptInput.value = `Pago ${opt.getAttribute('data-name') || 'Membresía'}`;
        }
    }

    modal.classList.add('open');
}

function initQuickPaymentModalHandlers() {
    const modal = document.getElementById('quick-pay-modal-overlay');
    const btnClose = document.getElementById('btn-close-quick-pay-modal');
    const btnCancel = document.getElementById('btn-cancel-quick-pay-modal');
    const form = document.getElementById('quick-pay-form');
    const planSelect = document.getElementById('qp-input-plan');
    const amountInput = document.getElementById('qp-input-amount');
    const conceptInput = document.getElementById('qp-input-concept');

    if (btnClose && modal) btnClose.onclick = () => modal.classList.remove('open');
    if (btnCancel && modal) btnCancel.onclick = () => modal.classList.remove('open');

    if (planSelect) {
        planSelect.onchange = () => {
            const opt = planSelect.options[planSelect.selectedIndex];
            if (opt) {
                if (amountInput) amountInput.value = opt.getAttribute('data-price') || '';
                if (conceptInput) conceptInput.value = `Pago ${opt.getAttribute('data-name') || 'Membresía'}`;
            }
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const userId = document.getElementById('qp-input-user')?.value;
            const amount = Number(amountInput?.value) || 0;
            const method = document.getElementById('qp-input-method')?.value || 'efectivo';
            const coverage = document.getElementById('qp-input-coverage')?.value || '';
            const concept = conceptInput?.value || 'Pago Mensualidad';
            const autoRenew = document.getElementById('qp-input-auto-renew')?.checked;

            try {
                const newId = 'p' + Date.now();

                // 1. Insertar pago aprobado en Supabase
                const { error: pErr } = await supabase.from('payments').insert([{
                    id: newId,
                    user_id: userId,
                    amount,
                    currency: 'CLP',
                    concept,
                    payment_method: method,
                    status: 'approved',
                    coverage_month: coverage,
                    created_at: new Date().toISOString()
                }]);

                if (pErr) throw pErr;

                // 2. Renovar socio si aplica
                if (autoRenew && userId) {
                    const member = cachedMembers.find(m => m.id === userId);
                    const now = new Date();
                    let base = now;
                    if (member?.membership_expiry) {
                        const cur = new Date(member.membership_expiry);
                        if (cur > now) base = cur;
                    }
                    const newExpiry = new Date(base.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

                    await supabase.from('profiles').update({
                        membership_status: 'active',
                        membership_expiry: newExpiry,
                        updated_at: new Date().toISOString()
                    }).eq('id', userId);
                }

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Pago Registrado con Éxito',
                        text: `Se registraron $${amount.toLocaleString('es-CL')} correctamente.`,
                        background: '#09090B',
                        color: '#fff',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }

                modal.classList.remove('open');
                form.reset();

                await loadPaymentsModule();
                await loadDashboardKPIs();

            } catch (err) {
                console.error('[Admin] Error registrando pago presencial:', err);
                if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
            }
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MODALES: RECHAZO Y EDICIÓN DE MONTO
// ─────────────────────────────────────────────────────────────────────────────
function openRejectPaymentModal(payment) {
    paymentToReject = payment;
    const modal = document.getElementById('reject-pay-modal-overlay');
    if (modal) modal.classList.add('open');
}

function initRejectPaymentModalHandlers() {
    const modal = document.getElementById('reject-pay-modal-overlay');
    const btnClose = document.getElementById('btn-close-reject-pay-modal');
    const btnCancel = document.getElementById('btn-cancel-reject-pay-modal');
    const form = document.getElementById('reject-pay-form');
    const preset = document.getElementById('reject-reason-preset');
    const reasonText = document.getElementById('reject-reason-text');

    if (btnClose && modal) btnClose.onclick = () => modal.classList.remove('open');
    if (btnCancel && modal) btnCancel.onclick = () => modal.classList.remove('open');

    if (preset && reasonText) {
        preset.onchange = () => {
            if (preset.value !== 'otro') reasonText.value = preset.value;
            else reasonText.value = '';
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (!paymentToReject) return;

            const reason = reasonText?.value || preset?.value || 'Comprobante rechazado por administración.';

            try {
                const { error } = await supabase
                    .from('payments')
                    .update({
                        status: 'rejected',
                        concept: `${paymentToReject.concept || 'Membresía'} [Rechazado: ${reason}]`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', paymentToReject.id);

                if (error) throw error;

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'info',
                        title: 'Comprobante Rechazado',
                        text: 'El pago ha sido marcado como rechazado.',
                        background: '#09090B',
                        color: '#fff',
                        timer: 1800,
                        showConfirmButton: false
                    });
                }

                modal.classList.remove('open');
                form.reset();
                paymentToReject = null;

                await loadPaymentsModule();
                await loadDashboardKPIs();

            } catch (err) {
                console.error('[Admin] Error rechazando pago:', err);
                if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
            }
        };
    }
}

function openEditAmountModal(payment) {
    paymentToEdit = payment;
    const modal = document.getElementById('edit-amount-modal-overlay');
    const dispEl = document.getElementById('edit-current-amount-display');
    const inputEl = document.getElementById('edit-new-amount-input');

    if (dispEl) dispEl.value = `$${(Number(payment.amount) || 0).toLocaleString('es-CL')}`;
    if (inputEl) inputEl.value = payment.amount || '';
    if (modal) modal.classList.add('open');
}

function initEditAmountModalHandlers() {
    const modal = document.getElementById('edit-amount-modal-overlay');
    const btnClose = document.getElementById('btn-close-edit-amount-modal');
    const btnCancel = document.getElementById('btn-cancel-edit-amount-modal');
    const form = document.getElementById('edit-amount-form');
    const newAmtInput = document.getElementById('edit-new-amount-input');
    const reasonInput = document.getElementById('edit-amount-reason-input');

    if (btnClose && modal) btnClose.onclick = () => modal.classList.remove('open');
    if (btnCancel && modal) btnCancel.onclick = () => modal.classList.remove('open');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (!paymentToEdit) return;

            const newAmount = Number(newAmtInput?.value) || 0;
            const reason = reasonInput?.value || 'Corrección de monto';

            try {
                const { error } = await supabase
                    .from('payments')
                    .update({
                        amount: newAmount,
                        concept: `${paymentToEdit.concept || 'Membresía'} [Corregido: ${reason}]`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', paymentToEdit.id);

                if (error) throw error;

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Monto Corregido',
                        text: `El nuevo monto es $${newAmount.toLocaleString('es-CL')}.`,
                        background: '#09090B',
                        color: '#fff',
                        timer: 1800,
                        showConfirmButton: false
                    });
                }

                modal.classList.remove('open');
                form.reset();
                paymentToEdit = null;

                await loadPaymentsModule();
                await loadDashboardKPIs();

            } catch (err) {
                console.error('[Admin] Error editando monto:', err);
                if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#09090B', color: '#fff' });
            }
        };
    }
}

// ============================================================================
// MÓDULO 4: GESTIÓN DE PLANES Y TARIFAS (CON ANALÍTICA Y GRÁFICOS)
// ============================================================================
let cachedRawPlans = [];
let plansDistributionChartInstance = null;
let plansRevenueChartInstance = null;

export async function loadPlansGrid() {
    const container = document.getElementById('plans-grid-container');
    if (!container) return;

    try {
        const [plansRes, profilesRes, paymentsRes] = await Promise.all([
            supabase.from('membership_plans').select('*').order('price', { ascending: true }),
            supabase.from('profiles').select('id, full_name, membership_plan_id, plan_name, membership_status'),
            supabase.from('payments').select('id, amount, concept, plan_name, status').eq('status', 'approved')
        ]);

        if (plansRes.error) throw plansRes.error;

        const plans = plansRes.data || [];
        const profiles = profilesRes.data || [];
        const payments = paymentsRes.data || [];
        cachedRawPlans = plans;

        if (plans.length === 0) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No hay planes configurados en la base de datos.</div>';
            return;
        }

        // Calcular métricas de cada plan
        const planStats = plans.map(plan => {
            const planNameLower = (plan.name || '').toLowerCase();
            // Socios asignados a este plan
            const assignedMembers = profiles.filter(p => 
                p.membership_plan_id === plan.id || 
                (p.plan_name && p.plan_name.toLowerCase() === planNameLower)
            );
            // Recaudación histórica / acumulada de este plan
            const planPayments = payments.filter(p => {
                const concept = (p.concept || p.plan_name || '').toLowerCase();
                return concept.includes(planNameLower);
            });
            const totalRevenue = planPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

            return {
                ...plan,
                memberCount: assignedMembers.length,
                totalRevenue
            };
        });

        // Encontrar plan más popular y con mayor recaudación
        const sortedByMembers = [...planStats].sort((a, b) => b.memberCount - a.memberCount);
        const sortedByRevenue = [...planStats].sort((a, b) => b.totalRevenue - a.totalRevenue);

        const popularPlan = sortedByMembers[0] || null;
        const revenuePlan = sortedByRevenue[0] || null;
        const totalMembersInPlans = planStats.reduce((acc, p) => acc + p.memberCount, 0);

        // Actualizar KPIs de Membresías en DOM
        const popularEl = document.getElementById('plans-kpi-popular');
        const popularSubEl = document.getElementById('plans-kpi-popular-sub');
        if (popularEl && popularPlan) {
            popularEl.textContent = popularPlan.name;
            const pct = totalMembersInPlans > 0 ? ((popularPlan.memberCount / totalMembersInPlans) * 100).toFixed(0) : 0;
            if (popularSubEl) popularSubEl.textContent = `${popularPlan.memberCount} socios (${pct}% del total)`;
        }

        const revKpiEl = document.getElementById('plans-kpi-revenue');
        const revKpiSubEl = document.getElementById('plans-kpi-revenue-sub');
        if (revKpiEl && revenuePlan) {
            revKpiEl.textContent = revenuePlan.name;
            if (revKpiSubEl) revKpiSubEl.textContent = `$${revenuePlan.totalRevenue.toLocaleString('es-CL')} recaudados`;
        }

        const totalKpiEl = document.getElementById('plans-kpi-total-members');
        if (totalKpiEl) {
            totalKpiEl.textContent = totalMembersInPlans;
        }

        // Renderizar Gráficos de Membresías
        renderPlansAnalyticsCharts(planStats);

        // Renderizar Catálogo de Planes
        container.innerHTML = planStats.map(plan => {
            const formattedPrice = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(plan.price || 0);
            const classesLimit = plan.monthly ? `${plan.monthly} clases/mes` : (plan.limit ? `${plan.limit} clases/día` : 'Ilimitadas');
            const isTop = popularPlan && popularPlan.id === plan.id && popularPlan.memberCount > 0;

            return `
                <div class="glass-card" style="display: flex; flex-direction: column; position: relative;">
                    <div class="card-header-row">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="card-label" style="text-transform: uppercase; font-weight: 700; color: #FFFFFF;">${plan.name}</span>
                            ${isTop ? '<span class="plan-stat-badge star"><i data-lucide="star" style="width: 11px; height: 11px;"></i> Más Elegido</span>' : ''}
                        </div>
                        <div class="card-icon-box red">
                            <i data-lucide="award"></i>
                        </div>
                    </div>
                    <div class="card-value" style="font-size: 1.6rem; color: #fff; margin: 10px 0;">${formattedPrice}</div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 14px; flex: 1;">${plan.description || 'Acceso al dojo según modalidad seleccionada.'}</p>
                    
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Límite de clases:</span>
                            <span style="font-weight: 600; color: #fff;">${classesLimit}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Socios activos:</span>
                            <span style="font-weight: 700; color: var(--accent-emerald);">${plan.memberCount} alumnos</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Total aportado:</span>
                            <span style="font-weight: 700; color: var(--accent-gold);">$${plan.totalRevenue.toLocaleString('es-CL')}</span>
                        </div>
                    </div>

                    <div class="plan-card-footer-actions">
                        <button type="button" class="btn-primary-action btn-edit-plan" data-plan-id="${plan.id}" style="flex: 1; justify-content: center; font-size: 0.78rem; padding: 8px 10px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-glass);">
                            <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                            <span>Editar Tarifa</span>
                        </button>
                        <button type="button" class="btn-icon-sm danger btn-delete-plan" data-plan-id="${plan.id}" data-plan-name="${plan.name}" title="Eliminar plan">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Listeners para editar y eliminar planes
        container.querySelectorAll('.btn-edit-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.currentTarget.dataset.planId;
                openEditPlanModal(planId);
            });
        });

        container.querySelectorAll('.btn-delete-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.currentTarget.dataset.planId;
                const planName = e.currentTarget.dataset.planName;
                confirmDeletePlan(planId, planName);
            });
        });

        initLucideIcons();
    } catch (err) {
        console.error('[Admin] Error cargando planes:', err);
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--primary); padding: 30px;">Error al cargar planes: ${err.message}</div>`;
    }
}

function renderPlansAnalyticsCharts(planStats) {
    if (!window.Chart) return;

    // Gráfico 1: Donut de Distribución de Socios
    const canvasDist = document.getElementById('chart-plans-distribution');
    if (canvasDist) {
        if (plansDistributionChartInstance) {
            plansDistributionChartInstance.destroy();
        }

        const labels = planStats.map(p => p.name);
        const data = planStats.map(p => p.memberCount);
        const colors = [
            '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6', '#f97316'
        ];

        const ctxDist = canvasDist.getContext('2d');
        plansDistributionChartInstance = new window.Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#09090B',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#A1A1AA', font: { size: 10, family: 'Inter' }, padding: 10 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.raw} socios`
                        }
                    }
                },
                cutout: '62%'
            }
        });
    }

    // Gráfico 2: Barra de Recaudación por Plan
    const canvasRev = document.getElementById('chart-plans-revenue');
    if (canvasRev) {
        if (plansRevenueChartInstance) {
            plansRevenueChartInstance.destroy();
        }

        const labels = planStats.map(p => p.name);
        const data = planStats.map(p => p.totalRevenue);

        const ctxRev = canvasRev.getContext('2d');
        plansRevenueChartInstance = new window.Chart(ctxRev, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Recaudación Acumulada',
                    data,
                    backgroundColor: 'rgba(245, 158, 11, 0.75)',
                    borderColor: '#f59e0b',
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
                        callbacks: {
                            label: (ctx) => ` Facturado: $${Number(ctx.raw).toLocaleString('es-CL')}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#A1A1AA', font: { size: 10, family: 'Inter' } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#A1A1AA',
                            font: { size: 10, family: 'Inter' },
                            callback: (v) => `$${(v / 1000).toFixed(0)}k`
                        }
                    }
                }
            }
        });
    }
}

export function openCreatePlanModal() {
    const modal = document.getElementById('plan-modal-overlay');
    const form = document.getElementById('plan-form');
    const idInput = document.getElementById('plan-input-id');
    const titleEl = document.getElementById('plan-modal-title');
    const deleteBtn = document.getElementById('btn-delete-plan-modal');
    const submitText = document.getElementById('plan-btn-submit-text');

    if (form) form.reset();
    if (idInput) idInput.value = '';
    if (titleEl) titleEl.innerHTML = '<i data-lucide="award" style="color: var(--accent-gold);"></i><span>Crear Nueva Membresía</span>';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (submitText) submitText.textContent = 'Crear Plan';

    initLucideIcons();
    if (modal) modal.classList.add('open');
}

export function openEditPlanModal(planId) {
    const plan = (cachedRawPlans || []).find(p => p.id === planId);
    if (!plan) return;

    const modal = document.getElementById('plan-modal-overlay');
    const idInput = document.getElementById('plan-input-id');
    const nameInput = document.getElementById('plan-input-name');
    const priceInput = document.getElementById('plan-input-price');
    const monthlyInput = document.getElementById('plan-input-monthly');
    const typeSelect = document.getElementById('plan-input-type');
    const descInput = document.getElementById('plan-input-description');
    const titleEl = document.getElementById('plan-modal-title');
    const deleteBtn = document.getElementById('btn-delete-plan-modal');
    const submitText = document.getElementById('plan-btn-submit-text');

    if (idInput) idInput.value = plan.id;
    if (nameInput) nameInput.value = plan.name || '';
    if (priceInput) priceInput.value = plan.price || 0;
    if (monthlyInput) monthlyInput.value = plan.monthly || 0;
    if (typeSelect) typeSelect.value = plan.type || 'presencial';
    if (descInput) descInput.value = plan.description || '';

    if (titleEl) titleEl.innerHTML = '<i data-lucide="award" style="color: var(--accent-gold);"></i><span>Editar Tarifa de Membresía</span>';
    if (deleteBtn) {
        deleteBtn.style.display = 'inline-flex';
        deleteBtn.onclick = () => confirmDeletePlan(plan.id, plan.name);
    }
    if (submitText) submitText.textContent = 'Guardar Cambios';

    initLucideIcons();
    if (modal) modal.classList.add('open');
}

export async function confirmDeletePlan(planId, planName = 'este plan') {
    if (window.Swal) {
        const res = await window.Swal.fire({
            icon: 'warning',
            title: '¿Eliminar Membresía?',
            text: `¿Estás seguro de eliminar el plan "${planName}"? Si hay alumnos asignados, perderán su referencia de tarifa.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            background: '#09090B',
            color: '#fff'
        });
        if (!res.isConfirmed) return;
    }

    try {
        const { error } = await supabase.from('membership_plans').delete().eq('id', planId);
        if (error) throw error;

        const modal = document.getElementById('plan-modal-overlay');
        if (modal) modal.classList.remove('open');

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Plan Eliminado',
                timer: 1500,
                showConfirmButton: false,
                background: '#09090B',
                color: '#fff'
            });
        }

        await loadPlansGrid();
    } catch (err) {
        console.error('[Admin] Error eliminando plan:', err);
        if (window.Swal) {
            window.Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'No se pudo eliminar el plan.',
                background: '#09090B',
                color: '#fff'
            });
        }
    }
}

// ============================================================================
// MÓDULO 5: CÓDIGOS DE DESCUENTO (GESTIÓN COMPLETA: CREAR, EDITAR, BORRAR)
// ============================================================================
let cachedDiscounts = [];
let isDiscountControlsInit = false;

export async function loadDiscountsTable() {
    initDiscountControlsOnce();
    const tableBody = document.getElementById('discounts-table-body');
    if (!tableBody) return;

    try {
        const [{ data: discounts, error }, { data: plans }] = await Promise.all([
            supabase.from('discounts').select('*').order('created_at', { ascending: false }),
            supabase.from('membership_plans').select('id, name').order('sort_order', { ascending: true })
        ]);

        if (error) throw error;

        cachedDiscounts = discounts || [];
        const plansMap = new Map((plans || []).map(p => [p.id, p.name]));

        if (!cachedDiscounts || cachedDiscounts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay cupones ni descuentos activos.</td></tr>';
            return;
        }

        tableBody.innerHTML = cachedDiscounts.map(d => {
            const val = d.percent ? `${d.percent}%` : (d.percentage ? `${d.percentage}%` : (d.amount ? `$${d.amount}` : 'Especial'));
            const isActive = d.is_active !== false;
            const exp = d.expiresAt || d.expires_at;

            // Renderizar planes aplicables como badges
            let plansDisplay = '<span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">Todos los planes</span>';
            if (Array.isArray(d.plans) && d.plans.length > 0) {
                plansDisplay = d.plans.map(pid => {
                    const name = plansMap.get(pid) || pid;
                    return `<span style="display: inline-block; font-size: 0.72rem; color: #a855f7; background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.25); padding: 2px 7px; border-radius: 4px; margin: 2px;">${name}</span>`;
                }).join(' ');
            }

            return `
                <tr>
                    <td><strong style="color: #FFFFFF; font-family: monospace; font-size: 1rem; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px;">${d.code || 'SIN CODIGO'}</strong></td>
                    <td style="font-weight: 700; color: var(--accent-emerald); font-size: 1.05rem;">${val}</td>
                    <td>${plansDisplay}</td>
                    <td>${d.current_uses || d.used_count || 0} usos</td>
                    <td>${exp ? new Date(exp).toLocaleDateString('es-CL') : 'Sin expiración'}</td>
                    <td><span class="status-pill ${isActive ? 'active' : 'inactive'}">${isActive ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" class="btn-icon-action btn-edit-discount" data-id="${d.id}" title="Editar cupón" style="color: #60a5fa; background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 6px; padding: 6px 9px; cursor: pointer;">
                                <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                            </button>
                            <button type="button" class="btn-icon-action btn-delete-discount" data-id="${d.id}" title="Eliminar cupón" style="color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; padding: 6px 9px; cursor: pointer;">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Event listeners para editar y borrar
        tableBody.querySelectorAll('.btn-edit-discount').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const disc = cachedDiscounts.find(x => x.id === id);
                if (disc) openDiscountModal(disc);
            };
        });

        tableBody.querySelectorAll('.btn-delete-discount').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                deleteDiscount(id);
            };
        });

        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        console.error('[Admin] Error cargando descuentos:', err);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--primary); padding: 25px;">Error al cargar descuentos: ${err.message}</td></tr>`;
    }
}

export async function openDiscountModal(discount = null) {
    const modal = document.getElementById('discount-modal-overlay');
    if (!modal) return;

    const titleEl = document.getElementById('discount-modal-title');
    const inputId = document.getElementById('discount-input-id');
    const inputCode = document.getElementById('discount-input-code');
    const inputPercent = document.getElementById('discount-input-percent');
    const inputExpiry = document.getElementById('discount-input-expiry');
    const inputStatus = document.getElementById('discount-input-status');
    const selectAllCheckbox = document.getElementById('discount-select-all-plans');
    const plansContainer = document.getElementById('discount-plans-checkbox-container');
    const saveBtnText = document.getElementById('btn-save-discount-text');

    // Asegurar que tenemos los planes cargados
    let plans = cachedPlans || [];
    if (!plans || plans.length === 0) {
        try {
            const { data } = await supabase.from('membership_plans').select('*').order('sort_order', { ascending: true });
            plans = data || [];
        } catch (err) {
            console.warn('[Admin] Error cargando planes para modal de descuentos:', err);
        }
    }

    // Renderizar checkboxes de planes
    if (plansContainer) {
        if (plans.length === 0) {
            plansContainer.innerHTML = '<p style="font-size:0.75rem; color:var(--text-muted); grid-column:1/-1;">No hay membresías creadas en el sistema.</p>';
        } else {
            plansContainer.innerHTML = plans.map(p => `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #fff; cursor: pointer; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    <input type="checkbox" class="discount-plan-cb" value="${p.id}" style="accent-color: var(--accent-purple); cursor: pointer;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                </label>
            `).join('');
        }
    }

    if (discount) {
        // Modo Edición
        if (titleEl) titleEl.textContent = `Editar Cupón: ${discount.code}`;
        if (saveBtnText) saveBtnText.textContent = 'Actualizar Cupón';
        if (inputId) inputId.value = discount.id;
        if (inputCode) inputCode.value = discount.code || '';
        if (inputPercent) inputPercent.value = discount.percent || discount.percentage || '';
        if (inputStatus) inputStatus.value = discount.is_active !== false ? 'active' : 'inactive';
        
        if (inputExpiry) {
            const exp = discount.expiresAt || discount.expires_at;
            if (exp) {
                try {
                    inputExpiry.value = new Date(exp).toISOString().split('T')[0];
                } catch {
                    inputExpiry.value = '';
                }
            } else {
                inputExpiry.value = '';
            }
        }

        const selectedPlans = Array.isArray(discount.plans) ? discount.plans : [];
        const allPlanCbs = document.querySelectorAll('.discount-plan-cb');
        if (selectedPlans.length === 0) {
            if (selectAllCheckbox) selectAllCheckbox.checked = true;
            allPlanCbs.forEach(cb => cb.checked = true);
        } else {
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            allPlanCbs.forEach(cb => {
                cb.checked = selectedPlans.includes(cb.value);
            });
        }
    } else {
        // Modo Creación
        if (titleEl) titleEl.textContent = 'Nuevo Cupón de Descuento';
        if (saveBtnText) saveBtnText.textContent = 'Guardar Cupón';
        if (inputId) inputId.value = '';
        if (inputCode) inputCode.value = '';
        if (inputPercent) inputPercent.value = '';
        if (inputExpiry) inputExpiry.value = '';
        if (inputStatus) inputStatus.value = 'active';
        if (selectAllCheckbox) selectAllCheckbox.checked = true;

        document.querySelectorAll('.discount-plan-cb').forEach(cb => cb.checked = true);
    }

    modal.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
}

export function closeDiscountModal() {
    const modal = document.getElementById('discount-modal-overlay');
    if (modal) modal.classList.remove('open');
}

export async function handleSaveDiscountSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('discount-input-id')?.value?.trim();
    const code = document.getElementById('discount-input-code')?.value?.trim().toUpperCase();
    const percent = parseInt(document.getElementById('discount-input-percent')?.value, 10);
    const expiryVal = document.getElementById('discount-input-expiry')?.value;
    const statusVal = document.getElementById('discount-input-status')?.value || 'active';
    const selectAll = document.getElementById('discount-select-all-plans')?.checked;

    if (!code) {
        if (window.Swal) window.Swal.fire({ icon: 'warning', title: 'Falta código', text: 'Por favor ingresa un código para el cupón.', background: '#09090B', color: '#fff' });
        return;
    }

    if (isNaN(percent) || percent <= 0 || percent > 100) {
        if (window.Swal) window.Swal.fire({ icon: 'warning', title: 'Porcentaje inválido', text: 'El porcentaje debe ser un valor entre 1 y 100.', background: '#09090B', color: '#fff' });
        return;
    }

    const checkedCbs = Array.from(document.querySelectorAll('.discount-plan-cb:checked')).map(cb => cb.value);
    const totalCbs = document.querySelectorAll('.discount-plan-cb').length;

    const plansToSave = (selectAll || checkedCbs.length === 0 || checkedCbs.length === totalCbs) ? null : checkedCbs;

    const payload = {
        code: code,
        name: `Descuento ${code} (${percent}%)`,
        percent: percent,
        plans: plansToSave,
        expiresAt: expiryVal ? new Date(expiryVal + 'T23:59:59').toISOString() : null,
        is_active: statusVal === 'active'
    };

    try {
        if (id) {
            const { error } = await supabase
                .from('discounts')
                .update(payload)
                .eq('id', id);
            if (error) throw error;

            if (window.Swal) {
                window.Swal.fire({
                    icon: 'success',
                    title: 'Cupón Actualizado',
                    text: `El cupón ${code} ha sido actualizado con éxito.`,
                    background: '#09090B',
                    color: '#fff',
                    timer: 1800,
                    showConfirmButton: false
                });
            }
        } else {
            const { error } = await supabase
                .from('discounts')
                .insert([payload]);
            if (error) throw error;

            if (window.Swal) {
                window.Swal.fire({
                    icon: 'success',
                    title: 'Cupón Creado',
                    text: `El cupón ${code} ya está listo para ser utilizado.`,
                    background: '#09090B',
                    color: '#fff',
                    timer: 1800,
                    showConfirmButton: false
                });
            }
        }

        closeDiscountModal();
        await loadDiscountsTable();

    } catch (err) {
        console.error('[Admin] Error guardando cupón:', err);
        if (window.Swal) {
            window.Swal.fire({
                icon: 'error',
                title: 'Error al guardar cupón',
                text: err.message || 'No se pudo guardar el descuento.',
                background: '#09090B',
                color: '#fff'
            });
        }
    }
}

export async function deleteDiscount(id) {
    if (!id) return;
    const disc = cachedDiscounts.find(x => x.id === id);
    const codeName = disc ? disc.code : 'este cupón';

    if (window.Swal) {
        const confirm = await window.Swal.fire({
            icon: 'warning',
            title: `¿Eliminar cupón "${codeName}"?`,
            text: 'Los alumnos ya no podrán aplicar este descuento en sus membresías.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            background: '#09090B',
            color: '#fff'
        });
        if (!confirm.isConfirmed) return;
    }

    try {
        const { error } = await supabase
            .from('discounts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'Cupón Eliminado',
                timer: 1600,
                showConfirmButton: false,
                background: '#09090B',
                color: '#fff'
            });
        }

        await loadDiscountsTable();
    } catch (err) {
        console.error('[Admin] Error eliminando cupón:', err);
        if (window.Swal) {
            window.Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: err.message || 'No se pudo eliminar el cupón.',
                background: '#09090B',
                color: '#fff'
            });
        }
    }
}

function initDiscountControlsOnce() {
    if (isDiscountControlsInit) return;
    isDiscountControlsInit = true;

    const btnCreate = document.getElementById('btn-create-discount');
    const btnClose = document.getElementById('btn-close-discount-modal');
    const btnCancel = document.getElementById('btn-cancel-discount-modal');
    const form = document.getElementById('discount-form');
    const selectAllCb = document.getElementById('discount-select-all-plans');

    if (btnCreate) btnCreate.addEventListener('click', () => openDiscountModal(null));
    if (btnClose) btnClose.addEventListener('click', closeDiscountModal);
    if (btnCancel) btnCancel.addEventListener('click', closeDiscountModal);
    if (form) form.addEventListener('submit', handleSaveDiscountSubmit);

    if (selectAllCb) {
        selectAllCb.addEventListener('change', () => {
            const isChecked = selectAllCb.checked;
            document.querySelectorAll('.discount-plan-cb').forEach(cb => {
                cb.checked = isChecked;
            });
        });
    }
}

// ============================================================================
// MÓDULO 6: INGRESOS Y REPORTES FINANCIEROS (COCKPIT EJECUTIVO)
// ============================================================================
let revenueChartInstance = null;
let revenueMethodChartInstance = null;
let revFilterMonth = new Date().getMonth();
let revFilterYear = new Date().getFullYear();
let revFilterMethod = 'all';
let revSearchQuery = '';
let revMonthlyGoal = Number(localStorage.getItem('amarufighter_monthly_goal')) || 3500000;
let cachedAllPaymentsForRev = [];
let isRevenueControlsInit = false;

export async function loadRevenueSection() {
    initRevenueControlsOnce();

    try {
        const [paymentsRes, profilesRes, plansRes] = await Promise.all([
            supabase.from('payments').select('*, profiles:profiles(id, full_name, email, membership_plan_id)').order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, full_name, email, membership_plan_id, membership_status'),
            supabase.from('membership_plans').select('*')
        ]);

        if (paymentsRes.error) throw paymentsRes.error;

        const payments = paymentsRes.data || [];
        const profiles = profilesRes.data || [];
        const plans = plansRes.data || [];
        cachedAllPaymentsForRev = payments;

        const plansPriceMap = new Map(plans.map(p => [p.id, Number(p.price) || 0]));

        // Calcular MRR Estimado
        const activeProfiles = profiles.filter(p => p.membership_status === 'active' || p.membership_plan_id);
        const estimatedMRR = activeProfiles.reduce((acc, p) => {
            const planPrice = plansPriceMap.get(p.membership_plan_id) || 30000;
            return acc + planPrice;
        }, 0);

        // Pagos pendientes por conciliar
        const pendingPayments = payments.filter(p => p.status === 'pending');
        const pendingTotal = pendingPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        // Pagos aprobados generales
        const approvedPayments = payments.filter(p => p.status === 'approved');

        // Filtrar pagos para el período seleccionado
        const selPayments = approvedPayments.filter(p => {
            if (!p.created_at) return false;
            const d = new Date(p.created_at);
            const matchesDate = d.getMonth() === revFilterMonth && d.getFullYear() === revFilterYear;
            const matchesMethod = revFilterMethod === 'all' || (p.payment_method || 'transferencia') === revFilterMethod;
            return matchesDate && matchesMethod;
        });

        // Filtrar pagos período anterior para cálculo de crecimiento
        const prevMonth = revFilterMonth === 0 ? 11 : revFilterMonth - 1;
        const prevYear = revFilterMonth === 0 ? revFilterYear - 1 : revFilterYear;
        const prevPayments = approvedPayments.filter(p => {
            if (!p.created_at) return false;
            const d = new Date(p.created_at);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });

        const selTotal = selPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const prevTotal = prevPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const growth = prevTotal > 0 ? ((selTotal - prevTotal) / prevTotal) * 100 : (selTotal > 0 ? 100 : 0);

        const uniquePayers = new Set(selPayments.map(p => p.user_id || p.profiles?.id || p.user_display_name)).size;
        const avgTicket = selPayments.length > 0 ? selTotal / selPayments.length : 0;

        // Actualizar KPIs en el DOM
        const totalEl = document.getElementById('rev-kpi-total');
        const growthEl = document.getElementById('rev-kpi-growth');
        const payersEl = document.getElementById('rev-kpi-payers');
        const ticketEl = document.getElementById('rev-kpi-ticket');
        const mrrEl = document.getElementById('rev-kpi-mrr');
        const pendingEl = document.getElementById('rev-kpi-pending');
        const pendingSubEl = document.getElementById('rev-kpi-pending-sub');

        if (totalEl) totalEl.textContent = `$${selTotal.toLocaleString('es-CL')}`;
        if (growthEl) {
            growthEl.textContent = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
            growthEl.style.color = growth >= 0 ? 'var(--accent-emerald)' : '#ef4444';
        }
        if (payersEl) payersEl.textContent = uniquePayers;
        if (ticketEl) ticketEl.textContent = `$${Math.round(avgTicket || (plans[0]?.price || 35000)).toLocaleString('es-CL')}`;
        if (mrrEl) mrrEl.textContent = `$${estimatedMRR.toLocaleString('es-CL')}`;
        if (pendingEl) pendingEl.textContent = `$${pendingTotal.toLocaleString('es-CL')}`;
        if (pendingSubEl) pendingSubEl.textContent = `${pendingPayments.length} en revisión`;

        // Renderizar Gráficos Financieros (si los canvas y Chart están disponibles)
        renderRevenueEvolutionChart(approvedPayments);
        renderRevenueMethodChart(selPayments);

        // Actualizar Herramientas de Administración Financiera
        renderRunRateTool(selTotal);
        updateWhatIfSimulation(selTotal, uniquePayers, avgTicket);

        // Renderizar Libro Diario Contable (Ledger)
        renderRevenueLedgerTable(selPayments);

        initLucideIcons();
    } catch (err) {
        console.error('[Admin] Error cargando sección de ingresos:', err);
    }
}

function initRevenueControlsOnce() {
    const simMembersSlider = document.getElementById('sim-members-slider');
    const simPriceSlider = document.getElementById('sim-price-slider');
    if (!simMembersSlider || !simPriceSlider) return;

    if (isRevenueControlsInit) return;
    isRevenueControlsInit = true;

    const monthSelect = document.getElementById('rev-filter-month');
    const yearSelect = document.getElementById('rev-filter-year');
    const methodSelect = document.getElementById('rev-filter-method');
    const btnRefresh = document.getElementById('btn-refresh-revenue');
    const btnExport = document.getElementById('btn-export-revenue-multiformat');
    const btnEditGoal = document.getElementById('btn-edit-revenue-goal');
    const searchInput = document.getElementById('rev-ledger-search');

    if (monthSelect) {
        monthSelect.value = revFilterMonth;
        monthSelect.addEventListener('change', (e) => {
            revFilterMonth = parseInt(e.target.value, 10);
            loadRevenueSection();
        });
    }

    if (yearSelect) {
        yearSelect.value = revFilterYear;
        yearSelect.addEventListener('change', (e) => {
            revFilterYear = parseInt(e.target.value, 10);
            loadRevenueSection();
        });
    }

    if (methodSelect) {
        methodSelect.value = revFilterMethod;
        methodSelect.addEventListener('change', (e) => {
            revFilterMethod = e.target.value;
            loadRevenueSection();
        });
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            await loadRevenueSection();
            if (window.Swal) {
                window.Swal.fire({
                    icon: 'success',
                    title: 'Datos Actualizados',
                    toast: true,
                    position: 'top-end',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#09090B',
                    color: '#fff'
                });
            }
        });
    }

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            exportRevenueToCSV();
        });
    }

    if (btnEditGoal) {
        btnEditGoal.addEventListener('click', async () => {
            if (!window.Swal) return;
            const { value: newGoal } = await window.Swal.fire({
                title: 'Meta Mensual del Dojo',
                input: 'number',
                inputLabel: 'Ingresa el objetivo de recaudación ($ CLP) para este mes:',
                inputValue: revMonthlyGoal,
                showCancelButton: true,
                confirmButtonText: 'Guardar Meta',
                cancelButtonText: 'Cancelar',
                background: '#09090B',
                color: '#fff',
                inputValidator: (val) => {
                    if (!val || isNaN(val) || Number(val) <= 0) {
                        return 'Por favor ingresa un monto válido.';
                    }
                }
            });

            if (newGoal) {
                revMonthlyGoal = Number(newGoal);
                localStorage.setItem('amarufighter_monthly_goal', revMonthlyGoal);
                loadRevenueSection();
            }
        });
    }

    const onSimChange = () => {
        const addedMembers = parseInt(simMembersSlider.value, 10) || 0;
        const priceDelta = parseInt(simPriceSlider.value, 10) || 0;

        const memValEl = document.getElementById('sim-members-val');
        const priceValEl = document.getElementById('sim-price-val');
        if (memValEl) memValEl.textContent = `+${addedMembers} alumnos`;
        if (priceValEl) priceValEl.textContent = `${priceDelta >= 0 ? '+' : ''}${priceDelta}%`;

        // Calcular ingresos basados en el estado actual
        const currentTotalStr = document.getElementById('rev-kpi-total')?.textContent || '$0';
        const cleanTotal = Number(currentTotalStr.replace(/[^0-9]/g, '')) || 0;
        const payersStr = document.getElementById('rev-kpi-payers')?.textContent || '0';
        const cleanPayers = Number(payersStr.replace(/[^0-9]/g, '')) || 0;

        // Fallback robusto para ticket medio si no hay pagos aún en el período
        let avgTicket = (cleanPayers > 0 && cleanTotal > 0) ? (cleanTotal / cleanPayers) : 35000;
        if (avgTicket <= 0) avgTicket = 35000;
        const basePayersCount = cleanPayers > 0 ? cleanPayers : 15;

        const newTicket = avgTicket * (1 + priceDelta / 100);
        const extraFromNew = addedMembers * newTicket;
        const extraFromPrice = basePayersCount * (newTicket - avgTicket);
        const totalExtra = Math.round(extraFromNew + extraFromPrice);
        const newProjected = cleanTotal + totalExtra;

        const extraEl = document.getElementById('sim-extra-revenue');
        const totalProjEl = document.getElementById('sim-total-projected');
        if (extraEl) extraEl.textContent = `+${totalExtra >= 0 ? '$' : '-$'}${Math.abs(totalExtra).toLocaleString('es-CL')} / mes`;
        if (totalProjEl) totalProjEl.textContent = `$${newProjected.toLocaleString('es-CL')}`;
    };

    simMembersSlider.addEventListener('input', onSimChange);
    simMembersSlider.addEventListener('change', onSimChange);
    simPriceSlider.addEventListener('input', onSimChange);
    simPriceSlider.addEventListener('change', onSimChange);
    onSimChange();

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            revSearchQuery = e.target.value.toLowerCase().trim();
            // Filtrar sobre los pagos del período
            const approved = (cachedAllPaymentsForRev || []).filter(p => p.status === 'approved');
            const selPayments = approved.filter(p => {
                if (!p.created_at) return false;
                const d = new Date(p.created_at);
                const matchesDate = d.getMonth() === revFilterMonth && d.getFullYear() === revFilterYear;
                const matchesMethod = revFilterMethod === 'all' || (p.payment_method || 'transferencia') === revFilterMethod;
                return matchesDate && matchesMethod;
            });
            renderRevenueLedgerTable(selPayments);
        });
    }
}

function renderRevenueEvolutionChart(approvedPayments) {
    const canvas = document.getElementById('desktop-revenue-chart');
    if (!canvas || !window.Chart) return;

    const monthlyData = {};
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Inicializar últimos 6 meses
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        monthlyData[key] = 0;
    }

    approvedPayments.forEach(p => {
        if (!p.created_at) return;
        const date = new Date(p.created_at);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyData[key] !== undefined) {
            monthlyData[key] += Number(p.amount) || 0;
        }
    });

    const labels = Object.keys(monthlyData);
    const values = Object.values(monthlyData);

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    revenueChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Recaudación Mensual',
                data: values,
                borderColor: '#10b981',
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#09090B',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#09090B',
                    titleColor: '#fff',
                    bodyColor: '#10b981',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => ` Total: $${Number(context.raw).toLocaleString('es-CL')}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#A1A1AA', font: { size: 10, family: 'Inter' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#A1A1AA',
                        font: { size: 10, family: 'Inter' },
                        callback: (val) => `$${(val / 1000).toFixed(0)}k`
                    }
                }
            }
        }
    });
}

function renderRevenueMethodChart(selPayments) {
    const canvas = document.getElementById('revenue-method-chart');
    if (!canvas || !window.Chart) return;

    if (revenueMethodChartInstance) {
        revenueMethodChartInstance.destroy();
    }

    const methodTotals = {
        transferencia: 0,
        efectivo: 0,
        pasarela: 0
    };

    selPayments.forEach(p => {
        const m = (p.payment_method || 'transferencia').toLowerCase();
        if (m.includes('efectivo')) methodTotals.efectivo += (Number(p.amount) || 0);
        else if (m.includes('pasarela') || m.includes('mercadopago') || m.includes('webpay')) methodTotals.pasarela += (Number(p.amount) || 0);
        else methodTotals.transferencia += (Number(p.amount) || 0);
    });

    const labels = ['Transferencia', 'Efectivo Dojo', 'Pasarela Digital'];
    const data = [methodTotals.transferencia, methodTotals.efectivo, methodTotals.pasarela];

    const ctx = canvas.getContext('2d');
    revenueMethodChartInstance = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
                borderColor: '#09090B',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#A1A1AA', font: { size: 10, family: 'Inter' }, padding: 10 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: $${Number(ctx.raw).toLocaleString('es-CL')}`
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderRunRateTool(selTotal) {
    const now = new Date();
    const isCurrentMonth = (now.getMonth() === revFilterMonth && now.getFullYear() === revFilterYear);
    const daysInMonth = new Date(revFilterYear, revFilterMonth + 1, 0).getDate();
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;

    const progressEl = document.getElementById('runrate-day-progress');
    const paceEl = document.getElementById('runrate-daily-pace');
    const closeEl = document.getElementById('runrate-projected-close');
    const goalDisplayEl = document.getElementById('runrate-goal-display');
    const goalBarEl = document.getElementById('runrate-goal-bar');
    const goalPercentEl = document.getElementById('runrate-goal-percent');
    const goalMissingEl = document.getElementById('runrate-goal-missing');

    if (progressEl) progressEl.textContent = `Día ${currentDay} de ${daysInMonth}`;

    const dailyPace = currentDay > 0 ? selTotal / currentDay : 0;
    const projectedClose = isCurrentMonth ? Math.round(dailyPace * daysInMonth) : selTotal;

    if (paceEl) paceEl.textContent = `$${Math.round(dailyPace).toLocaleString('es-CL')} / día`;
    if (closeEl) closeEl.textContent = `$${projectedClose.toLocaleString('es-CL')}`;
    if (goalDisplayEl) goalDisplayEl.textContent = `$${revMonthlyGoal.toLocaleString('es-CL')}`;

    const pctAchieved = revMonthlyGoal > 0 ? ((selTotal / revMonthlyGoal) * 100).toFixed(0) : 0;
    const missing = Math.max(0, revMonthlyGoal - selTotal);

    if (goalBarEl) goalBarEl.style.width = `${Math.min(100, Math.max(0, pctAchieved))}%`;
    if (goalPercentEl) goalPercentEl.textContent = `${pctAchieved}% alcanzado`;
    if (goalMissingEl) goalMissingEl.textContent = missing > 0 ? `Faltan $${missing.toLocaleString('es-CL')}` : '¡Meta alcanzada! 🎉';
}

function updateWhatIfSimulation(selTotal, uniquePayers, avgTicket) {
    const simMembersSlider = document.getElementById('sim-members-slider');
    const simPriceSlider = document.getElementById('sim-price-slider');
    if (!simMembersSlider || !simPriceSlider) return;

    const addedMembers = parseInt(simMembersSlider.value, 10) || 0;
    const priceDelta = parseInt(simPriceSlider.value, 10) || 0;

    const baseTicket = (avgTicket && avgTicket > 0) ? avgTicket : 35000;
    const basePayers = (uniquePayers && uniquePayers > 0) ? uniquePayers : 15;

    const newTicket = baseTicket * (1 + priceDelta / 100);
    const extraFromNew = addedMembers * newTicket;
    const extraFromPrice = basePayers * (newTicket - baseTicket);
    const totalExtra = Math.round(extraFromNew + extraFromPrice);
    const newProjected = (selTotal || 0) + totalExtra;

    const extraEl = document.getElementById('sim-extra-revenue');
    const totalProjEl = document.getElementById('sim-total-projected');
    if (extraEl) extraEl.textContent = `+${totalExtra >= 0 ? '$' : '-$'}${Math.abs(totalExtra).toLocaleString('es-CL')} / mes`;
    if (totalProjEl) totalProjEl.textContent = `$${newProjected.toLocaleString('es-CL')}`;
}

function renderRevenueLedgerTable(selPayments) {
    const tbody = document.getElementById('rev-ledger-tbody');
    if (!tbody) return;

    let filtered = selPayments;
    if (revSearchQuery) {
        filtered = selPayments.filter(p => {
            const name = (p.profiles?.full_name || p.user_display_name || '').toLowerCase();
            const email = (p.profiles?.email || p.user_email || '').toLowerCase();
            const concept = (p.concept || p.plan_name || '').toLowerCase();
            return name.includes(revSearchQuery) || email.includes(revSearchQuery) || concept.includes(revSearchQuery);
        });
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No se encontraron pagos aprobados en este período o criterio de búsqueda.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.slice(0, 50).map(p => {
        const studentName = p.profiles?.full_name || p.user_display_name || 'Socio';
        const studentEmail = p.profiles?.email || p.user_email || '';
        const concept = p.concept || p.plan_name || 'Membresía Mensual';
        const method = p.payment_method || 'transferencia';
        const dateStr = p.created_at ? new Date(p.created_at).toLocaleString('es-CL') : 'N/A';
        const amountStr = p.amount ? `$${Number(p.amount).toLocaleString('es-CL')}` : '$0';
        const coverage = p.coverage_month || 'Al día';

        let methodBadge = '<span class="status-pill active" style="font-size: 0.68rem; background: rgba(245,158,11,0.15); color: #f59e0b; border-color: rgba(245,158,11,0.3);">🏦 Transferencia</span>';
        if (method.includes('efectivo')) {
            methodBadge = '<span class="status-pill active" style="font-size: 0.68rem; background: rgba(16,185,129,0.15); color: #10b981; border-color: rgba(16,185,129,0.3);">💵 Efectivo</span>';
        } else if (method.includes('pasarela') || method.includes('mercadopago') || method.includes('webpay')) {
            methodBadge = '<span class="status-pill active" style="font-size: 0.68rem; background: rgba(59,130,246,0.15); color: #3b82f6; border-color: rgba(59,130,246,0.3);">💳 Pasarela</span>';
        }

        const receiptLink = p.receipt_url 
            ? `<a href="${p.receipt_url}" target="_blank" class="btn-icon-xs" title="Ver comprobante adjunto"><i data-lucide="file-text" style="width: 12px; height: 12px;"></i></a>`
            : '<span style="font-size: 0.72rem; color: var(--text-muted);">-</span>';

        return `
            <tr>
                <td style="font-size: 0.78rem; color: var(--text-secondary); white-space: nowrap;">${dateStr}</td>
                <td>
                    <div style="font-weight: 700; color: #fff;">${studentName}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${studentEmail}</div>
                </td>
                <td style="font-weight: 600; color: #fff;">${concept}</td>
                <td>${methodBadge}</td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${coverage}</td>
                <td style="font-weight: 800; color: var(--accent-emerald); font-size: 0.95rem;">${amountStr}</td>
                <td>${receiptLink}</td>
            </tr>
        `;
    }).join('');

    initLucideIcons();
}

// ============================================================================
// MÓDULO 7: AVISOS GLOBALES
// ============================================================================
export async function loadNotificationsTable() {
    const tableBody = document.getElementById('notifications-table-body');
    if (!tableBody) return;

    try {
        const { data: notifications, error } = await supabase
            .from('global_notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!notifications || notifications.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No se han emitido avisos recientes.</td></tr>';
            return;
        }

        tableBody.innerHTML = notifications.map(n => `
            <tr>
                <td><strong style="color: #FFFFFF;">${n.title}</strong></td>
                <td style="color: var(--text-secondary); max-width: 320px;">${n.message}</td>
                <td><span class="status-pill active" style="text-transform: uppercase;">${n.type || 'info'}</span></td>
                <td>${new Date(n.created_at).toLocaleDateString('es-CL')}</td>
                <td>-</td>
            </tr>
        `).join('');

    } catch (err) {
        console.warn('[Admin] Notificaciones no disponibles o vacías:', err);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 25px;">Sin avisos activos.</td></tr>';
    }
}

// ============================================================================
// SUITE UNIVERSAL DE EXPORTACIÓN MULTIFORMATO (.XLS, .PDF, .CSV)
// ============================================================================

/**
 * Descarga de archivo CSV con codificación UTF-8 y BOM
 */
export function downloadCSV(headers, rows, filename) {
    const formattedRows = rows.map(row => 
        row.map(val => {
            const str = String(val === null || val === undefined ? '' : val);
            return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...formattedRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Descarga de archivo Excel (.xls) compatible con Microsoft Excel, LibreOffice y Google Sheets
 */
export function downloadXLS(headers, rows, filename) {
    let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>${filename.slice(0, 31)}</x:Name>
                            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th { background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #4338ca; padding: 8px 12px; text-align: left; }
                td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 11px; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; }
            </style>
        </head>
        <body>
            <h2 style="color: #1e1b4b; margin-bottom: 4px;">Amarufighter Dojo • Reporte Oficial</h2>
            <p style="color: #64748b; font-size: 11px; margin-top: 0;">Generado el ${new Date().toLocaleString('es-CL')}</p>
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            ${r.map(val => `<td>${String(val === null || val === undefined ? '' : val)}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Descarga de archivo PDF institucional usando jsPDF y AutoTable
 */
export function downloadPDF(headers, rows, filename, pdfTitle, summaryCards = []) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        if (window.Swal) {
            window.Swal.fire({
                icon: 'warning',
                title: 'Librería PDF no disponible',
                text: 'Se descargará en formato Excel (.xls) alternativo.',
                background: '#09090B',
                color: '#fff'
            });
        }
        downloadXLS(headers, rows, filename);
        return;
    }

    try {
        const isLandscape = headers.length > 5;
        const doc = new window.jspdf.jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        // Encabezado corporativo
        doc.setFillColor(15, 15, 23);
        doc.rect(0, 0, pageWidth, 60, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('AMARUFIGHTER DOJO', 36, 32);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 210);
        doc.text(pdfTitle || 'REPORTE ADMINISTRATIVO', 36, 48);

        // Fecha y hora a la derecha
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 175);
        const dateStr = `Emisión: ${new Date().toLocaleString('es-CL')}`;
        doc.text(dateStr, pageWidth - 36, 48, { align: 'right' });

        let startY = 78;

        // Tarjetas o resumen ejecutivo si existe
        if (summaryCards && summaryCards.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(50, 50, 70);
            const summaryText = summaryCards.map(s => `${s.label}: ${s.value}`).join('   |   ');
            doc.text(summaryText, 36, startY);
            startY += 16;
        }

        // Renderizado de tabla mediante autoTable
        doc.autoTable({
            head: [headers],
            body: rows.map(r => r.map(val => String(val === null || val === undefined ? '' : val))),
            startY: startY,
            margin: { left: 36, right: 36, bottom: 40 },
            theme: 'striped',
            styles: {
                fontSize: headers.length > 7 ? 7 : 8,
                cellPadding: 4,
                overflow: 'linebreak',
                textColor: [30, 30, 40]
            },
            headStyles: {
                fillColor: [124, 58, 237],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            },
            alternateRowStyles: {
                fillColor: [248, 249, 252]
            },
            didDrawPage: (data) => {
                // Pie de página con numeración
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(140, 140, 150);
                doc.text(
                    `Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount} • Amarufighter Desktop Admin Suite`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 16,
                    { align: 'center' }
                );
            }
        });

        doc.save(`${filename}.pdf`);

        if (window.Swal) {
            window.Swal.fire({
                icon: 'success',
                title: 'PDF Descargado',
                text: `El archivo ${filename}.pdf ha sido generado con éxito.`,
                timer: 2000,
                showConfirmButton: false,
                background: '#09090B',
                color: '#fff'
            });
        }
    } catch (err) {
        console.error('[Admin] Error generando PDF:', err);
        downloadXLS(headers, rows, filename);
    }
}

/**
 * Modal interactivo que permite al administrador elegir entre Excel (.xls), PDF (.pdf) y CSV (.csv)
 */
export async function showExportFormatDialog({ title, filename, headers, rows, pdfTitle, summaryCards = [] }) {
    if (!rows || rows.length === 0) {
        if (window.Swal) {
            window.Swal.fire({
                icon: 'info',
                title: 'Sin datos',
                text: 'No hay registros disponibles para exportar en este módulo.',
                background: '#09090B',
                color: '#fff'
            });
        }
        return;
    }

    if (!window.Swal) {
        downloadCSV(headers, rows, filename);
        return;
    }

    await window.Swal.fire({
        title: `<span style="font-size: 1.2rem; color: #fff; font-weight: 800;">${title || 'Exportar Reporte'}</span>`,
        html: `
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 20px;">
                Selecciona el formato en el que deseas descargar este reporte (<strong>${rows.length} registros</strong>):
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button type="button" class="export-format-btn excel" id="swal-btn-exp-xls">
                    <span style="font-size: 1.5rem;">📊</span>
                    <div style="text-align: left;">
                        <div style="font-size: 0.92rem; font-weight: 700; color: #10b981;">Microsoft Excel (.xls)</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">Tabla estilizada para Excel, Google Sheets y LibreOffice</div>
                    </div>
                </button>
                <button type="button" class="export-format-btn pdf" id="swal-btn-exp-pdf">
                    <span style="font-size: 1.5rem;">📄</span>
                    <div style="text-align: left;">
                        <div style="font-size: 0.92rem; font-weight: 700; color: #ef4444;">Documento PDF (.pdf)</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">Diseño institucional formateado para impresión y archivo</div>
                    </div>
                </button>
                <button type="button" class="export-format-btn csv" id="swal-btn-exp-csv">
                    <span style="font-size: 1.5rem;">📝</span>
                    <div style="text-align: left;">
                        <div style="font-size: 0.92rem; font-weight: 700; color: #3b82f6;">Archivo Plano CSV (.csv)</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">Separado por comas con codificación universal UTF-8 con BOM</div>
                    </div>
                </button>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        background: '#09090B',
        color: '#fff',
        didOpen: () => {
            document.getElementById('swal-btn-exp-xls')?.addEventListener('click', () => {
                window.Swal.close();
                downloadXLS(headers, rows, filename);
            });
            document.getElementById('swal-btn-exp-pdf')?.addEventListener('click', () => {
                window.Swal.close();
                downloadPDF(headers, rows, filename, pdfTitle || title, summaryCards);
            });
            document.getElementById('swal-btn-exp-csv')?.addEventListener('click', () => {
                window.Swal.close();
                downloadCSV(headers, rows, filename);
            });
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPARADORES DE EXPORTACIÓN CONECTADOS A LA SUITE MULTIFORMATO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exportar socios generales (Navbar)
 */
export function exportMembersToCSV() {
    if (!cachedMembers || cachedMembers.length === 0) {
        if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay socios para exportar.', background: '#09090B', color: '#fff' });
        return;
    }

    const headers = ['Nombre Completo', 'Email', 'Teléfono', 'RUT', 'Plan', 'Estado', 'Vencimiento'];
    const rows = cachedMembers.map(m => [
        m.full_name || m.username || 'Sin nombre',
        m.email || '',
        m.phone || '',
        m.rut || '',
        m.plan_name || 'Sin plan',
        m.membership_status || 'active',
        m.membership_expiry ? new Date(m.membership_expiry).toLocaleDateString('es-CL') : 'N/A'
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    showExportFormatDialog({
        title: 'Exportar Listado de Socios',
        pdfTitle: 'Padrón General de Atletas y Socios',
        filename: `socios_amarufighter_${dateStr}`,
        headers,
        rows,
        summaryCards: [{ label: 'Total de Socios', value: rows.length }]
    });
}

/**
 * Exportar reporte de ingresos contables
 */
export async function exportRevenueToCSV() {
    try {
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!payments || payments.length === 0) {
            if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay pagos aprobados para exportar.', background: '#09090B', color: '#fff' });
            return;
        }

        const totalRecaudado = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const headers = ['ID Pago', 'Alumno / Usuario', 'Concepto', 'Método de Pago', 'Monto ($)', 'Mes Cobertura', 'Fecha Registro'];
        const rows = payments.map(p => [
            p.id,
            p.user_display_name || p.user_id || 'Socio',
            p.concept || p.plan_name || 'Membresía',
            p.payment_method || 'transferencia',
            p.amount ? `$${Number(p.amount).toLocaleString('es-CL')}` : '$0',
            p.coverage_month || '',
            p.created_at ? new Date(p.created_at).toLocaleString('es-CL') : ''
        ]);

        const dateStr = new Date().toISOString().slice(0, 10);
        showExportFormatDialog({
            title: 'Exportar Reporte Contable de Ingresos',
            pdfTitle: 'Libro Diario de Recaudación y Pagos Aprobados',
            filename: `ingresos_amarufighter_${dateStr}`,
            headers,
            rows,
            summaryCards: [
                { label: 'Transacciones', value: rows.length },
                { label: 'Total Recaudado', value: `$${totalRecaudado.toLocaleString('es-CL')}` }
            ]
        });
    } catch (err) {
        console.error('[Admin] Error exportando ingresos:', err);
    }
}

/**
 * Exportar catálogo de membresías y tarifas
 */
export async function exportPlansToMultiformat() {
    try {
        const { data: plans, error } = await supabase
            .from('membership_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        if (!plans || plans.length === 0) {
            if (window.Swal) window.Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay planes configurados para exportar.', background: '#09090B', color: '#fff' });
            return;
        }

        const headers = ['Plan / Membresía', 'Precio Mensual ($)', 'Límite Clases', 'Modalidad', 'Descripción'];
        const rows = plans.map(p => [
            p.name,
            `$${Number(p.price || 0).toLocaleString('es-CL')}`,
            p.monthly ? `${p.monthly} clases/mes` : 'Ilimitadas',
            p.type || 'Presencial Dojo',
            p.description || ''
        ]);

        const dateStr = new Date().toISOString().slice(0, 10);
        showExportFormatDialog({
            title: 'Exportar Tarifario de Membresías',
            pdfTitle: 'Catálogo de Planes y Precios Vigentes',
            filename: `tarifario_planes_amarufighter_${dateStr}`,
            headers,
            rows,
            summaryCards: [{ label: 'Total Planes', value: rows.length }]
        });
    } catch (err) {
        console.error('[Admin] Error exportando planes:', err);
    }
}

