/**
 * integrations.js - Conecta módulos nuevos con app existente
 */

// ===== SKELETON LOADING =====
export const SkeletonLoader = {
    tpl: {
        hero: `<div class="skeleton" style="height:140px;border-radius:20px;margin-bottom:16px"><div class="skeleton" style="width:60%;height:18px;margin:0 0 10px 12px"></div><div class="skeleton" style="width:40%;height:14px;margin:0 0 8px 12px"></div><div class="skeleton" style="width:75%;height:12px;margin-left:12px"></div></div>`,
        stats: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px"><div class="skeleton" style="height:100px;border-radius:16px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div></div>`,
        list: `<div class="skeleton" style="height:60px;border-radius:12px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:12px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:12px"></div>`,
        quote: `<div class="skeleton" style="height:50px;border-radius:12px;margin-bottom:16px"></div>`,
        schedule: `<div class="skeleton" style="height:100px;border-radius:16px;margin-bottom:12px"></div><div class="skeleton" style="height:100px;border-radius:16px;margin-bottom:12px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div>`
    },
    showDashboard() {
        const d = document.getElementById('dashboard'); if (!d) return;
        const n = d.querySelector('#dynamic-next-class');
        const a = d.querySelector('#activity-feed-list');
        const s = d.querySelector('#premium-stats-grid');
        const q = d.querySelector('.daily-motivation');
        if (n) { n.dataset.o = n.innerHTML; n.innerHTML = this.tpl.hero; }
        if (q) { q.dataset.o = q.innerHTML; q.innerHTML = this.tpl.quote; }
        if (a) { a.dataset.o = a.innerHTML; a.innerHTML = this.tpl.list; }
        if (s) { s.dataset.o = s.innerHTML; s.innerHTML = this.tpl.stats; }
    },
    hideDashboard() {
        const d = document.getElementById('dashboard'); if (!d) return;
        ['#dynamic-next-class', '#activity-feed-list', '#premium-stats-grid', '.daily-motivation'].forEach(sel => {
            const el = d.querySelector(sel); if (el && el.dataset.o) el.innerHTML = el.dataset.o;
        });
    },
    showSchedule() {
        const t = document.querySelector('.class-timeline'); if (!t) return;
        t.dataset.o = t.innerHTML; t.innerHTML = this.tpl.schedule;
    },
    hideSchedule() {
        const t = document.querySelector('.class-timeline'); if (t && t.dataset.o) t.innerHTML = t.dataset.o;
    },
    init() {
        // Initialization if needed
    },
    showFor(target) {
        if (target === 'schedule') this.showSchedule();
        else if (target === 'dashboard') this.showDashboard();
    },
    hideAll() {
        this.hideSchedule();
        this.hideDashboard();
    }
};

// ===== AGENDA ENHANCER =====
export const AgendaEnhancer = {
    init() {
        this.enhanceChips(); this.enhanceFilters(); this.addNavArrows();
    },
    enhanceChips() {
        document.querySelectorAll('.date-chip').forEach(chip => {
            chip.addEventListener('click', function () {
                document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            });
        });
    },
    enhanceFilters() {
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', function () {
                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const selectedType = this.dataset.type || this.textContent.trim();
                
                if (window.appState) {
                    window.appState.activeFilter = selectedType;
                }
                
                if (typeof window.renderSchedule === 'function') {
                    window.renderSchedule();
                } else {
                    document.querySelectorAll('.stitch-class-card, .class-card-premium, .class-card').forEach((item, i) => {
                        const tagEl = item.querySelector('.tag');
                        const cardText = item.textContent || '';
                        const show = selectedType === 'Todas' || 
                                     (item.dataset.type && item.dataset.type.includes(selectedType)) ||
                                     (tagEl && tagEl.textContent.includes(selectedType)) ||
                                     cardText.toLowerCase().includes(selectedType.toLowerCase());
                        item.style.display = show ? '' : 'none';
                        if (show) item.style.animation = `fadeSlideUp .4s ease ${i * .05}s both`;
                    });
                }
            });
        });
    },
    addNavArrows() {
        const carousel = document.querySelector('.date-carousel-premium');
        if (!carousel || carousel.parentNode.querySelector('.carousel-nav-btn')) return;
        const wrap = carousel.parentNode;
        const prev = document.createElement('button'); prev.className = 'carousel-nav-btn carousel-prev'; prev.innerHTML = '<i data-lucide="chevron-left"></i>'; prev.setAttribute('aria-label', 'Anterior');
        const next = document.createElement('button'); next.className = 'carousel-nav-btn carousel-next'; next.innerHTML = '<i data-lucide="chevron-right"></i>'; next.setAttribute('aria-label', 'Siguiente');
        prev.onclick = () => carousel.scrollBy({ left: -80, behavior: 'smooth' });
        next.onclick = () => carousel.scrollBy({ left: 80, behavior: 'smooth' });
        wrap.insertBefore(prev, carousel); wrap.insertBefore(next, carousel.nextSibling);
        if (window.lucide) window.lucide.createIcons();
    },
    animateEntry() {
        document.querySelectorAll('.class-card-premium, .class-card').forEach((item, i) => {
            item.style.opacity = '0'; item.style.transform = 'translateY(20px)';
            setTimeout(() => { item.style.transition = 'all .4s cubic-bezier(.34,1.56,.64,1)'; item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, i * 80);
        });
    }
};

