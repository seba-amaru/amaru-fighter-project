import { describe, it, expect, beforeEach } from 'vitest';

// --- MOCK STORAGE & SYSTEM UTILS FOR QA AUDIT ---
let mockLocalStorage = {};
beforeEach(() => {
    mockLocalStorage = {};
});

const getCancellationDeadlineHours = () => {
    return Number(mockLocalStorage['amarufighter_cancel_deadline_hours']) || 1;
};

const setCancellationDeadlineHours = (hours) => {
    mockLocalStorage['amarufighter_cancel_deadline_hours'] = String(hours);
    return hours;
};

function canCancelReservation({ classTime, reservationDate, deadlineHours = null, userRole = 'athlete', now = new Date() }) {
    if (userRole === 'admin') {
        return { allowed: true, hoursLeft: 999, reason: 'Acceso de Administrador' };
    }

    if (!classTime || !reservationDate) {
        return { allowed: true, hoursLeft: 0, reason: 'Información incompleta' };
    }

    const limit = (deadlineHours !== null && !isNaN(Number(deadlineHours)))
        ? Number(deadlineHours)
        : getCancellationDeadlineHours();

    const timeParts = classTime.split(':').map(Number);
    const dateParts = reservationDate.split('-').map(Number);
    if (timeParts.length < 2 || dateParts.length < 3) {
        return { allowed: true, hoursLeft: 0, reason: 'Formato inválido' };
    }

    const classDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0);
    const diffMs = classDateTime.getTime() - now.getTime();
    const hoursDiff = diffMs / (1000 * 60 * 60);

    if (hoursDiff < limit) {
        return {
            allowed: false,
            hoursLeft: Math.max(0, hoursDiff),
            deadlineHours: limit,
            reason: `No puedes cancelar a menos de ${limit} ${limit === 1 ? 'hora' : 'horas'} antes de la clase ⏳`
        };
    }

    return {
        allowed: true,
        hoursLeft: hoursDiff,
        deadlineHours: limit,
        reason: 'Cancelación permitida dentro del plazo'
    };
}

// --- SIMULACIÓN DE EXPORTACIÓN FINANCIERA ---
function buildExportRow(payment) {
    const studentName = payment.profiles?.full_name || payment.user_display_name || 'Socio';
    const studentEmail = payment.profiles?.email || payment.user_email || '';
    return [
        payment.id,
        studentName,
        studentEmail,
        payment.concept || payment.plan_name || 'Membresía',
        payment.payment_method || 'transferencia',
        payment.amount ? `$${Number(payment.amount).toLocaleString('es-CL')}` : '$0',
        payment.coverage_month || '',
        payment.created_at || ''
    ];
}

// --- SIMULACIÓN DE VALIDACIÓN QR ---
function generateClassQRToken(classId, date, time, className = '') {
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
}

function parseClassQRToken(rawString) {
    if (!rawString) return null;
    try {
        const str = String(rawString).trim();
        if (str.startsWith('AF_QR:')) {
            const b64 = str.slice(6);
            const jsonStr = decodeURIComponent(escape(atob(b64)));
            return JSON.parse(jsonStr);
        }
        return JSON.parse(str);
    } catch {
        return null;
    }
}

function simulateQRCheckIn({ userId, qrData, currentDate, reservations, attendances, userProfile }) {
    if (!userId) return { success: false, code: 'AUTH_REQUIRED', error: 'Usuario no autenticado.' };

    const payload = typeof qrData === 'object' && qrData !== null ? qrData : parseClassQRToken(qrData);

    if (!payload || payload.app !== 'amarufighter' || !payload.class_id) {
        return { success: false, code: 'INVALID_QR', error: 'Código QR no reconocido o inválido para Amarufighter Dojo.' };
    }

    if (payload.date && payload.date !== currentDate) {
        return { success: false, code: 'EXPIRED_DATE', error: `Este código QR corresponde a la fecha ${payload.date}, no al día de hoy.` };
    }

    const hasReservation = reservations.some(r => r.user_id === userId && r.class_id === payload.class_id && r.reservation_date === currentDate);
    if (!hasReservation) {
        return { success: false, code: 'NO_RESERVATION', error: 'No tienes una reserva activa para esta clase. Reserva primero en el horario.' };
    }

    const alreadyAttended = attendances.some(a => a.user_id === userId && a.class_id === payload.class_id && a.date === currentDate);
    if (alreadyAttended) {
        return { success: false, code: 'ALREADY_ATTENDED', error: 'Ya registraste tu asistencia para esta clase el día de hoy.' };
    }

    const newXP = (userProfile.xp || 0) + 25;
    userProfile.xp = newXP;

    return {
        success: true,
        xpEarned: 25,
        newXP,
        className: payload.class_name || 'Clase Dojo'
    };
}

