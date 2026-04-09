import { UsersRepository } from './users.repository.js';
import { CreateUserDto, UpdateUserDto } from './users.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { Role } from '../../shared/types/common.types.js';
import bcrypt from 'bcrypt';
import type { BillingService } from '../billing/billing.service.js';

interface ActorContext {
  actorUserId: string;
  actorRole: Role;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  managerId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface UserListResponse {
  data: UserResponse[];
  pagination: PaginationMeta;
}

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly billing: BillingService
  ) {}

  async getAllUsers(tenantId: string): Promise<UserResponse[]> {
    const users = await this.usersRepository.findAllActiveByTenant(tenantId);
    return users.map((user) => this.toUserResponse(user));
  }

  async listUsers(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<UserListResponse> {
    const users = await this.usersRepository.findAllActiveByTenantPaginated(tenantId, page, limit);
    const total = await this.usersRepository.countActiveByTenant(tenantId);
    const pages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.toUserResponse(user)),
      pagination: {
        total,
        page,
        limit,
        pages,
        hasMore: page < pages,
      },
    };
  }

  async getUserById(userId: string, tenantId: string): Promise<UserResponse> {
    const user = await this.usersRepository.findByIdAndTenant(userId, tenantId);
    if (!user || !user.is_active) {
      throw ApplicationError.notFound('User');
    }

    return this.toUserResponse(user);
  }

  async createUser(
    tenantId: string,
    data: CreateUserDto,
    context: ActorContext
  ): Promise<UserResponse> {
    this.assertCreateRoleAllowed(context.actorRole, data.role);

    const existing = await this.usersRepository.findByEmail(data.email, tenantId);
    if (existing) {
      throw ApplicationError.conflict('Email is already in use');
    }

    if (data.managerId) {
      const manager = await this.usersRepository.findByIdAndTenant(
        data.managerId,
        tenantId
      );

      if (!manager || !manager.is_active) {
        throw ApplicationError.badRequest('Manager does not exist in this tenant');
      }

      if (!['ADMIN', 'MANAGER'].includes(manager.role)) {
        throw ApplicationError.badRequest('managerId must point to an ADMIN or MANAGER');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const created = await this.billing.runAtomicUserCreation(tenantId, (tx) =>
      this.usersRepository.create(
        {
          tenant_id: tenantId,
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          manager_id: data.managerId ?? null,
          is_active: true,
        },
        tx
      )
    );

    return this.toUserResponse(created);
  }

  async updateUser(
    userId: string,
    tenantId: string,
    data: UpdateUserDto,
    context: ActorContext
  ): Promise<UserResponse> {
    const existing = await this.usersRepository.findByIdAndTenant(userId, tenantId);
    if (!existing || !existing.is_active) {
      throw ApplicationError.notFound('User');
    }

    if (data.role) {
      this.assertCreateRoleAllowed(context.actorRole, data.role);
    }

    if (data.email && data.email.toLowerCase() !== existing.email.toLowerCase()) {
      const duplicate = await this.usersRepository.findByEmail(data.email, tenantId);
      if (duplicate) {
        throw ApplicationError.conflict('Email is already in use');
      }
    }

    if (data.managerId !== undefined && data.managerId !== null) {
      if (data.managerId === userId) {
        throw ApplicationError.badRequest('User cannot be their own manager');
      }

      const manager = await this.usersRepository.findByIdAndTenant(data.managerId, tenantId);
      if (!manager || !manager.is_active) {
        throw ApplicationError.badRequest('Manager does not exist in this tenant');
      }

      if (!['ADMIN', 'MANAGER'].includes(manager.role)) {
        throw ApplicationError.badRequest('managerId must point to an ADMIN or MANAGER');
      }
    }

    const updated = await this.usersRepository.update(userId, tenantId, {
      email: data.email?.toLowerCase(),
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      manager_id: data.managerId,
    });

    return this.toUserResponse(updated);
  }

  async deactivateUser(
    userId: string,
    tenantId: string,
    context: ActorContext
  ): Promise<void> {
    const existing = await this.usersRepository.findByIdAndTenant(userId, tenantId);
    if (!existing || !existing.is_active) {
      throw ApplicationError.notFound('User');
    }

    // Managers cannot deactivate ADMIN or MANAGER.
    if (
      context.actorRole === 'MANAGER' &&
      ['ADMIN', 'MANAGER'].includes(existing.role)
    ) {
      throw ApplicationError.forbidden('Managers can only deactivate EMPLOYEE users');
    }

    const deactivated = await this.usersRepository.deactivate(userId, tenantId);
    if (!deactivated) {
      throw ApplicationError.notFound('User');
    }
  }

  private assertCreateRoleAllowed(actorRole: Role, targetRole: Role): void {
    if (actorRole === 'MANAGER' && targetRole !== 'EMPLOYEE') {
      throw ApplicationError.forbidden('Managers can only create EMPLOYEE users');
    }
  }

  private toUserResponse(user: {
    id: string;
    tenant_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
    manager_id: string | null;
    is_active: boolean;
    created_at: Date;
  }): UserResponse {
    return {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      managerId: user.manager_id,
      isActive: user.is_active,
      createdAt: user.created_at.toISOString(),
    };
  }
}
