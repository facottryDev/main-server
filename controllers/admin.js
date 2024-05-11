import { generateID, sendMail } from "../lib/helpers.js";
import Company from "../models/company.js";
import Project from "../models/project.js";
import Admin from "../models/admin.js";

// ADD COMPANY - COMPANY OWNER
export const addCompany = async (req, res) => {
  try {
    const { name, address } = req.body;
    const owner = req.session.username;

    const companyID = generateID(name);

    // Check if company already exists
    const companyExists = await Company.findOne({
      owners: { $in: [owner] },
    });

    if (companyExists) {
      return res.status(400).json({
        message: "A Company already exists under this email",
        companyID: companyExists.companyID,
      });
    }

    // Create new company
    const newCompany = new Company({
      companyID,
      name,
      address,
      owners: [owner],
    });

    await newCompany.save();

    // Create / Update Admin document
    const admin = await Admin.findOne({ email: owner });
    if (admin) {
      admin.companyID = companyID;
      await admin.save();
    } else {
      const newAdmin = new Admin({
        email: owner,
        companyID,
      });
      await newAdmin.save();
    }

    res.status(200).json({ message: "Company added successfully", companyID });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

//ADD PROJECT - COMPANY OWNER
export const addProject = async (req, res) => {
  try {
    const { name, type } = req.body;
    const owner = req.session.username;

    const projectID = generateID(name);

    // Check if user is owner of the company
    const company = await Company.findOne({
      owners: { $in: [owner] },
    });

    if (!company) {
      return res
        .status(404)
        .json({ message: "No company found under this email" });
    }

    // Check if project already exists
    const projectExists = await Project.findOne({
      companyID: company.companyID,
      name,
    });
    if (projectExists) {
      return res.status(409).json({
        message: "A project with same name already exists",
        projectID: projectExists.projectID,
      });
    }

    // Create new project
    const newProject = new Project({
      projectID,
      name,
      type,
      companyID: company.companyID,
      owners: [owner],
    });

    await newProject.save();

    // Update company document
    company.projects.push(projectID);
    await company.save();

    // Update Admin document
    await Admin.updateOne(
      { email: owner },
      { $push: { projects: { projectID, role: "owner" } } }
    );

    res.status(200).json({ message: "Project added successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET YOUR COMPANY'S DETAILS - COMPANY OWNER
export const getCompanyDetails = async (req, res) => {
  try {
    const email = req.session.username;

    const result = await Company.findOne(
      { owners: { $in: [email] } },
      { _id: 0, __v: 0 }
    );

    if (!result) {
      return res.status(404).json({ message: "No company under this email" });
    }

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET A PROJECT'S DETAILS - PROJECT OWNER
export const getProjectDetails = async (req, res) => {
  try {
    const email = req.session.username;

    const { projectID } = req.query;
    const result = await Project.findOne(
      { projectID, owners: { $in: [email] } },
      {
        _id: 0,
        __v: 0,
      }
    );

    if (!result) {
      return res
        .status(404)
        .json({ message: "No Project Found / Access Denied" });
    }

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET ALL PROJECTS UNDER YOU - ANY ADMIN
export const getAdminProjects = async (req, res) => {
  try {
    const email = req.session.username;

    const result = await Project.find(
      {
        $or: [
          { owners: { $in: [email] } },
          { editors: { $in: [email] } },
          { viewers: { $in: [email] } },
        ],
      },
      {
        _id: 0,
        __v: 0,
      }
    );

    if (!result) {
      return res.status(404).json({ message: "No Projects found" });
    }

    const projects = result.map((project) => {
      let role = "";

      if (project.owners.includes(email)) {
        role = "owner";
      } else if (project.editors.includes(email)) {
        role = "editor";
      } else if (project.viewers.includes(email)) {
        role = "viewer";
      } else {
        role = null;
      }

      return {
        projectID: project.projectID,
        companyID: project.companyID,
        name: project.name,
        type: project.type,
        role,
      };
    });

    res.status(200).json(projects);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// MANUALLY ADD USER TO PROJECT - PROJECT OWNER
export const addAdminToProject = async (req, res) => {
  try {
    const { projectID, email, role } = req.body;
    const owner = req.session.username;

    const project = await Project.findOne({
      projectID,
    });

    // Check if project exists and user is owner
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.owners.includes(owner)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if given email exists in same company
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Email not registered" });
    }

    if (admin.companyID !== project.companyID) {
      return res
        .status(400)
        .json({ message: "User does not belong to same company" });
    }

    // Check if user already exists in project
    if (
      project.owners.includes(email) ||
      project.editors.includes(email) ||
      project.viewers.includes(email)
    ) {
      return res
        .status(400)
        .json({ message: `User already exists in project` });
    }

    // Update Project document
    project[role + "s"].push(email);
    await project.save();

    // Update User document
    await Admin.updateOne(
      { email },
      { $push: { projects: { projectID, role } } }
    );

    res.status(200).json({ message: "User added to project successfully" });
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// CREATE A JOIN REQUEST TO COMPANY - USER
export const createJoinCompanyRequest = async (req, res) => {
  try {
    const email = req.session.username;
    const { companyID } = req.body;

    // Check if user is already part of a company
    const isAdmin = await Company.findOne({
      $or: [{ owners: email }, { employees: email }],
    });

    if (isAdmin)
      return res.status(400).json({
        message: "You are already part of a company",
        companyID: isAdmin.companyID,
        role: isAdmin.owners.includes(email) ? "owner" : "employee",
      });

    // Check if the companyID exists
    const company = await Company.findOne({
      companyID,
    });

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

// GET ALL JOIN REQUESTS TO COMPANY - COMPANY OWNER
export const getJoinCompanyRequests = async (req, res) => {
  try {
    const email = req.session.username;

    const company = await Company.findOne({
      owners: { $in: [email] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json(company.joinRequests);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// ACCEPT JOIN REQUEST TO COMPANY - COMPANY OWNER
export const acceptJoinCompanyRequest = async (req, res) => {
  try {
    const owner = req.session.username;
    const { email } = req.body;

    const company = await Company.findOne({
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
    company.employees.push(email);
    company.joinRequests = company.joinRequests.filter(
      (request) => request !== email
    );
    await company.save();

    // Remove all join requests from user
    await Company.updateMany(
      { joinRequests: { $in: [email] } },
      { $pull: { joinRequests: email } }
    );

    // Create Admin document
    const admin = new Admin({
      email,
      companyID: company.companyID,
    });
    await admin.save();

    res.status(200).json({ message: "Request accepted successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// REJECT JOIN REQUEST TO COMPANY - COMPANY OWNER
export const rejectJoinCompanyRequest = async (req, res) => {
  try {
    const owner = req.session.username;
    const { email } = req.body;

    const company = await Company.findOne({
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

// LEAVE COMPANY - ADMIN
export const leaveCompany = async (req, res) => {
  try {
    const email = req.session.username;

    const company = await Company.findOne({
      $or: [{ owners: email }, { employees: email }],
    });

    // Check if user is part of any company
    if (!company) {
      return res
        .status(404)
        .json({ message: "You don't belong to any company" });
    }

    // Update Company document
    if (company.owners.includes(email)) {
      company.owners = company.owners.filter((owner) => owner !== email);
    } else {
      company.employees = company.employees.filter(
        (employee) => employee !== email
      );
    }
    await company.save();

    // Delete Admin document
    await Admin.deleteOne({ email });

    res.status(200).json({ message: "Left company successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CREATE A JOIN REQUEST TO PROJECT - ADMIN
export const createJoinProjectRequest = async (req, res) => {
  try {
    const email = req.session.username;
    const { projectID } = req.body;

    // Check if user is already part of this project
    const project = await Project.findOne({
      projectID,
      $or: [{ owners: email }, { editors: email }, { viewers: email }],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has already sent a request to this project
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

// GET ALL JOIN REQUESTS TO PROJECT - PROJECT OWNER
export const getJoinProjectRequests = async (req, res) => {
  try {
    const email = req.session.username;

    const project = await Project.findOne({
      owners: { $in: [email] },
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project.joinRequests);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// ACCEPT JOIN REQUEST TO PROJECT FROM USER - PROJECT OWNER
export const acceptJoinProjectRequest = async (req, res) => {
  try {
    const owner = req.session.username;
    const { email, projectID } = req.body;

    const project = await Project.findOne({
      projectID,
    });

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
    project.viewers.push(email);
    project.joinRequests = project.joinRequests.filter(
      (request) => request !== email
    );
    await project.save();

    // Update Admin document
    await Admin.updateOne(
      { email },
      { $push: { projects: { projectID, role: "viewer" } } }
    );

    res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// REJECT JOIN REQUEST TO PROJECT FROM USER - PROJECT OWNER
export const rejectJoinProjectRequest = async (req, res) => {
  try {
    const owner = req.session.username;
    const { email, projectID } = req.body;

    const project = await Project.findOne({
      projectID,
    });

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
    const email = req.session.username;
    const { projectID } = req.body;

    const project = await Project.findOne({
      projectID,
      $or: [{ owners: email }, { editors: email }, { viewers: email }],
    });

    // Check if project exists and user is part of it
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update Project document
    project.owners = project.owners.filter((owner) => owner !== email);
    project.editors = project.editors.filter((editor) => editor !== email);
    project.viewers = project.viewers.filter((viewer) => viewer !== email);
    await project.save();

    // Update Admin document
    await Admin.updateOne({ email }, { $pull: { projects: { projectID } } });

    res.status(200).json({ message: "Left project successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// INVITE USER TO JOIN COMPANY USING INVITE LINK - COMPANY OWNER
export const sendCompanyInvite = async (req, res) => {
  try {
    const owner = req.session.username;
    const { email } = req.body;

    const company = await Company.findOne({
      owners: { $in: [owner] },
    });

    // Check if company exists for the owner
    if (!company) {
      return res.status(404).json({ message: "You don't own any company" });
    }

    // Check if user is already part of the company
    if (company.owners.includes(email) || company.employees.includes(email)) {
      return res.status(400).json({
        message: "User already part of this company",
        role: company.owners.includes(email) ? "owner" : "employee",
      });
    }

    // Send email to user
    const inviteCode = generateID(company.name + "_invite");
    const inviteLink = `http://localhost:3000/invite/${inviteCode}`;

    // Add invite to company document
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
    res.status(200).json({ message: "Invitation sent successfully (MAIL DISABLED FOR DEMO)", inviteLink });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// INVITE USER TO JOIN PROJECT USING INVITE LINK - PROJECT OWNER
export const sendProjectInvite = async (req, res) => {
  try {
    const owner = req.session.username;
    const { email, projectID } = req.body;

    const project = await Project.findOne({
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
    res
      .status(200)
      .json({
        message: "Invitation sent successfully (MAIL DISABLED FOR DEMO)",
        inviteLink,
      });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
