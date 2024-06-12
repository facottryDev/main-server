import { generateID, sendMail } from "../lib/helpers.js";
import Company from "../models/company.js";
import Project from "../models/project.js";
import AppConfig from "../models/appConfig.js";
import PlayerConfig from "../models/playerConfig.js";

// GET ADMIN INFO
export const getAdmin = async (req, res) => {
  try {
    const email = req.session.username || req.user.email;

    const company = await Company.findOne({
      status: "active",
      $or: [{ owners: email }, { employees: email }],
    });

    const projects = await Project.find({
      status: "active",
      $or: [{ owners: email }, { editors: email }, { viewers: email }],
    });

    if (!company) {
      return res.status(403).json({
        code: "NO_COMPANY",
        message: "You are not part of any company",
      });
    }

    const companyDetails = {
      companyID: company.companyID,
      name: company.name,
      address: company.address,
      role: company.owners.includes(email) ? "owner" : "employee",
      joinRequests: company.owners.includes(email) ? company.joinRequests : [],
      activeInvites: company.owners.includes(email)
        ? company.activeInvites
        : [],
      owners: company.owners,
      employees: company.owners.includes(email) ? company.employees : [],
    };

    if (!projects.length) {
      return res.status(403).json({
        code: "NO_PROJECT",
        message: "You are not part of any project",
        company: companyDetails,
      });
    }

    const projectDetails = projects.map((project) => ({
      projectID: project.projectID,
      name: project.name,
      type: project.type,
      role: project.owners.includes(email)
        ? "owner"
        : project.editors.includes(email)
        ? "editor"
        : "viewer",
      joinRequests: project.owners.includes(email) ? project.joinRequests : [],
      activeInvites: project.owners.includes(email)
        ? project.activeInvites
        : [],
      owners: project.owners,
      editors: project.owners.includes(email) ? project.editors : [],
      viewers: project.owners.includes(email) ? project.viewers : [],
      filters: project.filters,
    }));

    return res
      .status(200)
      .json({ company: companyDetails, projects: projectDetails });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ADD COMPANY - COMPANY OWNER
export const addCompany = async (req, res) => {
  try {
    const { name, address } = req.body;
    const email = req.session.username || req.user.email;

    // Check if company already exists
    const companyExists = await Company.findOne({
      status: "active",
      owners: { $in: [email] },
    });

    if (companyExists) {
      return res.status(400).json({
        message: "A Company already exists under this email",
        companyID: companyExists.companyID,
      });
    }

    // Create new company
    const companyID = generateID(name);

    const newCompany = new Company({
      companyID,
      name,
      address,
      owners: [email],
    });

    const company = await newCompany.save();

    const companyDetails = {
      companyID: company.companyID,
      name: company.name,
      address: company.address,
      role: company.owners.includes(email) ? "owner" : "employee",
      joinRequests: company.owners.includes(email) ? company.joinRequests : [],
      activeInvites: company.owners.includes(email)
        ? company.activeInvites
        : [],
      owners: company.owners.includes(email) ? company.owners : [],
      employees: company.employees.includes(email) ? company.employees : [],
    };

    return res
      .status(200)
      .json({ message: "Company added successfully", company: companyDetails });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// DEACTIVATE COMPANY - COMPANY OWNER
export const deactivateCompany = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;

    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update the status of all projects under the company and return projectIDs
    const projects = await Project.updateMany(
      { status: "active", companyID: company.companyID },
      { status: "inactive" }
    );

    // Update the status of all appConfigs under the company
    await AppConfig.updateMany(
      { status: "active", companyID: company.companyID },
      { status: "inactive" }
    );

    // Update the status of all playerConfigs under the company
    await PlayerConfig.updateMany(
      { status: "active", companyID: company.companyID },
      { status: "inactive" }
    );

    // Update the status of the company
    company.status = "inactive";
    await company.save();

    res.status(200).json({ message: "Company deactivated successfully" });
  } catch (error) {
    return res.status(500).send(error);
  }
};

// UPDATE COMPANY - COMPANY OWNER
export const updateCompanyDetails = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { name, address } = req.body;

    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update the company details
    company.name = name;
    company.address = address;
    await company.save();

    res.status(200).json({ message: "Company updated successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// DELETE EMPLOYEE FROM COMPANY - COMPANY OWNER
export const deleteEmployee = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email } = req.body;

    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if user exists in the company
    if (!company.employees.includes(email)) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update Company document
    company.employees = company.employees.filter(
      (employee) => employee !== email
    );
    await company.save();

    // Update Project document
    await Project.updateMany(
      { status: "active", companyID: company.companyID },
      {
        $pull: {
          owners: email,
          editors: email,
          viewers: email,
          joinRequests: email,
          activeInvites: email,
        },
      }
    );

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

//ADD PROJECT - COMPANY OWNER
export const addProject = async (req, res) => {
  try {
    const { name, type } = req.body;
    const owner = req.session.username || req.user.email;

    const projectID = generateID(name);

    // Check if user is owner of the company
    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    if (!company) {
      return res
        .status(404)
        .json({ message: "No company found under this email" });
    }

    // Check if project already exists
    const projectExists = await Project.findOne({
      status: "active",
      companyID: company.companyID,
      name,
      type,
    });

    if (projectExists) {
      return res.status(409).json({
        message: "A project with same configuration already exists",
        projectID: projectExists.projectID,
      });
    }

    // Add default filters
    const filters = {
      COUNTRY: { default: "IN", values: ["IN"] },
      SUBSCRIPTION: { default: "FREE", values: ["FREE"] },
    };

    // Create new project
    const newProject = new Project({
      projectID,
      name,
      type,
      companyID: company.companyID,
      owners: [owner],
      filters,
    });

    await newProject.save();

    const projectDetails = {
      projectID: newProject.projectID,
      name: newProject.name,
      type: newProject.type,
      role: "owner",
      joinRequests: [],
      activeInvites: [],
      owners: [owner],
      editors: [],
      viewers: [],
    };

    res
      .status(200)
      .json({ message: "Project added successfully", project: projectDetails });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

//DEACTIVATE PROJECT - PROJECT OWNER
export const deactivateProject = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { projectID } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update the status of the project
    project.status = "inactive";
    await project.save();

    res.status(200).json({ message: "Project deactivated successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// UPDATE PROJECT - PROJECT OWNER
export const updateProjectDetails = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { companyID, projectID, name, type } = req.body;

    const projectExists = await Project.findOne({
      status: "active",
      companyID,
      name,
      type,
    });

    if (projectExists) {
      return res.status(409).json({
        message:
          "A project with same configuration already exists in the company",
      });
    }

    const project = await Project.findOne({ status: "active", projectID });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.owners.includes(owner)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    project.name = name;
    project.type = type;
    await project.save();

    res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// DELETE USER FROM PROJECT - PROJECT OWNER
export const deleteProjectUser = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email, projectID } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user exists in the project
    if (
      !project.owners.includes(email) &&
      !project.editors.includes(email) &&
      !project.viewers.includes(email)
    ) {
      return res.status(404).json({ message: "User not found in project" });
    }

    if (project.owners.includes(email) && project.owners.length === 1) {
      return res.status(400).json({
        message:
          "You are the only owner of this project. Transfer ownership before leaving.",
      });
    }

    // Update Project document
    project.owners = project.owners.filter((owner) => owner !== email);
    project.editors = project.editors.filter((editor) => editor !== email);
    project.viewers = project.viewers.filter((viewer) => viewer !== email);
    await project.save();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CHANGE ACCESS RIGHT OF USER IN PROJECT - PROJECT OWNER
export const changeAccess = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email, projectID, role } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user exists in the project
    if (
      !project.owners.includes(email) &&
      !project.editors.includes(email) &&
      !project.viewers.includes(email)
    ) {
      return res.status(404).json({ message: "User not found in project" });
    }

    if (project.owners.includes(email) && project.owners.length === 1) {
      return res.status(400).json({
        message:
          "You are the only owner of this project. Make someone else owner before changing.",
      });
    }

    // Update Project document
    project.owners = project.owners.filter((owner) => owner !== email);
    project.editors = project.editors.filter((editor) => editor !== email);
    project.viewers = project.viewers.filter((viewer) => viewer !== email);

    role === "owner" && project.owners.push(email);
    role === "editor" && project.editors.push(email);
    role === "viewer" && project.viewers.push(email);

    await project.save();

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CREATE A JOIN REQUEST TO COMPANY - USER
export const createJoinCompanyRequest = async (req, res) => {
  try {
    const email = req.session.username || req.user.email;
    const { companyID } = req.body;

    // Check if user is already part of a company
    const isAdmin = await Company.findOne({
      status: "active",
      $or: [{ owners: email }, { employees: email }],
    });

    if (isAdmin)
      return res.status(400).json({
        message: "You are already part of a company",
        companyID: isAdmin.companyID,
        role: isAdmin.owners.includes(email) ? "owner" : "employee",
      });

    // Check if the companyID exists
    const company = await Company.findOne({ status: "active", companyID });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if user has already sent a request
    if (company.joinRequests.includes(email))
      return res.status(400).json({ message: "Request already exists" });

    // Update Company document
    company.joinRequests.push(email);
    await company.save();

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// ACCEPT JOIN REQUEST TO COMPANY - COMPANY OWNER
export const acceptJoinCompanyRequest = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email } = req.body;

    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "You don't own any company" });
    }

    // Check if user has sent a request
    if (!company.joinRequests.includes(email)) {
      return res.status(404).json({ message: "No request found from user" });
    }

    const isAdmin = await Company.findOne({
      status: "active",
      $or: [{ owners: email }, { employees: email }],
    });

    if (isAdmin) {
      return res.status(400).json({
        message: "User is already part of another company",
      });
    }

    // Update Company document
    company.employees.push(email);
    company.joinRequests = company.joinRequests.filter(
      (request) => request !== email
    );
    await company.save();

    // Remove all join requests from user
    await Company.updateMany(
      { status: "active", joinRequests: { $in: [email] } },
      { $pull: { joinRequests: email } }
    );

    res.status(200).json({ message: "Request accepted." });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// REJECT JOIN REQUEST TO COMPANY - COMPANY OWNER
export const rejectJoinCompanyRequest = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email } = req.body;

    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "You don't own any company" });
    }

    // Check if user has sent a request
    if (!company.joinRequests.includes(email)) {
      return res.status(404).json({ message: "No request found from user" });
    }

    // Update Company document
    company.joinRequests = company.joinRequests.filter(
      (request) => request !== email
    );
    await company.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CREATE A JOIN REQUEST TO PROJECT - ADMIN
