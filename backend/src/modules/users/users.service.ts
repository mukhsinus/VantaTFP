import { UsersRepository } from './users.repository.js';
import { CreateUserDto, UpdateUserDto } from './users.schema.js';

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getAllUsers(_tenantId: string) {
    throw new Error('Not implemented');
  }

  async getUserById(_userId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }

  async createUser(_tenantId: string, _data: CreateUserDto) {
    throw new Error('Not implemented');
  }

  async updateUser(_userId: string, _tenantId: string, _data: UpdateUserDto) {
    throw new Error('Not implemented');
  }

  async deactivateUser(_userId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }
}
