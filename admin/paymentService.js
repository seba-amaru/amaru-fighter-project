/**
 * paymentService.js
 * Servicio de gestión de pagos, descuentos y sincronización en tiempo real para Amarufighter.
 */

import { supabase } from './supabaseClient.js';

/**
 * Calcula el monto final con descuento formal o manual/familiar
 * @param {number} basePrice 
 * @param {Object} discountOptions 
 * @returns {{ finalAmount: number, discountAmount: number, note: string }}
 */
export function calculateDiscountedAmount(basePrice, discountOptions = {}) {
    const original = Math.max(0, Number(basePrice) || 0);
    if (!discountOptions || discountOptions.type === 'none' || !discountOptions.type) {
        return { finalAmount: original, discountAmount: 0, note: '' };
    }

    let discountAmount = 0;
    let note = '';

    if (discountOptions.type === 'code') {
        const pct = Math.min(100, Math.max(0, Number(discountOptions.percent) || 0));
        discountAmount = Math.round(original * (pct / 100));
        const code = discountOptions.code ? ` (${discountOptions.code.trim().toUpperCase()})` : '';
        note = `Cupón -${pct}%${code}`;
    } else if (discountOptions.type === 'percent') {
        const pct = Math.min(100, Math.max(0, Number(discountOptions.percent) || 0));
        discountAmount = Math.round(original * (pct / 100));
        const reason = discountOptions.reason ? ` [${discountOptions.reason.trim()}]` : ' [Manual]';
        note = `Desc. ${pct}%${reason}`;
    } else if (discountOptions.type === 'fixed') {
        const fixedRebate = Math.max(0, Number(discountOptions.fixedAmount) || 0);
        discountAmount = Math.min(original, fixedRebate);
        const reason = discountOptions.reason ? ` [${discountOptions.reason.trim()}]` : ' [Manual]';
        note = `Rebaja -$${discountAmount.toLocaleString('es-CL')}${reason}`;
    } else if (discountOptions.type === 'custom_price') {
        const agreedPrice = Math.max(0, Number(discountOptions.customPrice) || 0);
        discountAmount = Math.max(0, original - agreedPrice);
        const reason = discountOptions.reason ? ` [${discountOptions.reason.trim()}]` : ' [Tarifa acordada]';
        note = `Tarifa especial $${agreedPrice.toLocaleString('es-CL')}${reason}`;
    }

    const finalAmount = Math.max(0, original - discountAmount);
    return { finalAmount, discountAmount, note };
}

/**
 * Registra un pago de membresía en la tabla 'payments'
 */
export async function recordMembershipPayment({
    userId,
    planName,
    baseAmount = 0,
    paymentMethod = 'transferencia',
    discount = null,
    coverageMonth = null,
    status = 'approved',
    receiptUrl = null
}) {
    if (!userId) {
        throw new Error('El ID de usuario es obligatorio para registrar un pago.');
    }

    const now = new Date();
    const curMonthName = now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    const formattedMonth = coverageMonth || (curMonthName.charAt(0).toUpperCase() + curMonthName.slice(1));

    // Determinar cálculo con o sin descuento
    const { finalAmount, note: discountNote } = calculateDiscountedAmount(baseAmount, discount);

    let conceptText = `Pago ${planName || 'Membresía'}`;
    if (discountNote) {
        conceptText += ` - ${discountNote}`;
    }

    const paymentPayload = {
        user_id: userId,
        amount: finalAmount,
        currency: 'CLP',
        concept: conceptText,
        status: status,
        payment_method: paymentMethod || 'transferencia',
        coverage_month: formattedMonth,
        receipt_url: receiptUrl || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
    };

    const { data, error } = await supabase
        .from('payments')
        .insert([paymentPayload])
        .select()
        .single();

    if (error) {
        console.error('[paymentService] Error registrando pago:', error);
        throw error;
    }

    console.log('[paymentService] Pago registrado exitosamente:', data);
    return data;
}

/**
 * Conciliación automática de socios de Octubre 2026 sin registro de pago
 */
export async function reconcileOctoberMissingPayments() {
    try {
        console.log('[paymentService] Iniciando reconciliación de socios de octubre...');
        
        // 1. Obtener socios activos
        const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('membership_status', 'active')
            .gte('membership_expiry', '2026-10-01T00:00:00');

        if (pErr) throw pErr;

        // 2. Obtener planes para conocer precios
        const { data: plans } = await supabase.from('membership_plans').select('*');
        const plansMap = new Map((plans || []).map(p => [p.id, p]));

        // 3. Obtener pagos existentes de octubre
        const { data: existingPayments } = await supabase
            .from('payments')
            .select('user_id, status, created_at')
            .eq('status', 'approved')
            .gte('created_at', '2026-10-01T00:00:00');

        const paidUserIds = new Set((existingPayments || []).map(p => p.user_id));

        const reconciled = [];
        for (const prof of (profiles || [])) {
            // Solo conciliar si no tiene pago en octubre y tiene plan asignado
            if (!paidUserIds.has(prof.id) && prof.membership_plan_id) {
                const plan = plansMap.get(prof.membership_plan_id);
                if (!plan) continue;

                const payment = await recordMembershipPayment({
                    userId: prof.id,
                    userName: prof.full_name || prof.email,
                    planId: plan.id,
                    planName: plan.name,
                    baseAmount: plan.price || 30000,
                    paymentMethod: 'manual',
                    coverageMonth: 'Octubre 2026',
                    status: 'approved'
                });
                reconciled.push({ member: prof.full_name, payment });
            }
        }

        console.log(`[paymentService] Conciliación completada: ${reconciled.length} pagos generados.`, reconciled);
        return reconciled;
    } catch (err) {
        console.error('[paymentService] Error durante conciliación:', err);
        return [];
    }
}

/**
 * Inicializa la suscripción Realtime en Supabase para profiles y payments
 * @param {Function} onSyncCallback 
 * @returns {Object} supabase realtime channel
 */
export function setupRealtimeSync(onSyncCallback) {
    if (!supabase || typeof supabase.channel !== 'function') {
        console.warn('[Realtime] Supabase realtime no está disponible.');
        return null;
    }

    try {
        const channel = supabase
            .channel('amaru_realtime_sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                (payload) => {
                    console.log('[Realtime] Cambio detectado en payments:', payload.eventType, payload.new);
                    if (typeof onSyncCallback === 'function') {
                        onSyncCallback({ table: 'payments', event: payload.eventType, record: payload.new || payload.old });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => {
                    console.log('[Realtime] Cambio detectado en profiles:', payload.eventType, payload.new);
                    if (typeof onSyncCallback === 'function') {
                        onSyncCallback({ table: 'profiles', event: payload.eventType, record: payload.new || payload.old });
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Estado de suscripción:', status);
            });

        return channel;
    } catch (err) {
        console.error('[Realtime] Error configurando canal realtime:', err);
        return null;
    }
}
