/**
 * Utilidades para manejo robusto de Promises
 * Timeout, retry, y manejo de errores de red
 */

/**
 * Envuelve una Promise con un timeout
 * @param {Promise} promise - La promise a envolver
 * @param {number} ms - Tiempo máximo en ms (default: 8000)
 * @param {string} context - Contexto para el mensaje de error
 * @returns {Promise}
 */
export const withTimeout = (promise, ms = 8000, context = 'Operación') => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${context}: Tiempo de espera agotado (${ms}ms)`));
        }, ms);

        promise
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
};

/**
 * Ejecuta una función async con reintentos automáticos
 * @param {Function} fn - Función que retorna una Promise
 * @param {Object} options - Opciones de retry
 * @param {number} options.maxRetries - Máximo de reintentos (default: 3)
 * @param {number} options.delayMs - Delay base entre reintentos en ms (default: 1000)
 * @param {string} options.context - Contexto para logs
 * @returns {Promise}
 */
export const withRetry = async (fn, options = {}) => {
    const { maxRetries = 3, delayMs = 1000, context = 'Operación' } = options;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`[Retry] ${context} - Intento ${attempt + 1}/${maxRetries + 1}`);
                await new Promise(r => setTimeout(r, delayMs * attempt)); // Backoff exponencial simple
            }
            return await fn();
        } catch (err) {
            lastError = err;
            console.warn(`[Retry] ${context} falló en intento ${attempt + 1}:`, err.message);
            // No reintentar errores 4xx (cliente) ni de autenticación
            if (err.status && err.status >= 400 && err.status < 500) {
                throw err;
            }
        }
    }

    throw lastError;
};

/**
 * Wrapper combinado: timeout + retry
 */
export const withTimeoutAndRetry = (fn, timeoutMs = 8000, retryOptions = {}) => {
    return withRetry(
        () => withTimeout(fn(), timeoutMs, retryOptions.context),
        retryOptions
    );
};

/**
 * Verifica si un error es de red/conectividad
 */
export const isNetworkError = (err) => {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    return msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('fetch') ||
        msg.includes('abort') ||
        msg.includes('failed') ||
        msg.includes('tiempo de espera');
};
