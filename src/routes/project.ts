import { Router } from "express";
import { getProjectAllController, getProjectActiveController, isDeleteProjectController, updateStatusProjectController, getProjectFinishController, getCheckProjectController, getCurrentProjectController, createProjectController, updateProjectController } from "../controllers/project";

const router = Router();

router.get('/:userId/all', getProjectAllController);
router.get('/:userId/active', getProjectActiveController);
router.get('/:userId/finish', getProjectFinishController);
router.get('/:userId/check', getCheckProjectController);
router.get('/:userId/:projectId', getCurrentProjectController);
router.post('/:userId/create-project', createProjectController);
router.put('/:userId/update-project/:projectId', updateProjectController);
router.put('/:userId/isDelete/:projectId', isDeleteProjectController);
router.put('/:userId/comply/:projectId', updateStatusProjectController);


export default router;