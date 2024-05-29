import { Router } from "express";
import {
  addAppConfig,
  addPlayerConfig,
  createMapping,
  deleteMapping,
  getAllAppConfigs,
  getAllPlayerConfigs,
  deleteConfig,
  modifyConfig,
  cloneConfig,
  getActiveMapping,
  getMappingScale,
  getAllMappings,
} from "../controllers/config.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

router.post("/add-app-config", addAppConfig);
router.post("/add-player-config", addPlayerConfig);
router.get("/get-app-configs", getAllAppConfigs);
router.get("/get-player-configs", getAllPlayerConfigs);
router.delete("/delete", deleteConfig);
router.post("/update", modifyConfig);
router.post("/clone", cloneConfig);
router.post("/create-mapping", createMapping);
router.post("/delete-mapping", deleteMapping);
router.post("/mapping/active", getActiveMapping);
router.post("/mapping/all", getAllMappings);
router.post("/mapping/scale", getMappingScale);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Config Router" });
});

export default router;
