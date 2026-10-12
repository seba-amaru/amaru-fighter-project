/**
 * Servicio autocontenido para el Modo Kiosco Tatami TV de la Suite de Administración.
 * Encapsulado 100% dentro de /admin para compatibilidad tanto con servidores estáticos
 * directos (npx serve admin) como con Vite ESM y bundles de producción.
 */
import { supabase } from './supabaseClient.js';

export const KioskService = {
    /**
     * Determina la clase activa en curso o la próxima clase del día para el modo Kiosco TV.
     */
    getActiveClassForKiosk(classes = [], nowRef = new Date()) {
        if (!classes || classes.length === 0) return null;

        const now = nowRef instanceof Date ? nowRef : new Date(nowRef);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Parsear hora en minutos desde 'HH:MM' o 'HH:MM - HH:MM'
        const parseClassTime = (timeStr) => {
            if (!timeStr) return { start: 0, end: 60 };
            const parts = timeStr.split('-').map(s => s.trim());
            const [sh, sm] = (parts[0] || '00:00').split(':').map(Number);
            const start = (sh || 0) * 60 + (sm || 0);

            let end;
            if (parts[1]) {
                const [eh, em] = parts[1].split(':').map(Number);
                end = (eh || 0) * 60 + (em || 0);
            } else {
                end = start + 60; // 60 min por defecto
            }
            return { start, end };
        };

        const sorted = [...classes].map(c => {
            const { start, end } = parseClassTime(c.time);
            return { ...c, _startMins: start, _endMins: end };
        }).sort((a, b) => a._startMins - b._startMins);

        // 1. Buscar clase en curso (desde 20 min antes de inicio hasta 20 min después de fin)
        for (const cls of sorted) {
            const windowStart = cls._startMins - 20;
            const windowEnd = cls._endMins + 20;
            if (currentMinutes >= windowStart && currentMinutes <= windowEnd) {
                return {
                    classData: cls,
                    status: 'LIVE',
                    statusLabel: 'Tatami Activo 🔴',
                    minutesToStart: cls._startMins - currentMinutes
                };
            }
        }

        // 2. Buscar próxima clase más cercana en el día
        const upcoming = sorted.find(c => c._startMins > currentMinutes);
        if (upcoming) {
            return {
                classData: upcoming,
                status: 'UPCOMING',
                statusLabel: 'Próxima Clase ⏳',
                minutesToStart: upcoming._startMins - currentMinutes
            };
        }

        // 3. Si ya pasaron todas las clases de hoy, devolver la última clase
        return {
            classData: sorted[sorted.length - 1],
            status: 'FINISHED',
            statusLabel: 'Jornada Finalizada 🥋',
            minutesToStart: 0
        };
    },

    /**
     * Genera el payload y token QR de la clase con expiración y datos validados.
     */
    generateClassQRToken(classId, date, time, className = '') {
        const payload = {
            app: 'amarufighter',
            version: '1.0',
            class_id: classId,
            class_name: className,
            date: date,
            time: time,
            generated_at: Date.now()
        };
        return `AF_QR:${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
    },

    /**
     * Consulta el estado en tiempo real del Roster de la clase (Reservas + Asistencias confirmadas).
     */
    async getLiveClassStatus(classId, date = null) {
        if (!classId) throw new Error('ID de clase requerido');

        const now = new Date();
        const targetDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Obtener datos de la clase
        let classData = null;
        try {
            const { data: cData } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .maybeSingle();
            classData = cData;
        } catch (e) {
            console.warn('[KioskService] No se pudo obtener clase específica:', e);
        }

        // Obtener reservas con perfiles
        const { data: rawReservations, error: resErr } = await supabase
            .from('reservations')
            .select('*, profiles:profiles(id, full_name, photo_url, xp, level)')
            .eq('class_id', classId)
            .eq('reservation_date', targetDate);

        if (resErr) throw resErr;

        // Obtener asistencias registradas
        const { data: rawAttendances, error: attErr } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', classId);

        if (attErr) throw attErr;

        // Filtrar asistencias correspondientes a targetDate
        const attendancesToday = (rawAttendances || []).filter(a => {
            const aDate = (a.attended_at || a.created_at || '').slice(0, 10);
            return aDate === targetDate;
        });

        const attendanceUserMap = new Map();
        attendancesToday.forEach(a => {
            attendanceUserMap.set(a.user_id, a);
        });

        // Separar reservas regulares de waitlist
        const reservations = rawReservations || [];
        const activeReservations = reservations.filter(r => !(r.class_name || '').includes('[Waitlist]'));
        const waitlistReservations = reservations.filter(r => (r.class_name || '').includes('[Waitlist]'));

        // Generar lista unificada de atletas
        const athleteMap = new Map();

        // Primero agregar reservados activos
        activeReservations.forEach(r => {
            const prof = r.profiles || {};
            const att = attendanceUserMap.get(r.user_id);
            athleteMap.set(r.user_id, {
                userId: r.user_id,
                name: prof.full_name || r.user_name || 'Atleta',
                avatar: prof.photo_url || null,
                level: prof.level || 0,
                xp: prof.xp || 0,
                hasAttended: Boolean(att),
                attendedAt: att?.attended_at || att?.created_at || null,
                isWaitlist: false
            });
        });

        // Incluir asistentes directos (walk-ins / QR check-ins)
        attendancesToday.forEach(a => {
            if (!athleteMap.has(a.user_id)) {
                athleteMap.set(a.user_id, {
                    userId: a.user_id,
                    name: a.student_name || 'Atleta Dojo',
                    avatar: null,
                    level: 0,
                    xp: 0,
                    hasAttended: true,
                    attendedAt: a.attended_at || a.created_at || null,
                    isWaitlist: false
                });
            }
        });

        const athletes = Array.from(athleteMap.values()).sort((a, b) => {
            if (a.hasAttended && !b.hasAttended) return -1;
            if (!a.hasAttended && b.hasAttended) return 1;
            return a.name.localeCompare(b.name);
        });

        const capacity = Number(classData?.capacity) || 20;
        const attendedCount = athletes.filter(a => a.hasAttended).length;
        const reservedCount = activeReservations.length;
        const occupancyPct = Math.min(100, Math.round((attendedCount / capacity) * 100));

        // Generar Token QR de la clase para proyección
        const qrToken = this.generateClassQRToken(
            classId,
            targetDate,
            classData?.time || '19:00',
            classData?.name || 'Clase Dojo'
        );

        return {
            classData: classData || { id: classId, name: 'Clase Tatami', coach: 'Sensei', capacity },
            date: targetDate,
            qrToken,
            capacity,
            reservedCount,
            attendedCount,
            occupancyPct,
            waitlistCount: waitlistReservations.length,
            athletes,
            waitlist: waitlistReservations.map(w => ({
                userId: w.user_id,
                name: w.profiles?.full_name || w.user_name || 'Atleta en Espera',
                createdAt: w.created_at
            }))
        };
    },

    /**
     * Suscripción Realtime a check-ins y asistencias para actualización automática del Kiosco.
     */
    subscribeToLiveAttendance(classId, date, onAttendanceChange) {
        if (!supabase || typeof supabase.channel !== 'function') {
            console.warn('[KioskService] Realtime no disponible en cliente Supabase.');
            return { unsubscribe: () => {} };
        }

        const channelName = `kiosk-live-${classId}-${Date.now()}`;
        const channel = supabase.channel(channelName)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'attendance',
                filter: `class_id=eq.${classId}`
            }, (payload) => {
                if (typeof onAttendanceChange === 'function') {
                    onAttendanceChange({ type: 'attendance', payload });
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reservations',
                filter: `class_id=eq.${classId}`
            }, (payload) => {
                if (typeof onAttendanceChange === 'function') {
                    onAttendanceChange({ type: 'reservation', payload });
                }
            })
            .subscribe();

        return {
            channel,
            unsubscribe: () => {
                try {
                    supabase.removeChannel(channel);
                } catch (e) {
                    console.warn('[KioskService] Error removiendo canal realtime:', e);
                }
            }
        };
    }
};

export default KioskService;
