import type { NewUser, User } from '../domain/user.js';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  createUser(data: NewUser): Promise<User>;
}
