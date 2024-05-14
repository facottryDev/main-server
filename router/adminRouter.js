import { Router } from "express";
import {
  addAdminToProject,
  createJoinCompanyRequest,
  leaveCompany,
  createJoinProjectRequest,
  leaveProject,
  getJoinCompanyRequests,
  getJoinProjectRequests,
  acceptJoinCompanyRequest,
  sendCompanyInvite,
  sendProjectInvite,
  verifyCompanyInvite,
  addProject,
  addCompany,
  getAdmin,
} from "../controllers/admin.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

router.get("/get-admin", getAdmin);

// WHEN USER ADDS COMPANY/PROJECT
router.post("/add-company", addCompany);
router.post("/add-project", addProject);

// WHEN USER REQUESTS TO JOIN OR LEAVE COMPANY/PROJECT
router.post("/join-company", createJoinCompanyRequest);
router.get("/leave-company", leaveCompany);
router.post("/join-project", createJoinProjectRequest);
router.post("/leave-project", leaveProject);
router.get("/get-join-company-req", getJoinCompanyRequests);
router.get("/get-join-project-req", getJoinProjectRequests);
router.post("/accept-join-company-request", acceptJoinCompanyRequest);

// WHEN OWNER INVITES / REMOVES USERS
router.post("/add-admin-to-project", addAdminToProject);
router.post("/send-company-invite", sendCompanyInvite);
router.post("/send-project-invite", sendProjectInvite);
router.get("/invite/company", verifyCompanyInvite);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin Router" });
});

export default router;
