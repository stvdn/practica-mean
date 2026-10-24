import jwt from 'jsonwebtoken';
import type { IAuthRepository } from '../../src/repositories/auth.repository.js';
import type { NewUser, User } from '../../src/domain/user.js';

export const testSecret = 'isolated-test-secret-at-least-32-bytes-long';
export const testToken = () => jwt.sign({ id: 'test-user', rol: 'alumno' }, testSecret, { expiresIn: '2h' });

export class MemoryAuthRepository implements IAuthRepository {
  users: User[] = [];
  calls = 0;
  async findByEmail(email: string) {
    this.calls++;
    return this.users.find(user => user.email === email) ?? null;
  }
  async createUser(data: NewUser) {
    this.calls++;
    if (this.users.some(user => user.email === data.email)) throw { code: 11000 };
    const user = { ...data, id: String(this.users.length + 1) };
    this.users.push(user);
    return user;
  }
}
