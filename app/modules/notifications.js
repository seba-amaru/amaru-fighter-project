/**
 * Notification system for membership expiry alerts and class reminders
 */

import { SupabaseService } from '../services/supabaseService.js';

export const NotificationSystem = {
    reminderTimers: new Map(),

    init(userId) {
        this.checkMembershipExpiry();
        this.requestPushPermission();
        this.startClassReminderCheck(userId);
    },

    /**
     * Check membership expiry and show alert banners
     */
    async checkMembershipExpiry() {
        const profile = window.appState?.userProfile;
        if (!profile || !profile.membership_expiry) return;

        const expiry = new Date(profile.membership_expiry);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays > 0) {
            this.showMembershipToast(
                'Membresía por vencer',
                `Tu membresía vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}. Renueva para no perder acceso.`,
                'warning'
            );
        } else if (diffDays <= 0) {
            this.showMembershipToast(
                'Membresía vencida',
                'Tu membresía ha vencido. Renueva ahora para recuperar el acceso completo.',
                'danger'
            );
        }
    },

    showMembershipToast(title, message, type) {
        // Remove existing toasts
        document.querySelectorAll('.notification-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `notification-toast membership-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="${type === 'warning' ? 'alert-triangle' : 'alert-octagon'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i data-lucide="x" style="width:14px;"></i></button>
        `;

        document.body.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        requestAnimationFrame(() => toast.classList.add('visible'));

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 500);
        };

        // Auto dismiss after 8s for warnings, stay for danger
        if (type === 'warning') {
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 500);
            }, 8000);
        }
    },

    /**
     * Request browser push notification permission
     */
    async requestPushPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            try {
                const result = await Notification.requestPermission();
                console.log('[Notifications] Permission:', result);
            } catch (e) {
                console.warn('[Notifications] Permission request failed:', e);
            }
        }
    },

    /**
     * Send a push notification
     */
    sendPush(title, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const defaultOptions = {
            icon: '../images/icon-192.png',
            badge: '../images/icon-192.png',
            requireInteraction: false,
            ...options
        };

        try {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, defaultOptions);
            });
        } catch (e) {
            console.warn('[Notifications] Push failed:', e);
        }
    },

    /**
     * Start checking for upcoming classes and send reminders
     */
    async startClassReminderCheck(userId) {
        if (!userId) return;

        // Check every 5 minutes
        this.reminderInterval = setInterval(() => {
            this.checkUpcomingClasses(userId);
        }, 5 * 60 * 1000);

        // Initial check
        this.checkUpcomingClasses(userId);
    },

    async checkUpcomingClasses(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await SupabaseService.getReservations(today);
            if (!res || !res.length) return;

            const userReservations = res.filter(r => r.user_id === userId);
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;

            userReservations.forEach(r => {
                if (!r.class_time) return;
                const [h, m] = r.class_time.split(':').map(Number);
                const classTime = h * 60 + m;
                const diff = classTime - currentTime;

                // Remind 30 minutes before class
                if (diff > 25 && diff <= 35) {
                    const timerKey = `${r.class_id}-${today}`;
                    if (!this.reminderTimers.has(timerKey)) {
                        this.reminderTimers.set(timerKey, true);
                        this.sendPush(`¡Clase pronto! ${r.class_name || ''}`, {
                            body: `Tu clase comienza en 30 minutos (${r.class_time}). ¡Prepárate!`,
                            tag: timerKey,
                            requireInteraction: true,
                            actions: [
                                { action: 'open', title: 'Ver agenda' },
                                { action: 'dismiss', title: 'Descartar' }
                            ]
                        });
                    }
                }
            });
        } catch (e) {
            console.warn('[Notifications] Class reminder check failed:', e);
        }
    },

    stop() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
        this.reminderTimers.clear();
    }
};
