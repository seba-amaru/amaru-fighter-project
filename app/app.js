import { initAuthUI } from './auth/auth.js';
import { appState } from './store/appState.js';
import { exportToFormat, exportUserData } from './utils/exportUtils.js';
import { withTimeout, withRetry, isNetworkError } from './utils/promiseHelpers.js';
// Amaru App Logic - Version 1.4.1 - Force Sync Update
console.log("[INIT] Amaru App Logic Loaded - V1.4.6 (Robust Login & Background Load)");

import { SupabaseService } from './services/supabaseService.js';
import { initModals } from './modules/adminModals.js';
import { renderAdminActiveUsers, renderAdminClasses, renderAdminPlans, renderAdminAttendance, renderAdminDiscounts, renderAdminNotifications } from './modules/admin.js';
import { renderAdminPayments } from './modules/payments.js';
import { renderAdminMembers } from './modules/members.js';
import { renderSchedule } from './modules/schedule.js';
import { renderTournaments } from './modules/tournaments.js';
import { renderRevenueSection } from './modules/revenue.js';
import unknowAvatar from '../images/unknow.png';
// Firebase Auth removed, using Supabase Auth
const auth = {
    get currentUser() {
        return window.appState?.user || null;
    }
};
window.auth = auth;
// Firebase removed

