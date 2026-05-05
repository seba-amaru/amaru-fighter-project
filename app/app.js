// Amaru App Logic - Version 1.4.1 - Force Sync Update
console.log("[INIT] Amaru App Logic Loaded - V1.4.5 (Restored & Robust)");

import { SupabaseService } from './services/supabaseService.js';
import unknowAvatar from '../images/unknow.png';
// Firebase Auth removed, using Supabase Auth
const auth = {
    get currentUser() {
        return window.appState?.user || null;
    }
};
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

    const debugMsg = (m) => console.log(`[DEBUG] ${m}`);
    debugMsg("App Initializing...");

    // --- State Management ---
    window.appState = {
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
    };

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
        if (id === 'profile') updateProfileStats();
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

    // Auth State Observer
    let authInitialized = false;
    window.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[DEBUG] onAuthStateChange FIRED: event=${event}, user=${session?.user?.id}`);
        // Skip SIGNED_IN if we haven't processed INITIAL_SESSION yet — the token may not be ready
        if (event === 'SIGNED_IN' && !authInitialized) {
            console.log(`[DEBUG] Skipping early SIGNED_IN, waiting for INITIAL_SESSION`);
            return;
        }
        // Skip duplicate INITIAL_SESSION with no user if we already have a user loaded
        if (event === 'INITIAL_SESSION' && authInitialized) {
            console.log(`[DEBUG] Skipping duplicate INITIAL_SESSION`);
            return;
        }
        if (event === 'INITIAL_SESSION') {
            authInitialized = true;
        }
        const supabaseUser = session?.user;
        let user = null;
        if (supabaseUser) {
            user = { ...supabaseUser, uid: supabaseUser.id, email: supabaseUser.email };
            appState.user = user;
        } else {
            appState.user = null;
        }

        const authScreen = document.getElementById('auth-screen');
        const appContainer = document.getElementById('app-container');

        if (user) {
            // Show a loading indicator instead of a black screen
            authScreen.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column;"><div class="loader spin" style="border:4px solid #fff; border-top:4px solid transparent; border-radius:50%; width:40px; height:40px; margin-bottom:15px;"></div><p>Cargando datos de la cuenta...</p></div>';
            // Do NOT hide authScreen yet. We'll hide it when appContainer is ready.
            // authScreen.classList.add('hidden');

            try {
                debugMsg("Fetching profile...");
                    let profile = await SupabaseService.getProfile(user.uid);
                    debugMsg("Profile fetched.");
                    if (!profile) {
                        debugMsg("Profile not found in Supabase. Creating...");
                        await SupabaseService.createProfile(user);
                        profile = await SupabaseService.getProfile(user.uid);
                    }

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

                    // 2. UPDATE STATE
                    appState.role = profile.role || 'athlete';
                    
                    // Enforce admin mode correctly based on role
                    if (appState.role === 'admin') {
                        appState.isAdminMode = true; // Force true initially for admin users
                    } else {
                        appState.isAdminMode = false;
                    }
                    
                    appState.level = profile.level || 0;
                    appState.xp = profile.xp || 0;
                    appState.membershipLimit = profile.membership_limit || 2;
                    appState.membershipStatus = profile.membership_status || 'inactive';
                    appState.planTheme = profile.membership_plans?.theme || 'bronze';
                    appState.plan = profile.membership_plan_id;
                    appState.photoURL = profile.photo_url || '../images/icon-192.png';

                    // 2.1 Fetch Attendance History (Request #2)
                    const attendanceData = await SupabaseService.getAttendance(user.uid);
                    calculateDynamicStats(attendanceData || []);

                // 3. UI UPDATES
                const greetingSpan = document.querySelector('.greeting');
                if (greetingSpan) {
                    const fullName = profile.full_name || user.displayName || 'Atleta';
                    greetingSpan.textContent = `¡Hola, ${fullName}!`;
                }

                // 4. PUSH NOTIFICATIONS (Request #3)
                initMessaging(user.uid);

                const planNameEl = document.getElementById('profile-plan-name');
                const planStatusEl = document.getElementById('profile-plan-status');
                const planRemainingEl = document.getElementById('profile-plan-remaining');
                const planProgressEl = document.getElementById('profile-plan-progress');

                if (planNameEl) {
                    const planName = profile.membership_plans?.name || (profile.membership_status === 'active' ? 'PLAN ACTIVO' : 'SIN PLAN');
                    planNameEl.textContent = planName;

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

                // Style Selector Setup
                const styleSelect = document.getElementById('user-combat-style');
                if (styleSelect) {
                    styleSelect.value = profile.combat_style || 'striker';
                    styleSelect.onchange = async (e) => {
                        const newStyle = e.target.value;
                        showToast("Guardando estilo... 🥋");
                        try {
                            await SupabaseService.updateProfile(user.uid, { combat_style: newStyle });
                            showToast("¡Estilo actualizado!", "#22c55e");
                        } catch (err) {
                            console.error(err);
                            showToast("Error al guardar estilo", "#ef4444");
                        }
                    };
                }

                // 4. REAL-TIME SUBSCRIPTIONS
                // Profile Subscription
                const profileSubscription = window.supabase
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

                // Classes, Plans & Tournaments Fetching
                try {
                    const [fetchedClasses, fetchedPlans, fetchedTournaments, fetchedAllRes] = await Promise.all([
                        SupabaseService.getClasses(),
                        SupabaseService.getPlans(),
                        SupabaseService.getTournaments(user.uid),
                        SupabaseService.getUserReservations(user.uid)
                    ]);
                    if (fetchedClasses) appState.classes = fetchedClasses;
                    if (fetchedPlans) appState.plans = fetchedPlans;
                    if (fetchedTournaments) appState.tournaments = fetchedTournaments;
                    if (fetchedAllRes) {
                        appState.allUserReservations = fetchedAllRes;
                        appState.xp = (appState.xp || 0) + (fetchedAllRes.length * 50); // Each class booked is 50 XP
                    }
                    renderSchedule();
                    renderTournaments();
                } catch (err) {
                    console.error("Error fetching initial data:", err);
                }

                try {
                    console.log("Global notifications listener (Firebase) disabled.");
                } catch (gErr) {
                    console.error("Error setting up global notifications listener:", gErr);
                }

                // Global Subscriptions for Classes & Plans
                window.supabase
                    .channel('global-data')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, async () => {
                        appState.classes = await SupabaseService.getClasses();
                        renderSchedule();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_plans' }, async () => {
                        appState.plans = await SupabaseService.getPlans();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `user_id=eq.${user.uid}` }, async () => {
                        appState.tournaments = await SupabaseService.getTournaments(user.uid);
                        renderTournaments();
                        renderDashboardNotifications();
                    })
                    .subscribe();

                // Real-time Payments Subscription (Admin only)
                if (appState.role === 'admin') {
                    window.supabase
                        .channel('admin-payments')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
                            debugMsg("Real-time payment update received!");
                            // If the admin is currently viewing the payments validation area, re-render it
                            const adminAreaTitle = document.querySelector('#admin-content-area h3')?.innerText;
                            if (adminAreaTitle && (adminAreaTitle.includes('Validación de Pagos') || adminAreaTitle.includes('Pagos'))) {
                                renderAdminPayments();
                            }
                            showToast("¡Actualización de pago detectada! 💳", "#22c55e");
                        })
                        .subscribe();
                }

                // Reservations Subscription (Supabase)
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
                        const res = await SupabaseService.getReservations(appState.selectedDate);
                        appState.reservations = res.filter(r => r.user_id === user.uid).map(r => r.class_id);
                        appState.allUserReservations = await SupabaseService.getUserReservations(user.uid);
                        appState.xp = (profile.xp || 0) + ((appState.allUserReservations?.length || 0) * 50);
                        updateRankUI();
                        renderSchedule();
                        updateAttendanceUI();
                    })
                    .subscribe();

                appState.unsubscribeReservations = () => {
                    window.supabase.removeChannel(reservationChannel);
                };

                // Initial Reservations Fetch
                const initialRes = await SupabaseService.getReservations(appState.selectedDate);
                appState.reservations = initialRes.filter(r => r.user_id === user.uid).map(r => r.class_id);
                renderSchedule();
                updateAttendanceUI();

                // 5. LEGACY SYNC (Optional: Keep Firestore for basic backup or remove)
                // We'll skip Firestore sync if Supabase is successful

                appState.role = profile.role || 'athlete';

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

                if (appState.role !== 'admin' && profile.membership_status !== 'active') {
                    appContainer.classList.add('hidden');

                    // --- Load and Validate Saved Preference ---
                    const now = new Date();
                    const systemMonthYear = `${now.getMonth()}-${now.getFullYear()}`;
                    const savedMonthYear = profile.proRataMonthYear || "";

                    if (profile.proRataPreference && savedMonthYear === systemMonthYear) {
                        appState.proRataPreference = profile.proRataPreference;
                    } else if (profile.proRataPreference) {
                        // Choice from previous month is no longer valid
                        debugMsg("Pro-rata preference from previous month reset.");
                        appState.proRataPreference = null;
                        db.collection('users').doc(user.uid).set({
                            proRataPreference: null,
                            proRataMonthYear: null,
                            proRataSelectionDate: null,
                            proRataExpiredInMonth: true
                        }, { merge: true }).catch(e => console.error("Error resetting data:", e));
                    }

                    if (profile.proRataExpiredInMonth) {
                        showToast("⚠️ Tu opción proporcional anterior expiró al terminar el mes. Se ha restablecido a pago de mes completo.", "#8b5cf6");
                        window.supabase.from('profiles').update({ pro_rata_expired_in_month: null }).eq('id', user.uid).catch(e => console.error("Error clearing expiration flag:", e));
                    }

                    renderMembershipPlans();

                    const systemDay = now.getDate();
                    // If no valid preference is saved and it's >= 15, show explaining screen
                    if (!appState.proRataPreference && systemDay >= 15) {
                        const prScreen = document.getElementById('pro-rata-info-screen');
                        const msScreen = document.getElementById('membership-selection-screen');
                        if (prScreen) { prScreen.classList.remove('hidden'); triggerScreenAppear(prScreen); }
                        if (msScreen) msScreen.classList.add('hidden');

                        const updateDbPreference = async (pref) => {
                            try {
                                appState.proRataPreference = pref;
                                await db.collection('users').doc(user.uid).set({
                                    proRataPreference: pref,
                                    proRataMonthYear: systemMonthYear,
                                    proRataSelectionDate: now.toISOString()
                                }, { merge: true });
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
                        // Either we have a preference already or it's < 15, skip intro screen
                        document.getElementById('pro-rata-info-screen').classList.add('hidden');
                        const msScreen = document.getElementById('membership-selection-screen');
                        if (msScreen) { msScreen.classList.remove('hidden'); triggerScreenAppear(msScreen); }
                    }
                } else {
                    console.log("[DEBUG] Unhiding appContainer...");
                    authScreen.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    if (window.location.hash === '#payments') {
                        switchScreen('profile');
                        document.getElementById('payment-modal')?.classList.add('active');
                    } else {
                        const targetScreen = appState.isAdminMode ? 'admin-panel' : 'dashboard';
                        console.log(`[DEBUG] Switching to screen: ${targetScreen}`);
                        switchScreen(targetScreen);
                        
                        // Render welcome message instead of opening a section by default
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
                }

            } catch (err) {
                console.error("Sync error:", err);
                authScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                switchScreen('dashboard');
            }

            updateAttendanceUI();
            renderDashboardNextClass();
            renderPayments();
            updateRankUI();
            const profileName = document.getElementById('profile-user-name');
            const navUserName = document.getElementById('nav-user-name'); // If exists in top bar
            const displayName = user.displayName || (appState.role === 'admin' ? 'Administrador' : 'Atleta');

            if (profileName) profileName.innerText = displayName;
            if (navUserName) navUserName.innerText = displayName;

            const avatarImg = document.getElementById('profile-avatar');
            if (avatarImg) avatarImg.src = appState.photoURL || '../images/icon-192.png';

        } else {
            authScreen.classList.remove('hidden');
            triggerScreenAppear(authScreen);
            appContainer.classList.add('hidden');
        }
    });

    // --- Register Actions ---
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.onclick = async () => {
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value;

            if (!name || !email || !pass) return showToast("Faltan datos ⚠️", "#eab308");
            if (pass.length < 6) return showToast("Contraseña corta (mín. 6) 🔒", "#eab308");

            try {
                showToast("Creando cuenta... 🥋");
                const { data: authData, error: authError } = await window.supabase.auth.signUp({
                    email,
                    password: pass,
                    options: { data: { full_name: name } }
                });

                if (authError) throw authError;

                const user = { ...authData.user, uid: authData.user.id };
                await SupabaseService.createProfile(user, name);

                showToast("¡Cuenta creada con éxito! 🚀");

                // --- Fix 6: Open Membership Module on Register ---
                setTimeout(() => {
                    const authScreen = document.getElementById('auth-screen');
                    const memScreen = document.getElementById('membership-selection-screen');
                    if (authScreen) authScreen.classList.add('hidden');
                    if (memScreen) {
                        renderMembershipPlans();
                        memScreen.classList.remove('hidden');
                    } else {
                        document.getElementById('app-container').classList.remove('hidden');
                        switchScreen('dashboard');
                    }
                }, 1500);

            } catch (error) {
                console.error(error);
                let errorMsg = "Error al registrar la cuenta";
                if (error.code === 'auth/invalid-email') errorMsg = "El correo no tiene un formato válido.";
                else if (error.code === 'auth/email-already-in-use') errorMsg = "Este correo electrónico ya está registrado.";
                else if (error.code === 'auth/weak-password') errorMsg = "La contraseña es muy débil (mín. 6 caracteres).";
                else if (error.message) errorMsg += ": " + error.message;

                showToast(errorMsg + " ❌", "#ef4444");
            }
        };
    }

    // Toggle Forms
    const goToReg = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    const loginCont = document.getElementById('login-form-container');
    const regCont = document.getElementById('register-form-container');

    if (goToReg) goToReg.onclick = () => {
        loginCont.classList.add('hidden');
        regCont.classList.remove('hidden');
    };
    if (goToLogin) goToLogin.onclick = () => {
        regCont.classList.add('hidden');
        loginCont.classList.remove('hidden');
    };

    // --- Login Actions ---
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.onclick = async () => {
            const emailField = document.getElementById('login-email');
            const passField = document.getElementById('login-password');
            let email = emailField.value;
            let pass = passField.value;

            if (email.toLowerCase().trim() === 'admin') {
                email = 'admin@amaru.app';
                showToast("Acceso Maestro 🛡️");
            }

            if (!email || !pass) return showToast("Faltan datos ⚠️", "#eab308");
            try {
                const { error } = await window.supabase.auth.signInWithPassword({ email, password: pass });
                if (error) throw error;
                showToast("¡Bienvenido! 🥋");
            } catch (error) {
                showToast("Error de acceso: " + error.message, "#ef4444");
            }
        };
    }

    // Google Login Action
    const btnGoogle = document.getElementById('btn-google-login');
    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            try {
                showToast("Conectando con Google... 🚀");
                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                if (error) throw error;
            } catch (error) {
                showToast("Error al conectar con Google ❌", "#ef4444");
                console.error("Google Auth Error:", error);
            }
        };
    }

    // --- Forgot Password Action ---
    const btnForgot = document.getElementById('btn-forgot-password');
    if (btnForgot) {
        btnForgot.onclick = async () => {
            const emailField = document.getElementById('login-email');
            const email = emailField.value.trim();
            if (!email) return showToast("Ingresa tu email para restablecer contraseña ⚠️", "#eab308");
            
            try {
                showToast("Enviando enlace... 📧");
                const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/app/'
                });
                if (error) throw error;
                showToast("Email de restablecimiento enviado ✅", "#22c55e");
            } catch (error) {
                showToast("Error: " + error.message, "#ef4444");
            }
        };
    }

    // Logout
    document.getElementById('btn-logout').onclick = async () => {
        localStorage.removeItem('isAdminMode'); // Clear mode on logout
        await window.supabase.auth.signOut();
        window.location.reload();
    };

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
const toggleReservation = async (classId) => {
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

const renderSchedule = () => {
    const container = document.querySelector('.class-timeline');
    const carousel = document.querySelector('.date-carousel-premium');
    if (!container) return;

    // Build the dynamic calendar for 7 days
    if (carousel) {
        carousel.innerHTML = '';
        const selectedObj = new Date(appState.selectedDate + 'T12:00:00');

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            d.setDate(d.getDate() + i);
            const isoDate = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
            const dom = d.getDate();
            const isActive = isoDate === appState.selectedDate;

            const chip = document.createElement('div');
            chip.className = `date-chip ${isActive ? 'active' : ''}`;
            chip.innerHTML = `<span>${dayName}</span><p>${dom}</p>`;
            chip.onclick = async () => {
                appState.selectedDate = isoDate;
                showToast("Cargando clases... ⏳");
                appState.reservations = (await SupabaseService.getReservations(isoDate)).filter(r => r.user_id === auth.currentUser?.uid).map(r => r.class_id);
                renderSchedule();
            };
            carousel.appendChild(chip);
        }
    }

    const currentDay = new Date(appState.selectedDate + 'T12:00:00').getDay();

    const filteredClasses = appState.classes.filter(c => {
        const matchesFilter = appState.activeFilter === 'Todas' || c.type === appState.activeFilter;
        let cDays = c.days;
        if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { } }
        const matchesDay = Array.isArray(cDays) && cDays.includes(currentDay);
        return matchesFilter && matchesDay;
    });

    container.innerHTML = filteredClasses.map((cls, idx) => {
        const isBooked = appState.reservations.includes(cls.id);
        return `
            <div class="stitch-class-card ${isBooked ? 'booked' : ''} ${cls.theme}" style="opacity:0; animation: elegantFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.04 + idx * 0.08}s forwards;">
                <div class="smoke-layer"></div>
                <div class="stitch-class-content">
                    <div class="cls-info-main">
                        <span class="tag">${cls.type}</span>
                        <h4>${cls.name}</h4>
                        <p>${cls.time} • Coach ${cls.coach}</p>
                    </div>
                    <button class="btn-reserve-stitch ${isBooked ? 'booked' : ''}" data-id="${cls.id}">
                        ${appState.role === 'admin' ? 'EDITAR' : (isBooked ? 'CANCELAR' : 'RESERVAR')}
                    </button>
                </div>
            </div>`;
    }).join('');
    lucide.createIcons();

    document.querySelectorAll('.btn-reserve-stitch').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            if (appState.role === 'admin') {
                openClassModal(id, appState.classes);
            } else {
                toggleReservation(id);
            }
        };
    });
};

const renderTournaments = () => {
    const tourneyList = document.getElementById('tourney-list');
    if (!tourneyList) return;

    if (appState.tournaments.length === 0) {
        tourneyList.innerHTML = `
            <div class="smoothcomp-banner p-20 text-center mb-20" style="border: 1px solid rgba(203, 242, 240, 0.3); border-radius: 20px; background: linear-gradient(135deg, rgba(203, 242, 240, 0.15) 0%, rgba(203, 242, 240, 0.05) 100%);">
                <i data-lucide="trophy" style="width: 40px; height: 40px; color: #fff; margin-bottom: 10px;"></i>
                <h3>Conecta con Smoothcomp</h3>
                <p class="opacity-70 mb-10 text-sm">Administra tus competencias internacionales directas a tu perfil atlético.</p>
                <a href="https://smoothcomp.com/es/events/upcoming" target="_blank" class="cyber-btn" style="text-decoration:none; display:inline-block; margin-top:10px;">Encontrar Eventos 🏆</a>
            </div>
            <p class="opacity-50 text-center p-20">No tienes torneos locales registrados manualmente aún.</p>
        `;
    } else {
        tourneyList.innerHTML = `
            <div class="smoothcomp-banner p-20 text-center mb-20" style="border: 1px solid rgba(203, 242, 240, 0.3); border-radius: 20px; background: linear-gradient(135deg, rgba(203, 242, 240, 0.15) 0%, rgba(203, 242, 240, 0.05) 100%);">
                <i data-lucide="trophy" style="width: 40px; height: 40px; color: #fff; margin-bottom: 10px;"></i>
                <h3>Módulo Smoothcomp</h3>
                <p class="opacity-70 mb-10 text-sm">Administra tus competencias internacionales directas.</p>
                <a href="https://smoothcomp.com/es/events/upcoming" target="_blank" class="cyber-btn" style="text-decoration:none; display:inline-block; margin-top:10px;">Ver Eventos Oficiales 🏆</a>
            </div>
            ${appState.tournaments.map((t, idx) => `
            <div class="stitch-tourney-card luxury-gradient" style="opacity:0; animation: elegantFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.04 + idx * 0.12}s forwards;">
                <div class="st-tourney-content">
                    <div>
                        <span class="st-tag">COMPETIClÓN</span>
                        <h4>${t.name}</h4>
                        <p>${t.place}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size:0.7rem; opacity:0.7; font-weight:700; margin-bottom: 5px;">${t.date}</p>
                        <div class="item-actions">
                            <button class="edit-tourney-btn" data-id="${t.id}" style="background:none; border:none; color:white; cursor:pointer;"><i data-lucide="edit-3" style="width:14px;"></i></button>
                            <button class="delete-tourney-btn" data-id="${t.id}" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i data-lucide="trash-2" style="width:14px;"></i></button>
                        </div>
                    </div>
                </div>
            </div>`).join('')}
        `;
    }
    lucide.createIcons();

    document.querySelectorAll('.edit-tourney-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            const t = appState.tournaments.find(tour => tour.id === id);
            if (t) {
                document.getElementById('tourney-id').value = t.id;
                document.getElementById('tourney-name').value = t.name;
                document.getElementById('tourney-place').value = t.place;
                document.getElementById('tourney-date').value = t.date;
                document.getElementById('tourney-modal-title').innerText = "Editar Torneo";
                document.getElementById('tourney-modal').classList.add('active');
            }
        };
    });

    document.querySelectorAll('.delete-tourney-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Eliminar este torneo de tu lista?")) {
                const id = btn.getAttribute('data-id');
                try {
                    await SupabaseService.deleteTournament(id);
                    appState.tournaments = await SupabaseService.getTournaments(auth.currentUser.uid);
                    renderTournaments();
                    showToast("Torneo eliminado 🗑️", "#ef4444");
                } catch (err) {
                    showToast("Error al eliminar torneo ❌", "#ef4444");
                }
            }
        };
    });
};

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

// --- Global Modal Close Utility ---
const closeAllModals = () => {
    document.querySelectorAll('.overlay').forEach(m => m.classList.remove('active'));
};

// Close when clicking X or Cancel buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-close-modal') || e.target.closest('.btn-close') || e.target.closest('.btn-action-cancel')) {
        closeAllModals();
    }
    // Close when clicking directly on the overlay backdrop
    if (e.target.classList.contains('overlay')) {
        closeAllModals();
    }
});





let currentEditingClassId = null;
let currentEditingPlanId = null;

const renderAdminActiveUsers = async (filterType = 'active') => {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = `<div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando socios...</div>`;
    lucide.createIcons();
    try {
        const users = await SupabaseService.getAllProfiles();
        const allReservations = await SupabaseService.getAllReservations();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Pre-compute logic for filtering
        const processedUsers = users.map(u => {
            const expiryDate = u.membership_expiry ? new Date(u.membership_expiry) : null;
            const diffTime = expiryDate ? expiryDate - now : -1;
            const daysLeft = expiryDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
            const totalDays = 30;
            const progress = expiryDate ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 0;
            const isNearExpiry = daysLeft > 0 && daysLeft <= 5;

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
            } else if (daysLeft <= 0) {
                if (daysLeft > -30) {
                    status = "Moroso";
                    statusColor = "#f97316"; // Orange
                    statusBg = "rgba(249, 115, 22, 0.15)";
                } else {
                    status = "Inactivo";
                    statusColor = "#ef4444"; // Red
                    statusBg = "rgba(239, 68, 68, 0.15)";
                }
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
            return true;
        });

        adminContent.innerHTML = `
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
        lucide.createIcons();

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
                    showToast("El socio no tiene un plan asignado para renovar.", "#ef4444");
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
                        showToast("Plan renovado exitosamente ✅", "#22c55e");
                        renderAdminActiveUsers();
                    } catch (err) {
                        showToast("Error al renovar plan.", "#ef4444");
                    }
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
                    showToast(isFrozen ? "Membresía Descongelada 🧊" : "Membresía Congelada ❄️", "#3b82f6");
                    renderAdminActiveUsers();
                } catch (err) {
                    showToast("Error al procesar la acción.", "#ef4444");
                }
            }
        });

    } catch (err) {
        console.error(err);
        showToast("Error al cargar socios ❌", "#ef4444");
    }
};



