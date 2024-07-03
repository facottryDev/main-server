import Project from "../models/admin/project.js";
import AppConfig from "../models/configs/appConfig.js";
import PlayerConfig from "../models/configs/playerConfig.js";
import CustomConfig from "../models/configs/customConfig.js";
import Master from "../models/scale/master.js";
import { generateID } from "../lib/helpers.js";

// CREATE NEW APP CONFIG - PROJECT OWNER / EDITOR
export const addAppConfig = async (req, res) => {
  try {
    const { projectID, name, desc, params } = req.body;
    const owner = req.session.username || req.user.email;

    switch (true) {
      case !projectID:
        return res.status(400).json({ message: "ProjectID is required" });
      case !name:
        return res.status(400).json({ message: "Name is required" });
      case !params || Object.keys(params).length === 0:
        return res.status(400).json({ message: "Params are required" });
    }

    // Check if Project exists & user is authorized
    const project = await Project.findOne({ status: "active", projectID });

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if AppConfig already exists
    const appConfig = await AppConfig.findOne({
      status: "active",
      projectID,
      params,
    });

    if (appConfig) {
      return res.status(409).json({
        message: "AppConfig already exists",
        appConfigId: appConfig.configID,
      });
    }

    // Create new AppConfig
    const newAppConfig = new AppConfig({
      configID: generateID(`AC_${project.name}`),
      projectID,
      companyID: project.companyID,
      name,
      desc,
      params,
    });
    await newAppConfig.save();

    res
      .status(200)
      .json({ message: "Success", appConfigId: newAppConfig.configID });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error);
  }
};