export const createJoinProjectRequest = async (req, res) => {
  try {
    const email = req.session.username || req.user.email;
    const { projectID } = req.body;

    // Check if user is in a company
    const company = await Company.findOne({
      status: "active",
      $or: [{ owners: email }, { employees: email }],
    });

    if (!company) {
      return res.status(403).json({
        code: "NO_COMPANY",
        message: "You don't belong to any company",
      });
    }

    // Check if project exists
    const project = await Project.findOne({ status: "active", projectID });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user's company is same as project's company
    if (project.companyID !== company.companyID) {
      return res.status(403).json({
        code: "DIFFERENT_COMPANY",
        message: "This project does not belong to the your company",
      });
    }

    // Check if user is already part of the project
    if (
      project.owners.includes(email) ||
      project.editors.includes(email) ||
      project.viewers.includes(email)
    ) {
      return res.status(400).json({
        message: "You are already part of this project",
        role: project.owners.includes(email)
          ? "owner"
          : project.editors.includes(email)
          ? "editor"
          : "viewer",
      });
    }

    // Check if user has already sent a request
    if (project.joinRequests.includes(email))
      return res.status(400).json({ message: "Request already exists" });

    // Update Project document
    project.joinRequests.push(email);
    await project.save();

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// LEAVE COMPANY - ADMIN
export const leaveCompany = async (req, res) => {
  try {
    const email = req.session.username || req.user.email;

    const company = await Company.findOne({
      status: "active",
      $or: [{ owners: email }, { employees: email }],
    });

    // Check if user is part of any company
    if (!company) {
      return res
        .status(404)
        .json({ message: "You don't belong to any company" });
    }

    // Check if user is the only owner of the company
    if (company.owners.length === 1 && company.owners.includes(email)) {
      return res.status(400).json({
        message:
          "You are the only owner of this company. Transfer ownership before leaving.",
      });
    }

    // Update Company document
    company.owners = company.owners.filter((owner) => owner !== email);
    company.employees = company.employees.filter(
      (employee) => employee !== email
    );
    await company.save();

    // Update projects of the user
    await Project.updateMany(
      { status: "active", companyID: company.companyID },
      {
        $pull: {
          owners: email,
          editors: email,
          viewers: email,
          joinRequests: email,
          activeInvites: email,
        },
      }
    );

    res.status(200).json({ message: "Success!" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// ACCEPT JOIN REQUEST TO PROJECT FROM USER - PROJECT OWNER
export const acceptJoinProjectRequest = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email, projectID, role } = req.body;

    switch (true) {
      case !role:
        return res.status(400).json({ message: "Role not provided" });
      case !["owner", "editor", "viewer"].includes(role):
        return res.status(400).json({ message: "Invalid role" });
      case !email:
        return res.status(400).json({ message: "Email not provided" });
      case !projectID:
        return res.status(400).json({ message: "Project ID not provided" });
    }

    const project = await Project.findOne({ status: "active", projectID });

    // Check if project exists and user is owner
    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner):
        return res.status(401).json({
          message: "Unauthorized. You are not the owner of this project",
        });
    }

    // Check if user has sent a request
    if (!project.joinRequests.includes(email)) {
      return res.status(404).json({ message: "No request found from user" });
    }

    // Update Project document
    role === "owner" && project.owners.push(email);
    role === "editor" && project.editors.push(email);
    role === "viewer" && project.viewers.push(email);
    project.joinRequests = project.joinRequests.filter(
      (request) => request !== email
    );
    await project.save();

    res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// REJECT JOIN REQUEST TO PROJECT FROM USER - PROJECT OWNER
export const rejectJoinProjectRequest = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email, projectID } = req.body;

    const project = await Project.findOne({ status: "active", projectID });

    // Check if project exists and user is owner
    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner):
        return res.status(401).json({
          message: "Unauthorized. You are not the owner of this project",
        });
    }

    // Check if user has sent a request
    if (!project.joinRequests.includes(email)) {
      return res.status(404).json({ message: "No request found from user" });
    }

    // Update Project document
    project.joinRequests = project.joinRequests.filter(
      (request) => request !== email
    );
    await project.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// LEAVE PROJECT - ADMIN
