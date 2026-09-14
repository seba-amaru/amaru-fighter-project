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
    }
};