describe('🧪 AUDITORÍA QA: Requerimiento 1 — Nombres Reales en Reportes Financieros', () => {
    it('Q1.1: Debe extraer el nombre real (full_name) y no el UUID (user_id)', () => {
        const payment = {
            id: 'pay-001',
            user_id: '76f3458b-3db4-478a-9289-42b78a9c313a',
            user_display_name: null,
            amount: 35000,
            concept: 'Membresía Mensual',
            payment_method: 'transferencia',
            profiles: {
                id: '76f3458b-3db4-478a-9289-42b78a9c313a',
                full_name: 'Sebastián Amaru',
                email: 'seba@amarufighter.cl'
            }
        };

        const row = buildExportRow(payment);
        const studentNameCol = row[1];
        const studentEmailCol = row[2];

        expect(studentNameCol).toBe('Sebastián Amaru');
        expect(studentNameCol).not.toContain('76f3458b');
        expect(studentEmailCol).toBe('seba@amarufighter.cl');
    });

    it('Q1.2: Debe fallback amigable ("Socio") si perfil no tiene nombre, evitando filtrar UUID crudo', () => {
        const paymentWithoutName = {
            id: 'pay-002',
            user_id: '99a9b9c9-0000-1111-2222-333344445555',
            user_display_name: null,
            profiles: null
        };

        const row = buildExportRow(paymentWithoutName);
        expect(row[1]).toBe('Socio');
        expect(row[1]).not.toContain('99a9b9c9');
    });

    it('Q1.3: Debe estructurar correctamente las 8 columnas requeridas para el reporte contable', () => {
        const payment = {
            id: 'p-100',
            profiles: { full_name: 'Claudio Valenzuela', email: 'claudio@gym.cl' },
            concept: 'Plan Striking Trimestral',
            payment_method: 'efectivo',
            amount: 90000,
            coverage_month: 'Octubre 2026',
            created_at: '2026-10-05T15:30:00Z'
        };

        const row = buildExportRow(payment);
        expect(row.length).toBe(8);
        expect(row[0]).toBe('p-100');
        expect(row[1]).toBe('Claudio Valenzuela');
        expect(row[2]).toBe('claudio@gym.cl');
        expect(row[3]).toBe('Plan Striking Trimestral');
        expect(row[4]).toBe('efectivo');
        expect(row[5]).toBe('$90.000');
        expect(row[6]).toBe('Octubre 2026');
    });
});

describe('🧪 AUDITORÍA QA: Requerimiento 2 — Restricciones de Cancelación (Anti No-Show)', () => {
    const fixedNow = new Date('2026-10-12T18:00:00'); // 18:00 hrs

    it('Q2.1: Permitir cancelación con 75 minutos de antelación (hora clase: 19:15)', () => {
        const res = canCancelReservation({
            classTime: '19:15',
            reservationDate: '2026-10-12',
            deadlineHours: 1,
            userRole: 'athlete',
            now: fixedNow
        });

        expect(res.allowed).toBe(true);
        expect(res.hoursLeft).toBeCloseTo(1.25);
    });

    it('Q2.2: Bloquear cancelación con 45 minutos de antelación (hora clase: 18:45)', () => {
        const res = canCancelReservation({
            classTime: '18:45',
            reservationDate: '2026-10-12',
            deadlineHours: 1,
            userRole: 'athlete',
            now: fixedNow
        });

        expect(res.allowed).toBe(false);
        expect(res.hoursLeft).toBeCloseTo(0.75);
        expect(res.reason).toContain('No puedes cancelar a menos de 1 hora');
    });

    it('Q2.3: Caso límite de frontera: 60 minutos exactos vs 59 minutos', () => {
        const at60min = canCancelReservation({
            classTime: '19:00',
            reservationDate: '2026-10-12',
            deadlineHours: 1,
            userRole: 'athlete',
            now: fixedNow
        });
        expect(at60min.allowed).toBe(true);

        const at59min = canCancelReservation({
            classTime: '18:59',
            reservationDate: '2026-10-12',
            deadlineHours: 1,
            userRole: 'athlete',
            now: fixedNow
        });
        expect(at59min.allowed).toBe(false);
    });

    it('Q2.4: Bypass de Administrador: Admin siempre puede cancelar reservas pasadas o urgentes', () => {
        const adminCancel = canCancelReservation({
            classTime: '18:10', // faltan solo 10 minutos
            reservationDate: '2026-10-12',
            deadlineHours: 1,
            userRole: 'admin',
            now: fixedNow
        });

        expect(adminCancel.allowed).toBe(true);
        expect(adminCancel.reason).toBe('Acceso de Administrador');
    });

    it('Q2.5: Respeto a la configuración dinámica del Admin (cambio a 2 horas)', () => {
        setCancellationDeadlineHours(2);

        // Clase a las 19:30 (faltan 1.5 horas). Con límite de 1h se permitiría, con 2h debe bloquearse.
        const res = canCancelReservation({
            classTime: '19:30',
            reservationDate: '2026-10-12',
            userRole: 'athlete',
            now: fixedNow
        });

        expect(res.allowed).toBe(false);
        expect(res.reason).toContain('No puedes cancelar a menos de 2 horas');
    });
});

