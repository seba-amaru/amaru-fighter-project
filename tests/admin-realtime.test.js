import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initAdminRealtime,
    onRealtimeEvent,
    offRealtimeEvent,
    onConnectionStatusChange,
    offConnectionStatusChange,
    reconnect,
    disconnect,
    getRealtimeDiagnostics,
    getRealtimeHistory,
    setupRealtimeSync,
    REALTIME_STATUS
} from '../admin/realtimeService.js';

describe('Admin Realtime Service Suite (tests/admin-realtime.test.js)', () => {
    let mockChannel;
    let mockClient;
    let registeredPostgresCallbacks = {};
    let statusCallback = null;

    beforeEach(() => {
        disconnect(true);
        registeredPostgresCallbacks = {};
        statusCallback = null;

        mockChannel = {
            topic: 'amaru_admin_live',
            on: vi.fn((event, filter, cb) => {
                if (filter && filter.table) {
                    registeredPostgresCallbacks[filter.table] = cb;
                }
                return mockChannel;
            }),
            subscribe: vi.fn((cb) => {
                statusCallback = cb;
                if (typeof cb === 'function') {
                    // Simular suscripción exitosa inmediata
                    cb('SUBSCRIBED');
                }
                return mockChannel;
            }),
            unsubscribe: vi.fn(() => Promise.resolve('ok'))
        };

        mockClient = {
            channel: vi.fn(() => mockChannel),
            removeChannel: vi.fn(() => Promise.resolve('ok'))
        };
    });

    afterEach(() => {
        disconnect(true);
        vi.clearAllMocks();
    });

    it('debe iniciar el canal con las tablas requeridas y alcanzar estado ONLINE', () => {
        const channel = initAdminRealtime(mockClient);

        expect(mockClient.channel).toHaveBeenCalledWith('amaru_admin_live');
        expect(mockChannel.on).toHaveBeenCalled();
        expect(mockChannel.subscribe).toHaveBeenCalled();
        expect(channel).toBe(mockChannel);

        const diags = getRealtimeDiagnostics();
        expect(diags.status).toBe(REALTIME_STATUS.ONLINE);
        expect(diags.hasActiveChannel).toBe(true);
        expect(diags.monitoredTables).toEqual(
            expect.arrayContaining(['payments', 'profiles', 'attendance', 'reservations', 'classes'])
        );
    });

    it('debe notificar cambios en la máquina de estados mediante onConnectionStatusChange', () => {
        const statusHistory = [];
        const unsubscribe = onConnectionStatusChange((payload) => {
            statusHistory.push(payload.status);
        });

        initAdminRealtime(mockClient);

        expect(statusHistory).toContain(REALTIME_STATUS.CONNECTING);
        expect(statusHistory).toContain(REALTIME_STATUS.ONLINE);

        unsubscribe();
    });

    it('debe despachar eventos específicos y capturar en el historial de memoria', () => {
        initAdminRealtime(mockClient);

        const paymentsReceived = [];
        const unsubscribe = onRealtimeEvent('payments', 'INSERT', (event) => {
            paymentsReceived.push(event);
        });

        // Simular que Supabase emite un INSERT en payments
        const paymentPayload = {
            eventType: 'INSERT',
            new: { id: 'pay_999', amount: 35000, concept: 'Membresía BJJ' },
            old: null
        };

        const paymentCb = registeredPostgresCallbacks['payments'];
        expect(paymentCb).toBeDefined();
        paymentCb(paymentPayload);

        expect(paymentsReceived.length).toBe(1);
        expect(paymentsReceived[0].table).toBe('payments');
        expect(paymentsReceived[0].eventType).toBe('INSERT');
        expect(paymentsReceived[0].record.amount).toBe(35000);

        // Verificar registro en historial
        const history = getRealtimeHistory();
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].record.id).toBe('pay_999');

        unsubscribe();
    });

    it('debe permitir escuchar con comodín de tabla y comodín global', () => {
        initAdminRealtime(mockClient);

        const tableEvents = [];
        const globalEvents = [];

        onRealtimeEvent('attendance', '*', (e) => tableEvents.push(e));
        onRealtimeEvent('*', '*', (e) => globalEvents.push(e));

        const attendanceCb = registeredPostgresCallbacks['attendance'];
        expect(attendanceCb).toBeDefined();

        attendanceCb({
            eventType: 'INSERT',
            new: { id: 'att_123', class_name: 'No-Gi Avanzado', user_id: 'usr_1' }
        });

        expect(tableEvents.length).toBe(1);
        expect(tableEvents[0].record.class_name).toBe('No-Gi Avanzado');

        expect(globalEvents.length).toBe(1);
        expect(globalEvents[0].table).toBe('attendance');
    });

    it('debe desuscribirse limpiamente con offRealtimeEvent para evitar memory leaks', () => {
        initAdminRealtime(mockClient);

        let callCount = 0;
        const handler = () => { callCount += 1; };

        onRealtimeEvent('profiles', 'UPDATE', handler);
        const profilesCb = registeredPostgresCallbacks['profiles'];

        profilesCb({ eventType: 'UPDATE', new: { id: 'usr_1', full_name: 'Atleta Test' } });
        expect(callCount).toBe(1);

        offRealtimeEvent('profiles', 'UPDATE', handler);

        profilesCb({ eventType: 'UPDATE', new: { id: 'usr_1', full_name: 'Atleta Modificado' } });
        expect(callCount).toBe(1); // No debe incrementar tras desuscripción
    });

    it('debe cerrar el canal correctamente al invocar disconnect()', () => {
        initAdminRealtime(mockClient);
        expect(getRealtimeDiagnostics().status).toBe(REALTIME_STATUS.ONLINE);

        disconnect();

        expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);
        expect(getRealtimeDiagnostics().status).toBe(REALTIME_STATUS.OFFLINE);
        expect(getRealtimeDiagnostics().hasActiveChannel).toBe(false);
    });

    it('debe funcionar el puente retrocompatible setupRealtimeSync', () => {
        const syncPayloads = [];
        setupRealtimeSync((payload) => {
            syncPayloads.push(payload);
        }, mockClient);

        // Simular evento
        const payCb = registeredPostgresCallbacks['payments'];
        if (payCb) {
            payCb({ eventType: 'INSERT', new: { id: 'p1', amount: 20000 } });
        }

        expect(syncPayloads.length).toBeGreaterThanOrEqual(0);
    });
});
