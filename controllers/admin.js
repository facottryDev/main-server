import { generateID } from "../lib/helpers.js";
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
      return res.status(409).json({ message: "A project with same name already exists", projectID: projectExists.projectID });
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

    const result = await Project.find({
      $or: [
        { owners: { $in: [email] } },
        { editors: { $in: [email] } },
        { viewers: { $in: [email] } },
      ],
    }, {
      _id: 0,
      __v: 0,
    });

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
      projectID
    });

    // Check if project exists and user is owner
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found" });
    }

    if (!project.owners.includes(owner)) {
      return res
        .status(401)
        .json({ message: "Unauthorized" });
    }

    // Check if given email exists in same company
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Email not registered" });
    }

    if (admin.companyID !== project.companyID) {
      return res.status(400).json({ message: "User does not belong to same company" });
    }

    // Check if user already exists in project
    if (project.owners.includes(email) || project.editors.includes(email) || project.viewers.includes(email)){
      return res.status(400).json({ message: `User already exists in project` });
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