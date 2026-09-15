import supabase from './supabase-config.js';
import { initAuthUI } from './auth/auth.js';
import { appState } from './store/appState.js';
import { exportToFormat, exportUserData } from './utils/exportUtils.js';
import { withTimeout, withRetry, isNetworkError } from './utils/promiseHelpers.js';
console.log("[INIT] Amaru App Logic Loaded - V1.4.7 (Ultra-Fast Login & Cache Optimization)");

import { SupabaseService } from './services/supabaseService.js';
import { initModals } from './modules/adminModals.js';
import { renderAdminActiveUsers, renderAdminClasses, renderAdminPlans, renderAdminAttendance, renderAdminDiscounts, renderAdminNotifications } from './modules/admin.js';
import { renderAdminPayments } from './modules/payments.js';
import { renderAdminMembers } from './modules/members.js';
import { renderSchedule } from './modules/schedule.js';
import { renderTournaments } from './modules/tournaments.js';
import { renderRevenueSection } from './modules/revenue.js';
const unknowAvatar = '../images/unknow.png';
import { Validation } from './modules/validation.js';
import { NotificationSystem } from './modules/notifications.js';
import { FAQ } from './modules/faq.js';
import { SkeletonLoader, AgendaEnhancer } from './modules/integrations.js';
// Auth session bridge
window.auth = { get currentUser() { return window.appState?.user || null; } };

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
    window.SupabaseService = SupabaseService;

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

        // Show/hide bottom nav: hide on dashboard (has quick access), show elsewhere
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            bottomNav.style.transform = id === 'dashboard' ? 'translateY(100%)' : 'translateY(0)';
            bottomNav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        if (id === 'dashboard') {
            updateAttendanceUI();
            renderDashboardNextClass();
            renderDashboardNotifications();
            setRandomQuote();
            updateDashboardHeader();
            setupQuickAccessButtons();
            renderActivityFeed();
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

    // Auth State Observer — Refactored for robustness v1.5.1
    let authInitialized = false;
    let currentUserId = null;
    let lastSessionHandleFailed = false;
    let isHandlingSession = false;

    const showAuthLoadingScreen = (message = 'CARGANDO DATOS...', showRetry = false, errorDetail = '') => {
        // MOBILE FIX: Don't overwrite the auth-screen HTML — use an overlay instead.
        // This allows the user to interact with the login form if loading hangs.
        let overlay = document.getElementById('auth-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auth-loading-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 9999;
                background: rgba(13,13,18,0.95); backdrop-filter: blur(20px);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: 20px; transition: opacity 0.4s ease;
            `;
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; max-width: 320px; width: 100%;">
                <div style="width: 60px; height: 60px; border-radius: 20px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: pulseIcon 2s infinite;">
                    <i data-lucide="loader-2" style="width: 28px; color: var(--accent-purple); animation: spin 1s linear infinite;"></i>
                </div>
                <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 700; letter-spacing: 1px; text-align: center; margin-bottom: 8px;">${message}</p>
                ${errorDetail ? `<p style="color: #ef4444; font-size: 0.75rem; text-align: center; opacity: 0.8; margin-bottom: 12px;">${errorDetail}</p>` : ''}
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                    <div style="height: 100%; background: linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); border-radius: 10px; animation: loadBar 1.5s infinite ease-in-out; width: 60%;"></div>
                </div>
                ${showRetry ? `<button id="btn-auth-retry" style="padding: 10px 24px; background: rgba(139,92,246,0.2); border: 1px solid var(--accent-purple); color: white; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: all 0.3s; margin-bottom: 10px;">🔄 Reintentar</button>` : ''}
                <button id="btn-auth-skip" style="padding: 8px 20px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-gray); border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.7rem; transition: all 0.3s;">Saltar carga →</button>
                <style>
                @keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(150%); } }
                @keyframes pulseIcon { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                </style>
            </div>`;

        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        const retryBtn = document.getElementById('btn-auth-retry');
        if (retryBtn) {
            retryBtn.onmouseover = () => { retryBtn.style.background = 'var(--accent-purple)'; };
            retryBtn.onmouseout = () => { retryBtn.style.background = 'rgba(139,92,246,0.2)'; };
            retryBtn.onclick = () => {
                window.supabase.auth.getSession().then(({ data }) => {
                    handleAuthSession(data.session);
                });
            };
        }

        const skipBtn = document.getElementById('btn-auth-skip');
        if (skipBtn) {
            skipBtn.onmouseover = () => { skipBtn.style.borderColor = 'rgba(255,255,255,0.3)'; skipBtn.style.color = 'white'; };
            skipBtn.onmouseout = () => { skipBtn.style.borderColor = 'rgba(255,255,255,0.1)'; skipBtn.style.color = 'var(--text-gray)'; };
            skipBtn.onclick = () => {
                hideAuthLoadingScreen();
                showToast("Carga omitida. Algunos datos pueden no estar disponibles.", "#eab308");
            };
        }

        if (window.lucide) window.lucide.createIcons();
    };

    const hideAuthLoadingScreen = () => {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            setTimeout(() => { overlay.remove(); }, 400);
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
            // Fetch Global Notifications
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
            // Fetch Personal In-App Notifications
            appState.userNotifications = await withTimeout(
                SupabaseService.getUserNotifications(user.uid),
                8000,
                'Notificaciones personales'
            );
            updateNotificationBadge();
        } catch (err) {
            console.warn("[Background] Error loading user notifications:", err.message);
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

    let authLoadTimeoutId = null;

    const handleAuthSession = async (session) => {
        console.log('[Auth] handleAuthSession called. Session exists:', !!session, 'User exists:', !!session?.user);

        // CONCURRENCY GUARD: Prevent multiple simultaneous executions of handleAuthSession
        // which can happen when onAuthStateChange and getSession() polling race.
        if (isHandlingSession) {
            console.log('[Auth] handleAuthSession already running, skipping concurrent call');
            return;
        }
        isHandlingSession = true;

        try {
            // Always clear any existing loading overlay and safety timeout on fresh attempt
            hideAuthLoadingScreen();
            if (authLoadTimeoutId) { clearTimeout(authLoadTimeoutId); authLoadTimeoutId = null; }

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

            // Helper: Apply loaded or cached profile data to app state and activate appropriate screens
            const applyProfileData = (user, profileData) => {
                appState.userProfile = profileData;
                appState.role = profileData.role || 'athlete';
                appState.isAdminMode = appState.role === 'admin';
                appState.level = profileData.level || 0;
                appState.xp = profileData.xp || 0;
                appState.membershipLimit = profileData.membership_limit || 2;
                appState.membershipStatus = profileData.membership_status || 'inactive';
                appState.planTheme = profileData.membership_plans?.theme || 'bronze';
                appState.plan = profileData.membership_plan_id;
                appState.photoURL = profileData.photo_url || '../images/icon-192.png';

                // Update UI greetings & profile card
                const greetingSpan = document.querySelector('.greeting');
                if (greetingSpan) {
                    greetingSpan.textContent = `¡Hola, ${profileData.full_name || user.displayName || 'Atleta'}!`;
                }

                const planNameEl = document.getElementById('profile-plan-name');
                const planStatusEl = document.getElementById('profile-plan-status');
                const planRemainingEl = document.getElementById('profile-plan-remaining');
                const planProgressEl = document.getElementById('profile-plan-progress');

                if (planNameEl) {
                    planNameEl.textContent = profileData.membership_plans?.name || (profileData.membership_status === 'active' ? 'PLAN ACTIVO' : 'SIN PLAN');
                    if (profileData.membership_expiry) {
                        const expiryDate = new Date(profileData.membership_expiry);
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

                const styleSelect = document.getElementById('user-combat-style');
                if (styleSelect) {
                    styleSelect.value = profileData.combat_style || 'striker';
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

                const navAdmin = document.getElementById('nav-admin');
                const athleteNavs = document.querySelectorAll('.nav-item:not(#nav-admin)');

                if (appState.role === 'admin') {
                    athleteNavs.forEach(nav => nav.classList.remove('hidden'));
                } else {
                    if (navAdmin) navAdmin.classList.add('hidden');
                }

                updateAdminUIVisibility();
                renderDateCarousel();

                const btnBackProfile = document.getElementById('btn-back-admin');
                const btnBackDash = document.getElementById('btn-dashboard-back-admin');
                if (btnBackProfile) btnBackProfile.onclick = () => setAdminMode(true);
                if (btnBackDash) btnBackDash.onclick = () => setAdminMode(true);

                // Check membership status / display target screen
                if (appState.role !== 'admin' && profileData.membership_status !== 'active') {
                    appContainer.classList.add('hidden');
                    renderMembershipPlans();

                    const now = new Date();
                    const systemDay = now.getDate();
                    if (!appState.proRataPreference && systemDay >= 15) {
                        const prScreen = document.getElementById('pro-rata-info-screen');
                        const msScreen = document.getElementById('membership-selection-screen');
                        if (prScreen) { prScreen.classList.remove('hidden'); triggerScreenAppear(prScreen); }
                        if (msScreen) msScreen.classList.add('hidden');
                    } else {
                        document.getElementById('pro-rata-info-screen')?.classList.add('hidden');
                        const msScreen = document.getElementById('membership-selection-screen');
                        if (msScreen) { msScreen.classList.remove('hidden'); triggerScreenAppear(msScreen); }
                    }
                } else {
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
                            if (area && (!area.innerHTML || area.innerHTML.trim() === '')) {
                                area.innerHTML = `<div class="p-20 text-center glass" style="border-radius: 12px; margin-top: 20px;">
                                <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--accent-purple); margin-bottom: 10px;"></i>
                                <h3>Panel de Control</h3>
                                <p style="color: var(--text-gray); font-size: 0.9rem;">Selecciona una opción del menú superior para comenzar.</p>
                            </div>`;
                                if (window.lucide) window.lucide.createIcons();
                            }
                        }
                    }
                }

                const profileName = document.getElementById('profile-user-name');
                const navUserName = document.getElementById('nav-user-name');
                const displayName = user.displayName || (appState.role === 'admin' ? 'Administrador' : 'Atleta');

                if (profileName) profileName.innerText = displayName;
                if (navUserName) navUserName.innerText = displayName;

                const avatarImg = document.getElementById('profile-avatar');
                if (avatarImg) avatarImg.src = appState.photoURL || '../images/icon-192.png';
            };

            // CRITICAL OPTIMIZATION: Check for cached profile in localStorage for instant 0ms app unlock
            let cachedProfile = null;
            try {
                const stored = localStorage.getItem(`amaru_profile_${user.uid}`);
                if (stored) {
                    cachedProfile = JSON.parse(stored);
                }
            } catch (e) {
                console.warn('[Auth] Error parsing cached profile:', e);
            }

            if (cachedProfile) {
                console.log('[Auth] Instant optimistic profile loaded for:', user.email);
                applyProfileData(user, cachedProfile);
                lastSessionHandleFailed = false;
                hideAuthLoadingScreen();

                // Silently refresh profile and secondary data in background
                (async () => {
                    try {
                        const fresh = await withTimeout(SupabaseService.getProfile(user.uid), 4000, 'Background Profile');
                        if (fresh) {
                            localStorage.setItem(`amaru_profile_${user.uid}`, JSON.stringify(fresh));
                            applyProfileData(user, fresh);
                            loadUserDataInBackground(user, fresh);
                        } else {
                            loadUserDataInBackground(user, cachedProfile);
                        }
                    } catch (e) {
                        console.warn('[Auth] Background sync completed with cache fallback:', e.message);
                        loadUserDataInBackground(user, cachedProfile);
                    }
                    initMessaging(user.uid).catch(() => {});
                })();
                return;
            }

            // Fresh login (no cached profile yet on this device)
            console.log('[Auth] First-time login on device. Fetching profile from Supabase...');
            showAuthLoadingScreen('CARGANDO TU PERFIL...');

            authLoadTimeoutId = setTimeout(() => {
                console.warn('[Auth] Safety timeout triggered — forcing overlay hide');
                hideAuthLoadingScreen();
            }, 10000);

            let profile = null;

            try {
                profile = await withRetry(
                    () => withTimeout(SupabaseService.getProfile(user.uid), 5000, 'Perfil'),
                    { maxRetries: 1, delayMs: 600, context: 'Cargar perfil' }
                );

                if (!profile) {
                    debugMsg("Profile not found in Supabase. Creating...");
                    await SupabaseService.createProfile(user);
                    profile = await withTimeout(SupabaseService.getProfile(user.uid), 4000, 'Perfil recién creado');
                }

                if (profile) {
                    try {
                        localStorage.setItem(`amaru_profile_${user.uid}`, JSON.stringify(profile));
                    } catch (e) {}
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
                            if (profile) localStorage.setItem(`amaru_profile_${user.uid}`, JSON.stringify(profile));
                        }
                    } catch (err) {
                        console.error("Error confirmando pago:", err);
                    }
                }

                applyProfileData(user, profile);

                lastSessionHandleFailed = false;
                hideAuthLoadingScreen();
                if (authLoadTimeoutId) { clearTimeout(authLoadTimeoutId); authLoadTimeoutId = null; }

                // Load heavy data in background AFTER UI is visible
                loadUserDataInBackground(user, profile);
                initMessaging(user.uid).catch(() => {});

            } catch (err) {
                console.error("[Auth] Error during profile load:", err);
                const isNetErr = isNetworkError(err);
                showAuthLoadingScreen(
                    'Error al cargar',
                    true,
                    isNetErr ? 'Verifica tu conexión a internet e intenta de nuevo.' : (err.message || 'Error al iniciar sesión.')
                );
                return;
            }
        } finally {
            isHandlingSession = false;
        }
    };

    window.supabase.auth.onAuthStateChange(async (event, session) => {
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

    // Fast initial session verification without latency loops
    (async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.warn('[Auth] getSession warning:', error.message);
                return;
            }
            if (data?.session && !authInitialized) {
                authInitialized = true;
                await handleAuthSession(data.session);
            }
        } catch (err) {
            console.error('[Auth] Error getting initial session:', err);
        }
    })();

    initAuthUI(switchScreen, renderMembershipPlans);

    // Initialize new modules
    try {
        if (typeof Validation !== 'undefined') Validation.init();
        if (typeof NotificationSystem !== 'undefined') NotificationSystem.init();
        if (typeof FAQ !== 'undefined') FAQ.init();
        if (typeof AgendaEnhancer !== 'undefined') AgendaEnhancer.init();
        console.log('[INIT] All enhancement modules initialized');
    } catch (err) {
        console.error('[INIT] Error initializing enhancement modules:', err);
    }

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
        appState.level = derivedLevel;

        const rankColors = { 'Nomad': '#fbbf24', 'Warrior': '#f97316', 'Elite': '#a855f7', 'Legend': '#22c55e' };
        const rankColor = rankColors[rankTitle] || '#fbbf24';

        // Update Profile Hero
        if (badge) {
            badge.innerText = appState.role === 'admin' ? 'Admin' : rankTitle;
            badge.style.color = appState.role === 'admin' ? '#ef4444' : rankColor;
            badge.style.background = appState.role === 'admin' ? 'rgba(239,68,68,0.15)' : `${rankColor}22`;
            badge.style.borderColor = appState.role === 'admin' ? 'rgba(239,68,68,0.3)' : `${rankColor}44`;
        }

        const profLevel = document.getElementById('profile-user-level');
        if (profLevel) profLevel.innerText = appState.role === 'admin' ? 'Administrador' : `Nivel ${derivedLevel}`;

        const profXpText = document.getElementById('profile-xp-text');
        if (profXpText) profXpText.innerText = `${totalDisplayXP} / ${(derivedLevel + 1) * xpPerLevel} XP`;

        const profRankBar = document.getElementById('profile-rank-bar');
        if (profRankBar) {
            requestAnimationFrame(() => {
                profRankBar.style.width = `${progressPct}%`;
            });
        }

        const profPlanChip = document.getElementById('profile-plan-chip');
        if (profPlanChip) {
            const isActive = appState.membershipStatus === 'active' || appState.role === 'admin';
            profPlanChip.innerText = isActive ? 'Activo' : 'Inactivo';
            profPlanChip.style.background = isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            profPlanChip.style.color = isActive ? '#22c55e' : '#ef4444';
            profPlanChip.style.borderColor = isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
        }

        // Update Profile Stats Row
        const statClasses = document.getElementById('prof-stat-classes');
        const statStreak = document.getElementById('prof-stat-streak');
        const statXP = document.getElementById('prof-stat-xp');
        const statReserv = document.getElementById('prof-stat-reserv');

        if (statClasses) statClasses.innerText = appState.attendanceHistoryCount || 0;
        if (statStreak) statStreak.innerText = appState.currentStreak || 0;
        if (statXP) statXP.innerText = totalDisplayXP;
        if (statReserv) statReserv.innerText = appState.allUserReservations?.length || 0;

        // Legacy elements (for backwards compatibility)
        const fill = document.querySelector('.rank-bar-fill');
        const info = document.querySelector('.rank-info-text');
        if (fill) fill.style.width = `${progressPct}%`;
        if (info) info.innerHTML = `<span>${totalDisplayXP} / ${maxLevel * xpPerLevel} XP Max</span><strong>${Math.floor(progressPct)}% Lvl Up</strong>`;

        const levelVal = document.querySelector('#profile-user-level span');
        if (levelVal) levelVal.innerText = appState.role === 'admin' ? 'MAX' : derivedLevel;

        const dashLvlFill = document.querySelector('.lvl-fill');
        const dashLvlText = document.querySelector('.level-indicator span');
        if (dashLvlFill) dashLvlFill.style.width = appState.role === 'admin' ? '100%' : `${progressPct}%`;
        if (dashLvlText) dashLvlText.innerText = appState.role === 'admin' ? 'LVL MAX' : `NVL ${derivedLevel}`;

        // Update all sections
        updateBadgesUI();
        updateDashboardStats(derivedLevel, totalDisplayXP, maxLevel * xpPerLevel, progressPct, rankTitle);
        renderProfileActivityTimeline();
    };

    const renderProfileActivityTimeline = () => {
        const container = document.getElementById('profile-activity-timeline');
        if (!container) return;

        const activities = [];

        // Add reservations as activity
        if (appState.allUserReservations && appState.allUserReservations.length > 0) {
            const recent = [...appState.allUserReservations]
                .sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date))
                .slice(0, 5);

            recent.forEach(r => {
                const date = new Date(r.reservation_date);
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                const dayNum = date.getDate();
                activities.push({
                    type: 'reserva',
                    icon: 'calendar-check',
                    color: '#22c55e',
                    title: `Reserva: ${r.class_name || 'Clase'}`,
                    desc: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`,
                    date: date
                });
            });
        }

        // Add level up
        if (appState.level > 0) {
            activities.push({
                type: 'nivel',
                icon: 'zap',
                color: '#fbbf24',
                title: `¡Nivel ${appState.level} alcanzado!`,
                desc: 'Subiste de rango',
                date: new Date()
            });
        }

        // Sort by date
        activities.sort((a, b) => b.date - a.date);

        if (activities.length === 0) {
            container.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.4;"><p style="font-size: 0.75rem;">Sin actividad reciente</p></div>`;
            return;
        }

        container.innerHTML = activities.map((a, i) => `
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; ${i < activities.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.03);' : ''}">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: ${a.color}15; border: 1px solid ${a.color}30; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                    <i data-lucide="${a.icon}" style="width: 14px; color: ${a.color};"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.8rem; font-weight: 700; color: white; margin: 0;">${a.title}</p>
                    <p style="font-size: 0.7rem; color: var(--text-gray); margin: 2px 0 0;">${a.desc}</p>
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    };

    // --- Dashboard Header & Quick Access (A+B+C improvements) ---
    const updateDashboardHeader = () => {
        const user = auth.currentUser;
        if (!user) return;

        // Avatar
        const dashAvatar = document.getElementById('dash-avatar');
        if (dashAvatar) dashAvatar.src = appState.photoURL || '../images/icon-192.png';

        // Name
        const dashName = document.getElementById('dash-name');
        if (dashName) dashName.innerText = user.displayName || 'Atleta';

        // Plan chip
        const dashPlanChip = document.getElementById('dash-plan-chip');
        if (dashPlanChip) {
            const isActive = appState.membershipStatus === 'active' || appState.role === 'admin';
            dashPlanChip.innerText = isActive ? 'Activo' : 'Inactivo';
            dashPlanChip.style.background = isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            dashPlanChip.style.color = isActive ? '#22c55e' : '#ef4444';
            dashPlanChip.style.borderColor = isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
        }
    };

    const setupQuickAccessButtons = () => {
        document.querySelectorAll('.quick-btn').forEach(btn => {
            const targetScreen = btn.getAttribute('data-nav');
            const action = btn.getAttribute('data-action');

            btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.transform = 'translateY(-2px)'; };
            btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.03)'; btn.style.transform = 'translateY(0)'; };

            btn.onclick = () => {
                if (targetScreen) {
                    switchScreen(targetScreen);
                    if (action === 'reserve' && targetScreen === 'schedule') {
                        // Scroll to today or highlight reserve action
                        showToast("Selecciona una clase para reservar 🥋", "#22c55e");
                    }
                }
            };
        });
    };

    const updateDashboardStats = (level, currentXP, targetXP, progressPct, rankTitle) => {
        // 1. Streak Weekly Dots
        const streakDots = document.getElementById('streak-weekly-dots');
        if (streakDots) {
            const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
            const now = new Date();
            const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday-based index

            // Get attendance dates for current week
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - todayIdx);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // We don't have weekly attendance data loaded yet, so we'll highlight based on streak
            // In a real implementation, we'd check attendance records for each day
            const streakCount = appState.currentStreak || 0;

            streakDots.innerHTML = days.map((day, idx) => {
                const isPastOrToday = idx <= todayIdx;
                const isActive = isPastOrToday && idx >= (todayIdx - Math.min(streakCount - 1, todayIdx));
                const bg = isActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)';
                const border = isActive ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.08)';
                const color = isActive ? '#22c55e' : 'var(--text-gray)';
                return `<div style="width: 28px; height: 28px; border-radius: 50%; background: ${bg}; border: ${border}; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; font-weight: 700; color: ${color}; transition: all 0.3s;">${day}</div>`;
            }).join('');
        }

        const streakLabel = document.getElementById('streak-count-label');
        if (streakLabel) streakLabel.innerText = `${appState.currentStreak || 0} días seguidos`;

        // 2. XP Progress
        const dashXpCurrent = document.getElementById('dash-xp-current');
        const dashXpTarget = document.getElementById('dash-xp-target');
        const dashXpBar = document.getElementById('dash-xp-bar');
        const dashXpPercent = document.getElementById('dash-xp-percent');

        if (dashXpCurrent) dashXpCurrent.innerText = currentXP;
        if (dashXpTarget) dashXpTarget.innerText = targetXP;
        if (dashXpBar) {
            requestAnimationFrame(() => {
                dashXpBar.style.width = `${progressPct}%`;
            });
        }
        if (dashXpPercent) dashXpPercent.innerText = `${Math.floor(progressPct)}% para subir`;

        // 3. Classes This Month
        const dashClassesCount = document.getElementById('dash-classes-count');
        const dashSparkline = document.getElementById('dash-classes-sparkline');
        if (dashClassesCount) dashClassesCount.innerText = appState.currentMonthAttendance || 0;

        if (dashSparkline) {
            // Generate sparkline heights based on weekly data
            const weeks = [0.3, 0.5, 0.4, 0.7]; // Default
            if (appState.currentMonthAttendance > 0) {
                // Approximate distribution
                const w1 = Math.min(1, (appState.currentMonthAttendance * 0.2) / 5 + 0.2);
                const w2 = Math.min(1, (appState.currentMonthAttendance * 0.3) / 5 + 0.2);
                const w3 = Math.min(1, (appState.currentMonthAttendance * 0.25) / 5 + 0.2);
                const w4 = Math.min(1, (appState.currentMonthAttendance * 0.25) / 5 + 0.2);
                weeks[0] = w1; weeks[1] = w2; weeks[2] = w3; weeks[3] = w4;
            }
            dashSparkline.innerHTML = weeks.map(h => `
                <div style="width: 6px; background: linear-gradient(to top, var(--accent-cyan), var(--accent-purple)); border-radius: 2px; height: ${Math.round(h * 100)}%; transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 0.7;"></div>
            `).join('');
        }

        // 4. Current Rank
        const dashRankName = document.getElementById('dash-rank-name');
        const dashRankLevel = document.getElementById('dash-rank-level');
        const dashRankIcon = document.querySelector('#dash-rank-icon i');

        if (dashRankName) {
            dashRankName.innerText = rankTitle;
            const rankColors = { 'Nomad': '#fbbf24', 'Warrior': '#f97316', 'Elite': '#a855f7', 'Legend': '#22c55e' };
            dashRankName.style.color = rankColors[rankTitle] || '#fbbf24';
        }
        if (dashRankLevel) dashRankLevel.innerText = `Nivel ${level}`;
        if (dashRankIcon) {
            const rankIcons = { 'Nomad': 'shield', 'Warrior': 'sword', 'Elite': 'zap', 'Legend': 'crown' };
            dashRankIcon.setAttribute('data-lucide', rankIcons[rankTitle] || 'shield');
        }
    };

    const renderActivityFeed = () => {
        const container = document.getElementById('activity-feed-list');
        if (!container) return;

        const activities = [];

        // 1. Recent reservations
        if (appState.allUserReservations && appState.allUserReservations.length > 0) {
            const recentRes = [...appState.allUserReservations]
                .sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date))
                .slice(0, 3);

            recentRes.forEach(r => {
                const date = new Date(r.reservation_date);
                const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                const timeText = daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo} días`;
                activities.push({
                    icon: 'calendar-check',
                    color: '#22c55e',
                    bg: 'rgba(34,197,94,0.1)',
                    border: 'rgba(34,197,94,0.2)',
                    title: `Reserva confirmada`,
                    desc: `${r.class_name || 'Clase'} — ${timeText}`,
                    time: timeText
                });
            });
        }

        // 2. Recent attendance (simulated from attendance count)
        if (appState.attendanceHistoryCount > 0) {
            activities.push({
                icon: 'check-circle',
                color: '#a855f7',
                bg: 'rgba(168,85,247,0.1)',
                border: 'rgba(168,85,247,0.2)',
                title: `Asistencia registrada`,
                desc: `+25 XP obtenidos`,
                time: 'Reciente'
            });
        }

        // 3. Level up notification
        if (appState.level > 0) {
            activities.push({
                icon: 'zap',
                color: '#fbbf24',
                bg: 'rgba(251,191,36,0.1)',
                border: 'rgba(251,191,36,0.2)',
                title: `¡Subiste de nivel!`,
                desc: `Nivel ${appState.level} alcanzado`,
                time: 'Reciente'
            });
        }

        // 4. Upcoming tournament
        if (appState.tournaments && appState.tournaments.length > 0) {
            const nextTourney = appState.tournaments[0];
            const daysLeft = Math.ceil((new Date(nextTourney.date) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 30) {
                activities.push({
                    icon: 'trophy',
                    color: '#f97316',
                    bg: 'rgba(249,115,22,0.1)',
                    border: 'rgba(249,115,22,0.2)',
                    title: `Torneo próximo`,
                    desc: `${nextTourney.name} — ${daysLeft} días`,
                    time: 'Próximamente'
                });
            }
        }

        // 5. Plan status
        if (appState.membershipStatus === 'active') {
            activities.push({
                icon: 'shield-check',
                color: '#06b6d4',
                bg: 'rgba(6,182,212,0.1)',
                border: 'rgba(6,182,212,0.2)',
                title: `Plan activo`,
                desc: `Membresía al día`,
                time: 'Actual'
            });
        }

        if (activities.length === 0) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; opacity: 0.4;">
                    <i data-lucide="activity" style="width: 24px; height: 24px; margin-bottom: 8px;"></i>
                    <p style="font-size: 0.75rem;">Sin actividad reciente</p>
                </div>
            `;
        } else {
            container.innerHTML = activities.map((a, i) => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.3s; animation: elegantFadeIn 0.4s ease ${i * 0.08}s both;"
                    onmouseenter="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(4px)';"
                    onmouseleave="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateX(0)';">
                    <div style="width: 34px; height: 34px; border-radius: 10px; background: ${a.bg}; border: 1px solid ${a.border}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i data-lucide="${a.icon}" style="width: 16px; color: ${a.color};"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <p style="font-size: 0.8rem; font-weight: 700; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.title}</p>
                        <p style="font-size: 0.7rem; color: var(--text-gray); margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.desc}</p>
                    </div>
                    <span style="font-size: 0.6rem; color: var(--text-gray); opacity: 0.5; flex-shrink: 0;">${a.time}</span>
                </div>
            `).join('');
        }

        if (window.lucide) window.lucide.createIcons();
    };

    window.markNotifRead = async (id) => {
        try {
            await SupabaseService.markNotificationRead(id);
            if (appState.userNotifications) {
                const notif = appState.userNotifications.find(n => n.id === id);
                if (notif) notif.is_read = true;
            }
            updateNotificationBadge();
            renderNotifications();
        } catch (err) {
            console.error('[markNotifRead] Error:', err);
        }
    };

    window.renderActivityFeed = renderActivityFeed;

    const updateBadgesUI = () => {
        const container = document.getElementById('user-badges-container');
        if (!container) return;

        const badges = [
            { id: 'Novato', icon: 'shield', unlocked: appState.role === 'admin' || appState.attendanceHistoryCount >= 5, desc: '5 Clases tomadas', msg: '¡El inicio de la grandeza empieza con el primer paso!' },
            { id: 'Constante', icon: 'calendar-check', unlocked: appState.role === 'admin' || appState.attendanceHistoryCount >= 20, desc: '20 Clases tomadas', msg: 'La disciplina es el puente entre metas y logros.' },
            { id: 'Guerrero', icon: 'zap', unlocked: appState.role === 'admin' || appState.level >= 10, desc: 'Alcanza Nivel 10', msg: 'Tus rivales tiemblan ante tu poder.' },
            { id: 'Elite', icon: 'crown', unlocked: appState.role === 'admin' || appState.level >= 50, desc: 'Alcanza Nivel 50', msg: '¡Eres una leyenda viviente en el tatami!' }
        ];

        const unlockedCount = badges.filter(b => b.unlocked).length;
        const badgesProgress = document.getElementById('badges-progress-text');
        if (badgesProgress) badgesProgress.innerText = `${unlockedCount} / ${badges.length}`;

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


    const updateNotificationBadge = () => {
        const badge = document.getElementById('nav-notif-badge');
        const userNotifs = appState.userNotifications || [];
        const unread = userNotifs.filter(n => !n.is_read).length;
        if (badge) {
            if (unread > 0) {
                badge.textContent = unread > 99 ? '99+' : unread;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    };

    const renderNotifications = () => {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        const notificationsHTML = [];

        // 0. Personal In-App Notifications (NEW)
        const personalNotifs = (appState.userNotifications || []).map(n => {
            const isUnread = !n.is_read;
            const typeColor = n.type === 'mass' ? '#f59e0b' : n.type === 'direct' ? '#8b5cf6' : 'var(--accent-cyan)';
            const typeLabel = n.type === 'mass' ? 'Comunicación' : n.type === 'direct' ? 'Mensaje Directo' : 'Sistema';
            const icon = n.type === 'mass' ? 'megaphone' : n.type === 'direct' ? 'message-circle' : 'bell';
            const date = new Date(n.created_at);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            let timeText;
            if (diffMins < 1) timeText = 'Recién ahora';
            else if (diffMins < 60) timeText = `Hace ${diffMins} min`;
            else if (diffHours < 24) timeText = `Hace ${diffHours} h`;
            else if (diffDays < 7) timeText = `Hace ${diffDays} d`;
            else timeText = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });

            return `
            <div class="notification-item glass ${isUnread ? 'critical' : ''}" data-notif-id="${n.id}" style="border-left-color: ${typeColor}; cursor: pointer; ${isUnread ? 'background: rgba(139,92,246,0.04);' : ''}"
                onclick="markNotifRead('${n.id}')">
                <div class="notif-icon ${isUnread ? 'pulse' : ''}" style="color: ${typeColor};">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="notif-content">
                    <h4>${n.title} ${isUnread ? '<span style="font-size:0.6rem; background:#ef4444; color:white; padding:2px 6px; border-radius:8px; margin-left:6px; vertical-align:middle;">NUEVO</span>' : ''}</h4>
                    <p>${n.message}</p>
                    <span class="notif-time">${typeLabel} — ${timeText}</span>
                </div>
                ${isUnread ? `<div class="critical-badge" style="background:${typeColor}">NUEVO</div>` : ''}
            </div>
            `;
        });

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

            const paymentsCount = document.getElementById('payments-count');
            if (paymentsCount) paymentsCount.innerText = `${entries.length} pago${entries.length !== 1 ? 's' : ''}`;

            container.innerHTML = entries.length === 0
                ? `<div style="padding: 24px; text-align: center; opacity: 0.4;">
                        <i data-lucide="receipt" style="width: 24px; height: 24px; margin-bottom: 8px;"></i>
                        <p style="font-size: 0.75rem;">No hay pagos registrados</p>
                    </div>`
                : entries.map((p, i) => {
                    const isApproved = p.status === 'approved' || p.status === 'active';
                    const statusColor = isApproved ? '#22c55e' : '#eab308';
                    const statusBg = isApproved ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)';
                    const statusBorder = isApproved ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)';
                    const statusText = isApproved ? 'Aprobado' : 'Pendiente';
                    const statusIcon = isApproved ? 'check-circle' : 'clock';
                    const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';

                    return `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; transition: all 0.3s; animation: elegantFadeIn 0.4s ease ${i * 0.08}s both;"
                        onmouseenter="this.style.background='rgba(255,255,255,0.05)';"
                        onmouseleave="this.style.background='rgba(255,255,255,0.02)';">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: ${statusBg}; border: 1px solid ${statusBorder}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i data-lucide="${statusIcon}" style="width: 18px; color: ${statusColor};"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <p style="font-size: 0.85rem; font-weight: 700; color: white; margin: 0;">$${parseFloat(p.amount || 0).toLocaleString()}</p>
                            <p style="font-size: 0.7rem; color: var(--text-gray); margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.concept || 'Plan Amaru'} ${dateStr ? `• ${dateStr}` : ''}</p>
                        </div>
                        <span style="font-size: 0.6rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;">${statusText}</span>
                    </div>
                    `;
                }).join('');

            if (window.lucide) window.lucide.createIcons();
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

        debugMsg("Rendering Premium Plans v2.0...");

        const plans = appState.plans || [];
        if (plans.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.5;">No hay planes disponibles.</p>';
            return;
        }

        // Detectar plan más popular por activePromo o flag popular
        const mostPopularPlan = plans.reduce((max, p) => {
            if (p.popular) return p;
            return max;
        }, plans[0]);

        const themeColors = {
            bronze: { accent: '#cd7f32', icon: 'shield', gradient: 'linear-gradient(135deg, rgba(205,127,50,0.15), rgba(205,127,50,0.05))' },
            silver: { accent: '#c0c0c0', icon: 'shield-check', gradient: 'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))' },
            gold: { accent: '#ffd700', icon: 'crown', gradient: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))' }
        };

        container.innerHTML = plans.map((plan, idx) => {
            let finalPrice = plan.price;
            let originalPriceHtml = '';
            let subtitleHtml = plan.subtitle || '';
            let priceSuffix = '/ MES';
            let promoBadge = '';
            let savingsHtml = '';

            const theme = themeColors[plan.theme] || themeColors.bronze;
            const isPopular = plan.popular || (mostPopularPlan && plan.id === mostPopularPlan.id);

            // Cálculo de precio con promociones
            if (appState.proRataPreference === 'proportional') {
                const today = new Date();
                const currentDay = today.getDate();
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                const daysLeft = daysInMonth - currentDay + 1;
                const dailyRate = plan.price / daysInMonth;
                const surchargeMultiplier = 1 + (appState.surchargePct / 100);
                finalPrice = Math.round(dailyRate * daysLeft * surchargeMultiplier);
                originalPriceHtml = `<span style="text-decoration:line-through; opacity:0.4; font-size:0.75em; margin-right:6px;">$${plan.price.toLocaleString()}</span>`;
                subtitleHtml = `Proporcional (${daysLeft} días)`;
                priceSuffix = '';
                promoBadge = `<span style="font-size:0.6rem; background:rgba(251,191,36,0.15); color:#fbbf24; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(251,191,36,0.3);">⚡ Prorrateado</span>`;
            } else if (appState.activePromo) {
                let isValidForPlan = true;
                let isExpired = false;
                if (appState.activePromo.plans && appState.activePromo.plans.length > 0) {
                    isValidForPlan = appState.activePromo.plans.includes(plan.id);
                }
                if (appState.activePromo.expiresAt) {
                    const expDate = new Date(appState.activePromo.expiresAt);
                    expDate.setDate(expDate.getDate() + 1);
                    isExpired = expDate < new Date();
                }
                if (isValidForPlan && !isExpired) {
                    const discount = appState.activePromo.percent;
                    const saved = Math.round(plan.price * (discount / 100));
                    finalPrice = plan.price - saved;
                    originalPriceHtml = `<span style="text-decoration:line-through; opacity:0.4; font-size:0.75em; margin-right:6px;">$${plan.price.toLocaleString()}</span>`;
                    promoBadge = `<span style="font-size:0.6rem; background:rgba(34,197,94,0.15); color:#22c55e; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(34,197,94,0.3);">🎉 -${discount}%</span>`;
                    savingsHtml = `<span style="font-size:0.7rem; color:#22c55e; font-weight:700;">Ahorras $${saved.toLocaleString()}</span>`;
                }
            } else if (appState.proRataPreference === 'full') {
                promoBadge = `<span style="font-size:0.6rem; background:rgba(59,130,246,0.15); color:#3b82f6; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(59,130,246,0.3);">📅 Mes completo</span>`;
            }

            const features = Array.isArray(plan.features) ? plan.features : (plan.features ? String(plan.features).split(',').map(f => f.trim()).filter(f => f) : []);
            const featuresHtml = features.length > 0
                ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin:10px 0; justify-content:center;">${features.slice(0, 3).map(f => `<span style="font-size:0.6rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:2px 8px; border-radius:20px; color:var(--text-gray);">${f}</span>`).join('')}${features.length > 3 ? `<span style="font-size:0.6rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:2px 8px; border-radius:20px; color:var(--text-gray);">+${features.length - 3}</span>` : ''}</div>`
                : '';

            const descHtml = plan.description
                ? `<p style="font-size:0.7rem; color:var(--text-gray); margin:6px 12px 0; line-height:1.4; opacity:0.8; min-height:30px;">${plan.description}</p>`
                : '';

            return `
            <div id="plan-card-${plan.id}" class="plan-card ${plan.theme} ${isPopular ? 'popular' : ''}" style="opacity:0; animation: elegantFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.05 + idx * 0.12}s forwards;">
                <div class="plan-card-inner">
                    <!-- Front Side -->
                    <div class="plan-card-front" style="background:${theme.gradient};">
                        ${isPopular ? `<div style="position:absolute; top:-8px; right:12px; background:linear-gradient(135deg, #8b5cf6, #a855f7); color:white; font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 4px 15px rgba(139,92,246,0.4); display:flex; align-items:center; gap:4px; z-index:20;"><i data-lucide="flame" style="width:10px;"></i> ${plan.popular ? 'Recomendado' : 'Más Popular'}</div>` : ''}

                        <div class="plan-icon-wrapper" onclick="togglePlanFlip('${plan.id}')" style="cursor:pointer; position:relative; z-index:10;">
                            <i data-lucide="${theme.icon}" class="main-shield" style="color:${theme.accent};"></i>
                            <div class="tap-hint"><i data-lucide="mouse-pointer-2"></i></div>
                        </div>

                        <h2 style="color:${theme.accent};">${plan.name}</h2>

                        <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap; margin-bottom:4px;">
                            ${promoBadge}
                        </div>

                        <p class="plan-subtitle" style="font-size:0.75rem; margin:4px 0;">${subtitleHtml}</p>

                        ${descHtml}
                        ${featuresHtml}

                        <div style="margin:10px 0;">
                            <div style="display:flex; align-items:center; justify-content:center; gap:4px; flex-wrap:wrap;">
                                ${originalPriceHtml}
                                <span style="font-size:1.6rem; font-weight:900; color:white;">$${finalPrice.toLocaleString()}</span>
                            </div>
                            <span style="font-size:0.65rem; color:var(--text-gray); text-transform:uppercase; font-weight:700; letter-spacing:1px;">${priceSuffix}</span>
                            ${savingsHtml ? `<div style="margin-top:4px;">${savingsHtml}</div>` : ''}
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 12px; padding:8px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                            <div style="text-align:center;">
                                <span style="font-size:0.55rem; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Clases/día</span>
                                <strong style="font-size:0.9rem; color:white; display:block;">${plan.limit || '∞'}</strong>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.55rem; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Clases/mes</span>
                                <strong style="font-size:0.9rem; color:white; display:block;">${plan.monthly || 0}</strong>
                            </div>
                        </div>

                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${plan.id}')" style="margin-top:auto;">SELECCIONAR PLAN</button>
                    </div>

                    <!-- Back Side (Details) -->
                    <div class="plan-card-back">
                        <div class="plan-icon-wrapper back-trigger" onclick="togglePlanFlip('${plan.id}')" style="cursor:pointer; background:rgba(203,242,240,0.2); border-color:rgba(203,242,240,0.5);">
                            <i data-lucide="chevron-left"></i>
                        </div>
                        <h3 style="color:var(--accent-purple); margin-bottom:15px; font-weight:800; letter-spacing:1px; font-size:1rem;">DETALLES DEL PLAN</h3>

                        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:15px;">
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span style="font-size:0.75rem; color:var(--text-gray);">Precio mensual</span>
                                <strong style="font-size:0.8rem; color:white;">$${plan.price.toLocaleString()}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span style="font-size:0.75rem; color:var(--text-gray);">Clases por día</span>
                                <strong style="font-size:0.8rem; color:white;">${plan.limit || 'Ilimitado'}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span style="font-size:0.75rem; color:var(--text-gray);">Clases por mes</span>
                                <strong style="font-size:0.8rem; color:white;">${plan.monthly || 0}</strong>
                            </div>
                            ${plan.description ? `<div style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);"><span style="font-size:0.7rem; color:var(--text-gray);">${plan.description}</span></div>` : ''}
                        </div>

                        <h4 style="font-size:0.75rem; color:var(--accent-purple); margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Incluye</h4>
                        <ul class="plan-features" style="text-align:left; margin-bottom:15px; flex:1; overflow-y:auto;">
                            ${features.map(f => `<li style="display:flex; align-items:center; gap:8px; padding:3px 0; font-size:0.8rem;"><i data-lucide="check-circle-2" style="width:14px; color:#22c55e; flex-shrink:0;"></i> ${f}</li>`).join('')}
                        </ul>

                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${plan.id}')" style="margin-top:auto;">SELECCIONAR Y PAGAR</button>
                    </div>
                </div>
            </div>
        `;
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

    // Initialize new modules
    if (typeof Validation !== 'undefined') Validation.init();
    if (typeof NotificationSystem !== 'undefined') NotificationSystem.init();
    if (typeof FAQ !== 'undefined') FAQ.init();
    if (typeof AgendaEnhancer !== 'undefined') AgendaEnhancer.init();
    if (typeof SkeletonLoader !== 'undefined') {
        SkeletonLoader.init();
        // Override showLoading to use skeleton when possible
        const origShowLoading = window.showLoading;
        window.showLoading = (message = "Cargando...") => {
            const scheduleContainer = document.querySelector('.class-timeline');
            if (scheduleContainer && message.includes('clases')) {
                SkeletonLoader.showFor('schedule');
            } else if (typeof Swal !== 'undefined') {
                origShowLoading(message);
            }
        };
        const origHideLoading = window.hideLoading;
        window.hideLoading = () => {
            SkeletonLoader.hideAll();
            origHideLoading();
        };
    }
});
