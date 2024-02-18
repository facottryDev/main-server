import { Router } from "express";
import { addCompany, addProject, getCompanyDetails, getProjectDetails, getAdminProjects, addAdminToProject } from "../controllers/admin.js";
import { createAppConfig, createPlayerConfig, getAppConfigFromId, getConfigsFromFilterId, getFilterIdFromParams, getPlayerConfigFromId, mapConfigsToFilter } from "../controllers/config.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

// USER BASED ROUTES
router.post("/add-company", addCompany);
router.post("/add-project", addProject);
router.get("/get-company-details", getCompanyDetails);
router.get("/get-project-details", getProjectDetails);
router.get("/get-admin-projects", getAdminProjects);
router.post("/add-admin-to-project", addAdminToProject);

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