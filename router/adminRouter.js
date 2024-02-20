import { Router } from "express";
import { addCompany, addProject, getCompanyDetails, getProjectDetails, getAdminProjects, addAdminToProject } from "../controllers/admin.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

// USER BASED ROUTES
router.post("/add-company", addCompany);
router.post("/add-project", addProject);
router.post("/add-admin-to-project", addAdminToProject);
router.get("/get-company-details", getCompanyDetails);
router.get("/get-project-details", getProjectDetails);
router.get("/get-admin-projects", getAdminProjects);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin Router" });
});

export default router;