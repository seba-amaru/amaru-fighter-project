import { describe, it, expect } from 'vitest';
import { calculateDiscountedAmount } from '../admin/paymentService.js';

describe('Payment & Discount Logic (paymentService)', () => {
    const basePlanPrice = 30000;

    it('calculates full price when no discount is selected', () => {
        const res = calculateDiscountedAmount(basePlanPrice, { type: 'none' });
        expect(res.finalAmount).toBe(30000);
        expect(res.discountAmount).toBe(0);
        expect(res.note).toBe('');
    });

    it('calculates discount by percentage correctly', () => {
        const res = calculateDiscountedAmount(basePlanPrice, { type: 'percent', percent: 20, reason: 'Familiar' });
        expect(res.finalAmount).toBe(24000);
        expect(res.discountAmount).toBe(6000);
        expect(res.note).toContain('Desc. 20%');
        expect(res.note).toContain('Familiar');
    });

    it('calculates promo code discount correctly (e.g. LFNM2026)', () => {
        const res = calculateDiscountedAmount(40000, { type: 'code', code: 'LFNM2026', percent: 20 });
        expect(res.finalAmount).toBe(32000);
        expect(res.discountAmount).toBe(8000);
        expect(res.note).toContain('LFNM2026');
    });

    it('calculates fixed amount rebate correctly', () => {
        const res = calculateDiscountedAmount(50000, { type: 'fixed', fixedAmount: 15000, reason: 'Beca' });
        expect(res.finalAmount).toBe(35000);
        expect(res.discountAmount).toBe(15000);
        expect(res.note).toContain('Rebaja -$15.000');
    });

    it('handles custom agreed price directly', () => {
        const res = calculateDiscountedAmount(50000, { type: 'custom_price', customPrice: 25000, reason: 'Hermano' });
        expect(res.finalAmount).toBe(25000);
        expect(res.discountAmount).toBe(25000);
        expect(res.note).toContain('Tarifa especial $25.000');
    });

    it('prevents negative final amount if discount exceeds base price', () => {
        const res = calculateDiscountedAmount(30000, { type: 'fixed', fixedAmount: 45000 });
        expect(res.finalAmount).toBe(0);
        expect(res.discountAmount).toBe(30000);
    });
});
