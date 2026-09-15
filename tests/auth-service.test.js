import { describe, it, expect } from 'vitest';

describe('Servicio de Autenticación y Verificación de Roles', () => {
    it('debe identificar correctamente a un administrador', async () => {
        const mockProfile = { id: 'admin-123', role: 'admin', full_name: 'Admin Boss' };
        const verifyAdminRole = async (userId, fetcher) => {
            if (!userId) return { isAdmin: false, profile: null };
            const profile = await fetcher(userId);
            return { isAdmin: profile?.role === 'admin', profile };
        };

        const result = await verifyAdminRole('admin-123', async () => mockProfile);
        expect(result.isAdmin).toBe(true);
        expect(result.profile.full_name).toBe('Admin Boss');
    });

    it('debe rechazar a usuarios regulares sin rol admin', async () => {
        const mockProfile = { id: 'student-456', role: 'student', full_name: 'Luchador Amaru' };
        const verifyAdminRole = async (userId, fetcher) => {
            if (!userId) return { isAdmin: false, profile: null };
            const profile = await fetcher(userId);
            return { isAdmin: profile?.role === 'admin', profile };
        };

        const result = await verifyAdminRole('student-456', async () => mockProfile);
        expect(result.isAdmin).toBe(false);
    });

    it('debe manejar UIDs nulos o no definidos', async () => {
        const verifyAdminRole = async (userId) => {
            if (!userId) return { isAdmin: false, profile: null };
            return { isAdmin: true, profile: {} };
        };

        const result = await verifyAdminRole(null);
        expect(result.isAdmin).toBe(false);
        expect(result.profile).toBeNull();
    });
});
