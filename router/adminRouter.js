import { Router } from "express";
import {
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
  acceptJoinProjectRequest,
  rejectJoinProjectRequest,
  deleteProjectUser,
  changeAccess,
  updateFilters,
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
router.post("/company/invite", sendCompanyInvite);
router.get("/company/verify-invite", verifyCompanyInvite);
router.post('/company/update-filters', updateFilters);

// FOR PROJECT OWNERS
router.post("/add-project", addProject);
router.post("/project/deactivate", deactivateProject);
router.post("/update-project", updateProject);
router.post("/project/accept-request", acceptJoinProjectRequest);
router.post("/project/reject-request", rejectJoinProjectRequest);
router.post("/project/invite", sendProjectInvite);
router.post("/project/delete-user", deleteProjectUser);
router.post('/project/change-access', changeAccess);

// WHEN ANY COMPANY USER
router.post("/join-company", createJoinCompanyRequest);
router.post("/company/leave", leaveCompany);

// WHEN ANY PROJECT USER
router.post("/join-project", createJoinProjectRequest);
router.post("/project/leave", leaveProject);

router.get("/", (req, res) => {
  res.status(200).json({ message: "Admin Router" });
});

export default router;
