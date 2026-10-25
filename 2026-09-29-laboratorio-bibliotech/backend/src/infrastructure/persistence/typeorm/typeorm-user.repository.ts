import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { User } from '../../../model/entities/user.entity';
import type { UserRepository } from '../../../model/repositories/user.repository';
import { toUserDomain, toUserOrm } from './mappers';
import { UserOrm } from './orm-entities';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrm)
    private readonly repo: Repository<UserOrm>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? toUserDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.trim().toLowerCase() } });
    return orm ? toUserDomain(orm) : null;
  }

  async save(user: User): Promise<User> {
    const saved = await this.repo.save(toUserOrm(user));
    return toUserDomain(saved);
  }

  async list(): Promise<User[]> {
    const rows = await this.repo.find({ order: { createdAt: 'ASC' } });
    return rows.map(toUserDomain);
  }
}
