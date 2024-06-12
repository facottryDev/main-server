import cron from "node-cron";
import users from "../models/user.js";
import userArchives from "../models/userArchive.js";
import master from "../models/master.js";
import masterArchives from "../models/masterArchive.js";
import project from "../models/project.js";
import projectArchives from "../models/projectArchive.js";
import company from "../models/company.js";
import companyArchives from "../models/companyArchive.js";
import appConfig from "../models/appConfig.js";
import appConfigArchives from "../models/appConfigArchive.js";
import playerConfig from "../models/playerConfig.js";
import playerConfigArchives from "../models/playerConfigArchive.js";

// CRON JOB TO SHIFT INACTIVE USERS TO ARCHIVE
export const startCronJobs = () => {
  cron.schedule(
    "0 0 28 * *",
    async () => {
      try {
        console.log(`Cron Job Started ${new Date()}`);

        // ARCHIVE INACTIVE USERS
        const inactiveUsers = await users.find({ status: "inactive" });
        await userArchives.insertMany(inactiveUsers);
        await users.deleteMany({ status: "inactive" });

        // ARCHIVE INACTIVE PROJECTS
        const inactiveProjects = await project.find({ status: "inactive" });
        await projectArchives.insertMany(inactiveProjects);
        await project.deleteMany({ status: "inactive" });

        // ARCHIVE INACTIVE MASTERS
        const inactiveMasters = await master.find({ status: "inactive" });
        await masterArchives.insertMany(inactiveMasters);
        await master.deleteMany({ status: "inactive" });

        // ARCHIVE INACTIVE COMPANIES
        const inactiveCompanies = await company.find({ status: "inactive" });
        await companyArchives.insertMany(inactiveCompanies);
        await company.deleteMany({ status: "inactive" });

        // ARCHIVE INACTIVE APP CONFIGS
        const inactiveAppConfigs = await appConfig.find({ status: "inactive" });
        await appConfigArchives.insertMany(inactiveAppConfigs);
        await appConfig.deleteMany({ status: "inactive" });

        // ARCHIVE INACTIVE PLAYER CONFIGS
        const inactivePlayerConfigs = await playerConfig.find({ status: "inactive" });
        await playerConfigArchives.insertMany(inactivePlayerConfigs);
        await playerConfig.deleteMany({ status: "inactive" });

        console.log(`Cron Job Ended ${new Date()}`);
      } catch (error) {
        console.log(error.message);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );

  console.log(`Archive Jobs Queued at ${new Date()}`);
};