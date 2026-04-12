import { ApplicationError } from '../../shared/utils/application-error.js';
import { CreateRoleDto, UpdateRoleDto } from './rbac.schema.js';
import { PermissionRecord, RbacRepository, RoleRecord } from './rbac.repository.js';

export class RbacService {
  constructor(private readonly repo: RbacRepository) {}

  async listPermissions() {
    const rows = await this.repo.listPermissions();
    return rows.map((p) => this.toPermissionResponse(p));
  }

  async listRoles(tenantId: string) {
    const rows = await this.repo.listRolesForTenant(tenantId);
    return rows.map((r) => this.toRoleResponse(r));
  }

  async createRole(tenantId: string, data: CreateRoleDto) {
    const requested = [...new Set(data.permissionIds)];
    const count = await this.repo.countPermissionsByIds(requested);
    if (count !== requested.length) {
      throw ApplicationError.badRequest('One or more permissionIds are invalid');
    }

    let role: RoleRecord;
    try {
      role = await this.repo.createTenantRole({
        tenantId,
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        throw ApplicationError.conflict('Role code already exists for this tenant');
      }
      throw error;
    }

    await this.repo.replaceRolePermissions(role.id, requested);
    return this.toRoleResponse(role);
  }

  async updateRole(roleId: string, tenantId: string, data: UpdateRoleDto) {
    const role = await this.repo.findTenantRoleById(roleId, tenantId);
    if (!role) {
      throw ApplicationError.notFound('Role');
    }

    if (data.name !== undefined) {
      await this.repo.updateTenantRoleName(roleId, tenantId, data.name.trim());
    }

    if (data.permissionIds !== undefined) {
      const requested = [...new Set(data.permissionIds)];
      const count = await this.repo.countPermissionsByIds(requested);
      if (count !== requested.length) {
        throw ApplicationError.badRequest('One or more permissionIds are invalid');
      }
      await this.repo.replaceRolePermissions(roleId, requested);
    }

    const updated = await this.repo.findTenantRoleById(roleId, tenantId);
    if (!updated) {
      throw ApplicationError.notFound('Role');
    }
    return this.toRoleResponse(updated);
  }

  private toPermissionResponse(permission: PermissionRecord) {
    return {
      id: permission.id,
      action: permission.action,
      resource: permission.resource,
    };
  }

  private toRoleResponse(role: RoleRecord) {
    return {
      id: role.id,
      tenantId: role.tenant_id,
      name: role.name,
      code: role.code,
      isSystem: role.is_system,
      createdAt: role.created_at.toISOString(),
      updatedAt: role.updated_at.toISOString(),
    };
  }
}
