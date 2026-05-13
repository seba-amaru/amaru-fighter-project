import { SupabaseService } from '../services/supabaseService.js';

/**
 * Renders the class schedule and the date carousel.
 * Relies on global `window.appState`, `window.showLoading`, `window.hideLoading`, `window.auth`, `window.toggleReservation`, `window.openClassModal`.
 */
export const renderSchedule = async () => {
    const container = document.querySelector('.class-timeline');
    const carousel = document.querySelector('.date-carousel-premium');
    if (!container) return;

    const { appState, auth, showLoading, hideLoading, toggleReservation, openClassModal, SkeletonLoader } = window;

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
                try {
                    const res = await SupabaseService.getReservations(isoDate);
                    appState.reservations = (res || [])
                        .filter(r => r.user_id === auth.currentUser?.uid)
                        .map(r => r.class_id);
                } catch (e) {
                    console.error('[Schedule] Error fetching reservations:', e);
                    appState.reservations = [];
                }
                if (hideLoading) hideLoading();
                renderSchedule();
            };
            carousel.appendChild(chip);
        }
    }

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const currentDayInt = new Date(appState.selectedDate + 'T12:00:00').getDay();
    const currentDayName = dayNames[currentDayInt];

    console.log(`[Schedule] Rendering for ${appState.selectedDate} (${currentDayName}, index: ${currentDayInt})`);
    console.log(`[Schedule] Total classes in state: ${appState.classes?.length}`);

    // Fetch all reservations for this date to show attendance
    let allReservationsForDate = [];
    try {
        allReservationsForDate = await SupabaseService.getReservations(appState.selectedDate);
    } catch (e) {
        console.warn('[Schedule] Could not fetch reservations for date:', e);
    }

    const filteredClasses = appState.classes.filter(c => {
        const matchesFilter = appState.activeFilter === 'Todas' || c.type === appState.activeFilter;
        let cDays = c.days;
        if (typeof cDays === 'string') {
            try { cDays = JSON.parse(cDays); }
            catch (e) {
                cDays = cDays.split(',').map(d => d.trim());
            }
        }

        let matchesDay = false;
        if (Array.isArray(cDays)) {
            matchesDay = cDays.some(d =>
                d === currentDayInt ||
                String(d) === String(currentDayInt) ||
                String(d).toLowerCase() === currentDayName.toLowerCase() ||
                String(d).toLowerCase().startsWith(currentDayName.substring(0, 3).toLowerCase())
            );
        }
        return matchesFilter && matchesDay;
    });

    console.log(`[Schedule] Filtered classes: ${filteredClasses.length}`);

    if (filteredClasses.length === 0) {
        // Show skeleton while loading if data not ready yet
        if (appState.classes.length === 0 && SkeletonLoader) {
            SkeletonLoader.showFor('schedule');
            return;
        }
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:var(--text-gray);">
                <i data-lucide="calendar-x" style="width:40px; height:40px; opacity:0.3; margin-bottom:15px;"></i>
                <p>No hay clases programadas para este día.</p>
                <span style="font-size:0.8rem; opacity:0.6;">(Filtro: ${appState.activeFilter})</span>
            </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Hide skeleton when data is ready
    if (SkeletonLoader) SkeletonLoader.hideAll();

    container.innerHTML = filteredClasses.map((cls, idx) => {
        const isBooked = appState.reservations.includes(cls.id);
        const classReservations = allReservationsForDate.filter(r => r.class_id === cls.id);
        const attendeeCount = classReservations.length;
        const attendeeNames = classReservations.map(r => r.user_name || r.profiles?.full_name || 'Atleta').slice(0, 5);
        const hasMoreAttendees = classReservations.length > 5;

        const typeColor = {
            'Striking': '#ef4444',
            'BJJ': '#8b5cf6',
            'MMA': '#f97316',
            'Funcional Fighter': '#22c55e',
            'BJJ Gi': '#8b5cf6',
            'No Gi': '#a855f7'
        }[cls.type] || 'var(--accent-cyan)';

        return `
            <div class="stitch-class-card ${isBooked ? 'booked' : ''} ${cls.theme}" data-class-id="${cls.id}" style="opacity:0; animation: elegantFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.04 + idx * 0.08}s forwards; cursor: pointer; transition: all 0.3s;"
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 40px rgba(0,0,0,0.3)';"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='';">
                <div class="smoke-layer"></div>
                <div class="stitch-class-content">
                    <div class="cls-info-main" style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                            <span class="tag" style="background:${typeColor}22; color:${typeColor}; border:1px solid ${typeColor}44;">${cls.type}</span>
                            ${isBooked ? '<span class="tag" style="background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3);">✓ Reservado</span>' : ''}
                        </div>
                        <h4 style="margin:0; font-size:1.05rem; font-weight:800;">${cls.name}</h4>
                        <p style="margin:4px 0 0; font-size:0.8rem; opacity:0.7;">${cls.time} • Coach ${cls.coach}</p>
                        <div style="display:flex; align-items:center; gap:6px; margin-top:8px; flex-wrap:wrap;">
                            <span style="font-size:0.7rem; opacity:0.5; display:flex; align-items:center; gap:4px;">
                                <i data-lucide="users" style="width:12px;"></i> ${attendeeCount} inscrito${attendeeCount !== 1 ? 's' : ''}
                            </span>
                            ${attendeeCount > 0 ? `<span style="font-size:0.65rem; opacity:0.4;">• ${attendeeNames.join(', ')}${hasMoreAttendees ? '...' : ''}</span>` : ''}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                        ${appState.role === 'admin' ? `
                        <button class="btn-view-attendees" data-class-id="${cls.id}" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-gray); padding:8px 14px; border-radius:10px; font-size:0.7rem; font-weight:700; cursor:pointer; min-width:100px;"
                            onclick="event.stopPropagation();">
                            <i data-lucide="eye" style="width:12px; margin-right:4px;"></i> Ver asistencia
                        </button>` : `
                        <button class="btn-reserve-stitch ${isBooked ? 'booked' : ''}" data-id="${cls.id}" style="min-width:100px;"
                            onclick="event.stopPropagation();">
                            ${isBooked ? 'CANCELAR' : 'RESERVAR'}
                        </button>
                        `}
                    </div>
                </div>
                <div class="class-attendees-detail" id="attendees-${cls.id}" style="display:none; padding:12px 20px 16px; border-top:1px solid rgba(255,255,255,0.05);">
                    <p style="font-size:0.7rem; opacity:0.5; margin-bottom:8px; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Lista de asistentes</p>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${classReservations.length === 0 ? '<span style="font-size:0.8rem; opacity:0.4;">Nadie inscrito todavía</span>' : classReservations.map((r, i) => `
                            <div style="display:flex; align-items:center; gap:8px; padding:6px 0; ${i < classReservations.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.03);' : ''}">
                                <div style="width:26px; height:26px; border-radius:8px; background:${typeColor}15; border:1px solid ${typeColor}30; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:800; color:${typeColor};">
                                    ${(r.profiles?.full_name || r.user_name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <span style="font-size:0.8rem; font-weight:600;">${r.profiles?.full_name || r.user_name || 'Atleta'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    }).join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Main card click - toggle attendees detail
    document.querySelectorAll('.stitch-class-card').forEach(card => {
        card.onclick = () => {
            const classId = card.getAttribute('data-class-id');
            const detail = document.getElementById(`attendees-${classId}`);
            if (detail) {
                const isOpen = detail.style.display === 'block';
                detail.style.display = isOpen ? 'none' : 'block';
            }
        };
    });

    document.querySelectorAll('.btn-reserve-stitch').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            if (appState.role === 'admin') {
                if (openClassModal) openClassModal(id, appState.classes);
                else window.showToast("Función de edición no disponible", "#ef4444");
            } else {
                if (toggleReservation) toggleReservation(id);
            }
        };
    });

    // Admin: view attendees button
    document.querySelectorAll('.btn-view-attendees').forEach(btn => {
        btn.onclick = () => {
            const classId = btn.getAttribute('data-class-id');
            const detail = document.getElementById(`attendees-${classId}`);
            if (detail) {
                detail.style.display = detail.style.display === 'block' ? 'none' : 'block';
            }
        };
    });
};
