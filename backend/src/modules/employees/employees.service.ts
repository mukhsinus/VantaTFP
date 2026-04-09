import { EmployeesRepository, TenantMembershipRole } from './employees.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { Role } from '../../shared/types/common.types.js';
import type { PatchEmployeeRoleDto, ListEmployeesQuery } from './employees.schema.js';
import type { TenantRole } from '../../shared/types/common.types.js';

export interface EmployeeResponse {
  id: string;
  email: string;
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

function toEmployeeResponse(row: { id: string; email: string; role: TenantMembershipRole }): EmployeeResponse {
  return {
    id: row.id,
    email: row.email,
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

export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly usersRepository: UsersRepository
  ) {}

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
