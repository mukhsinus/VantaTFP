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
    const firstNameRaw = value.firstName ?? value.first_name ?? '';
    const lastNameRaw = value.lastName ?? value.last_name ?? '';
    const role = value.role;
    const systemRole = value.systemRole !== undefined
        ? asSystemRole(value.systemRole)
        : value.system_role !== undefined
            ? asSystemRole(value.system_role)
            : (fallback?.systemRole ?? 'user');
    const firstNameTrimmed = String(firstNameRaw).trim();
    const lastNameTrimmed = String(lastNameRaw).trim();
    if (!userId || !email || !role) {
        return null;
    }
    if (systemRole !== 'super_admin' && !tenantId) {
        return null;
    }
    if (systemRole !== 'super_admin' && (!firstNameTrimmed || !lastNameTrimmed)) {
        return null;
    }
    const firstName = firstNameTrimmed || (systemRole === 'super_admin' ? 'Super' : '');
    const lastName = lastNameTrimmed || (systemRole === 'super_admin' ? 'Admin' : '');
    return {
        userId,
        tenantId,
        tenantName: value.tenantName
            ?? value.tenant_name
            ?? fallback?.tenantName
            ?? 'Tenant',
        email,
        firstName,
        lastName,
        role,
        systemRole,
    };
}
