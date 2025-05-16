import { Router } from "express";
import { getAllIfcFileController, getCurrentIfcFileController, createIfcFileController, createIfcFilesController, deleteIfcFileController, deleteIfcFilesController } from "../controllers/ifcFile";

const router = Router();

router.get('/:projectId/ifcFiles', getAllIfcFileController);
router.get('/ifcFiles/:ifcFileId', getCurrentIfcFileController);
router.post('/ifcFiles/create-ifcFile', createIfcFileController);
router.post('/ifcFiles/create-ifcFiles', createIfcFilesController);
router.delete('/ifcFiles/delete-ifcFile/:ifcFileId', deleteIfcFileController);
router.delete('/ifcFiles/delete-ifcFiles/', deleteIfcFilesController);

export default router;