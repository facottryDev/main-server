import { Router } from "express";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);





export default router;