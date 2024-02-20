import Filter from "../models/filter.js";
import Project from "../models/project.js";
import AppConfig from "../models/appConfig.js";
import PlayerConfig from "../models/playerConfig.js";
import Master from "../models/master.js";
import { getNextSequence } from "../lib/helpers.js";
import { redisClient as client } from "../server.js";

// CREATE NEW APP CONFIG - PROJECT OWNER / EDITOR
export const addAppConfig = async (req, res) => {
  try {
    const { projectID, language, theme, customObject } = req.body;
    const owner = req.session.username;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      {
        projectID,
      },
      { owners: 1, editors: 1, _id: 0 }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if AppConfig already exists
    const appConfig = await AppConfig.findOne({
      projectID,
      language: language || "default",
      theme: theme || "default",
      customObject,
    });
    if (appConfig) {
      return res.status(409).json({
        message: "AppConfig already exists",
        appConfigId: appConfig.configID,
      });
    }

    // Create new AppConfig
    const nextId = await getNextSequence("appConfig");
    const newAppConfig = new AppConfig({
      configID: "AC_" + nextId,
      projectID,
      language,
      theme,
      customObject,
    });
    await newAppConfig.save();

    res
      .status(201)
      .json({ message: "Success", appConfigId: newAppConfig.configID });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// CREATE NEW PLAYER CONFIG - PROJECT OWNER / EDITOR
export const addPlayerConfig = async (req, res) => {
  try {
    const { projectID, autoplay, controls, customObject } = req.body;
    const owner = req.session.username;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      {
        projectID,
      },
      { owners: 1, editors: 1, _id: 0 }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if PlayerConfig already exists
    const playerConfig = await PlayerConfig.findOne({
      projectID,
      autoplay: autoplay || "default",
      controls: controls || "default",
      customObject,
    });
    if (playerConfig) {
      return res.status(409).json({
        message: "PlayerConfig already exists",
        playerConfigId: playerConfig.configID,
      });
    }

    // Create new PlayerConfig
    const nextId = await getNextSequence("playerConfig");
    const newPlayerConfig = new PlayerConfig({
      configID: "PC_" + nextId,
      projectID,
      autoplay,
      controls,
      customObject,
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

// FETCH APP CONFIG FROM APP_CONFIG_ID - PROJECT OWNER / EDITOR / VIEWER
export const getAppConfigFromId = async (req, res) => {
  try {
    const { projectID, configID } = req.query;
    const user = req.session.username;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      { projectID },
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

    const result = await AppConfig.findOne({ configID }, { _id: 0, __v: 0 });

    if (!result) {
      return res.status(404).json({ message: "AppConfig not found" });
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

// FETCH PLAYER CONFIG FROM PLAYER_CONFIG_ID - PROJECT OWNER / EDITOR / VIEWER
export const getPlayerConfigFromId = async (req, res) => {
  try {
    const { projectID, configID } = req.query;
    const user = req.session.username;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      { projectID },
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

    const result = await PlayerConfig.findOne({ configID }, { _id: 0, __v: 0 });

    if (!result) {
      return res.status(404).json({ message: "PlayerConfig not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET FILTER_ID FROM FILTER PARAMS
export const getFilterIdFromParams = async (req, res) => {
  try {
    const { country, subscription, OS, OSver } = req.query;
    const result = await Filter.findOne(
      { country, subscription, OS, OSver },
      { filterID: 1, _id: 0 }
    );

    if (!result) {
      return res.status(404).json({ message: "Filter not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// MAP CONFIGS TO FILTER IN MASTER - PROJECT OWNER / EDITOR
export const createMapping = async (req, res) => {
  try {
    const { projectID, appConfigID, playerConfigID, filterID } = req.body;
    const owner = req.session.username;

    switch (true) {
      case !projectID:
        return res.status(400).json({ message: "ProjectID is required" });
      case !appConfigID:
        return res.status(400).json({ message: "AppConfigID is required" });
      case !playerConfigID:
        return res.status(400).json({ message: "PlayerConfigID is required" });
      case !filterID:
        return res.status(400).json({ message: "FilterID is required" });
    }

    const project = await Project.findOne({ projectID }, { projectID: 1, owners: 1, editors: 1 });
    const appConfig = await AppConfig.findOne(
      { configID: appConfigID },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );
    const playerConfig = await PlayerConfig.findOne(
      { configID: playerConfigID },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );
    const filter = await Filter.findOne(
      { filterID },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
      case !appConfig:
        return res.status(404).json({ message: "AppConfig not found" });
      case !playerConfig:
        return res.status(404).json({ message: "PlayerConfig not found" });
      case !filter:
        return res.status(404).json({ message: "Filter not found" });
    }

    const document = await Master.findOne({
      projectID: projectID,
      "filter.filterID": filterID,
    });

    if (document) {
      return res.status(409).json({
        message: "A Mapping already exists for this filter in your project",
      });
    }

    const newMasterDoc = new Master({
      projectID,
      filter,
      appConfig,
      playerConfig,
    });

    await newMasterDoc.save();

    res.status(201).json({ message: "Success" });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// UPDATE CONFIGS TO FILTER IN MASTER - PROJECT OWNER / EDITOR
export const updateMapping = async (req, res) => {
  try {
    const { projectID, appConfigID, playerConfigID, filterID } = req.body;
    const owner = req.session.username;

    switch (true) {
      case !projectID:
        return res.status(400).json({ message: "ProjectID is required" });
      case !appConfigID:
        return res.status(400).json({ message: "AppConfigID is required" });
      case !playerConfigID:
        return res.status(400).json({ message: "PlayerConfigID is required" });
      case !filterID:
        return res.status(400).json({ message: "FilterID is required" });
    }

    const project = await Project.findOne({ projectID }, { projectID: 1, owners: 1, editors: 1 });
    const appConfig = await AppConfig.findOne(
      { configID: appConfigID },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );
    const playerConfig = await PlayerConfig.findOne(
      { configID: playerConfigID },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );
    const filter = await Filter.findOne(
      { filterID },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
      case !appConfig:
        return res.status(404).json({ message: "AppConfig not found" });
      case !playerConfig:
        return res.status(404).json({ message: "PlayerConfig not found" });
      case !filter:
        return res.status(404).json({ message: "Filter not found" });
    }

    const document = await Master.findOneAndUpdate(
      {
        projectID: projectID,
        "filter.filterID": filterID,
      },
      {
        appConfig,
        playerConfig,
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.status(200).json({ message: "Success", document });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// DELETE MAPPING FROM MASTER - PROJECT OWNER / EDITOR
export const deleteMapping = async (req, res) => {
  try {
    const { projectID, filterID } = req.body;
    const owner = req.session.username;

    // Check if Project exists & Authorized
    const project = await Project.findOne(
      { projectID },
      { owners: 1, editors: 1, _id: 0 }
    );

    switch (true) {
      case !project:
        return res.status(404).json({ message: "Project not found" });
      case !project.owners.includes(owner) && !project.editors.includes(owner):
        return res.status(403).json({ message: "Unauthorized" });
    }

    const document = await Master.findOneAndDelete({
      projectID,
      "filter.filterID": filterID,
    });

    if (!document) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.status(200).json({ message: "Success", });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET MAPPING FROM FILTER PARAMS (SCALE SERVER)
export const getMapping = async (req, res) => {
  try {
    const { projectID, country, subscription, OS, OSver } = req.query;
    const key = `${projectID}-${country}-${subscription}-${OS}-${OSver}`;

    // Try getting data from cache
    const data = await client.get(key);
    console.log(data)

    if (data) {
      return res.status(200).json(JSON.parse(data));
    } else {
      const document = await Master.findOne(
        {
          projectID,
          "filter.country": country,
          "filter.subscription": subscription,
          "filter.OS": OS,
          "filter.OSver": OSver,
        },
        {
          _id: 0,
          appConfig: 1,
          playerConfig: 1,
        }
      );

      if (!document) {
        const defaultDoc = {
          "appConfig": {
            "configID": "AC_1",
            "theme": "default",
            "language": "default"
          },
          "playerConfig": {
            "configID": "PC_1",
            "autoplay": "default",
            "controls": "default"
          },
        }

        return res.status(404).json({ message: "Mapping not found", defaultDoc});
      }

      // Store document in cache
      await client.set(key, JSON.stringify(document), 'EX', 3600);
      res.status(200).json(document);
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};