const renderAdminClasses = async () => {
    showToast("Configurando clases... 🥋");
    try {
        const classes = await SupabaseService.getClasses();
        adminContent.innerHTML = `
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
        lucide.createIcons();

        document.getElementById('btn-add-class-admin').onclick = () => openClassModal();
        document.querySelectorAll('.edit-class-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const targetClass = classes.find(c => c.id == id);
                if (targetClass) openClassModal(id, classes);
                else showToast("Clase no encontrada", "#ef4444");
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

        showToast("Orden actualizado 🔄", "#8b5cf6");
        renderAdminPlans();
    } catch (err) {
        console.error(err);
        showToast("Error al reordenar plan", "#ef4444");
    }
};

const renderAdminPlans = async () => {
    try {
        const plans = await SupabaseService.getMembershipPlans();
        adminContent.innerHTML = `
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
        lucide.createIcons();
        document.getElementById('btn-add-plan-admin').onclick = () => openPlanModal();
        document.querySelectorAll('.edit-plan-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const targetPlan = plans.find(p => p.id == id);
                if (targetPlan) openPlanModal(id, plans);
                else showToast("Plan no encontrado", "#ef4444");
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
        showToast("Error al cargar planes", "#ef4444");
    }
};

const renderAdminPayments = async (activeTab = 'pending') => {
    adminContent.innerHTML = `<div class="glass-premium p-20"><div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando pagos...</div></div>`;
    lucide.createIcons();
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
                let coverageMonthStr = '';
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

        adminContent.innerHTML = `
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
        lucide.createIcons();

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
            showToast(`Reporte exportado (${format.toUpperCase()}) ✅`, '#22c55e');
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
            lucide.createIcons();

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
                            showToast("Error al editar", "#ef4444");
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
                                showToast("Actualizando mes de cobertura...");
                                await window.supabase.from('payments').update({ coverage_month: newMonth }).eq('id', paymentId);
                                showToast("Mes de cobertura actualizado ✅", "#22c55e");
                                renderAdminPayments(activeTab);
                            } catch (e) {
                                showToast("Error al actualizar mes", "#ef4444");
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
                            showToast("Registro eliminado ✅", "#22c55e");
                            renderAdminPayments(activeTab);
                        } catch (e) {
                            showToast("Error al eliminar", "#ef4444");
                        }
                    }
                };
            });
        };
        attachPaymentActions();

    } catch (err) {
        console.error(err);
        adminContent.innerHTML = `<div class="glass-premium p-20"><p class="opacity-50">Error al cargar pagos: ${err.message}</p></div>`;
    }
};

const renderAdminAttendance = async () => {
        adminContent.innerHTML = `<div class="glass-premium p-20"><div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando asistencia...</div></div>`;
        lucide.createIcons();
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
                let displayGroups = [];

                if (period === 'today') {
                    // For "Today", we want to see ALL scheduled classes for today, even with 0 attendees
                    const todayClasses = appState.classes.filter(c => {
                        let cDays = c.days;
                        if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { } }
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
                            const cls = appState.classes.find(c => c.id === r.class_id) || {};
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
                lucide.createIcons();

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

            lucide.createIcons();
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
                if (!d || d.reservations.length === 0) return showToast("No hay datos para exportar", "#ef4444");
                
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
            adminContent.innerHTML = `<div class="glass-premium p-20"><p class="opacity-50">Error al cargar asistencia: ${err.message}</p></div>`;
        }
    };

    // --- Local Admin Actions ---
    const handlePaymentAction = async (id, status) => {
        try {
            await SupabaseService.updatePaymentStatus(id, status);
            
            if (status === 'approved') {
                const { data: payment } = await window.supabase
                    .from('payments')
                    .select('*')
                    .eq('id', id)
                    .single();
                    
                if (payment && payment.user_id) {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    
                    await window.supabase
                        .from('profiles')
                        .update({
                            membership_status: 'active',
                            membership_expiry: expiryDate.toISOString(),
                            membership_plan_id: payment.plan_id || null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', payment.user_id);
                        
                    await window.supabase
                        .from('payments')
                        .delete()
                        .eq('user_id', payment.user_id)
                        .eq('status', 'pending');
                }
            }
            
            showToast(`Pago ${status === 'approved' ? 'aprobado' : 'rechazado'} ✅`, status === 'approved' ? "#22c55e" : "#ef4444");
            const activeTab = document.getElementById('tab-approved-btn').style.background !== '' ? 'approved' : 'pending';
            renderAdminPayments(activeTab);
        } catch (err) {
            console.error(err);
            showToast("Error al actualizar pago", "#ef4444");
        }
    };

    const deleteClass = async (id) => {
        if (!confirm("¿Eliminar esta clase?")) return;
        try {
            await SupabaseService.deleteClass(id);
            showToast("Clase eliminada ✅", "#22c55e");
            renderAdminClasses();
        } catch (err) {
            console.error(err);
            showToast("Error al eliminar clase", "#ef4444");
        }
    };

    const deletePlan = async (id) => {
        if (!confirm("¿Eliminar este plan?")) return;
        try {
            await SupabaseService.deletePlan(id);
            showToast("Plan eliminado ✅", "#22c55e");
            renderAdminPlans();
        } catch (err) {
            console.error(err);
            showToast("Error al eliminar plan", "#ef4444");
        }
    };

    const openClassModal = (id = null, classes = []) => {
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
                showToast("Guardando clase...");
                await SupabaseService.upsertClass(classObj);
                showToast("Clase guardada ✅", "#22c55e");
                appState.classes = await SupabaseService.getClasses();
                modal.classList.remove('active');
                renderAdminClasses();
            } catch (err) {
                console.error(err);
                showToast("Fallo al guardar clase ❌", "#ef4444");
            }
        };
    };

    const openPlanModal = (id = null, plans = []) => {
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
                showToast("Guardando plan...");
                await SupabaseService.upsertPlan(planObj);
                showToast("Plan guardado ✅", "#22c55e");
                modal.classList.remove('active');
                renderAdminPlans();
            } catch (err) {
                console.error(err);
                showToast("Fallo al guardar plan ❌", "#ef4444");
            }
        };
    };


    let currentEditingMemberId = null;
    let currentEditingUsers = [];
    const openMemberModal = async (id = null, users = []) => {
        console.log("[DEBUG] openMemberModal triggered with ID:", id);
        try {
            currentEditingMemberId = id;
            currentEditingUsers = users;
            const modal = document.getElementById('member-modal');
            if (!modal) { console.error("Modal 'member-modal' not found!"); return; }

            // Close other modals first
            document.querySelectorAll('.overlay').forEach(ov => ov.classList.remove('active'));
            
            // Show modal immediately
            modal.classList.add('active');
            modal.style.display = 'flex'; // Extra force
            lucide.createIcons();
            console.log("[DEBUG] Modal activated");

            const title = document.getElementById('member-modal-title');
            const form = document.getElementById('member-form');
            const profileSummary = document.getElementById('mem-profile-summary');
            const tabsContainer = document.getElementById('mem-modal-tabs');
            const planSelect = document.getElementById('mem-plan');

            // Populate plans
            if (planSelect) {
                planSelect.innerHTML = '<option value="" style="color: black;">Sin Plan (Inactivo)</option>';
                (appState.plans || []).forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id; opt.text = p.name; opt.style.color = "black";
                    planSelect.appendChild(opt);
                });
            }

            // Tab switching logic
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
                    showToast("Socio no encontrado", "#ef4444"); 
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
                const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
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
                                    showToast("Email enviado correctamente 📧", "#22c55e");
                                } catch (err) { console.error(err); showToast("Error al enviar email ❌", "#ef4444"); }
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
            console.log("[DEBUG] openMemberModal finished successfully");
        } catch (err) {
            console.error("Error opening member modal:", err);
            showToast("Error crítico al abrir editor ❌", "#ef4444");
        }
    };

    // Load member history (attendance + payments)
    const loadMemberHistory = async (uid) => {
        const listContainer = document.getElementById('mem-attendance-list');
        const statTotal = document.getElementById('mem-stat-total');
        const statMonth = document.getElementById('mem-stat-month');
        const statPayments = document.getElementById('mem-stat-payments');
        listContainer.innerHTML = '<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>';
        lucide.createIcons();
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
            lucide.createIcons();
        } catch (err) { console.error("Error loading member history:", err); listContainer.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar historial</p>'; }
    };

    const deleteMember = async (id) => {
        if (confirm('¿Eliminar socio definitivamente? Todo su progreso y reservas se borrarán.')) {
            try {
                await SupabaseService.softDeleteUser(id);
                showToast("Socio eliminado correctamente 🗑️", "#ef4444");
                renderAdminActiveUsers();
            } catch (err) {
                console.error(err);
                showToast("Error al eliminar socio ❌", "#ef4444");
            }
        }
    };

    document.getElementById('member-form').onsubmit = async (e) => {
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
            showToast("Nombre y Email son obligatorios ⚠️", "#eab308");
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

        // Handle membership status
        if (statusVal === 'active' && planId) {
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
            if (currentEditingMemberId) {
                await SupabaseService.updateProfile(currentEditingMemberId, memberData);
                showToast("Datos de socio actualizados ✅", "#22c55e");
            } else {
                showToast("Creando nuevo socio... 🥋", "#8b5cf6");
                const { data: authData, error: authError } = await window.supabase.auth.signUp({
                    email: emailVal,
                    password: 'Amaru123!',
                    options: { data: { full_name: nameVal } }
                });
                if (authError) throw authError;
                const newUser = { uid: authData.user.id, email: emailVal };
                await SupabaseService.createProfile(newUser, nameVal);
                await SupabaseService.updateProfile(authData.user.id, memberData);
                showToast("Socio creado exitosamente ✅", "#22c55e");
            }
            document.getElementById('member-modal').classList.remove('active');
            renderAdminActiveUsers();
        } catch (err) {
            console.error(err);
            showToast("Error al guardar socio ❌", "#ef4444");
        }
    };

    let currentRevenueChart = null;
    let revenueDataRecords = [];

        const initRevenueChart = async () => {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        document.getElementById('admin-revenue-section').classList.remove('hidden');
        adminContent.innerHTML = ""; // Clear content area for the chart section above it

        showToast("Calculando inteligencia financiera... 🧠");

        try {
            const payments = await SupabaseService.getAllPayments();
            const approvedPayments = payments.filter(p => p.status === 'approved');

            const updateChart = () => {
                const selectElement = document.getElementById('revenue-timeframe');
                const timeframe = selectElement ? selectElement.value : 'mensual';
                const now = new Date();
                
                let currentPeriodPayments = [];
                let previousPeriodPayments = [];
                
                let configuredLabels = [];
                let currentDataRaw = [];
                let previousDataRaw = [];
                
                if (timeframe === 'mensual') {
                    // This month vs Last month
                    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    
                    currentPeriodPayments = approvedPayments.filter(p => new Date(p.created_at) >= startOfThisMonth);
                    previousPeriodPayments = approvedPayments.filter(p => {
                        const d = new Date(p.created_at);
                        return d >= startOfLastMonth && d < startOfThisMonth;
                    });
                    
                    configuredLabels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4+'];
                    currentDataRaw = [0, 0, 0, 0];
                    previousDataRaw = [0, 0, 0, 0];
                    
                    currentPeriodPayments.forEach(p => {
                        const d = new Date(p.created_at).getDate();
                        if (d <= 7) currentDataRaw[0] += parseFloat(p.amount);
                        else if (d <= 14) currentDataRaw[1] += parseFloat(p.amount);
                        else if (d <= 21) currentDataRaw[2] += parseFloat(p.amount);
                        else currentDataRaw[3] += parseFloat(p.amount);
                    });
                    
                    previousPeriodPayments.forEach(p => {
                        const d = new Date(p.created_at).getDate();
                        if (d <= 7) previousDataRaw[0] += parseFloat(p.amount);
                        else if (d <= 14) previousDataRaw[1] += parseFloat(p.amount);
                        else if (d <= 21) previousDataRaw[2] += parseFloat(p.amount);
                        else previousDataRaw[3] += parseFloat(p.amount);
                    });
                    
                } else if (timeframe === 'anual') {
                    // This year vs Last year
                    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
                    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
                    
                    currentPeriodPayments = approvedPayments.filter(p => new Date(p.created_at) >= startOfThisYear);
                    previousPeriodPayments = approvedPayments.filter(p => {
                        const d = new Date(p.created_at);
                        return d >= startOfLastYear && d < startOfThisYear;
                    });
                    
                    configuredLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    currentDataRaw = new Array(12).fill(0);
                    previousDataRaw = new Array(12).fill(0);
                    
                    currentPeriodPayments.forEach(p => {
                        currentDataRaw[new Date(p.created_at).getMonth()] += parseFloat(p.amount);
                    });
                    previousPeriodPayments.forEach(p => {
                        previousDataRaw[new Date(p.created_at).getMonth()] += parseFloat(p.amount);
                    });
                }
                
                const currentTotal = currentDataRaw.reduce((a, b) => a + b, 0);
                const previousTotal = previousDataRaw.reduce((a, b) => a + b, 0);
                
                let growth = 0;
                if (previousTotal > 0) {
                    growth = ((currentTotal - previousTotal) / previousTotal) * 100;
                } else if (currentTotal > 0) {
                    growth = 100;
                }

                if (currentRevenueChart) currentRevenueChart.destroy();

                currentRevenueChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: configuredLabels,
                        datasets: [
                            {
                                label: timeframe === 'mensual' ? 'Mes Actual' : 'Año Actual',
                                data: currentDataRaw,
                                backgroundColor: '#8b5cf6',
                                borderRadius: 4
                            },
                            {
                                label: timeframe === 'mensual' ? 'Mes Anterior' : 'Año Anterior',
                                data: previousDataRaw,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: 'rgba(255,255,255,0.7)' }
                            }
                        },
                        scales: {
                            y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                            x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } }
                        }
                    }
                });

                document.getElementById('admin-total-month').innerText = "$" + currentTotal.toLocaleString('es-CL', { minimumFractionDigits: 0 });
                const growthEl = document.getElementById('admin-growth-value');
                if (growthEl) {
                    growthEl.innerText = (growth > 0 ? '+' : '') + growth.toFixed(1) + "%";
                    growthEl.style.color = growth >= 0 ? '#22c55e' : '#ef4444';
                }

                // --- Breakdown ---
                const breakdownMap = {};
                currentPeriodPayments.forEach(p => {
                    let cat = p.concept || 'Otro';
                    if (cat.toLowerCase().includes('plan')) {
                        if (cat.toLowerCase().includes('básico')) cat = 'Plan Básico';
                        else if (cat.toLowerCase().includes('pro') || cat.toLowerCase().includes('premium')) cat = 'Plan Pro/Premium';
                        else cat = 'Otras Membresías';
                    } else if (cat.toLowerCase().includes('pase') || cat.toLowerCase().includes('clase')) {
                        cat = 'Clases Sueltas / Pases';
                    } else {
                        cat = 'Ingresos Extra';
                    }
                    if (!breakdownMap[cat]) breakdownMap[cat] = 0;
                    breakdownMap[cat] += parseFloat(p.amount);
                });
                
                const breakdownHtml = Object.keys(breakdownMap).sort((a,b) => breakdownMap[b] - breakdownMap[a]).map(cat => {
                    const pct = currentTotal > 0 ? Math.round((breakdownMap[cat] / currentTotal) * 100) : 0;
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                            <span style="font-size: 0.85rem; color: #ccc;">${cat}</span>
                            <div style="text-align: right;">
                                <strong style="display: block; font-size: 1rem;">$${breakdownMap[cat].toLocaleString('es-CL')}</strong>
                                <span style="font-size: 0.7rem; color: var(--accent-purple);">${pct}% del total</span>
                            </div>
                        </div>
                    `;
                }).join('');
                const bdEl = document.getElementById('revenue-breakdown');
                if (bdEl) bdEl.innerHTML = breakdownHtml || '<p style="opacity:0.5; font-size:0.8rem;">Sin ingresos en este periodo.</p>';

                // --- Automated Insights ---
                const insights = [];
                // 1. Growth insight
                if (growth > 5) {
                    insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px;"></i> <span>¡Excelente! Tus ingresos subieron un <strong>${growth.toFixed(1)}%</strong> respecto al periodo anterior.</span></div>`);
                } else if (growth < -5) {
                    insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-down" style="color:#ef4444; width:16px;"></i> <span>Cuidado, tus ingresos bajaron un <strong>${Math.abs(growth).toFixed(1)}%</strong>. Considera lanzar una promoción.</span></div>`);
                } else {
                    insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:#fbbf24; width:16px;"></i> <span>Tus ingresos se mantienen estables respecto al periodo anterior.</span></div>`);
                }

                // 2. Pareto Insight (Top Users)
                const userTotals = {};
                currentPeriodPayments.forEach(p => {
                    if (!userTotals[p.user_id]) userTotals[p.user_id] = 0;
                    userTotals[p.user_id] += parseFloat(p.amount);
                });
                const userValues = Object.values(userTotals).sort((a,b) => b-a);
                if (userValues.length > 5 && currentTotal > 0) {
                    const top10PercentCount = Math.max(1, Math.floor(userValues.length * 0.1));
                    const top10Revenue = userValues.slice(0, top10PercentCount).reduce((a,b)=>a+b, 0);
                    const topPct = ((top10Revenue / currentTotal) * 100).toFixed(0);
                    insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="users" style="color:#3b82f6; width:16px;"></i> <span>El <strong>${topPct}%</strong> de tus ingresos viene de solo el 10% de tus alumnos más activos.</span></div>`);
                }

                // 3. Best selling concept
                const bestCat = Object.keys(breakdownMap).sort((a,b) => breakdownMap[b] - breakdownMap[a])[0];
                if (bestCat) {
                    insights.push(`<div style="display:flex; gap:8px;"><i data-lucide="award" style="color:#fbbf24; width:16px;"></i> <span>La categoría <strong>${bestCat}</strong> es tu principal motor financiero este periodo.</span></div>`);
                }

                const insEl = document.getElementById('insights-content');
                if (insEl) insEl.innerHTML = insights.join('');
                lucide.createIcons();

                revenueDataRecords = currentPeriodPayments; // For export
            };

            const selectTimeframe = document.getElementById('revenue-timeframe');
            if (selectTimeframe) {
                const newSelect = selectTimeframe.cloneNode(true);
                selectTimeframe.parentNode.replaceChild(newSelect, selectTimeframe);
                newSelect.addEventListener('change', updateChart);
            }

            updateChart();

        } catch (err) {
            console.error(err);
            showToast("Error al cargar tendencia ❌", "#ef4444");
        }
    };

    const renderAdminDiscounts = async () => {
        const revSection = document.getElementById('admin-revenue-section');
        if (revSection) revSection.classList.add('hidden');
        showToast("Cargando códigos de descuento...");

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
                            ${appState.plans.map(p => `
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
                                            const p = appState.plans.find(x => x.id === pid);
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

            lucide.createIcons();

            const createBtn = document.getElementById('btn-create-promo');
            if (createBtn) {
                createBtn.onclick = async () => {
                    const code = document.getElementById('new-promo-code').value.trim().toUpperCase();
                    const percent = parseInt(document.getElementById('new-promo-perc').value);
                    const expStr = document.getElementById('new-promo-exp').value;

                    const checkedPlanBoxes = document.querySelectorAll('.promo-plan-checkbox:checked');
                    const selectedPlans = Array.from(checkedPlanBoxes).map(cb => cb.value);
                    
                    if (!code || isNaN(percent) || percent <= 0 || percent > 100) {
                        return showToast("Código o porcentaje inválido", "#ef4444");
                    }
                    if (codes.find(c => c.code === code)) {
                        return showToast("Ese código ya existe", "#ef4444");
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
                        showToast(`Código ${code} creado exitosamente`, "#22c55e");
                        renderAdminDiscounts(); // refresh view
                    } catch (err) {
                        console.error(err);
                        showToast("Error al crear código", "#ef4444");
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
                            showToast("Código eliminado");
                            renderAdminDiscounts();
                        } catch (err) {
                            console.error(err);
                            showToast("Error al eliminar", "#ef4444");
                        }
                    }
                };
            });

        } catch (err) {
            console.error("Error loading discounts", err);
            showToast("Error cargando sección de descuentos", "#ef4444");
        }
    };

    const renderAdminNotifications = () => {
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

        lucide.createIcons();

        const loadAdminNotifs = async () => {
            try {
                const docRef = await db.collection('system').doc('global_notifications').get();
                const listEl = document.getElementById('admin-notifications-list');

                let notices = [];
                if (docRef.exists && docRef.data().notices) {
                    notices = docRef.data().notices;
                }

                if (notices.length === 0) {
                    listEl.innerHTML = `<div style="text-align: center; color: var(--text-gray); padding: 20px;">No hay avisos globales activos.</div>`;
                    return;
                }

                listEl.innerHTML = notices.map(n => {
                    let color = 'var(--accent-purple)';
                    let typeLabel = 'INFO';
                    if (n.type === 'alert') { color = '#ef4444'; typeLabel = 'URGENTE'; }
                    if (n.type === 'calendar') { color = '#f59e0b'; typeLabel = 'FECHA IMPORTANTE'; }

                    return `
                    <div class="user-card glass" style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${color};">
                        <div>
                            <h4>${n.title}</h4>
                            <p style="font-size:0.85rem; color:var(--text-gray); margin-top:5px;">${n.message}</p>
                            <span style="font-size:0.75rem; color:${color};"><strong>[${typeLabel}]</strong> ${new Date(n.date).toLocaleString()}</span>
                        </div>
                        <button class="btn-secondary btn-delete-notif" data-id="${n.id}" style="padding: 8px;">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `}).join('');

                lucide.createIcons();

                document.querySelectorAll('.btn-delete-notif').forEach(btn => {
                    btn.onclick = async (e) => {
                        const id = e.currentTarget.dataset.id;
                        if (confirm('¿Seguro que deseas eliminar este aviso global?')) {
                            showToast('Eliminando aviso...', '#f59e0b');
                            const updated = notices.filter(x => x.id != id);
                            await db.collection('system').doc('global_notifications').set({ notices: updated }, { merge: true });
                            showToast('Aviso eliminado exitosamente.', '#ef4444');
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
                showToast("Por favor completa el título y mensaje.", "#ef4444");
                return;
            }

            try {
                showToast("Publicando aviso...", "#f59e0b");
                const docRef = await db.collection('system').doc('global_notifications').get();
                let notices = [];
                if (docRef.exists && docRef.data().notices) {
                    notices = docRef.data().notices;
                }

                const newAviso = {
                    id: Date.now(),
                    title: title,
                    message: msg,
                    date: new Date().toISOString(),
                    type: type
                };

                notices.unshift(newAviso);

                await db.collection('system').doc('global_notifications').set({ notices }, { merge: true });

                showToast("Aviso global publicado con éxito ✅", "#22c55e");
                modal.classList.remove('active');
                loadAdminNotifs();
            } catch (err) {
                console.error(err);
                showToast("Error publicando aviso", "#ef4444");
            }
        };

        loadAdminNotifs();
    };

    const exportUserData = (users, format) => {
        try {
            const headers = ['Nombre', 'Email', 'Nivel', 'Plan', 'Estado', 'Vencimiento'];
            const data = users.map(u => {
                const expiryDate = u.membership_expiry ? new Date(u.membership_expiry).toLocaleDateString() : 'N/A';
                const status = u.membership_status === 'active' ? 'Activo' : 'Inactivo';
                const planName = u.membership_plans?.name || 'Sin Plan';
                return [
                    u.full_name || 'Sin Nombre',
                    u.email || '',
                    u.level || 0,
                    planName,
                    status,
                    expiryDate
                ];
            });
            exportToFormat(format, data, headers, `Socios_Amaru_${new Date().toISOString().split('T')[0]}`);
            showToast(`Reporte de socios exportado (${format.toUpperCase()}) ✅`, "#22c55e");
        } catch (err) {
            console.error("Error al exportar datos de socios:", err);
            showToast("Error al exportar ❌", "#ef4444");
        }
    };

    const exportToFormat = (format, data, headers, filename) => {
        try {
            if (format === 'csv') {
                const csvContent = headers.join(',') + '\n' + data.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = filename + '.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'xls') {
                const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Reporte");
                XLSX.writeFile(wb, filename + '.xlsx');
            } else if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.autoTable({ head: [headers], body: data });
                doc.save(filename + '.pdf');
            }
        } catch (e) {
            console.error("Error al exportar formato:", e);
            showToast("Error al exportar ❌", "#ef4444");
        }
    };

    // Admin Button Listeners
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
            document.getElementById('admin-revenue-section').classList.add('hidden');
            renderAdminClasses();
        };

        if (manageUsersBtn) manageUsersBtn.onclick = () => {
            document.getElementById('admin-revenue-section').classList.add('hidden');
            renderAdminPlans();
        };
        if (manageActiveUsersBtn) manageActiveUsersBtn.onclick = () => {
            document.getElementById('admin-revenue-section').classList.add('hidden');
            renderAdminActiveUsers();
        };
        if (viewAttendanceBtn) viewAttendanceBtn.onclick = () => {
            document.getElementById('admin-revenue-section').classList.add('hidden');
            renderAdminAttendance();
        };
        if (managePaymentsBtn) managePaymentsBtn.onclick = () => {
            document.getElementById('admin-revenue-section').classList.add('hidden');
            renderAdminPayments();
        };
        if (viewRevenueBtn) viewRevenueBtn.onclick = () => initRevenueChart();
        if (manageDiscountsBtn) manageDiscountsBtn.onclick = () => renderAdminDiscounts();
        if (manageNotificationsBtn) manageNotificationsBtn.onclick = () => renderAdminNotifications();

        if (exportReportBtn) {
            const newExport = exportReportBtn.cloneNode(true);
            exportReportBtn.parentNode.replaceChild(newExport, exportReportBtn);
            newExport.onclick = () => {
                const format = document.getElementById('export-format-rev') ? document.getElementById('export-format-rev').value : 'csv';
                const timeframe = document.getElementById('revenue-timeframe') ? document.getElementById('revenue-timeframe').value : 'reporte';
                const headers = ['Fecha', 'Alumno', 'Monto', 'Concepto'];
                const rows = revenueDataRecords.map(p => [
                    new Date(p.created_at).toLocaleDateString(),
                    p.profiles?.full_name || 'N/A',
                    p.amount,
                    p.concept || 'Plan'
                ]);
                exportToFormat(format, rows, headers, `Recaudacion_${timeframe}_Amaru_${new Date().getFullYear()}`);
            };
        }

        // Class Filters
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.onclick = () => {
                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                appState.activeFilter = tag.innerText;
                renderSchedule();
            };
        });

        // --- Payment Price Calculation Logic ---
        const updatePaymentPrice = () => {
            const activeTab = document.querySelector('.pay-tab.active');
            const monthSelect = document.getElementById('pay-month');
            const amountInput = document.getElementById('pay-amount');
            const conceptInput = document.getElementById('pay-concept');

            if (!activeTab || !amountInput) return;

            const basePrice = parseFloat(activeTab.getAttribute('data-price'));
            const planName = activeTab.getAttribute('data-name');
            const selectedMonth = monthSelect ? monthSelect.value : 'actual';

            const now = new Date();
            const day = now.getDate();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

            let finalPrice = basePrice;

            // Condition: Only prorate if Day > 15 AND it's the current month
            if (selectedMonth === 'actual' && day > 15) {
                const daysRemaining = daysInMonth - day + 1;
                const prorated = (basePrice / daysInMonth) * daysRemaining;
                // Proportional + Dynamic % surcharge from admin settings
                const multiplier = 1 + (appState.surchargePct / 100);
                finalPrice = Math.round(prorated * multiplier);
                debugMsg(`Proporcional detectado(Día ${day} > 15) + ${appState.surchargePct}% Recargo: ${basePrice} -> ${finalPrice} `);
            } else {
                debugMsg(`Monto real aplicado: ${basePrice} `);
            }

            amountInput.value = finalPrice;
            if (conceptInput) conceptInput.value = planName;
        };

        const payTabs = document.querySelectorAll('.pay-tab');
        payTabs.forEach(tab => {
            tab.onclick = () => {
                payTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                updatePaymentPrice();
            };
        });

        const monthSelect = document.getElementById('pay-month');
        if (monthSelect) {
            monthSelect.onchange = () => updatePaymentPrice();
        }

        // --- Tournament Form Logic ---
        const tourneyBtn = document.getElementById('add-tourney-btn');
        if (tourneyBtn) {
            tourneyBtn.onclick = () => {
                document.getElementById('tourney-id').value = "";
                document.getElementById('tourney-form').reset();
                document.getElementById('tourney-modal-title').innerText = "Nuevo Torneo";
                document.getElementById('tourney-modal').classList.add('active');
            };
        }

        // Report payment button logic completely removed
        // Initialize empty chart on startup
        initProfileChart();


    };

    // Initialize all listeners at the start
    initAdminListeners();

    // Form Submissions
    document.getElementById('class-form').onsubmit = async (e) => {
        e.preventDefault();
        const days = Array.from(document.querySelectorAll('input[name="cls-day"]:checked')).map(cb => parseInt(cb.value));

        const classData = {
            name: document.getElementById('cls-name').value,
            coach: document.getElementById('cls-coach').value,
            time: document.getElementById('cls-time').value,
            type: document.getElementById('cls-type').value,
            days: days,
            theme: document.getElementById('cls-theme') ? document.getElementById('cls-theme').value : 'smoke-purple'
        };

        if (currentEditingClassId) {
            classData.id = currentEditingClassId;
        } else {
            classData.id = 'c' + Date.now();
        }

        try {
            await SupabaseService.upsertClass(classData);
            document.getElementById('class-modal').classList.remove('active');
            renderAdminClasses();
            renderSchedule();
            showToast(currentEditingClassId ? "Clase actualizada correctamente 🥋" : "Clase guardada exitosamente 🥋");
        } catch (err) {
            showToast("Error al guardar clase ❌", "#ef4444");
        }
    };

    document.getElementById('plan-form').onsubmit = async (e) => {
        e.preventDefault();
        const days = Array.from(document.querySelectorAll('input[name="plan-day"]:checked')).map(cb => parseInt(cb.value));

        const planData = {
            name: document.getElementById('plan-name').value,
            price: parseFloat(document.getElementById('plan-price').value),
            limit: parseInt(document.getElementById('plan-limit').value),
            monthly: parseInt(document.getElementById('plan-monthly').value),
            subtitle: document.getElementById('plan-subtitle').value,
            theme: document.getElementById('plan-theme').value,
            features: document.getElementById('plan-features').value.split(',').map(f => f.trim()).filter(f => f !== ''),
            popular: document.getElementById('plan-popular').checked,
            days: days,
            description: document.getElementById('plan-desc').value
        };

        if (currentEditingPlanId) {
            planData.id = currentEditingPlanId;
        } else {
            planData.id = 'p' + Date.now();
        }

        try {
            await SupabaseService.upsertPlan(planData);
            document.getElementById('plan-modal').classList.remove('active');
            renderAdminPlans();
            showToast(currentEditingPlanId ? "Plan actualizado correctamente ⚙️" : "Plan guardado exitosamente ⚙️");
        } catch (err) {
            showToast("Error al guardar plan ❌", "#ef4444");
        }
    };

    // New Tournament Submission
    document.getElementById('tourney-form').onsubmit = async (e) => {
        e.preventDefault();
        const newTourney = {
            name: document.getElementById('tourney-name').value,
            place: document.getElementById('tourney-place').value,
            date: document.getElementById('tourney-date').value,
            img: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500' // Working placeholder
        };


        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No user logged in");

            const tournamentData = { ...newTourney };
            const tourneyId = document.getElementById('tourney-id')?.value;
            if (tourneyId) tournamentData.id = tourneyId;

            await SupabaseService.upsertTournament(user.uid, tournamentData);

            // Re-fetch and re-render Tournaments in realtime
            appState.tournaments = await SupabaseService.getTournaments(user.uid);
            renderTournaments();

            document.getElementById('tourney-modal').classList.remove('active');
            document.getElementById('tourney-form').reset();
            showToast(tourneyId ? "Torneo actualizado ✨" : "¡Nuevo torneo agregado! 🏆");
        } catch (err) {
            showToast("Error al guardar torneo ❌", "#ef4444");
        }
    };

    // Close Modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.overlay').forEach(ov => ov.classList.remove('active'));
        };
    });

