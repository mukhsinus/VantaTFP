import bcrypt from 'bcrypt';
import { EmployeesRepository } from './employees.repository.js';
import type { EmployeeListRow, TenantMembershipRole } from './employees.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { Role } from '../../shared/types/common.types.js';
import type { PatchEmployeeRoleDto, ListEmployeesQuery, CreateEmployeeBody } from './employees.schema.js';
import type { TenantRole } from '../../shared/types/common.types.js';
import type { BillingService } from '../billing/billing.service.js';

export interface EmployeeResponse {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  role: TenantRole;
  isOwner: boolean;
}

export interface EmployeeListResponse {
  data: EmployeeResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

function buildEmployeeDisplayName(
  row: Pick<EmployeeListRow, 'email' | 'first_name' | 'last_name' | 'phone'>
): string {
  const fn = String(row.first_name ?? '').trim();
  const ln = String(row.last_name ?? '').trim();
  const full = `${fn} ${ln}`.trim();
  if (full) return full;
  const ph = String(row.phone ?? '').trim();
  if (ph) return ph;
  const email = row.email ?? '';
  if (email.toLowerCase().endsWith('@employee.tfp.internal')) {
    const local = email.split('@')[0] ?? '';
    const parts = local.split('.');
    if (parts.length >= 3 && parts[0]?.toLowerCase() === 'e') {
      const tail = parts[parts.length - 1]?.trim();
      if (tail) return tail;
    }
  }
  const beforeAt = email.split('@')[0]?.trim();
  return beforeAt || email;
}

function toEmployeeResponse(row: EmployeeListRow): EmployeeResponse {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    displayName: buildEmployeeDisplayName(row),
    role: row.role,
    isOwner: row.role === 'owner',
  };
}

function tenantRoleToLegacyRole(role: TenantMembershipRole): Role {
  switch (role) {
    case 'owner':
      return 'ADMIN';
    case 'manager':
      return 'MANAGER';
    default:
      return 'EMPLOYEE';
  }
}

export interface CreateEmployeeResponse {
  id: string;
  phone: string;
  name: string | null;
  role: TenantRole;
}

export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly billing?: BillingService
  ) {}

  /**
   * Employer creates an employee with phone as unique identifier.
   * Password min 4 chars, no complexity requirements (per spec).
   */
  async createEmployee(
    tenantId: string,
    body: CreateEmployeeBody,
    actorUserId: string
  ): Promise<CreateEmployeeResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }
    const hasPhoneColumn = await this.employeesRepository.hasPhoneColumn();
    if (!hasPhoneColumn) {
      throw ApplicationError.badRequest('Phone-based employee accounts are not available until DB phone column is added');
    }

    if (this.billing) {
      await this.billing.assertCanAddUser(tenantId);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const employeeData = {
      tenantId,
      phone: body.phone,
      name: body.name ?? null,
      roleDescription: body.roleDescription ?? null,
      passwordHash,
      role: body.role,
    };

    let created: { id: string; phone: string; name: string | null; role: TenantMembershipRole };

    if (this.billing) {
      created = await this.billing.runAtomicUserCreation(
        tenantId,
        { occupiesBillableSeat: true },
        (tx) => this.employeesRepository.createEmployee(employeeData, tx)
      );
    } else {
      created = await this.employeesRepository.createEmployee(employeeData);
    }

    return {
      id: created.id,
      phone: created.phone,
      name: created.name,
      role: created.role,
    };
  }

  async listEmployees(tenantId: string, query: ListEmployeesQuery): Promise<EmployeeListResponse> {
    const { page, limit } = query;
    const rows = await this.employeesRepository.listByTenant(tenantId, page, limit);
    const total = await this.employeesRepository.countByTenant(tenantId);
    const pages = Math.ceil(total / limit) || 1;

    return {
      data: rows.map(toEmployeeResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
        hasMore: page < pages,
      },
    };
  }

  async patchEmployeeRole(
    tenantId: string,
    targetUserId: string,
    body: PatchEmployeeRoleDto,
    actorUserId: string
  ): Promise<EmployeeResponse> {
    if (actorUserId === targetUserId) {
      throw ApplicationError.badRequest('You cannot change your own role');
    }

    const targetProfile = await this.usersRepository.findMeProfile(targetUserId);
    if (targetProfile?.system_role === 'super_admin') {
      throw ApplicationError.forbidden(
        'Platform administrators cannot be assigned a tenant role'
      );
    }

    const current = await this.employeesRepository.getMembershipRole(targetUserId, tenantId);
    if (!current) {
      throw ApplicationError.notFound('Employee');
    }
    if (current === 'owner') {
      throw ApplicationError.forbidden('The tenant owner role cannot be changed');
    }

    const next: TenantMembershipRole = body.role;
    await this.employeesRepository.upsertTenantMembership(targetUserId, tenantId, next);
    const legacy = tenantRoleToLegacyRole(next);
    const updated = await this.usersRepository.update(targetUserId, tenantId, { role: legacy });

    return toEmployeeResponse({
      id: updated.id,
      email: updated.email,
      first_name: updated.first_name,
      last_name: updated.last_name,
      phone: null,
      role: next,
    });
  }

  async deactivateEmployee(
    tenantId: string,
    targetUserId: string,
    actorUserId: string,
    actorLegacyRole: Role
  ): Promise<void> {
    if (actorUserId === targetUserId) {
      throw ApplicationError.badRequest('You cannot deactivate yourself');
    }

    const targetProfile = await this.usersRepository.findMeProfile(targetUserId);
    if (targetProfile?.system_role === 'super_admin') {
      throw ApplicationError.forbidden(
        'Platform administrators cannot be managed as tenant employees'
      );
    }

    const current = await this.employeesRepository.getMembershipRole(targetUserId, tenantId);
    if (!current) {
      throw ApplicationError.notFound('Employee');
    }
    if (current === 'owner') {
      throw ApplicationError.forbidden('The tenant owner cannot be removed');
    }

    if (actorLegacyRole === 'MANAGER' && current !== 'employee') {
      throw ApplicationError.forbidden('Managers can only deactivate employees');
    }

    const ok = await this.usersRepository.deactivate(targetUserId, tenantId);
    if (!ok) {
      throw ApplicationError.notFound('Employee');
    }
  }
}
