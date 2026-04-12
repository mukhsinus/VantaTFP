import { Pool } from 'pg';

export interface RolePermissionRow {
  action: string;
  resource: string;
}

export interface RoleRow {
  id: string;
}

export class PolicyRepository {
  constructor(private readonly db: Pool) {}

  async findRoleByCode(tenantId: string, roleCode: string): Promise<RoleRow | null> {
    const result = await this.db.query<RoleRow>(
      `
      SELECT id
      FROM roles
      WHERE code = $1
        AND (tenant_id = $2 OR tenant_id IS NULL)
      ORDER BY CASE WHEN tenant_id = $2 THEN 0 ELSE 1 END
      LIMIT 1
      `,
      [roleCode, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async findRolePermissions(roleId: string): Promise<RolePermissionRow[]> {
    const result = await this.db.query<RolePermissionRow>(
      `
      SELECT p.action, p.resource
      FROM role_permissions rp
      INNER JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      `,
      [roleId]
    );
    return result.rows;
  }
}
