import { describe, it, expect } from 'vitest';

function computeMemberStatus(member, referenceDate = new Date('2026-09-15T12:00:00Z')) {
    if (member.is_deleted) return { status: 'Eliminado', color: '#64748b' };
    if (member.is_frozen || member.membership_status === 'frozen') return { status: 'Congelado', color: '#3b82f6' };

    if (!member.membership_expiry) {
        return { status: 'Sin Plan', color: '#94a3b8' };
    }

    const expiry = new Date(member.membership_expiry);
    const diffMs = expiry - referenceDate;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return { status: 'Moroso', daysLeft, color: '#ef4444' };
    }
    if (daysLeft <= 5) {
        return { status: 'Por Vencer', daysLeft, color: '#f59e0b' };
    }
    return { status: 'Activo', daysLeft, color: '#22c55e' };
}

function evaluateChurnRisk(member, lastAttendanceDate, reservationsCountThisMonth, referenceDate = new Date('2026-09-15T12:00:00Z')) {
    const statusInfo = computeMemberStatus(member, referenceDate);
    if (statusInfo.status !== 'Activo' && statusInfo.status !== 'Moroso') {
        return { riskLevel: 'none', reason: null };
    }

    if (!lastAttendanceDate) {
        if (statusInfo.daysLeft > 0 && statusInfo.daysLeft <= 15) {
            return { riskLevel: 'high', reason: 'Pagó pero no asiste a clases' };
        }
        return { riskLevel: 'medium', reason: 'Sin asistencias registradas' };
    }

    const lastAtt = new Date(lastAttendanceDate);
    const diffDays = Math.floor((referenceDate - lastAtt) / (1000 * 60 * 60 * 24));

    if (diffDays > 14) {
        return { riskLevel: 'high', reason: 'Ausente hace ' + diffDays + ' días' };
    }
    if (reservationsCountThisMonth <= 1 && referenceDate.getUTCDate() > 15) {
        return { riskLevel: 'medium', reason: 'Baja frecuencia este mes' };
    }

    return { riskLevel: 'low', reason: 'Asistencia regular' };
}

function formatCLP(amount) {
    const num = Number(amount) || 0;
    return '$' + Math.round(num).toLocaleString('es-CL');
}

describe('Lógica de Negocio: Membresías y Socios', () => {
    const refDate = new Date('2026-09-15T12:00:00Z');

    it('debe marcar a un socio como Activo si su membresía vence en más de 5 días', () => {
        const member = { membership_expiry: '2026-09-25T12:00:00Z', membership_status: 'active' };
        const res = computeMemberStatus(member, refDate);
        expect(res.status).toBe('Activo');
        expect(res.daysLeft).toBe(10);
        expect(res.color).toBe('#22c55e');
    });

    it('debe marcar a un socio como Por Vencer si su membresía vence en 5 días o menos', () => {
        const member = { membership_expiry: '2026-09-18T12:00:00Z', membership_status: 'active' };
        const res = computeMemberStatus(member, refDate);
        expect(res.status).toBe('Por Vencer');
        expect(res.daysLeft).toBe(3);
        expect(res.color).toBe('#f59e0b');
    });

    it('debe marcar a un socio como Moroso si su membresía ya venció', () => {
        const member = { membership_expiry: '2026-09-10T12:00:00Z', membership_status: 'active' };
        const res = computeMemberStatus(member, refDate);
        expect(res.status).toBe('Moroso');
        expect(res.daysLeft).toBe(-5);
        expect(res.color).toBe('#ef4444');
    });

    it('debe priorizar el estado Congelado sobre la fecha de vencimiento', () => {
        const member = { membership_expiry: '2026-09-25T12:00:00Z', is_frozen: true };
        const res = computeMemberStatus(member, refDate);
        expect(res.status).toBe('Congelado');
        expect(res.color).toBe('#3b82f6');
    });
});

describe('Lógica de Retención y Detección de Churn', () => {
    const refDate = new Date('2026-09-15T12:00:00Z');

    it('debe detectar riesgo alto si el socio no asiste hace más de 14 días', () => {
        const member = { membership_expiry: '2026-09-30T12:00:00Z', membership_status: 'active' };
        const lastAtt = '2026-08-30T12:00:00Z';
        const risk = evaluateChurnRisk(member, lastAtt, 0, refDate);
        expect(risk.riskLevel).toBe('high');
        expect(risk.reason).toBe('Ausente hace 16 días');
    });

    it('debe marcar riesgo bajo si el socio tiene asistencia regular', () => {
        const member = { membership_expiry: '2026-09-30T12:00:00Z', membership_status: 'active' };
        const lastAtt = '2026-09-13T12:00:00Z';
        const risk = evaluateChurnRisk(member, lastAtt, 5, refDate);
        expect(risk.riskLevel).toBe('low');
    });
});

describe('Utilidades de Finanzas y Formateo', () => {
    it('debe formatear montos en pesos chilenos correctamente', () => {
        expect(formatCLP(35000)).toMatch(/\$35[.,]000/);
        expect(formatCLP(0)).toBe('$0');
        expect(formatCLP(null)).toBe('$0');
    });
});
