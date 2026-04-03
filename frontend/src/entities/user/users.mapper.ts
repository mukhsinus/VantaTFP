import type { UserApiDto, UserUiModel } from './users.types';

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
      ? '—'
      : dateFormatter.format(createdAt),
  };
}

export function mapUsersDtoToUiModel(dtos: UserApiDto[]): UserUiModel[] {
  return dtos.map(mapUserDtoToUiModel);
}
