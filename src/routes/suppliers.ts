
import { Router } from 'express';
import * as supplierController from '../controllers/suppliersController'; // Adjust the import path as needed
import jwtAuthMiddleware from '../core/jwtMiddleware';

const supplierRouter = Router();

supplierRouter.route('/').post(jwtAuthMiddleware, supplierController.createSupplier)
    .get(jwtAuthMiddleware, supplierController.getAllSuppliers);
supplierRouter.route('/:id').get(jwtAuthMiddleware, supplierController.getSupplierById)
    .put(jwtAuthMiddleware, supplierController.updateSupplier)
    .delete(jwtAuthMiddleware, supplierController.deleteSupplier);

export default supplierRouter;