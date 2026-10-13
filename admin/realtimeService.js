/**
 * admin/realtimeService.js
 * Servicio Centralizado de Sincronización en Tiempo Real con Supabase para la Suite Administrativa de Amarufighter.
 * 
 * Gestiona un único canal multiplexado ('amaru_admin_live') para evitar fugas de memoria y múltiples WebSockets.
 * Monitorea cambios en: 'payments', 'profiles', 'attendance', 'reservations', 'classes'.
 */

import { supabase as defaultSupabaseClient, getSupabaseClient } from './supabaseClient.js';

export const REALTIME_STATUS = {
    IDLE: 'IDLE',
    CONNECTING: 'CONNECTING',
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    ERROR: 'ERROR'
};

const MONITORED_TABLES = ['payments', 'profiles', 'attendance', 'reservations', 'classes'];

// Estado interno del servicio
let activeClient = null;
let activeChannel = null;
let currentStatus = REALTIME_STATUS.IDLE;
let lastEventTimestamp = null;
let eventHistory = [];
const MAX_HISTORY = 30;

// Listeners por clave ('table:eventType' o '*')
const eventListeners = new Map();
// Listeners de cambio de estado de conexión
const statusListeners = new Set();

let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Emite una actualización del estado de conexión a los observadores registrados
 * @param {string} newStatus 
 * @param {Object} [details={}]
 */
function setConnectionStatus(newStatus, details = {}) {
    if (currentStatus === newStatus && !details.force) return;
    currentStatus = newStatus;

    const statusPayload = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        reconnectAttempts,
        ...details
    };

    statusListeners.forEach((callback) => {
        try {
            callback(statusPayload);
        } catch (err) {
            console.error('[realtimeService] Error en callback de estado:', err);
        }
    });
}

/**
 * Registra un evento en el historial local en memoria
 * @param {Object} eventItem 
 */
function recordHistory(eventItem) {
    lastEventTimestamp = eventItem.timestamp;
    eventHistory.unshift(eventItem);
    if (eventHistory.length > MAX_HISTORY) {
        eventHistory.pop();
    }
}

/**
 * Despacha un evento entrante a los listeners correspondientes
 * @param {string} table 
 * @param {string} eventType 
 * @param {Object} rawPayload 
 */
function dispatchEvent(table, eventType, rawPayload) {
    const timestamp = new Date().toISOString();
    const normalizedEvent = {
        table,
        eventType,
        record: rawPayload.new || rawPayload.old || {},
        newRecord: rawPayload.new || null,
        oldRecord: rawPayload.old || null,
        timestamp,
        errors: rawPayload.errors || null
    };

    recordHistory(normalizedEvent);

    // 1. Listeners para evento específico: ej. 'payments:INSERT'
    const specificKey = `${table}:${eventType}`;
    const specificListeners = eventListeners.get(specificKey) || [];
    specificListeners.forEach((cb) => {
        try {
            cb(normalizedEvent);
        } catch (err) {
            console.error(`[realtimeService] Error en listener para ${specificKey}:`, err);
        }
    });

    // 2. Listeners comodín por tabla: ej. 'payments:*'
    const tableWildcardKey = `${table}:*`;
    const tableWildcardListeners = eventListeners.get(tableWildcardKey) || [];
    tableWildcardListeners.forEach((cb) => {
        try {
            cb(normalizedEvent);
        } catch (err) {
            console.error(`[realtimeService] Error en listener para ${tableWildcardKey}:`, err);
        }
    });

    // 3. Listeners globales: '*'
    const globalListeners = eventListeners.get('*') || [];
    globalListeners.forEach((cb) => {
        try {
            cb(normalizedEvent);
        } catch (err) {
            console.error('[realtimeService] Error en listener global:', err);
        }
    });
}

/**
 * Inicializa el canal multiplexado de Supabase Realtime
 * @param {Object} [client] Cliente Supabase opcional (usa default si se omite)
 * @param {Object} [options] Opciones de configuración
 * @returns {Object|null} El canal activo de Supabase o null si falló
 */
export function initAdminRealtime(client = null, options = {}) {
    const supabaseClient = client || getSupabaseClient() || defaultSupabaseClient;

    if (!supabaseClient || typeof supabaseClient.channel !== 'function') {
        console.warn('[realtimeService] Cliente Supabase no disponible o no soporta Realtime.');
        setConnectionStatus(REALTIME_STATUS.OFFLINE, { reason: 'client_unavailable' });
        return null;
    }

    // Si ya existe un canal conectado, retornar sin duplicar
    if (activeChannel && currentStatus === REALTIME_STATUS.ONLINE) {
        return activeChannel;
    }

    // Limpiar canal anterior si estaba en estado sucio
    if (activeChannel) {
        try {
            if (typeof supabaseClient.removeChannel === 'function') {
                supabaseClient.removeChannel(activeChannel);
            }
        } catch (e) {
            console.warn('[realtimeService] Error al retirar canal previo:', e);
        }
        activeChannel = null;
    }

    setConnectionStatus(REALTIME_STATUS.CONNECTING);

    const channelName = options.channelName || 'amaru_admin_live';
    const tablesToSubscribe = options.tables || MONITORED_TABLES;

    try {
        let channel = supabaseClient.channel(channelName);

        // Suscribir postgres_changes a cada tabla configurada
        tablesToSubscribe.forEach((tableName) => {
            channel = channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                (payload) => {
                    dispatchEvent(tableName, payload.eventType, payload);
                }
            );
        });

        // Manejador del estado de suscripción del socket
        channel.subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                reconnectAttempts = 0;
                setConnectionStatus(REALTIME_STATUS.ONLINE, { channelName });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.warn(`[realtimeService] Estado ${status}:`, err);
                setConnectionStatus(REALTIME_STATUS.ERROR, { error: err || status });
                scheduleReconnect(supabaseClient, options);
            } else if (status === 'CLOSED') {
                setConnectionStatus(REALTIME_STATUS.OFFLINE, { reason: 'closed' });
            }
        });

        activeChannel = channel;
        activeClient = supabaseClient;
        return activeChannel;
    } catch (err) {
        console.error('[realtimeService] Excepción al configurar canal:', err);
        setConnectionStatus(REALTIME_STATUS.ERROR, { error: err.message });
        scheduleReconnect(supabaseClient, options);
        return null;
    }
}

