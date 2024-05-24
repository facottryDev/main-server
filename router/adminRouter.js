import { Router } from "express";
import {
  addAdminToProject,
  createJoinCompanyRequest,
  leaveCompany,
  createJoinProjectRequest,
  leaveProject,
  acceptJoinCompanyRequest,
  sendCompanyInvite,
  sendProjectInvite,
  verifyCompanyInvite,
  addProject,
  addCompany,
  getAdmin,
  deactivateCompany,
  deactivateProject,
  updateCompany,
  updateProject,
  rejectJoinCompanyRequest,
  deleteEmployee,
} from "../controllers/admin.js";
import { isAuth } from "../lib/middlewares.js";
const router = Router();

router.use(isAuth);

router.get("/get-admin", getAdmin);

// FOR COMPANY OWNERS
router.post("/company/create", addCompany);
router.delete("/company/deactivate", deactivateCompany);
router.post("/company/update", updateCompany);
router.post("/company/accept-request", acceptJoinCompanyRequest);
router.post("/company/reject-request", rejectJoinCompanyRequest);
router.post("/company/delete-employee", deleteEmployee);

// FOR PROJECT OWNERS
router.post("/add-project", addProject);
router.delete("/deactivate-project", deactivateProject);
router.post("/update-project", updateProject);

// WHEN USER REQUESTS TO JOIN OR LEAVE COMPANY/PROJECT
router.post("/join-company", createJoinCompanyRequest);
router.get("/company/leave", leaveCompany);
router.post("/join-project", createJoinProjectRequest);
router.post("/leave-project", leaveProject);

// WHEN OWNER INVITES / REMOVES USERS
router.post("/add-admin-to-project", addAdminToProject);
router.post("/send-company-invite", sendCompanyInvite);
router.post("/send-project-invite", sendProjectInvite);
router.get("/invite/company", verifyCompanyInvite);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin Router" });
});

export default router;
