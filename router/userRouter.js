import { Router } from "express";
import { getMapping } from "../controllers/config.js";
const router = Router();

router.get("/get-mapping", getMapping);

export default router;