// ===== PASSWORD RESET ENHANCER =====
export const PasswordResetEnhancer = {
    init() {
        this.setupModal(); this.setupValidation(); this.setupSend();
    },
    setupModal() {
        const btn = document.getElementById('btn-forgot-password');
        const modal = document.getElementById('forgot-password-modal');
        if (btn && modal) btn.addEventListener('click', () => { modal.classList.remove('hidden'); setTimeout(() => document.getElementById('forgot-email')?.focus(), 100); });
    },
    setupValidation() {
        const email = document.getElementById('forgot-email');
        const fb = document.getElementById('forgot-email-feedback');
        if (!email || !fb) return;
        email.addEventListener('input', () => {
            const v = email.value.trim();
            if (!v) { fb.textContent = ''; fb.className = 'validation-feedback'; return; }
            const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            fb.textContent = ok ? '✓ Email válido' : '✗ Formato inválido';
            fb.className = 'validation-feedback ' + (ok ? 'valid' : 'invalid');
        });
    },
    setupSend() {
        const btn = document.getElementById('btn-send-reset');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const email = document.getElementById('forgot-email')?.value.trim();
            const status = document.getElementById('forgot-status');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status && (status.textContent = 'Ingresa un email válido'); return; }
            btn.disabled = true; btn.innerHTML = '<span class="btn-spinner"></span> Enviando...';
            try {
                const { error } = await window.supabaseClient?.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/app/reset-password.html` }) || { error: new Error('No disponible') };
                if (error) throw error;
                status && (status.textContent = '✓ Revisa tu email. Te enviamos un enlace.');
                btn.innerHTML = '✓ Enviado'; btn.style.background = '#22c55e';
                setTimeout(() => { document.getElementById('forgot-password-modal')?.classList.add('hidden'); btn.disabled = false; btn.innerHTML = 'ENVIAR ENLACE'; btn.style.background = ''; document.getElementById('forgot-email').value = ''; status && (status.textContent = ''); }, 3000);
            } catch (e) { status && (status.textContent = 'Error al enviar. Intenta de nuevo.'); btn.disabled = false; btn.innerHTML = 'ENVIAR ENLACE'; }
        });
    }
};

// ===== MEMBERSHIP EXPIRY ALERTS =====
export const MembershipAlerts = {
    check() {
        const user = window.appState?.currentUser; if (!user) return;
        const expiry = user.membership_expiry || user.expiry_date;
        if (!expiry) return;
        const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
        if (days <= 7 && days > 0) this.showBanner(`Tu membresía vence en ${days} días. Renueva para no perder tu acceso.`, 'warning');
        else if (days <= 0) this.showBanner('Tu membresía ha vencido. Renueva ahora para seguir entrenando.', 'danger');
    },
    showBanner(msg, type) {
        if (document.getElementById('membership-expiry-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'membership-expiry-banner';
        banner.className = `membership-banner membership-banner--${type}`;
        banner.innerHTML = `<div class="membership-banner__content"><i data-lucide="${type === 'danger' ? 'alert-triangle' : 'clock'}"></i><span>${msg}</span></div><button class="membership-banner__close" aria-label="Cerrar">×</button>`;
        banner.querySelector('.membership-banner__close').addEventListener('click', () => banner.remove());
        const main = document.getElementById('main-content');
        if (main) main.insertBefore(banner, main.firstChild);
        if (window.lucide) window.lucide.createIcons();
    }
};

// ===== FAQ TRIGGER =====
export function initFAQTrigger() {
    // Botón en perfil para abrir FAQ
    const profile = document.getElementById('profile');
    if (!profile) return;
    const faqBtn = document.createElement('button');
    faqBtn.id = 'btn-faq-help'; faqBtn.className = 'btn-glass';
    faqBtn.style.cssText = 'margin-top:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.75rem;padding:10px;';
    faqBtn.innerHTML = '<i data-lucide="help-circle"></i> Centro de Ayuda';
    faqBtn.addEventListener('click', () => document.getElementById('faq-overlay')?.classList.remove('hidden'));
    const footer = profile.querySelector('#profile-hero-card');
    if (footer) footer.appendChild(faqBtn);
}

// ===== INIT ALL =====
export function initIntegrations() {
    PasswordResetEnhancer.init();
    AgendaEnhancer.init();
    initFAQTrigger();
    // Membership alerts after user loads
    setTimeout(() => MembershipAlerts.check(), 3000);
}

export default { SkeletonLoader, AgendaEnhancer, PasswordResetEnhancer, MembershipAlerts, initIntegrations };
