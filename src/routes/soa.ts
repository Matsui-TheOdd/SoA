import { Router } from "express";
import { getAllSoAController, getCurrentSoAController, createSoAController, createSoAsController, deleteSoAController } from "../controllers/soa";

const router = Router();

router.get('/:excelId/soas', getAllSoAController);
router.get('/soas/:soaId', getCurrentSoAController);
router.post('/soas/create-soa', createSoAController);
router.post('/soas/create-soas', createSoAsController);
router.delete('/soas/delete-soas/:excelId', deleteSoAController);

export default router;