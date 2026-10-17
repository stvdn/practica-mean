import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { MongoEmployeeRepository } from './repositories/mongo-employee.repository.js';

async function main() {
  await connectDatabase();
  const app = createApp(new MongoEmployeeRepository());
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Servidor escuchando en el puerto ${port}`));
}
main().catch(() => {
  console.error('No se pudo iniciar el servidor. Revise MONGO_URI y la disponibilidad de MongoDB.');
  process.exitCode = 1;
});