describe('🧪 AUDITORÍA QA: Requerimiento 3 — Check-in con Código QR y Presencia Física', () => {
    const today = '2026-10-12';
    const classId = 'bjj-gi-1900';
    const validToken = generateClassQRToken(classId, today, '19:00', 'BJJ Gi Avanzado');

    it('Q3.1: Escaneo Exitoso con Reserva Activa: otorga asistencia y +25 XP', () => {
        const userProfile = { id: 'user-01', xp: 100 };
        const reservations = [{ user_id: 'user-01', class_id: classId, reservation_date: today }];
        const attendances = [];

        const result = simulateQRCheckIn({
            userId: 'user-01',
            qrData: validToken,
            currentDate: today,
            reservations,
            attendances,
            userProfile
        });

        expect(result.success).toBe(true);
        expect(result.xpEarned).toBe(25);
        expect(result.newXP).toBe(125);
        expect(userProfile.xp).toBe(125);
        expect(result.className).toBe('BJJ Gi Avanzado');
    });

    it('Q3.2: Rechazo por Falta de Reserva Previa', () => {
        const userProfile = { id: 'user-02', xp: 50 };
        const reservations = []; // Sin reserva
        const attendances = [];

        const result = simulateQRCheckIn({
            userId: 'user-02',
            qrData: validToken,
            currentDate: today,
            reservations,
            attendances,
            userProfile
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('NO_RESERVATION');
        expect(result.error).toContain('No tienes una reserva activa');
        expect(userProfile.xp).toBe(50); // XP intacto
    });

    it('Q3.3: Rechazo Anti-Fraude por Doble Escaneo en el Mismo Día', () => {
        const userProfile = { id: 'user-03', xp: 200 };
        const reservations = [{ user_id: 'user-03', class_id: classId, reservation_date: today }];
        const attendances = [{ user_id: 'user-03', class_id: classId, date: today }]; // Ya asistió

        const result = simulateQRCheckIn({
            userId: 'user-03',
            qrData: validToken,
            currentDate: today,
            reservations,
            attendances,
            userProfile
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('ALREADY_ATTENDED');
        expect(result.error).toContain('Ya registraste tu asistencia para esta clase el día de hoy');
        expect(userProfile.xp).toBe(200);
    });

    it('Q3.4: Rechazo de Código Vencido (fecha de ayer compartida por foto)', () => {
        const yesterdayToken = generateClassQRToken(classId, '2026-10-11', '19:00', 'BJJ Gi Avanzado');
        const userProfile = { id: 'user-04', xp: 0 };
        const reservations = [{ user_id: 'user-04', class_id: classId, reservation_date: today }];
        const attendances = [];

        const result = simulateQRCheckIn({
            userId: 'user-04',
            qrData: yesterdayToken,
            currentDate: today,
            reservations,
            attendances,
            userProfile
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('EXPIRED_DATE');
        expect(result.error).toContain('corresponde a la fecha 2026-10-11');
    });

    it('Q3.5: Rechazo de Payload Corrupto o Ajeno a Amarufighter', () => {
        const fakeToken = 'https://otro-gimnasio.com/qr/123';
        const userProfile = { id: 'user-05', xp: 0 };

        const result = simulateQRCheckIn({
            userId: 'user-05',
            qrData: fakeToken,
            currentDate: today,
            reservations: [],
            attendances: [],
            userProfile
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('INVALID_QR');
    });
});

// ============================================================================
// AUDITORÍA QA - RUTA 1: COBRANZA PROACTIVA POR WHATSAPP & WAITLIST INTELIGENTE
// ============================================================================

// Utilidades simuladas idénticas a supabaseService.js
function sanitizePhoneNumber(phone, defaultCountryCode = '56') {
    if (!phone) return null;
    let clean = String(phone).replace(/[^\d+]/g, '').trim();
    if (clean.startsWith('+')) clean = clean.slice(1);
    if (!clean) return null;

    if (clean.length === 9 && clean.startsWith('9')) {
        clean = `${defaultCountryCode}${clean}`;
    } else if (clean.length === 8) {
        clean = `${defaultCountryCode}9${clean}`;
    } else if (clean.startsWith('56') && clean.length === 11) {
        // Formato ok
    } else if (clean.length < 8) {
        return null;
    }
    return clean;
}

function getDojoBankDetails() {
    try {
        const stored = mockLocalStorage['amarufighter_bank_details'];
        if (stored) return JSON.parse(stored);
    } catch {
        // fallback
    }
    return {
        bank: 'Banco Estado',
        accountType: 'Cuenta Corriente',
        accountNumber: '123456789',
        holder: 'Amarufighter Dojo SpA',
        rut: '76.543.210-K',
        email: 'pagos@amarufighter.cl'
    };
}

function setDojoBankDetails(details) {
    if (!details || typeof details !== 'object') return false;
    const current = getDojoBankDetails();
    const updated = { ...current, ...details };
    mockLocalStorage['amarufighter_bank_details'] = JSON.stringify(updated);
    return updated;
}

function generateWhatsAppCobranzaUrl({ phone, name, planName, expiryDate, daysLeft = 0, amount = 0 }) {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone) {
        return { success: false, url: null, error: 'El socio no tiene un número telefónico válido registrado.' };
    }
    const bank = getDojoBankDetails();
    const studentName = name || 'Atleta';
    const plan = planName || 'Membresía Dojo';
    const formattedAmount = amount ? `$${Number(amount).toLocaleString('es-CL')}` : '';
    const dateStr = expiryDate ? new Date(expiryDate).toLocaleDateString('es-CL') : 'fecha límite';

    let message;
    if (daysLeft < 0) {
        message = `Hola ${studentName} 🥋! Te saludamos desde Amarufighter Dojo.\n\n` +
            `Te escribimos para recordarte que tu membresía (${plan}) venció el ${dateStr}.\n\n` +
            `Para mantener activos tus accesos y asegurar tus cupos en el tatami, te compartimos los datos de transferencia:\n\n` +
            `🏦 Banco: ${bank.bank}\n` +
            `📋 Tipo: ${bank.accountType}\n` +
            `🔢 N° Cuenta: ${bank.accountNumber}\n` +
            `👤 Titular: ${bank.holder}\n` +
            `🆔 RUT: ${bank.rut}\n` +
            `📧 Correo: ${bank.email}\n` +
            (formattedAmount ? `💰 Monto: ${formattedAmount}\n\n` : `\n`) +
            `Una vez realizada la transferencia, envíanos el comprobante por este medio. ¡Nos vemos en el entrenamiento! 🔥🥊`;
    } else {
        const remaining = daysLeft === 0 ? 'hoy' : `en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;
        message = `Hola ${studentName} 🥋! Te saludamos desde Amarufighter Dojo.\n\n` +
            `Te recordamos que tu membresía (${plan}) vence ${remaining} (${dateStr}).\n\n` +
            `Si deseas renovar anticipadamente para no perder la continuidad de tus clases, puedes transferir a:\n\n` +
            `🏦 Banco: ${bank.bank} (${bank.accountType})\n` +
            `🔢 N°: ${bank.accountNumber}\n` +
            `👤 ${bank.holder} (RUT: ${bank.rut})\n` +
            `📧 ${bank.email}\n` +
            (formattedAmount ? `💰 Monto: ${formattedAmount}\n\n` : `\n`) +
            `¡A seguir entrenando con todo! 🥊🥋`;
    }

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    return { success: true, url, cleanPhone, message };
}

describe('QA Suite - RUTA 1: Cobranza por WhatsApp & Waitlist Inteligente', () => {
    it('Q4.1: Normalización de Teléfonos Celulares Chilenos e Internacionales', () => {
        expect(sanitizePhoneNumber('987654321')).toBe('56987654321');
        expect(sanitizePhoneNumber('+56 9 8765 4321')).toBe('56987654321');
        expect(sanitizePhoneNumber('56987654321')).toBe('56987654321');
        expect(sanitizePhoneNumber('87654321')).toBe('56987654321');
        expect(sanitizePhoneNumber('+5491123456789')).toBe('5491123456789'); // Internacional (Argentina)
        expect(sanitizePhoneNumber('123')).toBeNull(); // Muy corto
        expect(sanitizePhoneNumber('')).toBeNull();
        expect(sanitizePhoneNumber(null)).toBeNull();
    });

    it('Q4.2: Generación de Plantilla de Cobranza para Socio Moroso', () => {
        const res = generateWhatsAppCobranzaUrl({
            phone: '987654321',
            name: 'Carlos Striker',
            planName: 'Plan Pro Striking',
            expiryDate: '2026-10-01',
            daysLeft: -11,
            amount: 45000
        });

        expect(res.success).toBe(true);
        expect(res.cleanPhone).toBe('56987654321');
        expect(res.url).toContain('https://api.whatsapp.com/send?phone=56987654321');
        expect(res.message).toContain('Carlos Striker');
        expect(res.message).toContain('Plan Pro Striking');
        expect(res.message).toContain('venció el');
        expect(res.message).toContain('Banco Estado');
        expect(res.message).toContain('$45.000');
    });

    it('Q4.3: Generación de Recordatorio Preventivo para Socio por Vencer', () => {
        const res = generateWhatsAppCobranzaUrl({
            phone: '+56 9 1234 5678',
            name: 'Valeria BJJ',
            planName: 'Plan Ilimitado',
            expiryDate: '2026-10-15',
            daysLeft: 3,
            amount: 55000
        });

        expect(res.success).toBe(true);
        expect(res.cleanPhone).toBe('56912345678');
        expect(res.message).toContain('Valeria BJJ');
        expect(res.message).toContain('vence en 3 días');
        expect(res.message).toContain('renovar anticipadamente');
    });

    it('Q4.4: Persistencia y Actualización de Datos Bancarios del Dojo', () => {
        const initial = getDojoBankDetails();
        expect(initial.bank).toBe('Banco Estado');

        setDojoBankDetails({
            bank: 'Banco de Chile',
            accountNumber: '9988776655',
            holder: 'Amarufighter Academia'
        });

        const updated = getDojoBankDetails();
        expect(updated.bank).toBe('Banco de Chile');
        expect(updated.accountNumber).toBe('9988776655');
        expect(updated.holder).toBe('Amarufighter Academia');
        expect(updated.email).toBe('pagos@amarufighter.cl'); // Mantiene campos previos
    });

    it('Q4.5: Lógica FIFO de Waitlist y Promoción Automática por Cancelación', () => {
        // Simulación de reservas de una clase con capacidad 2
        const classId = 'cls-striking-1';
        const date = '2026-10-12';

        let reservations = [
            { id: 'res-1', user_id: 'user-active-1', class_id: classId, class_name: 'Striking Pro', reservation_date: date, created_at: '2026-10-12T08:00:00Z' },
            { id: 'res-2', user_id: 'user-active-2', class_id: classId, class_name: 'Striking Pro', reservation_date: date, created_at: '2026-10-12T08:30:00Z' }
        ];

        // Se llena la clase, se inscriben 2 personas en lista de espera
        const waitlistUser1 = { id: 'res-3', user_id: 'user-wait-1', class_id: classId, class_name: 'Striking Pro [Waitlist]', reservation_date: date, created_at: '2026-10-12T09:00:00Z' };
        const waitlistUser2 = { id: 'res-4', user_id: 'user-wait-2', class_id: classId, class_name: 'Striking Pro [Waitlist]', reservation_date: date, created_at: '2026-10-12T09:15:00Z' };
        reservations.push(waitlistUser1, waitlistUser2);

        // Filtro de lista de espera ordenada por FIFO
        const getWaitlist = () => reservations
            .filter(r => (r.class_name || '').includes('[Waitlist]'))
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        expect(getWaitlist().length).toBe(2);
        expect(getWaitlist()[0].user_id).toBe('user-wait-1'); // Primer lugar en la cola

        // Cancelación de reserva activa (user-active-1 cancela)
        reservations = reservations.filter(r => r.user_id !== 'user-active-1');

        // Auto-promoción del 1er lugar en la cola
        const queue = getWaitlist();
        const nextInLine = queue[0];
        const notifications = [];

        if (nextInLine) {
            nextInLine.class_name = nextInLine.class_name.replace(' [Waitlist]', '').trim();
            notifications.push({
                user_id: nextInLine.user_id,
                title: '🥋 ¡Cupo Liberado en Tatami!',
                message: `Has sido promovido a la clase ${nextInLine.class_name}.`
            });
        }

        // Verificaciones
        expect(nextInLine.class_name).toBe('Striking Pro'); // Ahora es reserva activa
        expect(getWaitlist().length).toBe(1); // Queda 1 solo en espera
        expect(getWaitlist()[0].user_id).toBe('user-wait-2'); // Ahora user-wait-2 es el 1° en la cola
        expect(notifications.length).toBe(1);
        expect(notifications[0].user_id).toBe('user-wait-1');
    });
});

// --- SIMULACIÓN DE KIOSCO TATAMI Y DETECCIÓN EN VIVO PARA QA ---
function getActiveClassForKiosk(classes = [], nowRef = new Date()) {
    if (!classes || classes.length === 0) return null;

    const now = nowRef instanceof Date ? nowRef : new Date(nowRef);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

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
            end = start + 60;
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
}

function computeLiveClassRoster({ classData, rawReservations = [], rawAttendances = [], targetDate }) {
    const attendancesToday = (rawAttendances || []).filter(a => {
        const aDate = (a.attended_at || a.created_at || '').slice(0, 10);
        return aDate === targetDate;
    });

    const attendanceUserMap = new Map();
    attendancesToday.forEach(a => {
        attendanceUserMap.set(a.user_id, a);
    });

    const reservations = rawReservations || [];
    const activeReservations = reservations.filter(r => !(r.class_name || '').includes('[Waitlist]'));
    const waitlistReservations = reservations.filter(r => (r.class_name || '').includes('[Waitlist]'));

    const athleteMap = new Map();

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

    return {
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
}

describe('QA Suite - RUTA 2: Modo Pantalla Tatami / Kiosco TV en Vivo', () => {
    const mockClasses = [
        { id: 'c1', name: 'BJJ Fundamentos', time: '08:00 - 09:00', coach: 'Sensei Roberto', capacity: 15 },
        { id: 'c2', name: 'Striking Pro MMA', time: '19:00 - 20:15', coach: 'Sensei Amaru', capacity: 20 },
        { id: 'c3', name: 'Grappling No-Gi', time: '20:30 - 21:30', coach: 'Coach Carlos', capacity: 18 }
    ];

    it('Q5.1: Detección inteligente de clase activa (LIVE) dentro de ventana ±20 min', () => {
        // A las 19:10 (en pleno desarrollo de Striking Pro 19:00 - 20:15)
        const dateLiveMid = new Date('2026-10-12T19:10:00');
        const liveResult = getActiveClassForKiosk(mockClasses, dateLiveMid);
        expect(liveResult).not.toBeNull();
        expect(liveResult.status).toBe('LIVE');
        expect(liveResult.classData.id).toBe('c2');
        expect(liveResult.statusLabel).toBe('Tatami Activo 🔴');

        // A las 18:45 (15 minutos antes, dentro del margen previo de 20 min)
        const dateLiveEarly = new Date('2026-10-12T18:45:00');
        const earlyResult = getActiveClassForKiosk(mockClasses, dateLiveEarly);
        expect(earlyResult.status).toBe('LIVE');
        expect(earlyResult.classData.id).toBe('c2');

        // A las 20:25 (10 minutos después del fin, dentro del margen posterior de 20 min)
        const dateLiveLate = new Date('2026-10-12T20:25:00');
        const lateResult = getActiveClassForKiosk(mockClasses, dateLiveLate);
        expect(lateResult.status).toBe('LIVE');
        expect(lateResult.classData.id).toBe('c2');
    });

    it('Q5.2: Detección de próxima clase (UPCOMING) con cálculo exacto de minutos restantes', () => {
        // A las 17:30 (1 hora y media antes de la clase de las 19:00)
        const dateUpcoming = new Date('2026-10-12T17:30:00');
        const result = getActiveClassForKiosk(mockClasses, dateUpcoming);

        expect(result.status).toBe('UPCOMING');
        expect(result.classData.id).toBe('c2');
        expect(result.statusLabel).toBe('Próxima Clase ⏳');
        expect(result.minutesToStart).toBe(90); // 19:00 (1140 min) - 17:30 (1050 min) = 90 min
    });

    it('Q5.3: Estado FINISHED cuando concluyeron todas las clases de la jornada', () => {
        // A las 22:30 (más de 20 min después de la última clase de 20:30-21:30)
        const dateAfterHours = new Date('2026-10-12T22:30:00');
        const result = getActiveClassForKiosk(mockClasses, dateAfterHours);

        expect(result.status).toBe('FINISHED');
        expect(result.statusLabel).toBe('Jornada Finalizada 🥋');
        expect(result.classData.id).toBe('c3'); // Muestra la última clase realizada
    });

    it('Q5.4: Fallback elegante si la lista de clases es vacía o nula', () => {
        expect(getActiveClassForKiosk([], new Date())).toBeNull();
        expect(getActiveClassForKiosk(null, new Date())).toBeNull();
    });

    it('Q5.5: Agregación de Roster en Vivo: Separación de presentes, ordenamiento y aforo %', () => {
        const classData = { id: 'c2', name: 'Striking Pro MMA', capacity: 10 };
        const targetDate = '2026-10-12';

        const rawReservations = [
            { user_id: 'u1', class_name: 'Striking Pro MMA', profiles: { full_name: 'Benjamín Striker', photo_url: null, xp: 120, level: 3 } },
            { user_id: 'u2', class_name: 'Striking Pro MMA', profiles: { full_name: 'Ana Grappler', photo_url: null, xp: 250, level: 5 } },
            { user_id: 'u3', class_name: 'Striking Pro MMA', profiles: { full_name: 'Carlos Boxer', photo_url: null, xp: 50, level: 1 } },
            { user_id: 'u4', class_name: 'Striking Pro MMA [Waitlist]', profiles: { full_name: 'David Espera', photo_url: null, xp: 10, level: 1 } }
        ];

        // u2 y un alumno directo u5 ya tienen check-in de asistencia registrado hoy
        const rawAttendances = [
            { user_id: 'u2', class_id: 'c2', attended_at: '2026-10-12T18:55:00Z' },
            { user_id: 'u5', class_id: 'c2', student_name: 'Eduardo Walkin', attended_at: '2026-10-12T19:02:00Z' }
        ];

        const roster = computeLiveClassRoster({ classData, rawReservations, rawAttendances, targetDate });

        // Capacidad: 10, Reservados activos: 3 (excluye waitlist), Asistencias: 2
        expect(roster.capacity).toBe(10);
        expect(roster.reservedCount).toBe(3);
        expect(roster.attendedCount).toBe(2);
        // Ocupación: 2 asistentes / 10 cupos = 20%
        expect(roster.occupancyPct).toBe(20);

        // Waitlist separada
        expect(roster.waitlistCount).toBe(1);
        expect(roster.waitlist[0].name).toBe('David Espera');

        // Total atletas visibles en pantalla = 4 (u1, u2, u3, u5)
        expect(roster.athletes.length).toBe(4);

        // Primeros atletas en la lista DEBEN ser los que tienen check-in confirmado (hasAttended === true)
        const attendedAthletes = roster.athletes.filter(a => a.hasAttended);
        expect(attendedAthletes.length).toBe(2);
        expect(roster.athletes[0].hasAttended).toBe(true);
        expect(roster.athletes[1].hasAttended).toBe(true);

        // Los no asistidos van después
        expect(roster.athletes[2].hasAttended).toBe(false);
        expect(roster.athletes[3].hasAttended).toBe(false);
    });

    it('Q5.6: Generación y parseo de QR Token de gran formato para pantalla Kiosco TV', () => {
        const qr = generateClassQRToken('c2', '2026-10-12', '19:00', 'Striking Pro MMA');

        expect(qr.startsWith('AF_QR:')).toBe(true);

        const decoded = parseClassQRToken(qr);
        expect(decoded).not.toBeNull();
        expect(decoded.app).toBe('amarufighter');
        expect(decoded.class_id).toBe('c2');
        expect(decoded.date).toBe('2026-10-12');
        expect(decoded.time).toBe('19:00');
        expect(decoded.class_name).toBe('Striking Pro MMA');
    });
});