// CREATE NEW PLAYER CONFIG - PROJECT OWNER / EDITOR
export const addPlayerConfig = async (req, res) => {
  try {
    const { projectID, params, name, desc } = req.body;
    const owner = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne({ status: "active", projectID });

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if PlayerConfig already exists
    const playerConfig = await PlayerConfig.findOne({
      status: "active",
      projectID,
      params,
    });
    if (playerConfig) {
      return res.status(409).json({
        message: "PlayerConfig already exists",
        playerConfigId: playerConfig.configID,
      });
    }

    // Create new PlayerConfig
    const newPlayerConfig = new PlayerConfig({
      configID: generateID(`PC_${project.name}`),
      projectID,
      companyID: project.companyID,
      name,
      desc,
      params,
    });
    await newPlayerConfig.save();

    res
      .status(201)
      .json({ message: "Success", playerConfigId: newPlayerConfig.configID });
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// DELETE APP / PLAYER CONFIG - PROJECT OWNER / EDITOR
export const deleteConfig = async (req, res) => {
  try {
    const { configID } = req.query;
    const user = req.session.username || req.user.email;

    if (configID.startsWith("app") || configID.startsWith("ac")) {
      const appConfig = await AppConfig.findOne({ status: "active", configID });

      if (!appConfig) {
        return res.status(404).json({ message: "AppConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: appConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      appConfig.status = "inactive";
      await appConfig.save();

      // Deactivate all mappings
      await Master.updateMany(
        { "appConfig.configID": configID },
        { status: "inactive" }
      );
    } else if (configID.startsWith("player") || configID.startsWith("pc")) {
      const playerConfig = await PlayerConfig.findOne({
        status: "active",
        configID,
      });

      if (!playerConfig) {
        return res.status(404).json({ message: "PlayerConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: playerConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      playerConfig.status = "inactive";
      await playerConfig.save();

      // Deactivate all mappings
      await Master.updateMany(
        { "playerConfig.configID": configID },
        { status: "inactive" }
      );
    } else {
      const customConfig = await CustomConfig.findOne({
        status: "active",
        configID,
      });

      if (!customConfig) {
        return res.status(404).json({ message: "CustomConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: customConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      customConfig.status = "inactive";
      await customConfig.save();
    }

    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// MODIFY APP / PLAYER CONFIG - PROJECT OWNER / EDITOR
export const modifyConfig = async (req, res) => {
  try {
    const { configID, params, name, desc } = req.body;
    const user = req.session.username || req.user.email;

    if (configID.startsWith("app") || configID.startsWith("ac")) {
      const appConfig = await AppConfig.findOne({ status: "active", configID });

      if (!appConfig) {
        return res.status(404).json({ message: "AppConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: appConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      appConfig.params = params || appConfig.params;
      appConfig.name = name || appConfig.name;
      appConfig.desc = desc || appConfig.desc;

      await appConfig.save();

      // Update name, desc, params in master docs also
      await Master.updateMany(
        { "appConfig.configID": configID },
        {
          "appConfig.name": name,
          "appConfig.desc": desc,
          "appConfig.params": params,
        }
      );
    } else if (configID.startsWith("player") || configID.startsWith("pc") ) {
      const playerConfig = await PlayerConfig.findOne({
        status: "active",
        configID,
      });

      if (!playerConfig) {
        return res.status(404).json({ message: "PlayerConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: playerConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      playerConfig.params = params || playerConfig.params;
      playerConfig.name = name || playerConfig.name;
      playerConfig.desc = desc || playerConfig.desc;
      await playerConfig.save();

      // Update name, desc, params in master docs also
      await Master.updateMany(
        { "playerConfig.configID": configID },
        {
          "playerConfig.name": name,
          "playerConfig.desc": desc,
          "playerConfig.params": params,
        }
      );
    } else {
      const customConfig = await CustomConfig.findOne({
        status: "active",
        configID,
      });

      if (!customConfig) {
        return res.status(404).json({ message: "CustomConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: customConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      customConfig.params = params || customConfig.params;
      customConfig.name = name || customConfig.name;
      customConfig.desc = desc || customConfig.desc;
      await customConfig.save();
    }

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CLONE CONFIG - PROJECT OWNER / EDITOR
export const cloneConfig = async (req, res) => {
  try {
    const { configID, name, desc, params } = req.body;
    const user = req.session.username || req.user.email;

    if (configID.startsWith("app") || configID.startsWith("ac")) {
      const appConfig = await AppConfig.findOne({ status: "active", configID });

      if (!appConfig) {
        return res.status(404).json({ message: "AppConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: appConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const newAppConfig = new AppConfig({
        configID: generateID(`app_${project.name}`),
        projectID: appConfig.projectID,
        companyID: appConfig.companyID,
        desc: desc || appConfig.desc,
        name: name || appConfig.name,
        params: params || appConfig.params,
      });
      await newAppConfig.save();
    } else if (configID.startsWith("player") || configID.startsWith("pc")) {
      const playerConfig = await PlayerConfig.findOne({
        status: "active",
        configID,
      });

      if (!playerConfig) {
        return res.status(404).json({ message: "PlayerConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: playerConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const newPlayerConfig = new PlayerConfig({
        configID: generateID(`player_${project.name}`),
        projectID: playerConfig.projectID,
        companyID: playerConfig.companyID,
        desc: desc || playerConfig.desc,
        name: name || playerConfig.name,
        params: params || playerConfig.params,
      });
      await newPlayerConfig.save();
    } else {
      const customConfig = await CustomConfig.findOne({
        status: "active",
        configID,
      });

      if (!customConfig) {
        return res.status(404).json({ message: "CustomConfig not found" });
      }

      const project = await Project.findOne(
        { projectID: customConfig.projectID },
        { owners: 1, editors: 1, _id: 0 }
      );

      if (!project.owners.includes(user) && !project.editors.includes(user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const newCustomConfig = new CustomConfig({
        configID: generateID(`${customConfig.type}_${project.name}`),
        projectID: customConfig.projectID,
        companyID: customConfig.companyID,
        desc: desc || customConfig.desc,
        name: name || customConfig.name,
        params: params || customConfig.params,
      });
      await newCustomConfig.save();
    }

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send(error.message);
  }
};

// GET ALL APP CONFIGS - PROJECT OWNER / EDITOR / VIEWER
export const getAllAppConfigs = async (req, res) => {
  try {
    const { projectID } = req.query;
    const user = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      { status: "active", projectID },
      { owners: 1, editors: 1, viewers: 1, _id: 0 }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(user) &&
        !project.editors.includes(user) &&
        !project.viewers.includes(user):
        return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await AppConfig.find(
      { status: "active", projectID },
      { _id: 0, __v: 0 }
    );

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET ALL PLAYER CONFIGS - PROJECT OWNER / EDITOR / VIEWER
export const getAllPlayerConfigs = async (req, res) => {
  try {
    const { projectID } = req.query;
    const user = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      { status: "active", projectID },
      { owners: 1, editors: 1, viewers: 1, _id: 0 }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(user) &&
        !project.editors.includes(user) &&
        !project.viewers.includes(user):
        return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await PlayerConfig.find(
      { status: "active", projectID },
      { _id: 0, __v: 0 }
    );

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

export const getAllConfigs = async (req, res) => {
  try {
    const { projectID } = req.query;
    const user = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      { status: "active", projectID },
      { _id: 0 }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(user) &&
        !project.editors.includes(user) &&
        !project.viewers.includes(user):
        return res.status(403).json({ message: "Unauthorized" });
    }

    const appConfigs = await AppConfig.find(
      { status: "active", projectID },
      { _id: 0, __v: 0 }
    );

    const playerConfigs = await PlayerConfig.find(
      { status: "active", projectID },
      { _id: 0, __v: 0 }
    );

    const customConfigs = await CustomConfig.find(
      { status: "active", projectID },
      { _id: 0, __v: 0 }
    );

    res.status(200).json({
      appConfigs,
      playerConfigs,
      customConfigs,
      types: project.configTypes,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

export const addConfig = async (req, res) => {
  try {
    const { projectID, name, desc, params, type } = req.body;
    const owner = req.session.username || req.user.email;

    switch (true) {
      case !projectID:
        return res.status(400).json({ message: "ProjectID is required" });
      case !name:
        return res.status(400).json({ message: "Name is required" });
      case !params || Object.keys(params).length === 0:
        return res.status(400).json({ message: "Params are required" });
      case !type:
        return res.status(400).json({ message: "Type is required" });
    }

    // Check if Project exists & user is authorized
    const project = await Project.findOne({ status: "active", projectID });

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
      case !project.configTypes || project.configTypes.length === 0: {
        project.configTypes = ['app', 'player'];
        break;
      }
      case !project.configTypes.includes(type):
        return res.status(400).json({ message: "Invalid type" });
    }

    console.log(type)

    if (type === "app") {
      const appConfig = await AppConfig.findOne({
        status: "active",
        projectID,
        $or: [{ name }, { params }],
      });

      if (appConfig) {
        return res.status(409).json({
          message: "a config already exists with same name or params",
          name: appConfig.name,
          configID: appConfig.configID,
        });
      }

      const newAppConfig = new AppConfig({
        configID: generateID(`app_${project.name}`),
        projectID,
        companyID: project.companyID,
        name,
        type,
        desc,
        params,
      });

      await newAppConfig.save();
    } else if (type === "player") {
      const playerConfig = await PlayerConfig.findOne({
        status: "active",
        projectID,
        $or: [{ name }, { params }],
      });

      if (playerConfig) {
        return res.status(409).json({
          message: "a config already exists with same name or params",
          name: playerConfig.name,
          configID: playerConfig.configID,
        });
      }

      const newPlayerConfig = new PlayerConfig({
        configID: generateID(`player_${project.name}`),
        projectID,
        companyID: project.companyID,
        name,
        type,
        desc,
        params,
      });

      await newPlayerConfig.save();
    } else {
      const customConfig = await CustomConfig.findOne({
        status: "active",
        projectID,
        type,
        $or: [{ name }, { params }],
      });

      if (customConfig) {
        return res.status(409).json({
          message: "a config already exists with same name or params",
          configId: customConfig.configID,
          name: customConfig.name,
          type: customConfig.type,
        });
      }

      const newCustomConfig = new CustomConfig({
        configID: generateID(`${type}_${project.name}`),
        projectID,
        companyID: project.companyID,
        name,
        type,
        desc,
        params,
      });

      await newCustomConfig.save();
    }

    res.status(201).json({ message: "Success" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error);
  }
};

export const deleteConfigType = async (req, res) => {
  try {
    const { projectID, type } = req.query;
    const user = req.session.username || req.user.email;

    if (!projectID) {
      return res.status(400).json({ message: "ProjectID is required" });
    }

    const project = await Project.findOne({ status: "active", projectID });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.owners.includes(user) && !project.editors.includes(user)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!project.configTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    await Project.updateOne({ projectID }, { $pull: { configTypes: type } });

    // delete all configs of this type (except app & player configs)
    await CustomConfig.updateMany({ projectID, type }, { status: "inactive" });

    // delete all master docs with where customConfig has a key of type
    await Master.updateMany(
      {
        projectID,
        status: "active",
        [`customConfig.${type}`]: { $exists: true },
      },
      { status: "inactive" }
    );

    res.status(200).json({ message: "Success" });
  } catch (error) {
    return res.status(500).json(error);
  }
};

// MAP CONFIGS TO FILTER IN MASTER - PROJECT OWNER / EDITOR
export const createMapping = async (req, res) => {
  try {
    const { companyID, projectID, configs, filter } = req.body;
    const owner = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne({ status: "active", projectID });

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    const appConfig = await AppConfig.findOne(
      {
        status: "active",
        configID: configs.app.configID,
      },
      { _id: 0, configID: 1, name: 1, desc: 1, params: 1 }
    );

    if (!appConfig) {
      return res.status(404).json({ message: "AppConfig not found" });
    }

    const playerConfig = await PlayerConfig.findOne(
      {
        status: "active",
        configID: configs.player.configID,
      },
      { _id: 0, configID: 1, name: 1, desc: 1, params: 1 }
    );

    if (!playerConfig) {
      return res.status(404).json({ message: "PlayerConfig not found" });
    }

    const custom = Object.entries(configs).reduce((acc, [key, value]) => {
      if (key !== "app" && key !== "ac" && key !== "player" && key !== "pc") {
        acc[key] = value;
      }
      return acc;
    }, {});

    const customConfig = {};

    // check if all configs are valid
    if (Object.keys(custom).length > 0) {
      for (let [key, value] of Object.entries(custom)) {
        const config = await CustomConfig.findOne(
          {
            status: "active",
            configID: value.configID,
          },
          { _id: 0, configID: 1, name: 1, desc: 1, params: 1 }
        );

        if (!config) {
          return res.status(404).json({ message: `${key} Config not found` });
        }

        customConfig[key] = config;
      }
    }

    // For Loop for all type of configs.
    let searchFilter = {};
    for (const key in filter) {
      if (filter[key] === "") {
        searchFilter[key] = project.filters[key].default;
      } else if (filter[key] === "ALL") {
        searchFilter[key] = project.filters[key].values;
      } else {
        searchFilter[key] = filter[key].split(", ");
      }
    } // COUNTRY = [IND, USA], DEVICE = [MOBILE, DESKTOP], SUBSCRIPTION = FREE

    let filterConditions = Object.entries(searchFilter).reduce(
      (acc, [key, value]) => {
        if (Array.isArray(value)) {
          let newAcc = [];
          for (let val of value) {
            if (acc.length === 0) {
              newAcc.push({ [key]: val });
            } else {
              for (let obj of acc) {
                newAcc.push({ ...obj, [key]: val });
              }
            }
          }
          return newAcc;
        } else {
          if (acc.length === 0) {
            return [{ [key]: value }];
          } else {
            return acc.map((obj) => ({ ...obj, [key]: value }));
          }
        }
      },
      []
    );

    // create or update Master
    for (let condition of filterConditions) {
      await Master.findOneAndUpdate(
        {
          projectID,
          filter: condition,
          status: "active",
        },
        {
          appConfig,
          playerConfig,
          customConfig,
          filter: condition,
          projectID,
          companyID,
        },
        { upsert: true }
      );
    }

    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.log(error.message);
    console.log(error.message);
    return res.status(500).send(error.message);
  }
};

// DELETE MAPPING FROM MASTER - PROJECT OWNER / EDITOR
export const deleteMapping = async (req, res) => {
  try {
    const { projectID, filter } = req.body;
    const owner = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne({ status: "active", projectID });

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    const masterDoc = await Master.findOneAndUpdate(
      {
        projectID,
        filter,
        status: "active",
      },
      {
        status: "inactive",
      }
    );

    if (!masterDoc) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.status(200).json({ message: "Success" });
  } catch (error) {
    return res.status(500).send(error);
  }
};

// GET ALL MAPPINGS - PROJECT OWNER / EDITOR
export const getAllMappings = async (req, res) => {
  try {
    const { projectID, filter } = req.body;
    const owner = req.session.username || req.user.email;

    // Check if Project exists & Authorized
    const project = await Project.findOne({ status: "active", projectID });

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    let searchFilter = {};
    for (const key in filter) {
      if (filter[key] === "") {
        searchFilter[key] = project.filters[key].default;
      } else if (filter[key] === "ALL") {
        searchFilter[key] = project.filters[key].values;
      } else {
        searchFilter[key] = filter[key].split(", ");
      }
    } // COUNTRY = [IND, USA], DEVICE = [MOBILE, DESKTOP], SUBSCRIPTION = FREE

    console.log(searchFilter)

    let filterConditions = Object.entries(searchFilter).reduce(
      (acc, [key, value]) => {
        if (Array.isArray(value)) {
          let newAcc = [];
          for (let val of value) {
            if (acc.length === 0) {
              newAcc.push({ [key]: val });
            } else {
              for (let obj of acc) {
                newAcc.push({ ...obj, [key]: val });
              }
            }
          }
          return newAcc;
        } else {
          if (acc.length === 0) {
            return [{ [key]: value }];
          } else {
            return acc.map((obj) => ({ ...obj, [key]: value }));
          }
        }
      },
      []
    );

    const result = await Master.find(
      {
        projectID,
        status: "active",
        filter: { $in: filterConditions },
      },
      {
        _id: 0,
        __v: 0,
        status: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );

    res
      .status(200)
      .json({ code: "FOUND", message: "Success", mappings: result });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
