import { Pool } from 'pg';

export interface PermissionRecord {
  id: string;
  action: string;
  resource: string;
}

export interface RoleRecord {
  id: string;
  tenant_id: string | null;
  name: string;
  code: string;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export class RbacRepository {
  constructor(private readonly db: Pool) {}

  async listPermissions(): Promise<PermissionRecord[]> {
    const result = await this.db.query<PermissionRecord>(
      `
      SELECT id, action, resource
      FROM permissions
      ORDER BY resource ASC, action ASC
      `
    );
    return result.rows;
  }

  async listRolesForTenant(tenantId: string): Promise<RoleRecord[]> {
    const result = await this.db.query<RoleRecord>(
      `
      SELECT id, tenant_id, name, code, is_system, created_at, updated_at
      FROM roles
      WHERE tenant_id = $1 OR tenant_id IS NULL
      ORDER BY is_system DESC, created_at ASC
      `,
      [tenantId]
    );
    return result.rows;
  }

  async createTenantRole(params: {
    tenantId: string;
    name: string;
    code: string;
  }): Promise<RoleRecord> {
    const result = await this.db.query<RoleRecord>(
      `
      INSERT INTO roles (tenant_id, name, code, is_system, created_at, updated_at)
      VALUES ($1, $2, $3, FALSE, NOW(), NOW())
      RETURNING id, tenant_id, name, code, is_system, created_at, updated_at
      `,
      [params.tenantId, params.name, params.code]
    );
    return result.rows[0];
  }

  async findTenantRoleById(roleId: string, tenantId: string): Promise<RoleRecord | null> {
    const result = await this.db.query<RoleRecord>(
      `
      SELECT id, tenant_id, name, code, is_system, created_at, updated_at
      FROM roles
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
      [roleId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async updateTenantRoleName(roleId: string, tenantId: string, name: string): Promise<RoleRecord | null> {
    const result = await this.db.query<RoleRecord>(
      `
      UPDATE roles
      SET name = $1, updated_at = NOW()
      WHERE id = $2
        AND tenant_id = $3
      RETURNING id, tenant_id, name, code, is_system, created_at, updated_at
      `,
      [name, roleId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.db.query(
      `
      DELETE FROM role_permissions
      WHERE role_id = $1
      `,
      [roleId]
    );

    if (permissionIds.length === 0) return;

    await this.db.query(
      `
      INSERT INTO role_permissions (role_id, permission_id, created_at)
      SELECT $1, p.id, NOW()
      FROM permissions p
      WHERE p.id = ANY($2::uuid[])
      ON CONFLICT DO NOTHING
      `,
      [roleId, permissionIds]
    );
  }

  async countPermissionsByIds(permissionIds: string[]): Promise<number> {
    if (permissionIds.length === 0) return 0;
    const result = await this.db.query<{ total: string }>(
      `
      SELECT COUNT(*)::text AS total
      FROM permissions
      WHERE id = ANY($1::uuid[])
      `,
      [permissionIds]
    );
    return Number(result.rows[0]?.total ?? 0);
  }
}
