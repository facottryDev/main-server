import { Router } from "express";
import { addAppConfig, addPlayerConfig, getAppConfigFromId, getFilterIdFromParams, getPlayerConfigFromId, createMapping, updateMapping, deleteMapping } from "../controllers/config.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

router.post("/add-app-config", addAppConfig);
router.post("/add-player-config", addPlayerConfig);
router.get("/get-app-config-from-id", getAppConfigFromId);
router.get("/get-player-config-from-id", getPlayerConfigFromId);
router.get("/get-filter-id-from-params", getFilterIdFromParams);

router.post("/create-mapping", createMapping);
router.patch("/update-mapping", updateMapping);
router.delete("/delete-mapping", deleteMapping);

router.get("/", (req, res) => {
    res.status(200).json({ message: "Config Router" });
  });

export default router;