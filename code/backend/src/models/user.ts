import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  rol: { type: String, required: true, default: 'alumno', enum: ['alumno'] },
}, { timestamps: true });

export const UserModel = model('User', userSchema);
