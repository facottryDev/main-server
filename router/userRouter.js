import { Router } from "express";
import { getConfigsFromFilterParams } from "../controllers/config.js";
const router = Router();

router.get("/", getConfigsFromFilterParams);

export default router;
