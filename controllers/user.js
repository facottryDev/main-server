import { generateID } from "../lib/helpers.js";
import Company from "../models/company.js";
import Project from "../models/project.js";
import User from "../models/user.js";

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
    const projectExists = company.projects.includes(projectID);
    if (projectExists) {
      return res.status(400).json({ message: "Project already exists" });
    }

    // Create new project
    const newProject = new Project({
      projectID,
      name,
      type,
      companyID: company.companyID,
      owner,
    });

    await newProject.save();

    // Update company document
    company.projects.push(projectID);
    await company.save();

    res.status(200).json({ message: "Project added successfully" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET COMPANY PROFILE - COMPANY OWNER
export const getCompanyProfile = async (req, res) => {
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

// FETCH ALL USERS OF A PROJECT - PROJECT OWNER
export const getProjectUsers = async (req, res) => {
  try {
    const email = req.session.username;

    const { projectID } = req.query;
    const result = await Project.findOne(
      { projectID, owners: { $in: [email] } },
      {
        companyID: 1,
        owners: 1,
        editors: 1,
        viewers: 1,
        _id: 0,
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

// UPDATE PROJECT ACCESS - PROJECT OWNER
export const updateProjectAccess = async (req, res) => {
  try {
    const { projectID, email, role } = req.body;
    const owner = req.session.username;

    const project = await Project.findOne({
      projectID,
      owners: { $in: [owner] },
    });

    if (!project) {
      return res.status(404).json({ message: "No Project Found / Access Denied" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("user", user);

    // Check if company is same
    if (user.companyID !== project.companyID) {
      return res
        .status(400)
        .json({ message: "User and project are not in the same company" });
    }

    // Check if user is already added to project
    if (project.owner === email) {
      return res.status(400).json({ message: "Email already exists as owner" });
    }
    if (project.editors.includes(email)) {
      return res
        .status(400)
        .json({ message: "Email already exists as editor" });
    }
    if (project.viewers.includes(email)) {
      return res
        .status(400)
        .json({ message: "Email already exists as viewer" });
    }

    // Add user to project
    if (role === "owner") {
      project.owner = email;
    } else if (role === "editor") {
      project.editors.push(email);
    } else {
      project.viewers.push(email);
    }

    await project.save();

    // Update User document
    await User.updateOne(
      { email },
      { $addToSet: { projects: { projectID, role } } }
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

// GET ALL PROJECTS UNDER A USER - ANYONE
export const getUserProjects = async (req, res) => {
  try {
    const email = req.session.username;

    const result = await Project.find({
      $or: [
        { owners: { $in: [email] } },
        { editors: { $in: [email] } },
        { viewers: { $in: [email] } },
      ],
    });

    if (!result) {
      return res.status(404).json({ message: "No Projects found" });
    }

    const projects = result.map((project) => {
      let role = "";

      if (project.owner === email) {
        role = "owner";
      } else if (project.editors.includes(email)) {
        role = "editor";
      } else {
        role = "viewer";
      }

      return {
        projectID: project.projectID,
        name: project.name,
        type: project.type,
        companyID: project.companyID,
        owner: project.owner,
        role,
      };
    });

    res.status(200).json(projects);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};