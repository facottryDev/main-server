import { generateID, sendMail } from "../lib/helpers.js";
import Company from "../models/company.js";
import Project from "../models/project.js";
import Admin from "../models/admin.js";

// GET ADMIN INFO
export const getAdmin = async (req, res) => {
  try {
    const email = req.session.username;

    const company = await Company.findOne({
      $or: [{ owners: email }, { employees: email }],
    });

    const projects = await Project.find({
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
      owners: project.owners.includes(email) ? project.owners : [],
      editors: project.editors.includes(email) ? project.editors : [],
      viewers: project.viewers.includes(email) ? project.viewers : [],
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
    const email = req.session.username;

    // Check if company already exists
    const companyExists = await Company.findOne({
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
    const owner = req.session.username;

    const company = await Company.findOne({
      owners: { $in: [owner] },
    });

    // Check if company exists
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update the status of all projects
    await Project.updateMany(
      { companyID: company.companyID },
      { status: "inactive" }
    );

    // Update the status of the company
    company.status = "inactive";
    await company.save();

    res.status(200).json({ message: "Company deactivated successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// UPDATE COMPANY - COMPANY OWNER
export const updateCompany = async (req, res) => {
  try {
    const owner = req.session.username;
    const { name, address } = req.body;

    const company = await Company.findOne({
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
      type,
    });

    if (projectExists) {
      return res.status(409).json({
        message: "A project with same configuration already exists",
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
    const owner = req.session.username;
    const { projectID } = req.body;

    const project = await Project.findOne({
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
export const updateProject = async (req, res) => {
  try {
    const owner = req.session.username;
    const { companyID, projectID, name, type } = req.body;

    const projectExists = await Project.findOne({
      companyID,
      name,
      type,
    });
    
    if (projectExists) {
      return res.status(409).json({
        message: "A project with same configuration already exists in the company",
      });
    }

    const project = await Project.findOne({
      projectID
    });

    if(!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if(!project.owners.includes(owner)) {
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

// CREATE A JOIN REQUEST TO PROJECT - ADMIN
export const createJoinProjectRequest = async (req, res) => {
  try {
    const email = req.session.username;
    const { projectID } = req.body;

    // Check if user is in a company
    const company = await Company.findOne({
      $or: [{ owners: email }, { employees: email }],
    });

    if (!company) {
      return res.status(403).json({
        code: "NO_COMPANY",
        message: "You don't belong to any company",
      });
    }

    // Check if project exists
    const project = await Project.findOne({
      projectID,
    });

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
    company.owners = company.owners.filter((owner) => owner !== email);
    company.employees = company.employees.filter(
      (employee) => employee !== email
    );
    await company.save();

    // Update projects of the user
    await Project.updateMany(
      { companyID: company.companyID },
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
    const { employees } = req.body;

    // Check if company exists for the owner
    const company = await Company.findOne({
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
      activeInvites: { $in: [inviteCode] },
    });

    if (!company) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

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
    res.status(200).json({
      message: "Invitation sent successfully (MAIL DISABLED FOR DEMO)",
      inviteLink,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
