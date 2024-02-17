import { Router } from "express";
import { getCompanyEmployeesID, getCompanyProfile, getCompanyProjectsID, getProjectUsers, getUserProfile, getUserProjects, updateProjectAccess } from "../controllers/user.js";
import { createAppConfig, createPlayerConfig, getAppConfigFromId, getConfigsFromFilterId, getFilterIdFromParams, getPlayerConfigFromId, mapConfigsToFilter } from "../controllers/config.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

// USER BASED ROUTES
router.get("/get-company-employees", getCompanyEmployeesID);
router.get("/get-company-projects", getCompanyProjectsID);
router.get("/get-project-users", getProjectUsers);
router.get("/get-user-projects", getUserProjects);
router.get("/get-user-profile", getUserProfile);
router.get("/get-company-profile", getCompanyProfile);
router.post("/update-project-access", updateProjectAccess);

// CONFIG BASED ROUTES
router.get("/get-filter-id-from-params", getFilterIdFromParams);
router.get("/get-configs-from-filter-id", getConfigsFromFilterId);
router.get("/get-app-config-from-id", getAppConfigFromId);
router.get("/get-player-config-from-id", getPlayerConfigFromId);
router.post("/create-app-config", createAppConfig);
router.post("/create-player-config", createPlayerConfig);
router.post("/map-configs-to-filter", mapConfigsToFilter);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin Router" });
});

export default router;