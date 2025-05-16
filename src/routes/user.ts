import { Router } from "express";
import { getCurrentUserController } from "../controllers/user";

const router = Router();

router.get('/:userId', getCurrentUserController);

export default router;