import { Router } from "express";
import { getMapping } from "../controllers/scale.js";
const router = Router();

router.post("/get-mapping", getMapping);

export default router;