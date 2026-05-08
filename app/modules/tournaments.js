import { SupabaseService } from '../services/supabaseService.js';

/**
 * Renders the tournaments list with premium design.
 * Relies on global `window.appState`, `window.auth`, `window.showToast`.
 */

let tournamentCountdownInterval = null;

export const renderTournaments = () => {
    const tourneyList = document.getElementById('tourney-list');
    if (!tourneyList) return;

    const { appState, auth, showToast } = window;
    const now = new Date();

    // Separate upcoming vs past
    const upcoming = appState.tournaments.filter(t => new Date(t.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
    const past = appState.tournaments.filter(t => new Date(t.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update hero countdown
    updateTournamentHero(upcoming);

    // Get active tab
    const activeTab = document.querySelector('.tournament-selector .sel-tab.active')?.getAttribute('data-tab') || 'upcoming';
    const displayTournaments = activeTab === 'upcoming' ? upcoming : past;

    if (displayTournaments.length === 0) {
        tourneyList.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; opacity: 0.4;">
                <i data-lucide="trophy" style="width: 40px; height: 40px; margin-bottom: 12px;"></i>
                <p style="font-size: 0.85rem; font-weight: 700;">${activeTab === 'upcoming' ? 'No hay torneos próximos' : 'No hay torneos pasados'}</p>
                <p style="font-size: 0.7rem; color: var(--text-gray); margin-top: 4px;">${activeTab === 'upcoming' ? 'Agrega tu primer torneo con el botón +' : 'Los torneos pasados aparecerán aquí'}</p>
            </div>
        `;
    } else {
        tourneyList.innerHTML = displayTournaments.map((t, idx) => {
            const tourDate = new Date(t.date);
            const diffMs = tourDate - now;
            const isPast = diffMs < 0;
            const daysLeft = isPast ? Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24)) : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const dateStr = tourDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

            const statusColor = isPast ? '#22c55e' : daysLeft <= 7 ? '#ef4444' : '#fbbf24';
            const statusBg = isPast ? 'rgba(34,197,94,0.1)' : daysLeft <= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)';
            const statusBorder = isPast ? 'rgba(34,197,94,0.2)' : daysLeft <= 7 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)';
            const statusText = isPast ? 'Completado' : daysLeft <= 7 ? `En ${daysLeft} días` : `En ${daysLeft} días`;
            const statusIcon = isPast ? 'check-circle' : daysLeft <= 7 ? 'flame' : 'calendar';

            return `
            <div style="display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; transition: all 0.3s; animation: elegantFadeIn 0.45s ease ${0.04 + idx * 0.1}s both; cursor: pointer;"
                onmouseenter="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(4px)';"
                onmouseleave="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateX(0)';">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: ${statusBg}; border: 1px solid ${statusBorder}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i data-lucide="${statusIcon}" style="width: 20px; color: ${statusColor};"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.9rem; font-weight: 800; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.name}</p>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                        <span style="font-size: 0.7rem; color: var(--text-gray); display: flex; align-items: center; gap: 3px;">
                            <i data-lucide="map-pin" style="width: 10px;"></i> ${t.place}
                        </span>
                        <span style="font-size: 0.65rem; color: var(--text-gray); opacity: 0.6;">• ${dateStr}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span style="font-size: 0.6rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; text-transform: uppercase; letter-spacing: 0.5px;">${statusText}</span>
                    ${appState.role === 'admin' ? `
                    <button class="edit-tourney-btn" data-id="${t.id}" style="background:none; border:none; color:white; cursor:pointer; padding: 4px; opacity: 0.6; transition: opacity 0.3s;" onclick="event.stopPropagation();">
                        <i data-lucide="edit-3" style="width:14px;"></i>
                    </button>
                    <button class="delete-tourney-btn" data-id="${t.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding: 4px; opacity: 0.6; transition: opacity 0.3s;" onclick="event.stopPropagation();">
                        <i data-lucide="trash-2" style="width:14px;"></i>
                    </button>
                    ` : ''}
                </div>
            </div>`;
        }).join('');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Edit buttons
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

    // Delete buttons
    document.querySelectorAll('.delete-tourney-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Eliminar este torneo de tu lista?")) {
                const id = btn.getAttribute('data-id');
                try {
                    await SupabaseService.deleteTournament(id);
                    appState.tournaments = await SupabaseService.getTournaments(auth.currentUser.uid);
                    renderTournaments();
                    if (showToast) showToast("Torneo eliminado 🗑️", "#ef4444");
                } catch (err) {
                    if (showToast) showToast("Error al eliminar torneo ❌", "#ef4444");
                    console.error(err);
                }
            }
        };
    });

    // Tab switching
    document.querySelectorAll('.tournament-selector .sel-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.tournament-selector .sel-tab').forEach(t => {
                t.classList.remove('active');
                t.style.background = 'transparent';
                t.style.color = 'var(--text-gray)';
            });
            tab.classList.add('active');
            tab.style.background = 'var(--accent-purple)';
            tab.style.color = 'white';
            renderTournaments();
        };
    });
};

const updateTournamentHero = (upcoming) => {
    const countdownContainer = document.getElementById('tournament-next-countdown');
    const noEvents = document.getElementById('tournament-no-events');
    const heroName = document.getElementById('tournament-hero-name');
    const heroPlace = document.getElementById('tournament-hero-place');
    const cdDays = document.getElementById('tourney-cd-days');
    const cdHours = document.getElementById('tourney-cd-hours');
    const cdMins = document.getElementById('tourney-cd-mins');

    if (!countdownContainer || !noEvents) return;

    // Clear previous interval
    if (tournamentCountdownInterval) {
        clearInterval(tournamentCountdownInterval);
        tournamentCountdownInterval = null;
    }

    if (upcoming.length === 0) {
        countdownContainer.style.display = 'none';
        noEvents.style.display = 'block';
        return;
    }

    const next = upcoming[0];
    countdownContainer.style.display = 'block';
    noEvents.style.display = 'none';

    if (heroName) heroName.innerText = next.name;
    if (heroPlace) heroPlace.innerText = next.place;

    const updateCountdown = () => {
        const now = new Date();
        const target = new Date(next.date);
        const diff = target - now;

        if (diff <= 0) {
            if (cdDays) cdDays.innerText = '0';
            if (cdHours) cdHours.innerText = '0';
            if (cdMins) cdMins.innerText = '0';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (cdDays) cdDays.innerText = days;
        if (cdHours) cdHours.innerText = hours;
        if (cdMins) cdMins.innerText = mins;
    };

    updateCountdown();
    tournamentCountdownInterval = setInterval(updateCountdown, 60000); // Update every minute
};

export const openTournamentModal = (id = null, tournaments = []) => {
    const modal = document.getElementById('tourney-modal');
    if (!modal) {
        console.error('Tournament modal not found in DOM');
        return;
    }

    if (id) {
        const t = tournaments.find(tour => tour.id === id);
        if (t) {
            document.getElementById('tourney-id').value = t.id;
            document.getElementById('tourney-name').value = t.name;
            document.getElementById('tourney-place').value = t.place;
            document.getElementById('tourney-date').value = t.date;
            document.getElementById('tourney-modal-title').innerText = "Editar Torneo";
        }
    } else {
        document.getElementById('tourney-id').value = '';
        document.getElementById('tourney-name').value = '';
        document.getElementById('tourney-place').value = '';
        document.getElementById('tourney-date').value = '';
        document.getElementById('tourney-modal-title').innerText = "Nuevo Torneo";
    }
    modal.classList.add('active');
};
