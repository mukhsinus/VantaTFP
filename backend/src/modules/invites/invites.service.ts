import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { InvitesRepository, type InviteTenantRole } from './invites.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import type { AuthService, AuthSuccessResponse } from '../auth/auth.service.js';
import type { BillingService } from '../billing/billing.service.js';
import type { EmployeesRepository } from '../employees/employees.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { validatePassword } from '../../shared/utils/password-validator.js';
import type { SystemRole, TenantRole, Role } from '../../shared/types/common.types.js';
import type { AcceptInviteDto, CreateLinkInviteDto } from './invites.schema.js';

export class InvitesService {
  constructor(
    private readonly invitesRepository: InvitesRepository,
    private readonly authRepository: AuthRepository,
    private readonly billing: BillingService,
    private readonly employeesRepository: EmployeesRepository,
    private readonly authService: AuthService
  ) {}

  async createLinkInvite(
    tenantId: string,
    dto: CreateLinkInviteDto,
    actor: { system_role: SystemRole; tenant_role: TenantRole | null }
  ): Promise<{ token: string; expiresAt: Date }> {
    if (actor.system_role !== 'super_admin') {
      if (actor.tenant_role !== 'owner' && actor.tenant_role !== 'manager') {
        throw ApplicationError.forbidden('Only owners and managers can create invites');
      }
    }

    if (
      actor.tenant_role === 'manager' &&
      actor.system_role !== 'super_admin' &&
      dto.role !== 'employee'
    ) {
      throw ApplicationError.forbidden('Managers can only invite employees');
    }

    await this.billing.assertCanAddUser(tenantId);

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.invitesRepository.insertInvite({
      token,
      tenant_id: tenantId,
      role: dto.role,
      expires_at: expiresAt,
    });

    return { token, expiresAt };
  }

  async acceptInvite(dto: AcceptInviteDto): Promise<AuthSuccessResponse> {
    const pwd = validatePassword(dto.password);
    if (!pwd.valid) {
      throw ApplicationError.badRequest(
        `Password requirements not met: ${pwd.errors.join('; ')}`
      );
    }

    const email = dto.email.toLowerCase();
    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw ApplicationError.conflict('Email is already registered');
    }

    const tenantId = await this.invitesRepository.findTenantIdByToken(dto.token);
    if (!tenantId) {
      throw ApplicationError.unauthorized('Invalid or expired invite');
    }

    const [firstName, lastName] =
      dto.firstName?.trim() && dto.lastName?.trim()
        ? [dto.firstName.trim(), dto.lastName.trim()]
        : this.namesFromEmail(email);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.billing.runAtomicUserCreation(
      tenantId,
      { occupiesBillableSeat: true },
      async (tx) => {
        const invite = await this.invitesRepository.lockValidInviteByToken(dto.token, tx);
        if (!invite) {
          throw ApplicationError.unauthorized('Invalid or expired invite');
        }

        const legacyRole: Role = invite.role === 'manager' ? 'MANAGER' : 'EMPLOYEE';

        const user = await this.authRepository.createUser(
          {
            tenant_id: invite.tenant_id,
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            role: legacyRole,
            is_active: true,
          },
          tx
        );

        await this.invitesRepository.markUsed(invite.id, tx);

        await this.employeesRepository.upsertTenantMembership(
          user.id,
          invite.tenant_id,
          invite.role,
          tx
        );

        return user;
      }
    );

    return this.authService.issueSessionAfterRegistration(email);
  }

  private namesFromEmail(email: string): [string, string] {
    const localPart = email.split('@')[0];
    const cleaned = localPart
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/[._-]+/g, ' ')
      .trim();

    if (!cleaned) {
      return ['User', 'Account'];
    }

    const tokens = cleaned.split(' ').filter(Boolean);
    const first = this.capitalize(tokens[0] ?? 'User');
    const last = this.capitalize(tokens.slice(1).join(' ') || 'Account');
    return [first, last];
  }

  private capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
