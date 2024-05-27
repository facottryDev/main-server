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
  getMapping,
  cloneConfig,
} from "../controllers/config.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

router.post("/add-app-config", addAppConfig);
router.post("/add-player-config", addPlayerConfig);
router.delete("/delete", deleteConfig);
router.post("/update", modifyConfig);
router.post("/clone", cloneConfig);
router.get("/get-app-configs", getAllAppConfigs);
router.get("/get-player-configs", getAllPlayerConfigs);

router.post("/create-mapping", createMapping);
router.post("/delete-mapping", deleteMapping);
router.post("/get-mapping", getMapping);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Config Router" });
});

export default router;
