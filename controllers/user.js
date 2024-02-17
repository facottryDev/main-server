import Company from "../models/company.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import Joi from "joi";

// FETCH COMPANY PROFILE
export const getCompanyProfile = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      companyID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { companyID } = req.query;
    const result = await Company.findOne(
      { companyID },
      { _id: 0, companyID: 1, name: 1, address: 1 }
    );

    if (!result) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// FETCH COMPANY EMPLOYEES
export const getCompanyEmployeesID = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      companyID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { companyID } = req.query;
    const company = await Company.findOne(
      { companyID },
      { _id: 0, employees: 1 }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(200).json(company.employees);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// FETCH COMPANY PROJECTS
export const getCompanyProjectsID = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      companyID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { companyID } = req.query;
    const company = await Company.findOne(
      { companyID },
      { _id: 0, projects: 1 }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(200).json(company.projects);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// FETCH USER PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      email: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { email } = req.query;
    const result = await User.findOne(
      { email },
      { _id: 0, name: 1, email: 1, designation: 1, companyID: 1 }
    );

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// FETCH USER'S PROJECTS
export const getUserProjects = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      email: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { email } = req.query;
    const result = await User.findOne({ email }, { _id: 0, projects: 1 });

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// UPDATE PROJECT'S USERS
export const getProjectUsers = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      projectID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { projectID } = req.query;
    const result = await Project.findOne(
      { projectID },
      { _id: 0, owner: 1, editors: 1, viewers: 1 }
    );

    if (!result) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// UPDATE PROJECT ACCESS
export const updateProjectAccess = async (req, res) => {
  try {
    // Validate request body
    const bodySchema = Joi.object({
      projectID: Joi.string().required(),
      email: Joi.string().required(),
      role: Joi.string().valid("owner", "editor", "viewer").required(),
    });
    await bodySchema.validateAsync(req.body);
    const { projectID, email, role } = req.body;

    // Check if project exists
    const project = await Project.findOne({ projectID });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("user", user);

    // Check if company is same
    if(user.companyID !== project.companyID){
      return res.status(400).json({ message: "User and project are not in the same company" });
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