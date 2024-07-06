import Master from "../models/scale/master.js";
import crypto from "crypto";

// SCALE AUTHENTICATION
export const scaleAuth = (req, res, next) => {
  try {
    const clientHash = req.headers["x-client-hash"];
    const date = new Date();
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();
    let isAuthenticated = false;

    const permanentSalt = process.env.SCALE_SALT;

    for (let randomizer = 0; randomizer <= 9; randomizer++) {
      const temporarySalt = `${currentHour}${currentMinute}`;
      const dataToHash = `${permanentSalt}${temporarySalt}${randomizer}`;
      const generatedHash = crypto
        .createHash("sha256")
        .update(dataToHash)
        .digest("hex");

      console.log(generatedHash, clientHash);

      if (generatedHash === clientHash) {
        isAuthenticated = true;
        break;
      }
    }

    if (isAuthenticated) {
      next();
    } else {
      return res.status(401).send("Authentication Failed");
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send(error.message);
  }
};

// GET MAPPING FROM FILTER PARAMS
export const getMapping = async (req, res) => {
  try {
    const { projectID, filter } = req.body;

    switch (true) {
      case !projectID:
        return res.status(400).json({ message: "ProjectID is required" });
      case !filter:
        return res.status(400).json({ message: "Filter is required" });
    }

    const masters = await Master.findOne(
      {
        projectID,
        status: "active",
        filter,
      },
      {
        _id: 0,
        __v: 0,
        status: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );

    if (!masters) {
      return res.status(200).json({
        code: "NO_MAPPING",
        message: "Mapping not found",
        mappings: {
          appConfig: {},
          playerConfig: {},
          filter: {},
        },
      });
    }

    const appConfig = masters.appConfig?.params || {};
    const playerConfig = masters.playerConfig?.params || {};

    const resObj = {
      appConfig,
      playerConfig,
      filter: masters.filter,
      projectID: masters.projectID,
      companyID: masters.companyID,
    };

    res
      .status(200)
      .json({ code: "FOUND", message: "Success", mappings: resObj });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send(error.message);
  }
};