// --- Payment Form Submission ---
const paymentFormApp = document.getElementById('payment-form');
if (paymentFormApp) {
    paymentFormApp.onsubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return showToast("Debes iniciar sesión", "#ef4444");

        const amount = document.getElementById('pay-amount').value;
        const concept = document.getElementById('pay-concept').value;
        const file = document.getElementById('pay-receipt').files[0];

        if (!amount) return showToast("Falta el monto", "#eab308");

        const btn = paymentFormApp.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "ENVIANDO...";
        btn.disabled = true;

        try {
            let proofUrl = "";
            if (file) {
                // Upload payment proof to Supabase
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.uid}/${Date.now()}.${fileExt}`;
                const { data, error } = await window.supabase.storage.from('payments').upload(fileName, file);
                if (error) throw error;
                const { data: urlData } = window.supabase.storage.from('payments').getPublicUrl(fileName);
                proofUrl = urlData.publicUrl;
            }

            const paymentData = {
                amount: parseFloat(amount),
                concept: concept,
                receipt_url: proofUrl,
                status: 'pending',
                payment_method: 'manual',
                currency: 'COP'
            };

            if (appState.activePromo) {
                await window.supabase.from('profiles').update({ active_promo: appState.activePromo.code }).eq('id', user.uid);
            }

            await SupabaseService.recordPayment(user.uid, paymentData);

            showToast("¡Pago informado con éxito! 🚀", "#22c55e");
            paymentFormApp.reset();

            // Reset active tab to default
            const tabs = document.querySelectorAll('.pay-tab');
            tabs.forEach(t => t.classList.remove('active'));
            if (tabs[0]) {
                tabs[0].classList.add('active');
                document.getElementById('pay-concept').value = tabs[0].getAttribute('data-name');
                document.getElementById('pay-amount').value = tabs[0].getAttribute('data-price');
            }

            const paymentModal = document.getElementById('payment-modal');
            if (paymentModal) paymentModal.classList.remove('active');
            
            // Re-render user dashboard payments if needed
            if (typeof renderPayments === 'function') renderPayments();
        } catch (err) {
            console.error(err);
            showToast("Error al informar pago ❌", "#ef4444");
        } finally {
            if (btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    };
}

// --- Membership Redesign Logic ---
const renderMembershipPlans = () => {
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
