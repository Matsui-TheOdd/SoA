import { Router } from "express";
import { getAllExcelController, getCurrentExcelController, createExcelController, createExcelsController, deleteExcelController, deleteExcelsController } from "../controllers/excel";

const router = Router();

router.get('/:projectId/excels', getAllExcelController);
router.get('/excels/:excelId', getCurrentExcelController);
router.post('/excels/create-excel', createExcelController);
router.post('/excels/create-excels', createExcelsController);
router.delete('/excels/delete-excel/:excelId', deleteExcelController);
router.delete('/excels/delete-excels', deleteExcelsController);

export default router;