export const leaveProject = async (req, res) => {
  try {
    const email = req.session.username || req.user.email;
    const { projectID } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      $or: [{ owners: email }, { editors: email }, { viewers: email }],
    });

    // Check if project exists and user is part of it
    if (!project) {
      return res.status(404).json({ message: "No matching project" });
    }

    // Check if user is the only owner of the project
    if (project.owners.length === 1 && project.owners.includes(email)) {
      return res.status(400).json({
        message:
          "You are the only owner of this project. Transfer ownership before leaving.",
      });
    }

    // Update Project document
    project.owners = project.owners.filter((owner) => owner !== email);
    project.editors = project.editors.filter((editor) => editor !== email);
    project.viewers = project.viewers.filter((viewer) => viewer !== email);
    await project.save();

    res.status(200).json({ message: "Left project successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// INVITE USER TO JOIN COMPANY USING INVITE LINK - COMPANY OWNER
export const sendCompanyInvite = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { employees } = req.body;

    // Check if company exists for the owner
    const company = await Company.findOne({
      status: "active",
      owners: { $in: [owner] },
    });

    if (!company) {
      return res.status(404).json({ message: "You don't own any company" });
    }

    // Create array of employees from comma separated string
    const employeesArray = employees.split(",").map((email) => email.trim());

    const promises = employeesArray.map(async (email) => {
      // Generate Invite for each employee
      const inviteCode = generateID(company.name + "_invite_" + email);
      const inviteLink = `${process.env.SERVER_URL}/admin/invite/company/${inviteCode}`;

      company.activeInvites.push(inviteCode);
      await company.save();

      // Send Email
      const mailOptions = {
        from: " " + process.env.EMAIL,
        to: email,
        subject: `Invitation to join ${company.name}`,
        html: `<p>You have been invited to join ${company.name}.</p>
                <p>Click <a href="${inviteLink}">here</a> to join.</p>`,
      };

      // await sendMail(mailOptions);
    });

    await Promise.all(promises);

    return res.status(200).json({
      message: "Invitation sent successfully (MAIL DISABLED FOR DEMO)",
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// VERIFY INVITE & JOIN COMPANY
export const verifyCompanyInvite = async (req, res) => {
  try {
    const { inviteCode } = req.query;

    const company = await Company.findOne({
      status: "active",
      activeInvites: { $in: [inviteCode] },
    });

    if (!company) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    // Check if user is already part of a company
    const isAdmin = await Company.findOne({
      status: "active",
      $or: [{ owners: email }, { employees: email }],
    });

    if (isAdmin)
      return res.status(400).json({
        message: "You are already part of a company",
        companyID: isAdmin.companyID,
        role: isAdmin.owners.includes(email) ? "owner" : "employee",
      });

    // Update Company document
    company.employees.push(email);

    res.status(200).json({ message: "Joined company successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// INVITE USER TO JOIN PROJECT USING INVITE LINK - PROJECT OWNER
export const sendProjectInvite = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { email, projectID } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "You don't own this project" });
    }

    const isOwner = project.owners.includes(email);
    const isEditor = project.editors.includes(email);
    const isViewer = project.viewers.includes(email);

    // Check if user is already part of the project
    if (isOwner || isEditor || isViewer) {
      return res.status(400).json({
        message: "User already part of this project",
        role: isOwner ? "owner" : isEditor ? "editor" : "viewer",
      });
    }

    // Check if email exists in the company
    const IssameCompany = await Company.findOne({
      status: "active",
      companyID: project.companyID,
      $or: [{ owners: email }, { employees: email }],
    });

    if (!IssameCompany) {
      return res.status(400).json({
        message: "Email does not belong to the same company",
      });
    }

    // Send email to user
    const inviteCode = generateID(project.name + "_invite");
    const inviteLink = `http://localhost:3000/invite/${inviteCode}`;

    // Send Email
    const mailOptions = {
      from: " " + process.env.EMAIL,
      to: email,
      subject: `Invitation to join ${project.name}`,
      html: `<p>You have been invited to join ${project.name}.</p>
              <p>Click <a href="${inviteLink}">here</a> to join.</p>`,
    };

    // await sendMail(mailOptions);
    res.status(200).json({
      message: "Invitation sent successfully (MAIL DISABLED FOR DEMO)",
      inviteLink,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// DELETE ADMIN ACCOUNT BY CALLING LEAVE COMPANY & LEAVE PROJECT
export const deleteAdmin = async (req, res) => {
  try {
    // Leave Company
    await leaveCompany(req, res);

    // Leave All Projects
    const email = req.session.username || req.user.email;
    const projects = await Project.find({
      status: "active",
      $or: [{ owners: email }, { editors: email }, { viewers: email }],
    });

    const promises = projects.map(async (project) => {
      const body = { projectID: project.projectID };
      await leaveProject({ body }, res);
    });

    await Promise.all(promises);
    return;
  } catch (error) {
    return error;
  }
};

// ADD FILTER TO THE PROJECT - PROJECT OWNER
export const addFilter = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { projectID, filter } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if filter.name exist as a key in project.filters
    if (project.filters[filter.name]) {
      return res.status(409).json({ message: "Filter already exists" });
    }

    // Check if default value is present in values
    if (!filter.values.includes(filter.default)) {
      return res.status(400).json({ message: "Default value not in values" });
    }

    // Add filter to project
    project.filters[filter.name] = {
      default: filter.default,
      values: filter.values,
    };

    project.markModified('filters');

    await project.save();
    res.status(200).json({ message: "Filter added successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// UPDATE A FILTER OF THE FILTERS OF A PROJECT - PROJECT OWNER
export const updateFilter = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { projectID, filter } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if filter exists
    const filterExists = Object.keys(project.filters).includes(filter.name);

    if (!filterExists) {
      return res.status(404).json({ message: "Filter not found" });
    }

    // Update filter details
    project.filters[filter.name] = {
      default: filter.default,
      values: filter.values,
    };

    project.markModified('filters');

    await project.save();
    res.status(200).json({ message: "Filter updated successfully" });
  } catch (error) {
    console.log(error.message)
    return res.status(500).send(error.message);
  }
};

// DELETE A FILTER FROM THE FILTERS OF A PROJECT - PROJECT OWNER
export const deleteFilter = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { projectID, filterName } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if filter exists
    const filterExists = project.filters.find((f) => f.name === filterName);

    if (!filterExists) {
      return res.status(404).json({ message: "Filter not found" });
    }

    // Remove filter from filters array
    project.filters = project.filters.filter((f) => f.name !== filterName);
    await project.save();
    res.status(200).json({ message: "Filter deleted successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CLONE PROJECT - PROJECT OWNER
export const cloneProject = async (req, res) => {
  try {
    const owner = req.session.username || req.user.email;
    const { projectID, name } = req.body;

    const project = await Project.findOne({
      status: "active",
      projectID,
      owners: { $in: [owner] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if project with same name exists
    const projectExists = await Project.findOne({
      status: "active",
      companyID: project.companyID,
      name,
    });

    if (projectExists) {
      return res.status(409).json({
        message: "A project with same name already exists in the company",
      });
    }

    // Clone project
    const clonedProject = new Project({
      projectID: generateID(name),
      name,
      type: project.type,
      companyID: project.companyID,
      owners: [owner],
      filters: project.filters,
    });

    await clonedProject.save();

    // Clone appConfigs, playerConfigs and masters from the original project
    const appConfigs = await AppConfig.find({
      status: "active",
      projectID,
    });

    const playerConfigs = await PlayerConfig.find({
      status: "active",
      projectID,
    });

    const masters = await Master.find({
      status: "active",
      projectID,
    });

    const promises = appConfigs.map(async (appConfig) => {
      const clonedAppConfig = new AppConfig({
        ...appConfig.toObject(),
        projectID: clonedProject.projectID,
      });
      await clonedAppConfig.save();
    });

    await Promise.all(promises);

    const promises2 = playerConfigs.map(async (playerConfig) => {
      const clonedPlayerConfig = new PlayerConfig({
        ...playerConfig.toObject(),
        projectID: clonedProject.projectID,
      });
      await clonedPlayerConfig.save();
    });

    await Promise.all(promises2);

    const promises3 = masters.map(async (master) => {
      const clonedMaster = new Master({
        ...master.toObject(),
        projectID: clonedProject.projectID,
      });
      await clonedMaster.save();
    });

    await Promise.all(promises3);
    res.status(200).json({ message: "Project cloned successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
