import { Router } from "express";
import { addAppConfig, addPlayerConfig, getAppConfigFromId, getFilterIdFromParams, getPlayerConfigFromId, createMapping, deleteMapping, updateAppConfig, updatePlayerConfig, getAllAppConfigs, getAllPlayerConfigs } from "../controllers/config.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

router.post("/add-app-config", addAppConfig);
router.post("/add-player-config", addPlayerConfig);
router.get("/get-app-configs", getAllAppConfigs);
router.get("/get-player-configs", getAllPlayerConfigs);
router.post("/update-app-config", updateAppConfig);
router.post("/update-player-config", updatePlayerConfig);
router.get("/get-app-config-from-id", getAppConfigFromId);
router.get("/get-player-config-from-id", getPlayerConfigFromId);
router.get("/get-filter-id-from-params", getFilterIdFromParams);

router.post("/create-mapping", createMapping);
router.post("/delete-mapping", deleteMapping);

router.get("/", (req, res) => {
    res.status(200).json({ message: "Config Router" });
  });

export default router;