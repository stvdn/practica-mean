import type { NewUser, User } from '../domain/user.js';
import type { IAuthRepository } from './auth.repository.js';
import { UserModel } from '../models/user.js';

function toUser(doc: { _id: { toString(): string }; email: string; rol: string; passwordHash: string }): User {
  return { id: doc._id.toString(), email: doc.email, rol: doc.rol, passwordHash: doc.passwordHash };
}

export class MongoAuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).select('+passwordHash').exec();
    return doc ? toUser(doc) : null;
  }
  async createUser(data: NewUser): Promise<User> {
    return toUser(await UserModel.create(data));
  }
}
