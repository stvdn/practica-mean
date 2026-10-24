import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { MongoEmployeeRepository } from './repositories/mongo-employee.repository.js';
import { getJwtSecret } from './config/auth.js';
import { UserModel } from './models/user.js';

async function main() {
  getJwtSecret();
  await connectDatabase();
  await UserModel.init();
  const app = createApp(new MongoEmployeeRepository());
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Servidor escuchando en el puerto ${port}`));
}
main().catch(() => {
  console.error('No se pudo iniciar el servidor. Revise JWT_SECRET (mínimo 32 bytes), MONGO_URI y MongoDB.');
  process.exitCode = 1;
});