/**
 * Planifica un intento de reconexión con retroceso exponencial simple
 */
function scheduleReconnect(supabaseClient, options) {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('[realtimeService] Límite de reconexiones automáticas alcanzado.');
        setConnectionStatus(REALTIME_STATUS.OFFLINE, { reason: 'max_attempts_reached' });
        return;
    }

    reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
    console.log(`[realtimeService] Reintentando conexión en ${delay}ms (Intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    reconnectTimeout = setTimeout(() => {
        initAdminRealtime(supabaseClient, options);
    }, delay);
}

/**
 * Fuerza una reconexión inmediata manual
 */
export function reconnect(client = null, options = {}) {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectAttempts = 0;
    disconnect();
    return initAdminRealtime(client, options);
}

/**
 * Cierra la conexión activa y limpia listeners para evitar fugas de memoria
 * @param {boolean} [clearListeners=false] Si es true, también elimina callbacks registrados
 */
export function disconnect(clearListeners = false) {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (activeChannel) {
        try {
            const client = activeClient || getSupabaseClient() || defaultSupabaseClient;
            if (client && typeof client.removeChannel === 'function') {
                client.removeChannel(activeChannel);
            } else if (typeof activeChannel.unsubscribe === 'function') {
                activeChannel.unsubscribe();
            }
        } catch (err) {
            console.warn('[realtimeService] Error al desconectar canal:', err);
        }
        activeChannel = null;
    }
    activeClient = null;

    setConnectionStatus(REALTIME_STATUS.OFFLINE, { reason: 'manual_disconnect' });

    if (clearListeners) {
        eventListeners.clear();
        statusListeners.clear();
    }
}

/**
 * Suscribe un callback a eventos de datos
 * @param {string} table Nombre de la tabla o '*'
 * @param {string} eventType 'INSERT', 'UPDATE', 'DELETE' o '*'
 * @param {Function} callback Función receptora (normalizedEvent) => void
 * @returns {Function} Función para cancelar la suscripción (unsubscribe)
 */
export function onRealtimeEvent(table, eventType, callback) {
    if (typeof callback !== 'function') return () => {};

    const key = (table === '*' || eventType === '*')
        ? (table === '*' ? '*' : `${table}:*`)
        : `${table}:${eventType}`;

    if (!eventListeners.has(key)) {
        eventListeners.set(key, []);
    }
    eventListeners.get(key).push(callback);

    // Retorna función de desuscripción limpia
    return () => {
        offRealtimeEvent(table, eventType, callback);
    };
}

/**
 * Remueve un callback de eventos previamente registrado
 */
export function offRealtimeEvent(table, eventType, callback) {
    const key = (table === '*' || eventType === '*')
        ? (table === '*' ? '*' : `${table}:*`)
        : `${table}:${eventType}`;

    const list = eventListeners.get(key);
    if (!list) return;

    const idx = list.indexOf(callback);
    if (idx !== -1) {
        list.splice(idx, 1);
    }
    if (list.length === 0) {
        eventListeners.delete(key);
    }
}

/**
 * Suscribe un callback a cambios de estado de la conexión
 * @param {Function} callback (statusPayload) => void
 * @returns {Function} Función de desuscripción
 */
export function onConnectionStatusChange(callback) {
    if (typeof callback !== 'function') return () => {};
    statusListeners.add(callback);

    // Invocar inmediatamente con el estado actual
    try {
        callback({
            status: currentStatus,
            timestamp: new Date().toISOString(),
            reconnectAttempts
        });
    } catch (err) {
        console.error('[realtimeService] Error en callback inicial de estado:', err);
    }

    return () => {
        statusListeners.delete(callback);
    };
}

/**
 * Remueve un callback de estado de conexión
 */
export function offConnectionStatusChange(callback) {
    statusListeners.delete(callback);
}

/**
 * Obtiene un diagnóstico del estado actual del servicio
 */
export function getRealtimeDiagnostics() {
    return {
        status: currentStatus,
        hasActiveChannel: !!activeChannel,
        channelName: activeChannel?.topic || null,
        reconnectAttempts,
        lastEventTimestamp,
        totalEventsCached: eventHistory.length,
        monitoredTables: [...MONITORED_TABLES],
        listenerKeys: Array.from(eventListeners.keys()),
        statusListenersCount: statusListeners.size
    };
}

/**
 * Obtiene el historial reciente de eventos (hasta 30)
 */
export function getRealtimeHistory() {
    return [...eventHistory];
}

/**
 * Función puente de compatibilidad retroactiva con `setupRealtimeSync` existente
 * @param {Function} onSyncCallback (payload) => void
 * @returns {Object|null}
 */
export function setupRealtimeSync(onSyncCallback, client = null) {
    // Si aún no está conectado, iniciar
    if (!activeChannel) {
        initAdminRealtime(client);
    }

    if (typeof onSyncCallback === 'function') {
        onRealtimeEvent('*', '*', (event) => {
            onSyncCallback({
                table: event.table,
                event: event.eventType,
                record: event.record,
                timestamp: event.timestamp
            });
        });
    }

    return activeChannel;
}
