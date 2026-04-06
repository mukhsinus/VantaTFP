import type { UserApiDto, UserUiModel } from './users.types';
import i18n from '@shared/i18n/i18n';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

export function mapUserDtoToUiModel(dto: UserApiDto): UserUiModel {
  const createdAt = new Date(dto.createdAt);

  return {
    id: dto.id,
    fullName: `${dto.firstName} ${dto.lastName}`.trim(),
    email: dto.email,
    role: dto.role,
    isActive: dto.isActive,
    createdAtLabel: Number.isNaN(createdAt.getTime())
      ? i18n.t('common.states.notAvailable')
      : dateFormatter.format(createdAt),
  };
}

export function mapUsersDtoToUiModel(dtos: UserApiDto[]): UserUiModel[] {
  return dtos.map(mapUserDtoToUiModel);
}
