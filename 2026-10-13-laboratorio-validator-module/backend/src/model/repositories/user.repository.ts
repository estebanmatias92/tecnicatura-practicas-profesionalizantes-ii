import type { User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  list(): Promise<User[]>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
