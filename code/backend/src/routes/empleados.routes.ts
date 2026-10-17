import { Router } from 'express';
import type { IEmployeeRepository } from '../repositories/employee.repository.js';
import { EmployeeController } from '../controllers/empleados.controllers.js';
import { employeeDto, updateEmployeeDto, employeeParamsDto, employeeQueryDto } from '../dto/employee.dto.js';
import { validate } from '../middleware/validate.js';

export function employeeRoutes(repository: IEmployeeRepository) {
  const router = Router();
  const controller = new EmployeeController(repository);
  router.get('/', validate(employeeQueryDto, 'query'), controller.list);
  router.post('/', validate(employeeDto, 'body'), controller.create);
  router.get('/:id', validate(employeeParamsDto, 'params'), controller.get);
  router.put('/:id', validate(employeeParamsDto, 'params'), validate(employeeDto, 'body'), controller.update);
  router.patch('/:id', validate(employeeParamsDto, 'params'), validate(updateEmployeeDto, 'body'), controller.update);
  router.delete('/:id', validate(employeeParamsDto, 'params'), controller.delete);
  return router;
}
