// app/services/supabaseService.js

export const SupabaseService = {
    /**
     * Creates or updates a user profile.
     * @param {Object} user - The authenticated user object (from Supabase Auth).
     * @param {string} name - The user's full name.
     * @returns {Promise<Object>} The created or updated profile data.
     */
    async createProfile(user, name) {
        const { data: existing } = await window.supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

        if (existing && existing.id !== user.uid) {
            console.warn(`Profile with email ${user.email} exists with different ID. Merging accounts.`);
            const { error: updateError } = await window.supabase
                .from('profiles')
                .update({ id: user.uid })
                .eq('id', existing.id);
            if (updateError) throw updateError;
            return this.getProfile(user.uid);
        }

        const { data, error } = await window.supabase
            .from('profiles')
            .upsert({
                id: user.uid,
                email: user.email,
                full_name: name || user.displayName || 'Atleta',
                role: 'athlete',
                membership_limit: 2,
                xp: 0,
                level: 0
            });
        if (error) throw error;
        return data;
    },

    async getProfile(uid) {
        try {
            // Fetch profile and joined plan in a single network round-trip
            const { data, error } = await window.supabase
                .from('profiles')
                .select('*, membership_plans(id, name, theme, price, monthly)')
                .eq('id', uid)
                .maybeSingle();

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.warn(`[Supabase] getProfile error (ID: ${uid}): ${error.message}`);
                }
                // Fallback to basic query if join relation is not defined
                const { data: fallbackData, error: fbError } = await window.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', uid)
                    .maybeSingle();
                if (fbError) return null;
                return fallbackData;
            }

            return data;
        } catch (err) {
            console.error("[Supabase] getProfile exception:", err);
            return null;
        }
    },

    async updateProfile(uid, updates) {
        const { data, error } = await window.supabase
            .from('profiles')
            .update(updates)
            .eq('id', uid);
        if (error) throw error;
        return data;
    },

    async saveFCMToken(uid, token) {
        return this.updateProfile(uid, { fcm_token: token });
    },

    async deleteUser(uid) {
        const { data, error } = await window.supabase
            .from('profiles')
            .delete()
            .eq('id', uid);
        if (error) throw error;
        return data;
    },

    async softDeleteUser(uid) {
        const { data, error } = await window.supabase
            .from('profiles')
            .update({ is_deleted: true })
            .eq('id', uid);
        if (error) throw error;
        return data;
    },

    async getAttendance(uid) {
        const { data, error } = await window.supabase
            .from('attendance')
            .select('*')
            .eq('user_id', uid)
            .order('attended_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async logAttendance(uid, classId, className) {
        const { data, error } = await window.supabase
            .from('attendance')
            .insert({
                user_id: uid,
                class_id: classId,
                class_name: className
            });
        if (error) throw error;
        return data;
    },

    async recordPayment(uid, paymentData) {
        const { data, error } = await window.supabase
            .from('payments')
            .insert({
                user_id: uid,
                ...paymentData
            });
        if (error) throw error;
        return data;
    },

    async getPayments(uid) {
        const { data, error } = await window.supabase
            .from('payments')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAllPayments() {
        const { data, error } = await window.supabase
            .from('payments')
            .select('*, profiles(full_name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAllProfiles() {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*, membership_plans(name, monthly)')
            .eq('role', 'athlete')
            .eq('is_deleted', false)
            .order('full_name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async getClasses() {
        const { data, error } = await window.supabase
            .from('classes')
            .select('*');
        if (error) throw error;

        return data.map(cls => ({
            ...cls,
            img: (cls.img && cls.img.includes('photo-1599058917232-d750c1844bb7'))
                ? 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500'
                : cls.img
        }));
    },

    async upsertClass(classData) {
        const { data, error } = await window.supabase
            .from('classes')
            .upsert(classData);
        if (error) throw error;
        return data;
    },

    async getPlans() {
        const { data, error } = await window.supabase
            .from('membership_plans')
            .select('*').order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
    },

    async upsertPlan(planData) {
        const { data, error } = await window.supabase
            .from('membership_plans')
            .upsert(planData);
        if (error) throw error;
        return data;
    },

    async getMembershipPlans() {
        return this.getPlans();
    },

    async updatePlanOrder(planId, newOrder) {
        const { error } = await window.supabase
            .from('membership_plans')
            .update({ sort_order: newOrder })
            .eq('id', planId);
        if (error) throw error;
    },

    async getPendingPayments() {
        const { data, error } = await window.supabase
            .from('payments')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async updatePaymentStatus(id, status) {
        const { data, error } = await window.supabase
            .from('payments')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    async getPayment(id) {
        const { data, error } = await window.supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async deletePendingPayments(uid) {
        const { data, error } = await window.supabase
            .from('payments')
            .delete()
            .eq('user_id', uid)
            .eq('status', 'pending');
        if (error) throw error;
        return data;
    },

    async deletePlan(id) {
        const { error } = await window.supabase
            .from('membership_plans')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async deleteClass(id) {
        const { error } = await window.supabase
            .from('classes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getReservations(date) {
        let query = window.supabase.from('reservations').select('*');
        if (date) query = query.eq('reservation_date', date);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getAllReservations() {
        const { data, error } = await window.supabase
            .from('reservations')
            .select('*');
        if (error) throw error;
        return data;
    },

    async getUserReservations(uid) {
        const { data, error } = await window.supabase
            .from('reservations')
            .select('*')
            .eq('user_id', uid);
        if (error) throw error;
        return data;
    },

    async createReservation(uid, classId, className, date) {
        const { data, error } = await window.supabase
            .from('reservations')
            .insert({
                user_id: uid,
                class_id: classId,
                class_name: className,
                reservation_date: date
            });
        if (error) throw error;
        return data;
    },

    async deleteReservation(uid, classId, date) {
        const { error } = await window.supabase
            .from('reservations')
            .delete()
            .eq('user_id', uid)
            .eq('class_id', classId)
            .eq('reservation_date', date);
        if (error) throw error;

        // Auto-promover al primer atleta en lista de espera si existe
        try {
            await this.promoteNextFromWaitlist(classId, date);
        } catch (waitErr) {
            console.warn('[SupabaseService] Auto-promoción de waitlist omitida:', waitErr);
        }
    },

    async getTournaments(userId) {
        const { data, error } = await window.supabase
            .from('tournaments')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });
        if (error) throw error;
        return data.map(t => ({
            ...t,
            img: (t.img && t.img.includes('photo-1599058917232-d750c1844bb7'))
                ? 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500'
                : t.img
        }));
    },

    async upsertTournament(userId, tournamentData) {
        const { data, error } = await window.supabase
            .from('tournaments')
            .upsert({ ...tournamentData, user_id: userId });
        if (error) throw error;
        return data;
    },

    async deleteTournament(id) {
        const { error } = await window.supabase.from('tournaments').delete().eq('id', id);
        if (error) throw error;
    },

    // --- STORAGE ---
    async uploadAvatar(userId, file) {
        const fileName = `${userId}-${Date.now()}`;
        const { error: uploadError } = await window.supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = window.supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return data.publicUrl;
    },

    async uploadPaymentReceipt(userId, file) {
        const fileName = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await window.supabase.storage
            .from('payments')
            .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = window.supabase.storage
            .from('payments')
            .getPublicUrl(fileName);

        return data.publicUrl;
    },

    // --- GLOBAL NOTIFICATIONS ---
    async getNotifications() {
        const { data, error } = await window.supabase.from('global_notifications').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async addNotification(title, message, type) {
        const { data, error } = await window.supabase.from('global_notifications').insert([{ title, message, type }]).select();
        if (error) throw error;
        return data;
    },

    async deleteNotification(id) {
        const { error } = await window.supabase.from('global_notifications').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // --- USER NOTIFICATIONS (In-App Messaging) ---
    async getUserNotifications(userId) {
        const { data, error } = await window.supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getUnreadCount(userId) {
        const { count, error } = await window.supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) throw error;
        return count || 0;
    },

    async sendUserNotification(userId, title, message, type = 'direct') {
        const senderId = window.appState?.user?.uid || null;
        const { data, error } = await window.supabase
            .from('user_notifications')
            .insert([{ user_id: userId, sender_id: senderId, title, message, type }])
            .select();
        if (error) throw error;
        return data;
    },

    async sendBulkUserNotifications(userIds, title, message, type = 'mass') {
        const senderId = window.appState?.user?.uid || null;
        const notifications = userIds.map(userId => ({
            user_id: userId,
            sender_id: senderId,
            title,
            message,
            type
        }));

        const { data, error } = await window.supabase
            .from('user_notifications')
            .insert(notifications)
            .select();
        if (error) throw error;
        return data;
    },

    async markNotificationRead(id) {
        const { error } = await window.supabase
            .from('user_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async markAllNotificationsRead(userId) {
        const { error } = await window.supabase
            .from('user_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) throw error;
        return true;
    },

    async deleteUserNotification(id) {
        const { error } = await window.supabase
            .from('user_notifications')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // --- EMAIL (Resend via Edge Function) ---
    async sendBulkEmail(emails, subject, text, html) {
        const { data, error } = await window.supabase.functions.invoke('send-email', {
            body: {
                to: emails,
                subject,
                text,
                html: html || text.replace(/\n/g, '<br>')
            }
        });
        if (error) throw error;
        return data;
    },

    // --- REGLAS DE CANCELACIÓN Y ASISTENCIA QR (FASE 1) ---
    getCancellationDeadlineHours() {
        try {
            return Number(localStorage.getItem('amarufighter_cancel_deadline_hours')) || 1;
        } catch {
            return 1;
        }
    },

    setCancellationDeadlineHours(hours) {
        const val = Math.max(0.25, Number(hours) || 1);
        try {
            localStorage.setItem('amarufighter_cancel_deadline_hours', String(val));
        } catch (e) {
            console.warn('[SupabaseService] No se pudo guardar horas límite en localStorage:', e);
        }
        return val;
    },

    canCancelReservation({ classTime, reservationDate, deadlineHours = null, userRole = 'athlete' }) {
        if (userRole === 'admin') {
            return { allowed: true, hoursLeft: 999, reason: 'Acceso de Administrador' };
        }

        if (!classTime || !reservationDate) {
            return { allowed: true, hoursLeft: 0, reason: 'Información incompleta' };
        }

        const limit = (deadlineHours !== null && !isNaN(Number(deadlineHours)))
            ? Number(deadlineHours)
            : this.getCancellationDeadlineHours();

        const now = new Date();
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
    },

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
        try {
            return `AF_QR:${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
        } catch {
            return JSON.stringify(payload);
        }
    },

    parseClassQRToken(rawString) {
        if (!rawString) return null;
        if (typeof rawString === 'object') return rawString;
        try {
            const str = String(rawString).trim();
            if (str.startsWith('AF_QR:')) {
                const b64 = str.slice(6);
                const jsonStr = decodeURIComponent(escape(atob(b64)));
                return JSON.parse(jsonStr);
            }
            return JSON.parse(str);
        } catch (e) {
            console.error('[SupabaseService] Error parseando payload QR:', e);
            return null;
        }
    },

    async validateAndCheckInQR(userId, qrData) {
        if (!userId) {
            return { success: false, code: 'AUTH_REQUIRED', error: 'Usuario no autenticado.' };
        }

        const payload = typeof qrData === 'object' && qrData !== null
            ? qrData
            : this.parseClassQRToken(qrData);

        if (!payload || payload.app !== 'amarufighter' || !payload.class_id) {
            return {
                success: false,
                code: 'INVALID_QR',
                error: 'Código QR no reconocido o inválido para Amarufighter Dojo.'
            };
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Validar fecha
        if (payload.date && payload.date !== todayStr) {
            return {
                success: false,
                code: 'EXPIRED_DATE',
                error: `Este código QR corresponde a la fecha ${payload.date}, no al día de hoy.`
            };
        }

        // 2. Validar reserva activa
        const { data: reservations, error: resErr } = await window.supabase
            .from('reservations')
            .select('*')
            .eq('user_id', userId)
            .eq('class_id', payload.class_id)
            .eq('reservation_date', todayStr);

        if (resErr) {
            console.error('[SupabaseService] Error verificando reservas:', resErr);
            throw resErr;
        }

        if (!reservations || reservations.length === 0) {
            return {
                success: false,
                code: 'NO_RESERVATION',
                error: 'No tienes una reserva activa para esta clase. Reserva primero en el horario.'
            };
        }

        // 3. Validar asistencia previa hoy
        const { data: attendances, error: attErr } = await window.supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('class_id', payload.class_id);

        if (attErr) {
            console.error('[SupabaseService] Error verificando asistencias:', attErr);
            throw attErr;
        }

        const alreadyAttendedToday = (attendances || []).some(a => {
            const attDate = a.attended_at ? new Date(a.attended_at).toISOString().slice(0, 10) : '';
            return attDate === todayStr;
        });

        if (alreadyAttendedToday) {
            return {
                success: false,
                code: 'ALREADY_ATTENDED',
                error: 'Ya registraste tu asistencia para esta clase el día de hoy.'
            };
        }

        // 4. Registrar asistencia en la base de datos
        const classNameToRecord = payload.class_name || reservations[0]?.class_name || 'Clase Dojo';
        const { error: insErr } = await window.supabase
            .from('attendance')
            .insert([{
                user_id: userId,
                class_id: payload.class_id,
                class_name: `${classNameToRecord} [QR Scan]`
            }])
            .select();

        if (insErr) {
            console.error('[SupabaseService] Error insertando asistencia:', insErr);
            throw insErr;
        }

        // 5. Otorgar +25 XP
        let newXP = 25;
        try {
            const { data: prof } = await window.supabase
                .from('profiles')
                .select('xp')
                .eq('id', userId)
                .maybeSingle();

            const currentXP = Number(prof?.xp) || 0;
            newXP = currentXP + 25;
            await window.supabase
                .from('profiles')
                .update({ xp: newXP })
                .eq('id', userId);
        } catch (xpErr) {
            console.warn('[SupabaseService] Error asignando XP tras QR check-in:', xpErr);
        }

        return {
            success: true,
            xpEarned: 25,
            newXP,
            className: classNameToRecord,
            classId: payload.class_id,
            attendedAt: new Date().toISOString()
        };
    },

    // =========================================================================
    // MÓDULO RUTA 1: COBRANZA PROACTIVA POR WHATSAPP
    // =========================================================================

    /**
     * Sanitiza y formatea números de teléfono para WhatsApp (default: Chile +56).
     */
    sanitizePhoneNumber(phone, defaultCountryCode = '56') {
        if (!phone) return null;
        let clean = String(phone).replace(/[^\d+]/g, '').trim();
        if (clean.startsWith('+')) clean = clean.slice(1);
        if (!clean) return null;

        // Caso Chile: 9 dígitos empezando en 9 (ej: 987654321)
        if (clean.length === 9 && clean.startsWith('9')) {
            clean = `${defaultCountryCode}${clean}`;
        }
        // Caso 8 dígitos locales (ej: 87654321)
        else if (clean.length === 8) {
            clean = `${defaultCountryCode}9${clean}`;
        }
        // Caso ya con código 56 (ej: 56987654321)
        else if (clean.startsWith('56') && clean.length === 11) {
            // Ya formateado
        }
        // Número internacional genérico: mínimo 8 dígitos
        else if (clean.length < 8) {
            return null;
        }

        return clean;
    },

    /**
     * Obtiene los datos de cuenta bancaria del dojo (persistidos en localStorage).
     */
    getDojoBankDetails() {
        try {
            const stored = localStorage.getItem('amarufighter_bank_details');
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.warn('[SupabaseService] Error leyendo datos bancarios:', e);
        }
        return {
            bank: 'Banco Estado',
            accountType: 'Cuenta Corriente',
            accountNumber: '123456789',
            holder: 'Amarufighter Dojo SpA',
            rut: '76.543.210-K',
            email: 'pagos@amarufighter.cl'
        };
    },

    /**
     * Actualiza los datos de cuenta bancaria del dojo.
     */
    setDojoBankDetails(details) {
        if (!details || typeof details !== 'object') return false;
        try {
            const current = this.getDojoBankDetails();
            const updated = { ...current, ...details };
            localStorage.setItem('amarufighter_bank_details', JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.warn('[SupabaseService] Error guardando datos bancarios:', e);
            return false;
        }
    },

    /**
     * Genera un enlace directo a WhatsApp con mensaje de cobranza o aviso de vencimiento pre-redactado.
     */
    generateWhatsAppCobranzaUrl({ phone, name, planName, expiryDate, daysLeft = 0, amount = 0, customMessage = null }) {
        const cleanPhone = this.sanitizePhoneNumber(phone);
        if (!cleanPhone) {
            return { success: false, url: null, error: 'El socio no tiene un número telefónico válido registrado.' };
        }

        const bank = this.getDojoBankDetails();
        const studentName = name || 'Atleta';
        const plan = planName || 'Membresía Dojo';
        const formattedAmount = amount ? `$${Number(amount).toLocaleString('es-CL')}` : '';
        const dateStr = expiryDate ? new Date(expiryDate).toLocaleDateString('es-CL') : 'fecha límite';

        let message;
        if (customMessage) {
            message = customMessage;
        } else if (daysLeft < 0) {
            // Socio Moroso / Vencido
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
            // Socio por vencer (≤5 días)
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
    },

    // =========================================================================
    // MÓDULO RUTA 1: WAITLIST INTELIGENTE (LISTA DE ESPERA)
    // =========================================================================

    /**
     * Consulta los atletas en lista de espera para una clase y fecha.
     */
    async getWaitlist(classId, date) {
        const { data, error } = await window.supabase
            .from('reservations')
            .select('*')
            .eq('class_id', classId)
            .eq('reservation_date', date);

        if (error) throw error;
        return (data || [])
            .filter(r => (r.class_name || '').includes('[Waitlist]'))
            .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    },

    /**
     * Inscribe a un atleta en la lista de espera de una clase llena.
     */
    async joinWaitlist(userId, classId, className, date) {
        if (!userId || !classId || !date) throw new Error('Datos incompletos para unirse a la lista de espera');

        const taggedClassName = `${className || 'Clase Dojo'} [Waitlist]`;
        const { data, error } = await window.supabase
            .from('reservations')
            .insert([{
                user_id: userId,
                class_id: classId,
                class_name: taggedClassName,
                reservation_date: date
            }])
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Retira a un atleta de la lista de espera.
     */
    async leaveWaitlist(userId, classId, date) {
        const { error } = await window.supabase
            .from('reservations')
            .delete()
            .eq('user_id', userId)
            .eq('class_id', classId)
            .eq('reservation_date', date);

        if (error) throw error;
        return true;
    },

    /**
     * Promueve al siguiente atleta en la lista de espera (FIFO) cuando se libera un cupo por cancelación.
     */
    async promoteNextFromWaitlist(classId, date) {
        try {
            const waitlist = await this.getWaitlist(classId, date);
            if (!waitlist || waitlist.length === 0) return null;

            // Primer atleta en la cola (FIFO)
            const nextInLine = waitlist[0];
            const cleanClassName = (nextInLine.class_name || 'Clase Dojo').replace(' [Waitlist]', '').trim();

            // 1. Actualizar reserva a activa removiendo la etiqueta [Waitlist]
            const { error: updateErr } = await window.supabase
                .from('reservations')
                .update({ class_name: cleanClassName })
                .eq('id', nextInLine.id);

            if (updateErr) throw updateErr;

            // 2. Notificar al alumno en user_notifications
            try {
                await window.supabase
                    .from('user_notifications')
                    .insert([{
                        user_id: nextInLine.user_id,
                        title: '🥋 ¡Cupo Liberado en Tatami!',
                        message: `¡Buenas noticias! Se liberó un cupo y has sido promovido automáticamente de la lista de espera a la clase de ${cleanClassName} para el ${date}.`,
                        type: 'system'
                    }]);
            } catch (notifErr) {
                console.warn('[SupabaseService] No se pudo crear notificación de waitlist:', notifErr);
            }

            return {
                promoted: true,
                userId: nextInLine.user_id,
                className: cleanClassName,
                date
            };
        } catch (err) {
            console.error('[SupabaseService] Error promoviendo de waitlist:', err);
            return null;
        }
    },

    // =========================================================================
    // MÓDULO RUTA 2: MODO PANTALLA TATAMI / KIOSCO TV EN VIVO
    // =========================================================================

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
                end = start + 60; // 60 min de duración por defecto
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
     * Consulta el estado en tiempo real del Roster de la clase (Reservas + Asistencias confirmadas).
     */
    async getLiveClassStatus(classId, date = null) {
        if (!classId) throw new Error('ID de clase requerido');

        const now = new Date();
        const targetDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Obtener datos de la clase
        let classData = null;
        try {
            const { data: cData } = await window.supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .maybeSingle();
            classData = cData;
        } catch (e) {
            console.warn('[SupabaseService] No se pudo obtener clase específica:', e);
        }

        // Obtener reservas con perfiles
        const { data: rawReservations, error: resErr } = await window.supabase
            .from('reservations')
            .select('*, profiles:profiles(id, full_name, photo_url, xp, level)')
            .eq('class_id', classId)
            .eq('reservation_date', targetDate);

        if (resErr) throw resErr;

        // Obtener asistencias registradas
        const { data: rawAttendances, error: attErr } = await window.supabase
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
        if (!window.supabase || !window.supabase.channel) {
            console.warn('[SupabaseService] Realtime no soportado en este cliente.');
            return { unsubscribe: () => {} };
        }

        const channelName = `kiosk-live-${classId}-${Date.now()}`;
        const channel = window.supabase.channel(channelName)
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
                    window.supabase.removeChannel(channel);
                } catch (e) {
                    console.warn('[SupabaseService] Error removiendo canal realtime:', e);
                }
            }
        };
    }
};
