import { PolicyRepository } from './policy.repository.js';

export class PolicyService {
  constructor(private readonly repo: PolicyRepository) {}

  private getRoleCodeCandidates(roleCode: string): string[] {
    const raw = roleCode.trim();
    if (!raw) return [];

    const normalized = raw.toLowerCase();
    const upper = raw.toUpperCase();
    const candidates = [raw, normalized, upper];

    // Legacy -> canonical aliases
    if (normalized === 'admin') candidates.push('owner');
    if (normalized === 'manager') candidates.push('manager');
    if (normalized === 'employee') candidates.push('employee');

    // Canonical -> legacy aliases
    if (normalized === 'owner') candidates.push('ADMIN');
    if (normalized === 'manager') candidates.push('MANAGER');
    if (normalized === 'employee') candidates.push('EMPLOYEE');

    return [...new Set(candidates.filter(Boolean))];
  }

  async checkPermission(
    tenantId: string,
    roleCode: string,
    action: string,
    resource: string
  ): Promise<boolean> {
    const roleCandidates = this.getRoleCodeCandidates(roleCode);
    let role = null as Awaited<ReturnType<PolicyRepository['findRoleByCode']>>;
    for (const candidate of roleCandidates) {
      role = await this.repo.findRoleByCode(tenantId, candidate);
      if (role) break;
    }
    if (!role) {
      return false;
    }

    const permissions = await this.repo.findRolePermissions(role.id);
    return permissions.some(
      (p) =>
        (p.action === 'manage' && p.resource === 'all') ||
        (p.action === action && p.resource === resource)
    );
  }

  async hasAnyRole(tenantId: string, actorRoleCode: string, allowedRoles: string[]): Promise<boolean> {
    if (allowedRoles.includes(actorRoleCode)) {
      return true;
    }

    // For custom tenant roles, infer acceptance from granted manage/read/write permissions.
    const role = await this.repo.findRoleByCode(tenantId, actorRoleCode);
    if (!role) {
      return false;
    }
    const permissions = await this.repo.findRolePermissions(role.id);
    if (permissions.some((p) => p.action === 'manage' && p.resource === 'all')) {
      return true;
    }

    // Backward-compatible hierarchy for common checks:
    // ADMIN-like roles satisfy all role checks, MANAGER-like satisfy employee checks.
    const canWriteUsers = permissions.some((p) => p.action === 'write' && p.resource === 'users');
    const canWriteTasks = permissions.some((p) => p.action === 'write' && p.resource === 'tasks');
    const canReadTasks = permissions.some((p) => p.action === 'read' && p.resource === 'tasks');
    const isAdminLike = canWriteUsers && canWriteTasks;
    const isManagerLike = canReadTasks;

    if (allowedRoles.includes('ADMIN') && isAdminLike) return true;
    if (allowedRoles.includes('MANAGER') && (isAdminLike || isManagerLike)) return true;
    if (allowedRoles.includes('EMPLOYEE') && (isAdminLike || isManagerLike || canReadTasks)) return true;

    return false;
  }
}