document.addEventListener('DOMContentLoaded', () => {
    // Upsell Functions
    window.buyDailyPass = () => {
        document.getElementById('upsell-modal').classList.add('hidden');
        document.getElementById('pay-concept').value = 'Pase Diario / Clase Extra';
        document.getElementById('pay-amount').value = '5000';
        document.getElementById('payment-modal').classList.add('active');
        // If showToast is not globally available yet, we use a simple alert or wait for it.
        // Usually showToast is defined inside the block, so we'll just show the modal for now.
    };

    window.upgradePlan = () => {
        document.getElementById('upsell-modal').classList.add('hidden');
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('membership-selection-screen').classList.remove('hidden');
        document.getElementById('membership-selection-screen').classList.add('active');
        document.getElementById('app-container').classList.add('hidden');
    };
    lucide.createIcons();

    // --- Mercado Pago callback moved below showToast ---

    // --- Global Error Boundary ---
    window.onerror = (msg, url, line) => {
        showToast(`Error: ${msg}`, "#ef4444");
        console.error("Critical Error:", msg, "at", url, ":", line);
    };

    const applyPromoBtn = document.getElementById('btn-apply-promo');
    if (applyPromoBtn) {
        applyPromoBtn.onclick = async () => {
            const codeInput = document.getElementById('promo-code-input').value.trim().toUpperCase();
            const msgEl = document.getElementById('promo-code-message');
            if (!codeInput) {
                msgEl.style.display = 'block';
                msgEl.style.color = '#ef4444';
                msgEl.innerText = 'Ingresa un código.';
                return;
            }
            try {
                showToast("Validando código...");
                const { data: promo, error } = await window.supabase
                    .from('discounts')
                    .select('*')
                    .eq('code', codeInput)
                    .maybeSingle();

                if (error) throw new Error("Error consultando código");

                if (promo) {
                    if (promo.expiresAt) {
                        const expDate = new Date(promo.expiresAt);
                        expDate.setDate(expDate.getDate() + 1);
                        if (expDate < new Date()) {
                            throw new Error("Este código ha expirado");
                        }
                    }
                    appState.activePromo = promo;
                    msgEl.style.display = 'block';
                    msgEl.style.color = '#22c55e';
                    msgEl.innerText = `¡Código '${promo.code}' aplicado! ${promo.percent}% de descuento.`;
                    if (typeof renderMembershipPlans === 'function') renderMembershipPlans();
                    showToast(`Descuento del ${promo.percent}% aplicado ✨`, "#22c55e");
                } else {
                    throw new Error("Código no válido");
                }
            } catch (err) {
                appState.activePromo = null;
                msgEl.style.display = 'block';
                msgEl.style.color = '#ef4444';
                msgEl.innerText = 'Código inválido o expirado.';
                if (typeof renderMembershipPlans === 'function') renderMembershipPlans();
            }
        };
    }

    // --- Utility: Professional Toast Notification Stack ---
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-stack-container';
    toastContainer.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column-reverse;
        gap: 12px;
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(toastContainer);

    // Expose utility functions for modules
    window.showToast = (message, color = "var(--accent-purple)") => {
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: rgba(13, 13, 18, 0.95);
            border: 1px solid ${color};
            border-left: 4px solid ${color};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 500;
            font-size: 0.85rem;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            pointer-events: auto;
            min-width: 280px;
            max-width: 350px;
            transform: translateX(120%);
            transition: all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);
        requestAnimationFrame(() => { toast.style.transform = "translateX(0)"; });
        setTimeout(() => {
            toast.style.transform = "translateX(120%)";
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    };

    window.showLoading = (message = "Cargando...") => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: message,
                allowOutsideClick: false,
                background: '#1f1f2e',
                color: '#fff',
                didOpen: () => {
                    Swal.showLoading();
                    const loader = Swal.getPopup().querySelector('.swal2-loader');
                    if (loader) loader.style.borderColor = 'var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent';
                }
            });
        }
    };

    window.hideLoading = () => {
        if (typeof Swal !== 'undefined') {
            Swal.close();
        }
    };

    // --- Check for Mercado Pago Callback ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        showToast("¡Pago procesado con éxito! Bienvenido 🥋", "#22c55e");
        // Remove query params without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('payment') === 'failure') {
        showToast("El pago no pudo completarse. Intenta de nuevo. ❌", "#ef4444");
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const debugMsg = (m) => {
        if (import.meta.env && import.meta.env.DEV) {
        }
    };
    debugMsg("App Initializing...");

    // --- State Management ---
    // Extend the imported store's appState instead of creating a new object,
    // so that window.appState and the local appState variable reference the SAME object.
    Object.assign(appState, {
        attendance: 0,
        attendanceGoal: 4,
        membershipLimit: 2,
        reservations: [],
        tournaments: [],
        classes: [],
        plans: [],
        isAdminMode: localStorage.getItem('isAdminMode') === 'true',
        activeFilter: 'Todas',
        selectedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        role: 'athlete',
        level: 0,
        xp: 0,
        notifications: [],
        membershipExpiry: '2026-02-28',
        attendanceHistoryCount: 0,
        surchargePct: 30, // Default 30%
        unsubscribeReservations: null,
        activePromo: null,
        proRataPreference: null
    });
    window.appState = appState;

    const motivationalQuotes = [
        "El único entrenamiento malo es el que no sucedió.",
        "No entrenas para ser mejor que otros, entrenas para que tu 'yo' de ayer no pueda alcanzarte.",
        "La disciplina es el puente entre la intención y el cinturón negro.",
        "El sudor es la tinta con la que escribes tu propia historia de superación.",
        "En el dojo, el ego es el primer oponente que debes derribar antes de saludar al maestro.",
        "La mente domina, el cuerpo obedece; si la mente no se rinde, el cuerpo es invencible.",
        "La calma en el combate no nace de la falta de miedo, sino del exceso de preparación.",
        "Caer siete veces y levantarse ocho no es solo una técnica de Jiu Jitsu/Judo/Wrestling, es una filosofía de vida.",
        "El dolor del entrenamiento es temporal, pero el orgullo de la victoria sobre ti mismo es eterno.",
        "No busques una vida fácil, busca la fortaleza mental para superar una difícil.",
        "Tu mayor rival no está frente a ti con guantes, está dentro de ti pidiendo que te detengas. No lo escuches."
    ];

    const setRandomQuote = () => {
        const quoteEl = document.getElementById('motivational-quote');
        if (quoteEl) {
            const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
            quoteEl.innerText = `"${motivationalQuotes[randomIndex]}"`;
        }
    };

    // --- Admin Mode Transition Logic ---
    const updateAdminUIVisibility = () => {
        const navAdmin = document.getElementById('nav-admin');
        const btnBackProfile = document.getElementById('btn-back-admin');
        const btnBackDash = document.getElementById('btn-dashboard-back-admin');

        if (appState.role === 'admin') {
            // Admin role items that stay visible or functional
            if (appState.isAdminMode) {
                if (navAdmin) navAdmin.classList.remove('hidden');
                if (btnBackProfile) btnBackProfile.classList.remove('hidden');
                if (btnBackDash) btnBackDash.classList.remove('hidden');
            } else {
                // If not in admin mode, we still show the entry points
                if (navAdmin) navAdmin.classList.add('hidden'); // Nav only in admin mode? Actually prompt says "Visible way to return"
                if (btnBackProfile) btnBackProfile.classList.remove('hidden');
                if (btnBackDash) btnBackDash.classList.remove('hidden');
            }
        } else {
            if (navAdmin) navAdmin.classList.add('hidden');
            if (btnBackProfile) btnBackProfile.classList.add('hidden');
            if (btnBackDash) btnBackDash.classList.add('hidden');
        }

        // --- Fix 1: Hide "Informar Pago" for Admin ---
        // (Informar pago uses removed button, but we ensure we don't break if id is referenced)

        // Modal toggles
    };

    const setAdminMode = (active) => {
        debugMsg(`Setting Admin Mode: ${active}`);
        appState.isAdminMode = active;
        localStorage.setItem('isAdminMode', active);
        updateAdminUIVisibility();
        if (active) {
            switchScreen('admin-panel');
            showToast("Modo Administrador Activo 🛡️", "#ef4444");
        } else {
            switchScreen('dashboard');
            showToast("Modo Usuario Activo 👤");
        }
    };

    // --- Supabase Service Layer (CRUD) ---
    // SupabaseService moved to ./services/supabaseService.js

    // --- Mercado Pago Integration ---
    const MP_PUBLIC_KEY = 'APP_USR-126c732c-4185-4911-82a0-e7452c2f1243';
    const mp = (typeof MercadoPago !== 'undefined')
        ? new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-CL' })
        : null;

    const PaymentService = {
        async createPreference(planData) {
            console.log("Creando Preferencia de Mercado Pago para:", planData.name);
            showToast("Conectando con Mercado Pago... 💳", "#22c55e");

            const user = auth.currentUser;
            if (!user) return showToast("Debes iniciar sesión", "#ef4444");

            try {
                // Call Supabase Edge Function
                const { data, error } = await window.supabase.functions.invoke('create-mp-preference', {
                    body: {
                        plan: planData,
                        userId: user.uid,
                        userEmail: user.email
                    }
                });

                if (error) {
                    throw new Error("Error en el servidor al generar el pago: " + error.message);
                }

                if (appState.activePromo) {
                    await window.supabase.from('profiles').update({ active_promo: appState.activePromo.code }).eq('id', user.uid);
                }

                if (data && data.init_point) {
                    showToast("Redirigiendo a entorno seguro... 🔒", "#22c55e");
                    // Redirect to the Checkout Pro URL from MP
                    window.location.href = data.init_point;
                } else {
                    throw new Error("No se pudo obtener el link de pago");
                }
            } catch (error) {
                console.error("Payment creation error:", error);
                showToast("Fallo al conectar con la pasarela de pagos ❌", "#ef4444");
            }
        }
    };

    // --- Navigation & Core UI ---
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    const triggerScreenAppear = (screenEl) => {
        if (!screenEl) return;
        screenEl.classList.remove('screen-appear');
        void screenEl.offsetWidth;
        screenEl.classList.add('screen-appear');
    };

    const switchScreen = (id) => {
        debugMsg(`Switching to screen: ${id}`);
        navItems.forEach(item => {
            if (item.getAttribute('data-screen') === id) item.classList.add('active');
            else item.classList.remove('active');
        });
        screens.forEach(s => {
            s.classList.remove('active');
            s.classList.remove('screen-appear');
        });
        const target = document.getElementById(id);
        if (target) {
            target.classList.add('active');
            triggerScreenAppear(target);
        }

        if (id === 'dashboard') {
            updateAttendanceUI();
            renderDashboardNextClass();
            renderDashboardNotifications();
            setRandomQuote();
        }
        if (id === 'schedule') renderSchedule();
        if (id === 'tournaments') renderTournaments();
        if (id === 'notifications') renderNotifications();
        if (id === 'profile') {
            updateProfileStats();
            renderPayments();
        }
    };

    const calculateDynamicStats = (attendance) => {
        appState.attendanceHistoryCount = attendance.length;

        if (!attendance || attendance.length === 0) {
            appState.currentMonthAttendance = 0;
            appState.currentStreak = 0;
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        appState.currentMonthAttendance = attendance.filter(a => {
            const d = new Date(a.attended_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const uniqueDays = [...new Set(attendance.map(a => new Date(a.attended_at).toISOString().split('T')[0]))].sort().reverse();

        let streak = 0;
        let d = new Date();
        let todayStr = d.toISOString().split('T')[0];

        if (uniqueDays.includes(todayStr)) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            let y = new Date();
            y.setDate(y.getDate() - 1);
            let yesterdayStr = y.toISOString().split('T')[0];
            if (uniqueDays.includes(yesterdayStr)) {
                streak++;
                d.setDate(d.getDate() - 2);
            }
        }

        if (streak > 0) {
            while (true) {
                let dateStr = d.toISOString().split('T')[0];
                if (uniqueDays.includes(dateStr)) {
                    streak++;
                    d.setDate(d.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        appState.currentStreak = streak;
    };

    const updateProfileStats = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const attendance = await SupabaseService.getAttendance(user.uid);
            calculateDynamicStats(attendance);

            // Calculate weekly stats for the chart (Last 4 weeks)
            const now = new Date();
            const weeklyAttendance = [0, 0, 0, 0];

            attendance.forEach(att => {
                const attDate = new Date(att.attended_at);
                const diffDays = Math.floor((now - attDate) / (1000 * 60 * 60 * 24));
                const weekIndex = Math.floor(diffDays / 7);
                if (weekIndex >= 0 && weekIndex < 4) {
                    weeklyAttendance[3 - weekIndex]++;
                }
            });

            updateRankUI();

            // For now the chart shows attendance, but we could scale it to XP
            initProfileChart(weeklyAttendance);
        } catch (err) {
            console.error("Error updating profile stats:", err);
        }
    };

    // --- Improved Secret Navigation Trick for Admin ---
    let homeClickCounter = 0;
    let homeClickTimer = null;

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.getAttribute('data-screen');

            // Secret Gesture for Admin
            if (appState.role === 'admin') {
                if (screenId === 'dashboard') {
                    homeClickCounter++;
                    debugMsg(`Home clicks: ${homeClickCounter}`);
                    clearTimeout(homeClickTimer);

                    if (homeClickCounter >= 3) {
                        setAdminMode(true);
                        homeClickCounter = 0;
                        return;
                    }

                    homeClickTimer = setTimeout(() => {
                        homeClickCounter = 0;
                    }, 1000);
                } else {
                    homeClickCounter = 0;
                }
            }

            // Normal Navigation
            if (screenId === 'admin-panel') {
                if (appState.role === 'admin') {
                    setAdminMode(true);
                } else {
                    showToast("Acceso restringido 🔒", "#ef4444");
                    return;
                }
            }
            switchScreen(screenId);
        });
    });

    // Auth State Observer — Refactored for robustness v1.4.6
    let authInitialized = false;
    let currentUserId = null;

    const showAuthLoadingScreen = (message = 'CARGANDO DATOS...', showRetry = false, errorDetail = '') => {
        const authScreen = document.getElementById('auth-screen');
        if (!authScreen) return;
        authScreen.innerHTML = `
            <div id="auth-loading-container" style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; background: var(--bg-dark, #0d0d12); padding: 20px;">
                <div style="width: 220px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 25px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
                    <div id="auth-load-bar" style="height: 100%; background: linear-gradient(90deg, var(--accent-cyan, #00f0ff), var(--neon-blue, #0055ff)); border-radius: 10px; animation: cyberLoad 1.5s infinite ease-in-out alternate; width: 60%; box-shadow: 0 0 10px var(--accent-cyan, #00f0ff);"></div>
                </div>
                <p id="auth-load-text" style="color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; letter-spacing: 2px; animation: pulseText 1.5s infinite alternate; font-family: 'Inter', sans-serif; text-align: center;">${message}</p>
                ${errorDetail ? `<p style="color: #ef4444; font-size: 0.75rem; margin-top: 10px; text-align: center; max-width: 300px; opacity: 0.8;">${errorDetail}</p>` : ''}
                ${showRetry ? `<button id="btn-auth-retry" style="margin-top: 20px; padding: 10px 24px; background: rgba(139,92,246,0.2); border: 1px solid var(--accent-purple); color: white; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: all 0.3s;">🔄 Reintentar</button>` : ''}
                <style>
                @keyframes cyberLoad { 0% { transform: translateX(-100%); } 100% { transform: translateX(150%); } }
                @keyframes pulseText { 0% { opacity: 0.4; } 100% { opacity: 1; } }
                </style>
            </div>`;

        const retryBtn = document.getElementById('btn-auth-retry');
        if (retryBtn) {
            retryBtn.onmouseover = () => { retryBtn.style.background = 'var(--accent-purple)'; };
            retryBtn.onmouseout = () => { retryBtn.style.background = 'rgba(139,92,246,0.2)'; };
            retryBtn.onclick = () => {
                authScreen.innerHTML = '';
                // Force re-trigger by reloading auth state
                window.supabase.auth.getSession().then(({ data }) => {
                    handleAuthSession(data.session);
                });
            };
        }
    };

    const setupRealtimeSubscriptions = (user, profile) => {
        // Cleanup previous subscriptions
        if (appState._channels) {
            appState._channels.forEach(ch => {
                try { window.supabase.removeChannel(ch); } catch (e) { }
            });
        }
        appState._channels = [];

        const styleSelect = document.getElementById('user-combat-style');

        // Profile Subscription
        const profileChannel = window.supabase
            .channel(`profile:${user.uid}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                filter: `id=eq.${user.uid}`,
                schema: 'public',
                table: 'profiles'
            }, payload => {
                debugMsg("Profile updated in real-time");
                const newData = payload.new;
                Object.assign(profile, newData);
                appState.level = newData.level;
                appState.xp = newData.xp;
                appState.membershipLimit = newData.membership_limit;
                appState.membershipStatus = newData.membership_status || 'inactive';
                if (styleSelect && newData.combat_style) {
                    styleSelect.value = newData.combat_style;
                }
                updateRankUI();
                updateAdminUIVisibility();
            })
            .subscribe();
        appState._channels.push(profileChannel);

        // Global Subscriptions for Classes & Plans
        const globalChannel = window.supabase
            .channel('global-data')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, async () => {
                try {
                    appState.classes = await SupabaseService.getClasses();
                    renderSchedule();
                } catch (e) { console.error('Realtime classes error:', e); }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_plans' }, async () => {
                try {
                    appState.plans = await SupabaseService.getPlans();
                } catch (e) { console.error('Realtime plans error:', e); }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `user_id=eq.${user.uid}` }, async () => {
                try {
                    appState.tournaments = await SupabaseService.getTournaments(user.uid);
                    renderTournaments();
                    renderDashboardNotifications();
                } catch (e) { console.error('Realtime tournaments error:', e); }
            })
            .subscribe();
        appState._channels.push(globalChannel);

        // Real-time Payments Subscription (Admin only)
        if (appState.role === 'admin') {
            const paymentsChannel = window.supabase
                .channel('admin-payments')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
                    debugMsg("Real-time payment update received!");
                    const adminAreaTitle = document.querySelector('#admin-content-area h3')?.innerText;
                    if (adminAreaTitle && (adminAreaTitle.includes('Validación de Pagos') || adminAreaTitle.includes('Pagos'))) {
                        renderAdminPayments();
                    }
                    showToast("¡Actualización de pago detectada! 💳", "#22c55e");
                })
                .subscribe();
            appState._channels.push(paymentsChannel);
        }

        // Reservations Subscription
        if (appState.unsubscribeReservations) appState.unsubscribeReservations();

        const reservationChannel = window.supabase
            .channel(`reservations:${user.uid}`)
            .on('postgres_changes', {
                event: '*',
                filter: `user_id=eq.${user.uid}`,
                schema: 'public',
                table: 'reservations'
            }, async () => {
                debugMsg("Reservations updated in real-time (Supabase)");
                try {
                    const res = await SupabaseService.getReservations(appState.selectedDate);
                    appState.reservations = res.filter(r => r.user_id === user.uid).map(r => r.class_id);
                    appState.allUserReservations = await SupabaseService.getUserReservations(user.uid);
                    appState.xp = (profile.xp || 0) + ((appState.allUserReservations?.length || 0) * 50);
                    updateRankUI();
                    renderSchedule();
                    updateAttendanceUI();
                } catch (e) { console.error('Realtime reservations error:', e); }
            })
            .subscribe();

        appState.unsubscribeReservations = () => {
            window.supabase.removeChannel(reservationChannel);
        };
        appState._channels.push(reservationChannel);
    };

    const loadUserDataInBackground = async (user, profile) => {
        // This runs AFTER the UI is already visible
        try {
            // Fetch Attendance History
            const attendanceData = await withTimeout(
                SupabaseService.getAttendance(user.uid),
                8000,
                'Asistencia'
            );
            calculateDynamicStats(attendanceData || []);
            updateAttendanceUI();
        } catch (err) {
            console.warn("[Background] Error loading attendance:", err.message);
        }

        try {
            // Fetch Notifications
            if (appState.role === 'admin') {
                appState.notifications = await withTimeout(SupabaseService.getNotifications(), 8000, 'Notificaciones admin');
            } else {
                const allNotifs = await withTimeout(SupabaseService.getNotifications(), 8000, 'Notificaciones');
                appState.notifications = allNotifs.filter(n => n.is_active !== false);
            }
        } catch (err) {
            console.warn("[Background] Error loading notifications:", err.message);
        }

        try {
            // Classes, Plans & Tournaments
            const [fetchedClasses, fetchedPlans, fetchedTournaments, fetchedAllRes] = await Promise.all([
                withTimeout(SupabaseService.getClasses(), 8000, 'Clases'),
                withTimeout(SupabaseService.getPlans(), 8000, 'Planes'),
                withTimeout(SupabaseService.getTournaments(user.uid), 8000, 'Torneos'),
                withTimeout(SupabaseService.getUserReservations(user.uid), 8000, 'Reservas')
            ]);
            if (fetchedClasses) appState.classes = fetchedClasses;
            if (fetchedPlans) {
                appState.plans = fetchedPlans;
                if (window.renderPaymentTabs) window.renderPaymentTabs();
            }
            if (fetchedTournaments) appState.tournaments = fetchedTournaments;
            if (fetchedAllRes) {
                appState.allUserReservations = fetchedAllRes;
                appState.xp = (appState.xp || 0) + (fetchedAllRes.length * 50);
            }
            renderSchedule();
            renderTournaments();
            renderDashboardNextClass();
            updateAttendanceUI();
        } catch (err) {
            console.warn("[Background] Error fetching initial data:", err.message);
            showToast("Algunos datos no cargaron. Intenta refrescar. 🔄", "#eab308");
        }

        try {
            // Initial Reservations Fetch
            const initialRes = await withTimeout(SupabaseService.getReservations(appState.selectedDate), 8000, 'Reservas iniciales');
            appState.reservations = initialRes.filter(r => r.user_id === user.uid).map(r => r.class_id);
            renderSchedule();
            updateAttendanceUI();
        } catch (err) {
            console.warn("[Background] Error loading initial reservations:", err.message);
        }

        // Setup real-time subscriptions only after basic data is loaded
        setupRealtimeSubscriptions(user, profile);
    };

    const handleAuthSession = async (session) => {
        console.log('[Auth] handleAuthSession called. Session exists:', !!session, 'User exists:', !!session?.user);
        const supabaseUser = session?.user;
        let user = null;
        if (supabaseUser) {
            user = { ...supabaseUser, uid: supabaseUser.id, email: supabaseUser.email };
        }

        const authScreen = document.getElementById('auth-screen');
        const appContainer = document.getElementById('app-container');

        if (!user) {
            console.log('[Auth] No user in session, showing auth screen');
            authScreen.classList.remove('hidden');
            triggerScreenAppear(authScreen);
            appContainer.classList.add('hidden');
            authInitialized = false;
            currentUserId = null;
            appState.user = null;
            return;
        }

        // CRITICAL FIX: Prevent duplicate processing for the same user.
        // Supabase's _recoverAndRefresh triggers onAuthStateChange multiple times
        // for the same session, which was overwriting a working UI with an error screen.
        if (currentUserId === user.uid && appState.user) {
            console.log('[Auth] Same user already logged in, skipping duplicate session handler');
            return;
        }

        appState.user = user;
        currentUserId = user.uid;
        console.log('[Auth] User found:', user.email, '- starting profile load...');

        // Show loading screen with timeout fail-safe
        showAuthLoadingScreen('CARGANDO DATOS...');
        const loadStartTime = Date.now();
        const LOAD_TIMEOUT = 15000; // 15 seconds max

        let profile = null;
        let loadError = null;

        try {
            // Step 1: Get profile with generous timeout (30s) and 1 retry
            // Localhost/development connections to Supabase can be slow
            profile = await withRetry(
                () => withTimeout(SupabaseService.getProfile(user.uid), 30000, 'Perfil'),
                { maxRetries: 1, delayMs: 2000, context: 'Cargar perfil' }
            );

            if (!profile) {
                debugMsg("Profile not found in Supabase. Creating...");
                await withRetry(
                    () => withTimeout(SupabaseService.createProfile(user), 30000, 'Crear perfil'),
                    { maxRetries: 1, delayMs: 2000, context: 'Crear perfil' }
                );
                profile = await withTimeout(SupabaseService.getProfile(user.uid), 30000, 'Perfil recién creado');
            }

            // Mercado Pago callback check
            if (sessionStorage.getItem('mp_payment_success') === 'true') {
                sessionStorage.removeItem('mp_payment_success');
                try {
                    const payments = await SupabaseService.getPayments(user.uid);
                    const pendingPayment = payments.find(p => p.status === 'pending');
                    if (pendingPayment) {
                        await SupabaseService.updatePaymentStatus(pendingPayment.id, 'approved', 'mercadopago');
                        showToast("Pago validado automáticamente ✨", "#22c55e");
                        const expiry = new Date();
                        expiry.setMonth(expiry.getMonth() + 1);
                        await SupabaseService.updateProfile(user.uid, {
                            membership_status: 'active',
                            membership_expiry: expiry.toISOString().split('T')[0]
                        });
                        profile = await SupabaseService.getProfile(user.uid);
                    }
                } catch (err) {
                    console.error("Error confirmando pago:", err);
                }
            }

            // Update core state
            appState.role = profile.role || 'athlete';
            appState.isAdminMode = appState.role === 'admin';
            appState.level = profile.level || 0;
            appState.xp = profile.xp || 0;
            appState.membershipLimit = profile.membership_limit || 2;
            appState.membershipStatus = profile.membership_status || 'inactive';
            appState.planTheme = profile.membership_plans?.theme || 'bronze';
            appState.plan = profile.membership_plan_id;
            appState.photoURL = profile.photo_url || '../images/icon-192.png';

            // UI Updates - basic info
            const greetingSpan = document.querySelector('.greeting');
            if (greetingSpan) {
                greetingSpan.textContent = `¡Hola, ${profile.full_name || user.displayName || 'Atleta'}!`;
            }

            const planNameEl = document.getElementById('profile-plan-name');
            const planStatusEl = document.getElementById('profile-plan-status');
            const planRemainingEl = document.getElementById('profile-plan-remaining');
            const planProgressEl = document.getElementById('profile-plan-progress');

            if (planNameEl) {
                planNameEl.textContent = profile.membership_plans?.name || (profile.membership_status === 'active' ? 'PLAN ACTIVO' : 'SIN PLAN');
                if (profile.membership_expiry) {
                    const expiryDate = new Date(profile.membership_expiry);
                    const today = new Date();
                    if (expiryDate > today) {
                        planStatusEl.textContent = 'ACTIVO';
                        planStatusEl.style.background = '#22c55e';
                        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        planRemainingEl.textContent = `${diffDays} Días restantes`;
                        const progress = Math.max(0, Math.min(100, ((30 - diffDays) / 30) * 100));
                        if (planProgressEl) planProgressEl.style.width = `${progress}%`;
                    } else {
                        planStatusEl.textContent = 'INACTIVO';
                        planStatusEl.style.background = '#ef4444';
                        planRemainingEl.textContent = 'Renovación requerida';
                    }
                }
            }

            updateRankUI();

            // Style selector
            const styleSelect = document.getElementById('user-combat-style');
            if (styleSelect) {
                styleSelect.value = profile.combat_style || 'striker';
                styleSelect.onchange = async (e) => {
                    const newStyle = e.target.value;
                    window.showLoading("Guardando estilo...");
                    try {
                        await SupabaseService.updateProfile(user.uid, { combat_style: newStyle });
                        window.hideLoading();
                        showToast("¡Estilo actualizado!", "#22c55e");
                    } catch (err) {
                        console.error(err);
                        showToast("Error al guardar estilo", "#ef4444");
                    }
                };
            }

            // Final UI Config
            const navAdmin = document.getElementById('nav-admin');
            const athleteNavs = document.querySelectorAll('.nav-item:not(#nav-admin)');

            if (appState.role === 'admin') {
                athleteNavs.forEach(nav => nav.classList.remove('hidden'));
            } else {
                if (navAdmin) navAdmin.classList.add('hidden');
            }

            updateAdminUIVisibility();
            renderDateCarousel();

            // Admin Entry Point Listeners
            const btnBackProfile = document.getElementById('btn-back-admin');
            const btnBackDash = document.getElementById('btn-dashboard-back-admin');
            if (btnBackProfile) btnBackProfile.onclick = () => setAdminMode(true);
            if (btnBackDash) btnBackDash.onclick = () => setAdminMode(true);

            // Check membership status
            if (appState.role !== 'admin' && profile.membership_status !== 'active') {
                appContainer.classList.add('hidden');

                const now = new Date();
                const systemMonthYear = `${now.getMonth()}-${now.getFullYear()}`;
                const savedMonthYear = profile.proRataMonthYear || "";

                if (profile.proRataPreference && savedMonthYear === systemMonthYear) {
                    appState.proRataPreference = profile.proRataPreference;
                } else if (profile.proRataPreference) {
                    debugMsg("Pro-rata preference from previous month reset.");
                    appState.proRataPreference = null;
                    if (typeof db !== 'undefined' && db.collection) {
                        db.collection('users').doc(user.uid).set({
                            proRataPreference: null,
                            proRataMonthYear: null,
                            proRataSelectionDate: null,
                            proRataExpiredInMonth: true
                        }, { merge: true }).catch(e => console.error("Error resetting data:", e));
                    }
                }

                if (profile.proRataExpiredInMonth) {
                    showToast("⚠️ Tu opción proporcional anterior expiró al terminar el mes. Se ha restablecido a pago de mes completo.", "#8b5cf6");
                    window.supabase.from('profiles').update({ pro_rata_expired_in_month: null }).eq('id', user.uid).catch(e => console.error("Error clearing expiration flag:", e));
                }

                renderMembershipPlans();

                const systemDay = now.getDate();
                if (!appState.proRataPreference && systemDay >= 15) {
                    const prScreen = document.getElementById('pro-rata-info-screen');
                    const msScreen = document.getElementById('membership-selection-screen');
                    if (prScreen) { prScreen.classList.remove('hidden'); triggerScreenAppear(prScreen); }
                    if (msScreen) msScreen.classList.add('hidden');

                    const updateDbPreference = async (pref) => {
                        try {
                            appState.proRataPreference = pref;
                            if (typeof db !== 'undefined' && db.collection) {
                                await db.collection('users').doc(user.uid).set({
                                    proRataPreference: pref,
                                    proRataMonthYear: systemMonthYear,
                                    proRataSelectionDate: now.toISOString()
                                }, { merge: true });
                            }
                            renderMembershipPlans();
                            if (prScreen) prScreen.classList.add('hidden');
                            if (msScreen) { msScreen.classList.remove('hidden'); triggerScreenAppear(msScreen); }
                        } catch (e) {
                            console.error("Error saving preference:", e);
                            showToast("Error al guardar preferencia", "#ef4444");
                        }
                    };

                    document.getElementById('btn-option-proportional').onclick = () => updateDbPreference('proportional');
                    document.getElementById('btn-option-full').onclick = () => updateDbPreference('full');
                } else {
                    document.getElementById('pro-rata-info-screen').classList.add('hidden');
                    const msScreen = document.getElementById('membership-selection-screen');
                    if (msScreen) { msScreen.classList.remove('hidden'); triggerScreenAppear(msScreen); }
                }
            } else {
                // SHOW APP IMMEDIATELY
                authScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');

                if (window.location.hash === '#payments') {
                    switchScreen('profile');
                    document.getElementById('payment-modal')?.classList.add('active');
                } else {
                    const targetScreen = appState.isAdminMode ? 'admin-panel' : 'dashboard';
                    switchScreen(targetScreen);

                    if (appState.isAdminMode) {
                        const area = document.getElementById('admin-content-area');
                        if (area) {
                            area.innerHTML = `<div class="p-20 text-center glass" style="border-radius: 12px; margin-top: 20px;">
                                <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--accent-purple); margin-bottom: 10px;"></i>
                                <h3>Panel de Control</h3>
                                <p style="color: var(--text-gray); font-size: 0.9rem;">Selecciona una opción del menú superior para comenzar.</p>
                            </div>`;
                            if (window.lucide) window.lucide.createIcons();
                        }
                    }
                }

                // Load heavy data in background AFTER UI is visible
                loadUserDataInBackground(user, profile);

                // Messaging init (non-blocking)
                initMessaging(user.uid).catch(() => { });
            }

        } catch (err) {
            loadError = err;
            console.error("[Auth] Critical error during login:", err);
            const isNetErr = isNetworkError(err);
            showAuthLoadingScreen(
                'Error al cargar',
                true,
                isNetErr ? 'Parece que hay un problema de conexión. Verifica tu red e intenta de nuevo.' : (err.message || 'Error desconocido al iniciar sesión.')
            );
            return; // Don't proceed - wait for retry
        }

        // Final UI updates
        const profileName = document.getElementById('profile-user-name');
        const navUserName = document.getElementById('nav-user-name');
        const displayName = user.displayName || (appState.role === 'admin' ? 'Administrador' : 'Atleta');

        if (profileName) profileName.innerText = displayName;
        if (navUserName) navUserName.innerText = displayName;

        const avatarImg = document.getElementById('profile-avatar');
        if (avatarImg) avatarImg.src = appState.photoURL || '../images/icon-192.png';
    };

    window.supabase.auth.onAuthStateChange(async (event, session) => {
        // FIXED: Process SIGNED_IN always — it's the event fired after manual login
        if (event === 'SIGNED_IN') {
            authInitialized = true;
            await handleAuthSession(session);
            return;
        }
        if (event === 'INITIAL_SESSION' && authInitialized) {
            return;
        }
        if (event === 'INITIAL_SESSION') {
            authInitialized = true;
        }
        await handleAuthSession(session);
    });

    // CRITICAL FIX: Explicitly get existing session on app load.
    // onAuthStateChange(INITIAL_SESSION) does NOT always fire if the session
    // is already restored before the listener is registered (race condition).
    // Supabase restores session from localStorage asynchronously, so we poll
    // for up to 5 seconds until the session is ready.
    (async () => {
        const MAX_ATTEMPTS = 20; // 20 x 500ms = 10 seconds max
        const INTERVAL_MS = 500;
        let attempts = 0;
        let pollInterval = null;

        // Wait for window.supabase to be available (supabase-config.js loads in parallel)
        while (!window.supabase && attempts < MAX_ATTEMPTS) {
            console.log('[Auth] Waiting for window.supabase to be ready...');
            await new Promise(r => setTimeout(r, INTERVAL_MS));
            attempts++;
        }

        if (!window.supabase) {
            console.error('[Auth] window.supabase never became available. Check supabase-config.js loading.');
            return;
        }

        attempts = 0;

        const tryGetSession = async () => {
            try {
                const { data, error } = await window.supabase.auth.getSession();
                if (error) {
                    console.error('[Auth] getSession error:', error);
                    return false;
                }
                if (data.session && !authInitialized) {
                    console.log('[Auth] Session found via getSession(), triggering handleAuthSession...');
                    authInitialized = true;
                    await handleAuthSession(data.session);
                    return true;
                }
                return false;
            } catch (err) {
                console.error('[Auth] Critical error calling getSession():', err);
                return false;
            }
        };

        // Try immediately
        if (await tryGetSession()) return;

        // If no session yet, Supabase may still be restoring from localStorage.
        // Poll every 500ms for up to 10 seconds.
        pollInterval = setInterval(async () => {
            attempts++;
            if (authInitialized) {
                // Session was already handled by onAuthStateChange, stop polling
                clearInterval(pollInterval);
                return;
            }
            if (await tryGetSession()) {
                clearInterval(pollInterval);
                return;
            }
            if (attempts >= MAX_ATTEMPTS) {
                clearInterval(pollInterval);
                console.log('[Auth] No active session found after polling.');
                // Ensure auth screen is visible if no session
                const authScreen = document.getElementById('auth-screen');
                const appContainer = document.getElementById('app-container');
                if (authScreen) {
                    authScreen.classList.remove('hidden');
                    triggerScreenAppear(authScreen);
                }
                if (appContainer) appContainer.classList.add('hidden');
            }
        }, INTERVAL_MS);
    })();

    initAuthUI(switchScreen, renderMembershipPlans);

    // --- Profile Avatar Logic ---
    const btnEditAvatar = document.getElementById('btn-edit-avatar');
    const btnDeleteAvatar = document.getElementById('btn-delete-avatar');
    const avatarInput = document.getElementById('avatar-input');

    if (btnEditAvatar && avatarInput) {
        btnEditAvatar.onclick = () => avatarInput.click();
        avatarInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const user = auth.currentUser;
            if (!user) return;

            showToast("Subiendo imagen... 📸");
            try {
                const url = await SupabaseService.uploadAvatar(user.uid, file);

                await user.updateProfile({ photoURL: url });
                await SupabaseService.updateProfile(user.uid, { photo_url: url });

                const avatarImg = document.getElementById('profile-avatar');
                if (avatarImg) avatarImg.src = url;
                showToast("Foto de perfil actualizada ✨", "#22c55e");
            } catch (err) {
                console.error(err);
                showToast("Error al subir foto ❌", "#ef4444");
            }
        };
    }

    if (btnDeleteAvatar) {
        btnDeleteAvatar.onclick = async () => {
            const user = auth.currentUser;
            if (!user) return;

            showToast("Eliminando foto... 🗑️");
            try {
                await user.updateProfile({ photoURL: "" });
                await SupabaseService.updateProfile(user.uid, { photo_url: null });

                const avatarImg = document.getElementById('profile-avatar');
                if (avatarImg) avatarImg.src = '../images/icon-192.png';

                showToast("Foto eliminada ✅");
            } catch (err) {
                console.error(err);
                showToast("Error al eliminar ❌", "#ef4444");
            }
        };
    }

    // Exit Admin Mode Action
    const btnExitAdmin = document.getElementById('btn-exit-admin-mode');
    if (btnExitAdmin) {
        btnExitAdmin.onclick = () => setAdminMode(false);
    }

    // --- Profile Chart Logic ---
    let profileChartInstance = null;
    const initProfileChart = (dataValues = [0, 0, 0, 0]) => {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;
        if (profileChartInstance) profileChartInstance.destroy();

        // Start empty if no progress provided
        const finalData = dataValues.every(v => v === 0) ? [0, 0, 0, 0] : dataValues;

        profileChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [{
                    label: 'Clases',
                    data: finalData,
                    borderColor: '#CBF2F0',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(203, 242, 240, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false, beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    // --- Schedule & Tournaments Rendering ---
    const renderDateCarousel = () => {
        const container = document.querySelector('.date-carousel-premium');
        if (!container) return;

        const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        const today = new Date();
        let html = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const isActive = dateStr === appState.selectedDate;

            html += `
                <div class="date-chip ${isActive ? 'active' : ''}" data-date="${dateStr}">
                    <span>${days[date.getDay()]}</span>
                    <p>${date.getDate()}</p>
                </div>
            `;
        }

        container.innerHTML = html;

        container.querySelectorAll('.date-chip').forEach(chip => {
            chip.onclick = async () => {
                appState.selectedDate = chip.getAttribute('data-date');
                renderDateCarousel();

                // Re-subscribe or re-fetch for this date
                const user = auth.currentUser;
                if (user) {
                    const res = await SupabaseService.getReservations(appState.selectedDate);
                    appState.reservations = res.filter(r => r.user_id === user.uid).map(r => r.class_id);
                    renderSchedule();
                }
            };
        });
    };

    let isProcessingReservation = false;
    window.toggleReservation = async (classId) => {
        if (isProcessingReservation) return;
        const user = auth.currentUser;
        if (!user) {
            showToast("Inicia sesión 🔒", "#ef4444");
            return;
        }

        const d = new Date();
        const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        if (appState.role !== 'admin' && appState.selectedDate !== todayStr) {
            showToast("Solo puedes agendar clases para el día de hoy 📅", "#ef4444");
            return;
        }

        const cls = appState.classes.find(c => c.id === classId);
        if (!cls) return;
        const isBooked = appState.reservations.includes(classId);

        isProcessingReservation = true;
        try {
            if (isBooked) {
                const now = new Date();
                const classDateTime = new Date(`${appState.selectedDate}T${cls.time}`);
                const hoursDiff = (classDateTime - now) / (1000 * 60 * 60);

                if (appState.role !== 'admin' && hoursDiff < 1) {
                    showToast("No puedes cancelar a menos de 1 hr ⏳", "#ef4444");
                    return;
                }

                await SupabaseService.deleteReservation(user.uid, classId, appState.selectedDate);
                // Update UI in real-time
                appState.reservations = appState.reservations.filter(id => id !== classId);
                if (appState.allUserReservations) {
                    appState.allUserReservations = appState.allUserReservations.filter(r => !(r.class_id === classId && r.reservation_date === appState.selectedDate));
                }
                setTimeout(() => {
                    renderSchedule();
                    updateAttendanceUI();
                    renderDashboardNextClass();
                }, 0);
                showToast("Reserva cancelada 🗓️", "#71717A");
            } else {
                if (appState.membershipStatus !== 'active' && appState.role !== 'admin') {
                    showToast("Membresía inactiva. ¡Actívala ahora! 🔒", "#f59e0b");
                    switchScreen('membership');
                    return;
                }

                // Check Plan Day Restrictions
                if (appState.plan) {
                    const currentPlan = appState.plans.find(p => p.name === appState.plan || p.id === appState.plan);
                    if (currentPlan && currentPlan.days && currentPlan.days.length > 0) {
                        const currentDay = new Date(appState.selectedDate + 'T12:00:00').getDay();
                        if (!currentPlan.days.includes(currentDay)) {
                            return showToast("Plan no válido para este día 🗓️", "#ef4444");
                        }
                    }

                    // Monthly Limit Check
                    const currentMonth = appState.selectedDate.substring(0, 7);
                    const monthlyReservations = appState.allUserReservations ? appState.allUserReservations.filter(r => r.reservation_date && r.reservation_date.startsWith(currentMonth)) : [];

                    let monthlyLimit = 999;
                    if (currentPlan) {
                        monthlyLimit = currentPlan.monthly || 999;
                    }

                    if (monthlyReservations.length >= monthlyLimit) {
                        const upsellModal = document.getElementById('upsell-modal');
                        if (upsellModal) {
                            upsellModal.classList.remove('hidden');
                            lucide.createIcons();
                        }
                        isProcessingReservation = false;
                        return showToast("Límite mensual agotado ⚠️", "#eab308");
                    }
                }

                if (appState.reservations.length >= appState.membershipLimit) {
                    const upsellModal = document.getElementById('upsell-modal');
                    if (upsellModal) {
                        upsellModal.classList.remove('hidden');
                        lucide.createIcons();
                    }
                    isProcessingReservation = false;
                    return showToast("Límite diario alcanzado ⚠️", "#eab308");
                }

                await SupabaseService.createReservation(user.uid, classId, cls.name, appState.selectedDate);

                // Update UI in real-time
                if (!appState.reservations.includes(classId)) {
                    appState.reservations.push(classId);
                }
                if (appState.allUserReservations) {
                    appState.allUserReservations.push({
                        user_id: user.uid,
                        class_id: classId,
                        class_name: cls.name,
                        reservation_date: appState.selectedDate
                    });
                }
                setTimeout(() => {
                    renderSchedule();
                    updateAttendanceUI();
                    renderDashboardNextClass();
                }, 0);

                // Update Profile XP (Refining logic Request #2)
                let xpBonus = 10; // Base XP
                const type = (cls.type || '').toLowerCase();
                if (type.includes('gi') || type.includes('no-gi')) xpBonus = 15;
                if (type.includes('open')) xpBonus = 5;

                await SupabaseService.updateProfile(user.uid, {
                    xp: (appState.xp || 0) + xpBonus
                });

                appState.xp = (appState.xp || 0) + xpBonus;
                updateRankUI();

                showToast("¡Clase reservada con éxito! 🥋", "#22c55e");
            }
        } catch (err) {
            console.error("Supabase Reservation Error:", err);
            showToast("Error procesando reserva ❌", "#ef4444");
        } finally {
            isProcessingReservation = false;
        }
    };

    window.renderSchedule = renderSchedule;

    window.renderTournaments = renderTournaments;

    const updateAttendanceUI = () => {
        const circle = document.getElementById('attendance-circle');
        const percentLabel = document.getElementById('attendance-percent');
        const completedCountLabel = document.getElementById('completed-classes-count');
        const streakLabel = document.getElementById('user-streak-text');

        if (streakLabel) {
            streakLabel.innerText = `${appState.currentStreak || 0} Días`;
        }

        if (circle && percentLabel) {
            let limitPerWeek = appState.membershipLimit || 5;
            if (limitPerWeek > 10) limitPerWeek = 5;

            const total = limitPerWeek * 4;
            const current = appState.currentMonthAttendance || 0;
            const percent = Math.min(100, Math.round((current / total) * 100));

            let ringColor = 'var(--amaru-gold)';
            if (percent < 50) {
                ringColor = '#ef4444';
            } else if (percent < 100) {
                ringColor = '#eab308';
            } else {
                ringColor = '#22c55e';
            }
            circle.style.stroke = ringColor;

            const offset = 188.5 - (percent / 100) * 188.5;
            circle.style.strokeDashoffset = offset;
            percentLabel.innerText = `${percent}%`;

            if (completedCountLabel) {
                const targetCount = current;
                let currentCount = 0;

                const updateCounterText = (val) => {
                    completedCountLabel.innerHTML = `${val} <span style="font-size: 1rem; color: var(--text-gray); font-weight: 600;">/ ${total}</span>`;
                };

                if (targetCount > 0) {
                    const duration = 1500;
                    const interval = 30;
                    const step = Math.max(1, Math.ceil(targetCount / (duration / interval)));

                    const timer = setInterval(() => {
                        currentCount += step;
                        if (currentCount >= targetCount) {
                            currentCount = targetCount;
                            clearInterval(timer);
                            updateCounterText(currentCount);

                            if (percent >= 100 && auth.currentUser) {
                                const currentMonthKey = `goal_reward_${new Date().getFullYear()}_${new Date().getMonth()}_${auth.currentUser.uid}`;
                                if (!localStorage.getItem(currentMonthKey)) {
                                    triggerMonthlyGoalReward(currentMonthKey);
                                }
                            }
                        } else {
                            updateCounterText(currentCount);
                        }
                    }, interval);
                } else {
                    updateCounterText(0);
                }
            }
        }
    };

    const triggerMonthlyGoalReward = async (storageKey) => {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#ffffff', '#22c55e']
            });
        }

        showToast("¡Meta Mensual Alcanzada! +500 XP Extra 🏆", "var(--amaru-gold)");

        try {
            const user = auth.currentUser;
            if (user) {
                const addXp = 500;
                appState.xp = (appState.xp || 0) + addXp;
                await SupabaseService.updateProfile(user.uid, { xp: appState.xp });
                updateRankUI();
                localStorage.setItem(storageKey, 'true');
            }
        } catch (e) {
            console.error("Error giving month reward", e);
        }
    };

    const renderDashboardNextClass = () => {
        const container = document.getElementById('dynamic-next-class');
        if (!container) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const currentDayNum = now.getDay();

        let displayClass = null;
        let isBooked = false;

        // 1. Find the actual NEXT reservation for the user
        if (appState.allUserReservations && appState.allUserReservations.length > 0) {
            const sortedReservations = appState.allUserReservations
                .filter(r => r.reservation_date >= todayStr)
                .map(r => {
                    const cls = appState.classes.find(c => c.id === r.class_id);
                    if (!cls) return null;
                    const [h, m] = cls.time.split(':').map(Number);
                    return { ...r, classData: cls, totalMinutes: h * 60 + m };
                })
                .filter(r => r !== null)
                .sort((a, b) => {
                    if (a.reservation_date !== b.reservation_date) {
                        return a.reservation_date.localeCompare(b.reservation_date);
                    }
                    return a.totalMinutes - b.totalMinutes;
                });

            const nextRes = sortedReservations.find(r => {
                if (r.reservation_date > todayStr) return true;
                return r.totalMinutes > (nowMinutes + 10); // 10 min grace period
            });

            if (nextRes) {
                displayClass = nextRes.classData;
                isBooked = true;
            }
        }

        // 2. If no reservation, find next available class in schedule for today or upcoming days
        if (!displayClass && appState.classes.length > 0) {
            for (let i = 0; i < 7; i++) {
                const searchDate = new Date();
                searchDate.setDate(now.getDate() + i);
                const searchDay = searchDate.getDay();

                const dayClasses = appState.classes.filter(c => {
                    let cDays = c.days;
                    if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { } }
                    return Array.isArray(cDays) && cDays.includes(searchDay);
                }).sort((a, b) => {
                    const [ha, ma] = a.time.split(':').map(Number);
                    const [hb, mb] = b.time.split(':').map(Number);
                    return (ha * 60 + ma) - (hb * 60 + mb);
                });

                if (i === 0) {
                    const nextToday = dayClasses.find(c => {
                        const [h, m] = c.time.split(':').map(Number);
                        return (h * 60 + m) > nowMinutes;
                    });
                    if (nextToday) {
                        displayClass = nextToday;
                        break;
                    }
                } else if (dayClasses.length > 0) {
                    displayClass = dayClasses[0];
                    break;
                }
            }
        }

        if (displayClass) {
            container.classList.remove('smoke-purple', 'smoke-cyan', 'smoke-gold', 'smoke-crimson');
            if (displayClass.theme) {
                container.classList.add(displayClass.theme);
            }

            container.innerHTML = `
                <div class="card-overlay" style="backdrop-filter: blur(12px); background: linear-gradient(90deg, rgba(8, 8, 10, 0.95) 0%, rgba(8, 8, 10, 0.45) 100%);"></div>
                <div class="hero-content">
                    <span class="tag" style="background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        ${isBooked ? 'TU PRÓXIMA CITA' : 'PRÓXIMA CLASE'}
                    </span>
                    <h2 style="color: white; font-weight: 900; margin: 10px 0 5px; font-size: 1.8rem; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${displayClass.name}</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 500;"><i data-lucide="clock" style="width:14px; vertical-align: middle; margin-right: 4px;"></i> ${displayClass.time} • Coach ${displayClass.coach}</p>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        ${isBooked ? `<button class="btn-primary" id="btn-checkin-dash" style="background:white; color:black; padding: 12px 24px; font-size:0.8rem; border-radius:100px; border:none; font-weight:900; box-shadow: 0 4px 15px rgba(255,255,255,0.2);">MARCAR ASISTENCIA (+25 XP)</button>` : ''}
                        <button class="btn-glass" id="btn-dashboard-go-schedule" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 12px 24px; font-size: 0.8rem; border-radius: 100px;">VER AGENDA</button>
                    </div>
                </div>
            `;
            lucide.createIcons();

            if (isBooked) {
                const checkInBtn = document.getElementById('btn-checkin-dash');
                if (checkInBtn) checkInBtn.onclick = () => handleCheckIn(displayClass);
            }

            document.getElementById('btn-dashboard-go-schedule').onclick = () => {
                const scheduleNav = document.querySelector('[data-screen="schedule"]');
                if (scheduleNav) scheduleNav.click();
            };
        } else {
            container.innerHTML = `<div class="p-30 text-center opacity-50">No hay clases programadas próximamente</div>`;
        }
    };

    const handleCheckIn = async (cls) => {
        const user = auth.currentUser;
        if (!user) return;

        showToast("Registrando asistencia... 🥋");
        try {
            await SupabaseService.logAttendance(user.uid, cls.id, cls.name);

            // Bonus XP for attendance (gamification Request #2)
            const newXP = (appState.xp || 0) + 25;
            await SupabaseService.updateProfile(user.uid, { xp: newXP });
            appState.xp = newXP;
            appState.attendanceHistoryCount++;

            showToast("¡Asistencia confirmada! +25 XP 🔥", "#22c55e");
            updateRankUI();
            renderDashboardNextClass();
            updateAttendanceUI();
        } catch (err) {
            console.error("Check-in error:", err);
            showToast("Ya registraste asistencia hoy o hubo un error 🛡️", "#eab308");
        }
    };

    const renderDashboardNotifications = () => {
        const container = document.getElementById('motivation-container');
        if (!container) return;
        container.innerHTML = "";

        // Tournament Interactive Countdown
        const nextTourney = appState.tournaments[0];
        if (nextTourney) {
            const tourneyDate = new Date(nextTourney.date);
            const now = new Date();
            const diff = tourneyDate - now;
            const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (daysLeft > 0) {
                const card = document.createElement('div');
                card.className = 'glass-premium tournament-countdown-card';
                card.style.margin = "0 20px 20px";
                card.style.position = "relative";
                card.style.overflow = "hidden";

                card.innerHTML = `
                    <div class="countdown-bg-glow"></div>
                    <div style="position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div class="trophy-pulse">
                                <i data-lucide="trophy" style="color: #FFD700; width: 28px; height: 28px;"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 0.95rem; font-weight: 800; letter-spacing: 0.5px;">OBJETIVO: ${nextTourney.name.toUpperCase()}</h4>
                                <p style="font-size: 0.75rem; color: var(--text-gray);">Faltan <span style="color: var(--accent-cyan); font-weight: 800;">${daysLeft} días</span> para la gloria</p>
                            </div>
                        </div>
                        <div class="countdown-digits">
                            <span class="digit">${daysLeft}</span>
                            <span class="unit">DÍAS</span>
                        </div>
                    </div>
                    <div class="tournament-progress-mini">
                        <div class="t-progress-fill" style="width: ${Math.max(5, 100 - (daysLeft * 3.3))}%"></div>
                    </div>
                `;
                container.prepend(card);
            }
        }
        lucide.createIcons();
    };

    const updateRankUI = () => {
        const badge = document.getElementById('user-rank-status');
        const fill = document.querySelector('.rank-bar-fill');
        const info = document.querySelector('.rank-info-text');

        // Dynamic level calculation based on planTheme and XP
        let maxLevel = appState.planTheme === 'gold' ? 100 : appState.planTheme === 'silver' ? 30 : 10;
        let xpPerLevel = 100;
        let totalDisplayXP = Math.floor(appState.xp || 0);
        let derivedLevel = Math.min(Math.floor(totalDisplayXP / xpPerLevel), maxLevel);
        let progressPct = Math.min((totalDisplayXP % xpPerLevel) / xpPerLevel * 100, 100);
        if (derivedLevel >= maxLevel) {
            progressPct = 100;
        }

        let rankTitle = derivedLevel < 10 ? 'Nomad' : derivedLevel < 30 ? 'Warrior' : derivedLevel < 50 ? 'Elite' : 'Legend';
        appState.level = derivedLevel; // Local override based on XP

        if (appState.role === 'admin') {
            if (badge) badge.innerText = `ADMINISTRADOR • Elite`;
            if (fill) fill.style.width = `100%`;
            if (info) info.innerHTML = `<span>MAX XP</span><strong>100%</strong>`;
        } else {
            if (badge) badge.innerText = `Nivel ${derivedLevel} • ${rankTitle}`;
            if (fill) fill.style.width = `${progressPct}%`;
            if (info) info.innerHTML = `<span>${totalDisplayXP} / ${maxLevel * xpPerLevel} XP Max</span><strong>${Math.floor(progressPct)}% Lvl Up</strong>`;
        }

        // Update inline level in premium card
        const levelVal = document.querySelector('#profile-user-level span');
        if (levelVal) levelVal.innerText = appState.role === 'admin' ? 'MAX' : derivedLevel;

        // Update Dashboard indicator too (Request #2)
        const dashLvlFill = document.querySelector('.lvl-fill');
        const dashLvlText = document.querySelector('.level-indicator span');
        if (dashLvlFill) dashLvlFill.style.width = appState.role === 'admin' ? '100%' : `${progressPct}%`;
        if (dashLvlText) dashLvlText.innerText = appState.role === 'admin' ? 'LVL MAX' : `NVL ${derivedLevel}`;

        // Update Classes count (Request #2)
        const classesVal = document.querySelector('.stat-box:nth-child(2) .stat-value');
        if (classesVal) classesVal.innerText = appState.attendanceHistoryCount || 0;

        // Update Badges (Request #2)
        updateBadgesUI();
    };

    const updateBadgesUI = () => {
        const container = document.getElementById('user-badges-container');
        if (!container) return;

        const badges = [
            { id: 'Novato', icon: 'shield', unlocked: appState.role === 'admin' || appState.attendanceHistoryCount >= 5, desc: '5 Clases tomadas', msg: '¡El inicio de la grandeza empieza con el primer paso!' },
            { id: 'Constante', icon: 'calendar-check', unlocked: appState.role === 'admin' || appState.attendanceHistoryCount >= 20, desc: '20 Clases tomadas', msg: 'La disciplina es el puente entre metas y logros.' },
            { id: 'Guerrero', icon: 'zap', unlocked: appState.role === 'admin' || appState.level >= 10, desc: 'Alcanza Nivel 10', msg: 'Tus rivales tiemblan ante tu poder.' },
            { id: 'Elite', icon: 'crown', unlocked: appState.role === 'admin' || appState.level >= 50, desc: 'Alcanza Nivel 50', msg: '¡Eres una leyenda viviente en el tatami!' }
        ];

        container.innerHTML = badges.map(b => `
            <div class="badge-item ${b.unlocked ? '' : 'locked'}" title="${b.id}: ${b.desc}" ${b.unlocked ? `onclick="this.classList.toggle('flipped')"` : ''}>
                <div class="badge-card-inner">
                    <div class="badge-card-front">
                        <div class="badge-icon"><i data-lucide="${b.icon}"></i></div>
                    </div>
                    <div class="badge-card-back">
                        <p>${b.msg}</p>
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    };

    // --- Firebase Messaging Implementation (Request #3) ---
    let messagingRetryCount = 0;
    const MAX_MESSAGING_RETRIES = 3;
    const initMessaging = async (uid) => {
        try {
            console.log("Firebase Messaging removed. Push notifications require Supabase/OneSignal setup.");
        } catch (err) {
            console.error("Error initializing Firebase Messaging:", err);
        }
    };


    const renderNotifications = () => {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        const notificationsHTML = [];

        // 1. Plan Expiry Notification
        if (appState.membershipExpiry) {
            const expiryDate = new Date(appState.membershipExpiry);
            const today = new Date();
            const diffTime = expiryDate - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysLeft <= 10 && daysLeft >= 0) {
                const isCritical = daysLeft <= 3;
                notificationsHTML.push(`
                    <div class="notification-item glass ${isCritical ? 'critical' : ''}" style="border-left-color: var(--accent-cyan);">
                        <div class="notif-icon ${isCritical ? 'pulse' : ''}" style="color: var(--accent-cyan);">
                            <i data-lucide="credit-card"></i>
                        </div>
                        <div class="notif-content">
                            <h4>Renovación de Plan</h4>
                            <p>Tu plan Elite vence en <strong>${daysLeft} días</strong>. ¡No te quedes sin entrenar!</p>
                            <span class="notif-time">Recordatorio Administrativo</span>
                        </div>
                        ${isCritical ? '<div class="critical-badge" style="background:var(--accent-cyan)">RENOVAR</div>' : ''}
                    </div>
                `);
            }
        }

        // Welcome Notification for New Users
        if (appState.level === 0 && (appState.xp || 0) < 5) {
            notificationsHTML.push(`
                <div class="notification-item glass" style="border-left-color: var(--accent-purple);">
                    <div class="notif-icon" style="color: var(--accent-purple);">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <div class="notif-content">
                        <h4>¡Bienvenido a AmaruApp! 🥋</h4>
                        <p>Nos alegra tenerte en el equipo. Explora la app, revisa los planes disponibles y prepárate para tu primer entrenamiento.</p>
                        <span class="notif-time">Mensaje de Bienvenida</span>
                    </div>
                </div>
            `);
        }

        // 2. Custom App Notifications (Welcome, etc.)
        const customNotifs = appState.notifications.map(n => {
            let icon = 'bell';
            let color = 'var(--accent-purple)';
            let badgeHtml = '';

            if (n.type === 'welcome') {
                icon = 'sparkles';
            } else if (n.type === 'alert') {
                icon = 'alert-triangle';
                color = '#ef4444';
                badgeHtml = '<div class="critical-badge" style="background:#ef4444">URGENTE</div>';
            } else if (n.type === 'calendar') {
                icon = 'calendar';
                color = '#f59e0b';
                badgeHtml = '<div class="critical-badge" style="background:#f59e0b">IMPORTANTE</div>';
            }

            return `
            <div class="notification-item glass" style="border-left-color: ${color};">
                <div class="notif-icon" style="color: ${color};">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="notif-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <span class="notif-time">${new Date(n.date || n.time || Date.now()).toLocaleDateString()}</span>
                </div>
                ${badgeHtml}
            </div>
            `;
        });

        // 3. Tournament Notifications
        const tourneyHTML = appState.tournaments.map(t => {
            const daysLeft = Math.ceil((new Date(t.date) - new Date()) / (1000 * 60 * 60 * 24));
            const isCritical = daysLeft <= 7;

            return `
            <div class="notification-item glass ${isCritical ? 'critical' : ''}">
                <div class="notif-icon ${isCritical ? 'pulse' : ''}">
                    <i data-lucide="trophy"></i>
                </div>
                <div class="notif-content">
                    <h4>Nueva Alerta de Torneo</h4>
                    <p>Faltan <strong>${daysLeft} días</strong> para <strong>${t.name}</strong> en ${t.place}.</p>
                    <span class="notif-time">Aviso Deportivo</span>
                </div>
                ${isCritical ? '<div class="critical-badge">EVENTO</div>' : ''}
            </div>`;
        });

        const finalHTML = [...notificationsHTML, ...customNotifs, ...tourneyHTML].join('');
        container.innerHTML = finalHTML || `<div class="p-20 text-center opacity-50">No hay notificaciones nuevas.</div>`;

        lucide.createIcons();
    };

    const renderPayments = async () => {
        const container = document.getElementById('payment-history-list');
        const memProgressContainer = document.getElementById('current-membership-progress');

        const btnViewPlans = document.getElementById('btn-view-plans');
        if (btnViewPlans) {
            btnViewPlans.onclick = () => {
                const msScreen = document.getElementById('membership-selection-screen');
                if (msScreen) { msScreen.classList.remove('hidden'); triggerScreenAppear(msScreen); }
                if (typeof renderMembershipPlans === 'function') {
                    renderMembershipPlans();
                }
            };
        }

        if (!container || !auth.currentUser) return;

        // Update current membership progress
        if (memProgressContainer) {
            try {
                const profile = await SupabaseService.getProfile(auth.currentUser.uid);
                if (profile && profile.membership_status === 'active') {
                    const planName = profile.membership_plans?.name || 'PLAN ACTIVO';
                    const planTheme = profile.membership_plans?.theme || 'bronze';
                    const limit = profile.membership_plans?.class_limit || profile.membership_limit || 0;

                    let usedClasses = 0;
                    let daysLeft = 0;

                    if (profile.membership_expiry) {
                        const expiry = new Date(profile.membership_expiry);
                        daysLeft = Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)));

                        // Approximate the start date of the current cycle (30 days before expiry)
                        const start = new Date(expiry);
                        start.setDate(start.getDate() - 30);

                        if (appState.allUserReservations) {
                            usedClasses = appState.allUserReservations.filter(res => {
                                const d = new Date(res.reservation_date);
                                return d >= start && d <= expiry;
                            }).length;
                        }
                    }

                    const progressPercent = limit > 0 ? Math.min((usedClasses / limit) * 100, 100) : (usedClasses > 0 ? 100 : 0);

                    memProgressContainer.innerHTML = `
                        <div class="membership-card-interactive" id="membership-main-info" style="cursor:pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 5px; border-radius: 12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <span style="font-size:0.95rem; font-weight:800; color:var(--accent-purple); letter-spacing: 0.5px;">${planName}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); font-weight:600; text-transform: uppercase;">Estado: Activo</span>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size:0.85rem; color: #fff; font-weight: 800;">${daysLeft}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display: block;">días restantess</span>
                                </div>
                            </div>
                            
                            <div class="progress-bar-bg" style="height:10px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                                <div class="progress-bar-fill" style="height:100%; width:${progressPercent}%; background: linear-gradient(90deg, var(--accent-purple), #fff); border-radius:10px; transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                                <p style="font-size:0.75rem; color:rgba(255,255,255,0.8); font-weight: 600;">Utilizado: <span style="color:var(--accent-purple);">${usedClasses}</span> / ${limit} clases</p>
                                <div id="toggle-membership-indicator" style="background: rgba(255,255,255,0.1); border-radius: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255,255,255,0.1);">
                                    <i data-lucide="chevron-down" style="width: 14px; height: 14px; color: white;"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div id="membership-extra-details" class="hidden" style="margin-top:20px; padding-top:20px; border-top: 1px solid rgba(255,255,255,0.1); animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
                            <div class="details-stats-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom: 20px;">
                                <div class="detail-stat glass" style="padding:15px; text-align:center; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); position: relative; overflow: hidden;">
                                    <i data-lucide="bookmark" style="position: absolute; top: 10px; right: 10px; width: 12px; opacity: 0.2;"></i>
                                    <span style="display:block; font-size:0.6rem; color:var(--text-gray); text-transform:uppercase; font-weight:800; margin-bottom:6px; letter-spacing: 1px;">Reservas Realizadas</span>
                                    <strong style="font-size:1.6rem; color: white; font-weight: 900;">${appState.allUserReservations?.length || 0}</strong>
                                    <p style="font-size:0.6rem; color:var(--accent-purple); font-weight: 700; margin-top: 4px;">Total Histórico</p>
                                </div>
                                <div class="detail-stat glass" style="padding:15px; text-align:center; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);">
                                    <span style="display:block; font-size:0.6rem; color:var(--text-gray); text-transform:uppercase; font-weight:800; margin-bottom:6px; letter-spacing: 1px;">Clases Activas</span>
                                    <strong style="font-size:1.6rem; color: #fff; font-weight: 900;">${appState.attendanceHistoryCount || 0}</strong>
                                    <p style="font-size:0.6rem; color:#10b981; font-weight: 700; margin-top: 4px;">En Sistema</p>
                                </div>
                            </div>
                            
                            <div class="membership-info-banner glass" style="padding:15px; border-radius:20px; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 15px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="background: var(--accent-purple); width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="calendar" style="width: 18px; color: black;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <p style="font-size:0.8rem; color: white; font-weight: 800;">Renovación del Plan</p>
                                        <p style="font-size:0.7rem; color: var(--text-gray); font-weight: 500;">Tu suscripción se renueva el <span style="color: white; font-weight: 700;">${profile.membership_expiry ? new Date(profile.membership_expiry).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'pronto'}</span></p>
                                    </div>
                                </div>
                                <button id="btn-renew-advance-plan" class="btn-primary" style="width: 100%; border-radius: 12px; padding: 10px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease;">
                                    <i data-lucide="credit-card" style="width: 16px;"></i> Renovar / Adelantar Pago
                                </button>
                            </div>
                        </div>
                    `;

                    // Add Interactive Logic
                    const mainInfo = memProgressContainer.querySelector('#membership-main-info');
                    const extraDetails = memProgressContainer.querySelector('#membership-extra-details');
                    const indicator = memProgressContainer.querySelector('#toggle-membership-indicator');

                    if (mainInfo && extraDetails) {
                        mainInfo.onclick = () => {
                            const isHidden = extraDetails.classList.contains('hidden');
                            if (isHidden) {
                                extraDetails.classList.remove('hidden');
                                if (indicator) indicator.style.transform = 'rotate(180deg)';
                                mainInfo.style.background = 'rgba(255,255,255,0.03)';
                            } else {
                                extraDetails.classList.add('hidden');
                                if (indicator) indicator.style.transform = 'rotate(0deg)';
                                mainInfo.style.background = 'transparent';
                            }
                            lucide.createIcons();
                        };
                    }

                    const btnRenewAdvance = memProgressContainer.querySelector('#btn-renew-advance-plan');
                    if (btnRenewAdvance) {
                        btnRenewAdvance.onclick = () => {
                            const msScreen = document.getElementById('membership-selection-screen');
                            if (msScreen) { msScreen.classList.remove('hidden'); triggerScreenAppear(msScreen); }
                            if (typeof renderMembershipPlans === 'function') {
                                renderMembershipPlans();
                            }
                        };
                    }

                    lucide.createIcons();
                } else {
                    memProgressContainer.innerHTML = `<p style="text-align:center; font-size:0.8rem; color:var(--text-gray);">No tienes una membresía activa actualmente.</p>`;
                }
            } catch (error) {
                console.error("Error setting membership progress:", error);
                memProgressContainer.innerHTML = `<p style="text-align:center; font-size:0.8rem; color:var(--text-gray);">Error al cargar progreso.</p>`;
            }
        }

        try {
            const entries = await SupabaseService.getPayments(auth.currentUser.uid);

            container.innerHTML = entries.length === 0
                ? '<li class="p-20 opacity-50 text-center">No hay pagos registrados.</li>'
                : entries.map(p => `
                    <li class="payment-premium-item glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px; border-radius:15px;">
                        <div class="pay-info">
                            <strong style="display:block; font-size:1.1rem;">$${parseFloat(p.amount).toLocaleString()}</strong>
                            <span style="font-size:0.75rem; color:var(--text-gray);">${p.concept || 'Plan Amaru'}</span>
                        </div>
                        <span class="tag" style="background:${p.status === 'pending' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}; color:${p.status === 'pending' ? '#eab308' : '#22c55e'};">
                            ${p.status === 'pending' ? 'Pendiente' : 'Aprobado'}
                        </span>
                    </li>
                `).join('');
        } catch (error) {
            console.error("Error rendering payments:", error);
        }
    };

    // --- ADMIN MANAGEMENT LOGIC ---
    const adminContent = document.getElementById('admin-content-area');

    // --- Membership Redesign Logic ---
    function renderMembershipPlans() {
        const container = document.getElementById('membership-plans-container');
        if (!container) return;

        debugMsg("Rendering Premium Plans...");
        container.innerHTML = appState.plans.map((plan, idx) => {
            let finalPrice = plan.price;
            let originalPriceHtml = '';
            let subtitleHtml = plan.subtitle;
            let priceSuffix = '/ MES';
            let proportionalWarning = '';

            if (appState.proRataPreference === 'proportional') {
                const today = new Date();
                const currentDay = today.getDate();
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                const daysLeft = daysInMonth - currentDay + 1; // inclusive today
                const dailyRate = plan.price / daysInMonth;
                const surchargeMultiplier = 1 + (appState.surchargePct / 100);

                finalPrice = Math.round(dailyRate * daysLeft * surchargeMultiplier);
                originalPriceHtml = `<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.8em; margin-right: 5px;">$${plan.price.toLocaleString()}</span>`;
                subtitleHtml = `Plan Proporcional (${daysLeft} días restantes)`;
                priceSuffix = '';
                proportionalWarning = `<div style="font-size: 0.75em; color: var(--accent-yellow); margin-bottom: 5px; font-weight: 600;">Incluye recargo del ${appState.surchargePct}%</div>`;
            } else if (appState.activePromo) {
                let isValidForPlan = true;
                let isExpired = false;

                if (appState.activePromo.plans && appState.activePromo.plans.length > 0) {
                    isValidForPlan = appState.activePromo.plans.includes(plan.id);
                }
                if (appState.activePromo.expiresAt) {
                    const expDate = new Date(appState.activePromo.expiresAt);
                    expDate.setDate(expDate.getDate() + 1); // Expirar al final del día seleccionado
                    isExpired = expDate < new Date();
                }

                if (isValidForPlan && !isExpired) {
                    finalPrice = finalPrice - (finalPrice * (appState.activePromo.percent / 100));
                    originalPriceHtml = `<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.8em; margin-right: 5px;">$${plan.price.toLocaleString()}</span>`;
                }
            } else if (appState.proRataPreference === 'full') {
                proportionalWarning = `<div style="font-size: 0.75em; color: #60a5fa; margin-bottom: 5px; font-weight: 600;">Mes adelantado sin recargos</div>`;
            }

            return `
            <div id="plan-card-${plan.id}" class="plan-card ${plan.theme} ${plan.popular ? 'popular' : ''}" style="opacity:0; animation: elegantFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.05 + idx * 0.12}s forwards;">
                <div class="plan-card-inner">
                    <!-- Front Side -->
                    <div class="plan-card-front">
                        ${plan.popular ? '<div class="popular-badge">RECOMENDADO</div>' : ''}
                        <div class="plan-icon-wrapper" onclick="togglePlanFlip('${plan.id}')" style="cursor: pointer; position: relative; z-index: 10;">
                            <i data-lucide="${plan.theme === 'bronze' ? 'shield' : plan.theme === 'silver' ? 'shield-check' : 'crown'}" class="main-shield"></i>
                            <div class="tap-hint"><i data-lucide="mouse-pointer-2"></i></div>
                        </div>
                        <h2>${plan.name}</h2>
                        <p class="plan-subtitle">${subtitleHtml}</p>
                        ${proportionalWarning}
                        <div class="plan-price">COP ${originalPriceHtml}<span>$${finalPrice.toLocaleString()}</span> ${priceSuffix}</div>
                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${plan.id}')">SELECCIONAR PLAN</button>
                    </div>

                    <!-- Back Side (Details) -->
                    <div class="plan-card-back">
                        <div class="plan-icon-wrapper back-trigger" onclick="togglePlanFlip('${plan.id}')" style="cursor: pointer; background: rgba(203, 242, 240, 0.2); border-color: rgba(203, 242, 240, 0.5);">
                            <i data-lucide="chevron-left"></i>
                        </div>
                        <h3 style="color:var(--accent-purple); margin-bottom: 20px; font-weight: 800; letter-spacing: 1px;">VENTAJAS DEL PLAN</h3>
                        <ul class="plan-features" style="text-align: left; margin-bottom: 30px;">
                            <li><i data-lucide="clock" style="width:14px; color:var(--accent-purple);"></i> <strong>${plan.limit}</strong> Clases por día</li>
                            <li><i data-lucide="calendar" style="width:14px; color:var(--accent-purple);"></i> <strong>${plan.monthly}</strong> Clases por mes</li>
                            ${(plan.features || []).map(f => `<li><i data-lucide="check-circle-2" style="width:14px; color:#22c55e;"></i> ${f}</li>`).join('')}
                        </ul>
                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${plan.id}')" style="margin-top: auto;">SELECCIONAR Y PAGAR</button>
                    </div>
                </div>
            </div>
        `
        }).join('');
        lucide.createIcons();
    };

    window.togglePlanFlip = (planId) => {
        const card = document.getElementById(`plan-card-${planId}`);
        if (card) {
            card.classList.toggle('flipped');
        }
    };

    window.selectMembershipPlan = async (planId) => {
        const plan = appState.plans.find(p => p.id == planId);
        if (!plan) return;

        const user = auth.currentUser;
        if (!user) return showToast("Debes iniciar sesión para continuar", "#ef4444");

        let paymentPlan = { ...plan };
        if (appState.activePromo) {
            let isValidForPlan = true;
            if (appState.activePromo.plans && appState.activePromo.plans.length > 0) {
                isValidForPlan = appState.activePromo.plans.includes(plan.id);
            }
            if (isValidForPlan) {
                paymentPlan.price = paymentPlan.price - (paymentPlan.price * (appState.activePromo.percent / 100));
                paymentPlan.name = `${paymentPlan.name} (Promo: ${appState.activePromo.code})`;
            }
        }

        const processPayment = async (finalPlan) => {
            try {
                showToast(`Iniciando pago para ${finalPlan.name}... 💳`, "#22c55e");
                if (typeof PaymentService !== 'undefined' && typeof PaymentService.createPreference === 'function') {
                    await PaymentService.createPreference(finalPlan);
                } else {
                    throw new Error("Servicio de pagos no disponible");
                }
            } catch (error) {
                console.error("Auto-payment error:", error);
                showToast("No se pudo iniciar el pago automático. Intenta de nuevo.", "#ef4444");
            }
        };

        const today = new Date();
        const currentDay = today.getDate();
        let isNewUser = false;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const p = userDoc.data();
                if (!p.membership_status || p.membership_status === 'pending') {
                    isNewUser = true;
                }
            }
        } catch (e) {
            console.error("Error checking user plan status:", e);
        }

        if (isNewUser && currentDay >= 15) {
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysLeft = daysInMonth - currentDay + 1; // inclusive today
            const dailyRate = paymentPlan.price / daysInMonth;
            const surchargeMultiplier = 1 + (appState.surchargePct / 100);
            const proportionalPriceWithSurcharge = Math.round(dailyRate * daysLeft * surchargeMultiplier); // Using dynamic surcharge from admin panel

            const proportionalPlan = {
                ...paymentPlan,
                price: proportionalPriceWithSurcharge,
                name: `${paymentPlan.name} (Proporcional resto del mes)`
            };

            const nextMonthPlan = {
                ...paymentPlan,
                name: `${paymentPlan.name} (Mes Completo)`
            };

            if (appState.proRataPreference === 'proportional') {
                return await processPayment(proportionalPlan);
            } else if (appState.proRataPreference === 'full') {
                return await processPayment(nextMonthPlan);
            }

            if (!document.getElementById('proportional-modal')) {
                const modalHtml = `
                <div id="proportional-modal" class="overlay" style="display:flex; z-index: 10000; align-items: center; justify-content: center; background: rgba(0,0,0,0.8);">
                    <div class="modal-content glass" style="max-width:350px; text-align:center; padding: 25px; border-radius: 20px;">
                        <h3 style="margin-bottom:15px; color:var(--accent-yellow); font-size: 1.2rem; font-weight: 800;">Bienvenido a Amaru</h3>
                        <p style="font-size:0.9rem; margin-bottom: 20px; color: #ddd;">Como ingresas pasado el día 15, puedes elegir cómo pagar tu primera membresía:</p>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            <button id="btn-pay-proportional" class="btn-primary" style="padding:15px; font-size:0.85rem; border-radius:12px; display: flex; flex-direction: column; align-items: center;">
                                <strong style="font-size: 1rem;">Pagar Proporcional ($${proportionalPriceWithSurcharge.toLocaleString()})</strong>
                                <span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Lo que resta del mes (incluye recargo)</span>
                            </button>
                            <button id="btn-pay-full" class="btn-secondary" style="padding:15px; font-size:0.85rem; border-radius:12px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; transition: all 0.2s;">
                                <strong style="font-size: 1rem;">Pagar Mes Completo ($${paymentPlan.price.toLocaleString()})</strong>
                                <span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Se cobrará el mes entero desde hoy</span>
                            </button>
                            <button id="btn-cancel-proportional" style="margin-top:10px; background:none; color:var(--text-gray); border:none; text-decoration:underline; font-weight: 600; cursor: pointer;">Cancelar</button>
                        </div>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                document.getElementById('btn-pay-proportional').innerHTML = `<strong style="font-size: 1rem;">Pagar Proporcional ($${proportionalPriceWithSurcharge.toLocaleString()})</strong><span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Lo que resta del mes (incluye recargo)</span>`;
                document.getElementById('btn-pay-full').innerHTML = `<strong style="font-size: 1rem;">Pagar Mes Completo ($${paymentPlan.price.toLocaleString()})</strong><span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Se cobrará el mes entero desde hoy</span>`;
                document.getElementById('proportional-modal').style.display = 'flex';
            }

            document.getElementById('btn-pay-proportional').onclick = async () => {
                document.getElementById('proportional-modal').style.display = 'none';
                await processPayment(proportionalPlan);
            };
            document.getElementById('btn-pay-full').onclick = async () => {
                document.getElementById('proportional-modal').style.display = 'none';
                await processPayment(nextMonthPlan);
            };
            document.getElementById('btn-cancel-proportional').onclick = () => {
                document.getElementById('proportional-modal').style.display = 'none';
            };
            return;
        }

        if (appState.role === 'admin') return showToast("El administrador no realiza pagos ⚙️", "#fbbf24");
        await processPayment(paymentPlan);
    };

    // The checkout modal and simulation logic were removed to make the process automatic.


    const btnSkipMembership = document.getElementById('btn-skip-membership');
    if (btnSkipMembership) {
        btnSkipMembership.onclick = async () => {
            document.getElementById('membership-selection-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            switchScreen('dashboard');

            const user = auth.currentUser;
            if (user && appState.role !== 'admin') {
                try {
                    // Check if a pending payment limit already exists to avoid duplicates
                    const { data: existing } = await window.supabase
                        .from('payments')
                        .select('id')
                        .eq('user_id', user.uid)
                        .eq('status', 'pending');

                    if (!existing || existing.length === 0) {
                        await SupabaseService.recordPayment(user.uid, {
                            amount: 0,
                            concept: 'Registro - Pago Omitido',
                            receipt_url: null,
                            status: 'pending',
                            payment_method: 'manual',
                            currency: 'COP'
                        });
                    }
                } catch (err) {
                    console.error("Error al registrar el pago omitido:", err);
                }
            }

            showToast("¡Explora AmaruApp! 🥋");
        };
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initModals();

    const initAdminListeners = () => {
        const manageClsBtn = document.getElementById('manage-classes-btn');
        const manageUsersBtn = document.getElementById('manage-users-btn');
        const manageActiveUsersBtn = document.getElementById('manage-active-users-btn');
        const viewAttendanceBtn = document.getElementById('view-attendance-btn');
        const managePaymentsBtn = document.getElementById('manage-payments-btn');
        const viewRevenueBtn = document.getElementById('view-revenue-btn');
        const manageDiscountsBtn = document.getElementById('manage-discounts-btn');
        const manageNotificationsBtn = document.getElementById('manage-notifications-btn');
        const exportReportBtn = document.getElementById('btn-export-revenue');

        if (manageClsBtn) manageClsBtn.onclick = () => {
            const rev = document.getElementById('admin-revenue-section');
            if (rev) rev.classList.add('hidden');
            renderAdminClasses();
        };

        if (manageUsersBtn) manageUsersBtn.onclick = () => renderAdminPlans();
        if (manageActiveUsersBtn) manageActiveUsersBtn.onclick = () => renderAdminMembers();
        if (viewAttendanceBtn) viewAttendanceBtn.onclick = () => renderAdminAttendance();
        if (managePaymentsBtn) managePaymentsBtn.onclick = () => renderAdminPayments();
        if (viewRevenueBtn) viewRevenueBtn.onclick = () => renderRevenueSection();
        if (manageDiscountsBtn) manageDiscountsBtn.onclick = () => renderAdminDiscounts();
        if (manageNotificationsBtn) manageNotificationsBtn.onclick = () => renderAdminNotifications();
    };

    initAdminListeners();

});
