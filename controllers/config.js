import Filter from "../models/filter.js";
import Project from "../models/project.js";
import Joi from "joi";
import AppConfig from "../models/appConfig.js";
import PlayerConfig from "../models/playerConfig.js";
import { getNextSequence } from "../lib/helpers.js";

// GET FILTER_ID FROM FILTER PARAMS
export const getFilterIdFromParams = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      country: Joi.string().required(),
      subscription: Joi.string().required(),
      OS: Joi.string().required(),
      OSver: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const result = await Filter.findOne({ params: req.query }, { filterID: 1 });

    if (!result) {
      return res.status(404).json({ message: "Filter not found" });
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

// FETCH APP CONFIG & PLAYER CONFIG FROM FILTER_ID
export const getConfigsFromFilterId = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      filterID: Joi.string().required(),
      projectID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { filterID, projectID } = req.query;
    const project = await Project.findOne({ projectID });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const result = project.configs.find((config) => config.filterID === filterID);

    if (!result) {
      return res.status(404).json({ message: "No configs found for this filter" });
    }

    const { appConfigID, playerConfigID } = result;

    const appConfig = await AppConfig.findOne({ configID: appConfigID });
    const playerConfig = await PlayerConfig.findOne({
      configID: playerConfigID,
    });

    res.status(200).json({ appConfig, playerConfig });
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// FETCH APP CONFIG FROM APP_CONFIG_ID
export const getAppConfigFromId = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      appConfigID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { appConfigID } = req.query;
    const result = await AppConfig.findOne({ configID: appConfigID });

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

// FETCH PLAYER CONFIG FROM PLAYER_CONFIG_ID
export const getPlayerConfigFromId = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      playerConfigID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.query);

    const { playerConfigID } = req.query;
    const result = await PlayerConfig.findOne({ configID: playerConfigID });

    if (!result) {
      return res.status(404).json({ message: "PlayerConfig not found" });
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

// CREATE NEW APP CONFIG
export const createAppConfig = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      theme: Joi.string().required(),
      language: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.body);
    const params = req.body;

    // Check if AppConfig already exists
    const appConfig = await AppConfig.findOne({ params });
    if (appConfig) {
      return res.status(409).json({ message: "AppConfig already exists" });
    }

    // Create new AppConfig
    const nextId = await getNextSequence("appConfig");
    const newAppConfig = new AppConfig({ configID: "AC_" + nextId, params });
    await newAppConfig.save();

    res.status(201).json(newAppConfig);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// CREATE NEW PLAYER CONFIG
export const createPlayerConfig = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      autoplay: Joi.boolean().required(),
      controls: Joi.boolean().required(),
    });
    await bodySchema.validateAsync(req.body);
    const params = req.body;

    // Check if PlayerConfig already exists
    const playerConfig = await PlayerConfig.findOne({ params });
    if (playerConfig) {
      return res.status(409).json({ message: "PlayerConfig already exists" });
    }

    // Create new PlayerConfig
    const nextId = await getNextSequence("playerConfig");
    const newPlayerConfig = new PlayerConfig({
      configID: "PC_" + nextId,
      params,
    });
    await newPlayerConfig.save();

    res.status(201).json(newPlayerConfig);
  } catch (error) {
    if (error.details) {
      return res
        .status(400)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

// MAP CONFIGS TO FILTER IN A PROJECT
export const mapConfigsToFilter = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      projectID: Joi.string().required(),
      appConfigID: Joi.string().required(),
      playerConfigID: Joi.string().required(),
      filterID: Joi.string().required(),
    });
    await bodySchema.validateAsync(req.body);

    const { filterID, appConfigID, playerConfigID, projectID } = req.body;

    const result = await Project.findOne({ projectID });
    if(!result) {
      return res.status(404).json({ message: "Project not found" });
    }

    const configIndex = result.configs.findIndex(
      (config) => config.filterID === filterID
    );

    if (configIndex !== -1) {
      return res
        .status(409)
        .json({ message: "Filter already has configs mapped" });
    }

    result.configs.push({ filterID, appConfigID, playerConfigID });
    await result.save();

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
