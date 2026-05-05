import { SupabaseService } from '../services/supabaseService.js';

/**
 * Renders the class schedule and the date carousel.
 * Relies on global `window.appState`, `window.showLoading`, `window.hideLoading`, `window.auth`, `window.toggleReservation`, `window.openClassModal`.
 */
export const renderSchedule = () => {
    const container = document.querySelector('.class-timeline');
    const carousel = document.querySelector('.date-carousel-premium');
    if (!container) return;

    const { appState, auth, showLoading, hideLoading, toggleReservation, openClassModal } = window;

    // Build the dynamic calendar for 7 days
    if (carousel) {
        carousel.innerHTML = '';

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
                if (showLoading) showLoading("Cargando clases... ⏳");
                appState.reservations = (await SupabaseService.getReservations(isoDate))
                    .filter(r => r.user_id === auth.currentUser?.uid)
                    .map(r => r.class_id);
                if (hideLoading) hideLoading();
                renderSchedule();
            };
            carousel.appendChild(chip);
        }
    }

    const currentDay = new Date(appState.selectedDate + 'T12:00:00').getDay();

    const filteredClasses = appState.classes.filter(c => {
        const matchesFilter = appState.activeFilter === 'Todas' || c.type === appState.activeFilter;
        let cDays = c.days;
        if (typeof cDays === 'string') { try { cDays = JSON.parse(cDays); } catch (e) { console.warn('Invalid JSON for cDays'); } }
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
    
    if (window.lucide) {
        window.lucide.createIcons();
    }

    document.querySelectorAll('.btn-reserve-stitch').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            if (appState.role === 'admin') {
                if (openClassModal) openClassModal(id, appState.classes);
            } else {
                if (toggleReservation) toggleReservation(id);
            }
        };
    });
};
