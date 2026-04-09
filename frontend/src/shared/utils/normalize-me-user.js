function asSystemRole(raw) {
    return raw === 'super_admin' ? 'super_admin' : 'user';
}
/** Normalizes `/users/me` payload (or stored profile shape) into `CurrentUser`. */
export function normalizeMeUser(raw, fallback = null) {
    if (!raw || typeof raw !== 'object')
        return null;
    const value = raw;
    const userId = value.userId ?? value.id;
    const tenantId = value.tenantId ?? '';
    const email = value.email;
    const firstName = value.firstName;
    const lastName = value.lastName;
    const role = value.role;
    const systemRole = value.systemRole !== undefined ? asSystemRole(value.systemRole) : (fallback?.systemRole ?? 'user');
    if (!userId || !email || !firstName || !lastName || !role) {
        return null;
    }
    if (systemRole !== 'super_admin' && !tenantId) {
        return null;
    }
    return {
        userId,
        tenantId,
        tenantName: value.tenantName ?? fallback?.tenantName ?? 'Tenant',
        email,
        firstName,
        lastName,
        role,
        systemRole,
    };
}
