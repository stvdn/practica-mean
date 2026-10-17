import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/usuarios_db', {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('Conexión exitosa a MongoDB');
}
