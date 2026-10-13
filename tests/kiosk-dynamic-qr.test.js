import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KioskService } from '../admin/kioskService.js';
import { playCheckinSuccessSound, playCheckinErrorSound } from '../admin/kioskAudioService.js';

describe('Kiosk Dynamic QR & Audio Synth Suite (tests/kiosk-dynamic-qr.test.js)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe generar tokens QR dinámicos con time_window de 30 segundos y versión 2.0', () => {
        const fakeNow = 1700000000000; // ms fijo
        const expectedWindow = Math.floor(fakeNow / 30000);

        const token = KioskService.generateClassQRToken(
            'class_bjj_1',
            '2026-10-13',
            '19:00',
            'BJJ Gi Avanzado',
            fakeNow
        );

        expect(token).toMatch(/^AF_QR:/);

        // Decodificar payload
        const base64Part = token.replace('AF_QR:', '');
        const jsonStr = decodeURIComponent(escape(atob(base64Part)));
        const payload = JSON.parse(jsonStr);

        expect(payload.app).toBe('amarufighter');
        expect(payload.version).toBe('2.0');
        expect(payload.class_id).toBe('class_bjj_1');
        expect(payload.class_name).toBe('BJJ Gi Avanzado');
        expect(payload.time_window).toBe(expectedWindow);
        expect(payload.generated_at).toBe(fakeNow);
        expect(payload.window_expires_in).toBeGreaterThanOrEqual(1);
        expect(payload.window_expires_in).toBeLessThanOrEqual(30);
    });

    it('debe validar la frescura de un token recién generado (< 60 segundos)', () => {
        const now = Date.now();
        const payloadReciente = {
            app: 'amarufighter',
            class_id: 'cls_1',
            generated_at: now - 15000 // generado hace 15 segundos
        };

        const result = KioskService.validateQRTokenFreshness(payloadReciente, now, 60);

        expect(result.valid).toBe(true);
        expect(result.ageSeconds).toBe(15);
    });

    it('debe rechazar un token generado hace más de 60 segundos (anti-capturas)', () => {
        const now = Date.now();
        const payloadExpirado = {
            app: 'amarufighter',
            class_id: 'cls_1',
            generated_at: now - 75000 // generado hace 75 segundos
        };

        const result = KioskService.validateQRTokenFreshness(payloadExpirado, now, 60);

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('EXPIRED');
        expect(result.ageSeconds).toBe(75);
    });

    it('debe permitir tokens legados (v1) sin generated_at por retrocompatibilidad', () => {
        const payloadLegacy = {
            app: 'amarufighter',
            class_id: 'cls_1'
        };

        const result = KioskService.validateQRTokenFreshness(payloadLegacy);

        expect(result.valid).toBe(true);
        expect(result.isLegacy).toBe(true);
    });

    it('debe ejecutar los sintetizadores de sonido de check-in sin arrojar excepciones', () => {
        // En jsdom Web Audio API puede estar simulada o no disponible
        expect(() => playCheckinSuccessSound()).not.toThrow();
        expect(() => playCheckinErrorSound()).not.toThrow();
    });
});
