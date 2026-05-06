import { SupabaseService } from '../services/supabaseService.js';

/**
 * Renders the tournaments list.
 * Relies on global `window.appState`, `window.auth`, `window.showToast`.
 */
export const renderTournaments = () => {
    const tourneyList = document.getElementById('tourney-list');
    if (!tourneyList) return;

    const { appState, auth, showToast } = window;

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
                        <span class="st-tag">COMPETICIÓN</span>
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
    
    if (window.lucide) {
        window.lucide.createIcons();
    }

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
                    if (showToast) showToast("Torneo eliminado 🗑️", "#ef4444");
                } catch (err) {
                    if (showToast) showToast("Error al eliminar torneo ❌", "#ef4444");
                }
            }
        };
    });

    const createBtn = document.getElementById('add-tourney-btn');
    if (createBtn) {
        createBtn.onclick = () => openTournamentModal(null, appState.tournaments);
    }
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
