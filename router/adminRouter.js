import { Router } from "express";
import {
  addCompany,
  addProject,
  getCompanyDetails,
  getProjectDetails,
  getAdminProjects,
  addAdminToProject,
  createJoinCompanyRequest,
  leaveCompany,
  createJoinProjectRequest,
  leaveProject,
  getJoinCompanyRequests,
  getJoinProjectRequests,
  acceptJoinCompanyRequest,
  sendCompanyInvite
} from "../controllers/admin.js";
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

router.post("/join-company-req", createJoinCompanyRequest);
router.get("/leave-company", leaveCompany);
router.post("/join-project-req", createJoinProjectRequest);
router.post("/leave-project", leaveProject);
router.get("/get-join-company-req", getJoinCompanyRequests);
router.get("/get-join-project-req", getJoinProjectRequests);
router.post("/accept-join-company-request", acceptJoinCompanyRequest);

router.post("/send-company-invite", sendCompanyInvite);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin Router" });
});

export default router;
