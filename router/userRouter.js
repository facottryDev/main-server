import { Router } from "express";
import { getMapping } from "../controllers/config.js";
const router = Router();

router.get("/dummy", (req, res) => {
  res.json({
    filter: {
      country: "IN",
      subscription: "",
      os: "",
      osver: "",
    },
    appConfig: {
      configID: "ac_styles_16d71c37-d20e-4d4f-a75c-56d4fa06557d",
      name: "W&W",
      desc: "White & White",
      params: {
        theme: "white",
      },
      demo_url:
        "https://res.cloudinary.com/dqjkucbjn/image/upload/v1715428241/facottry_player_demo.jpg",
    },
    playerConfig: {
      configID: "pc_styles_09ead04b-a6a6-476e-9de4-db87a185ac45",
      name: "Dark",
      desc: "Dark Player",
      params: {
        theme: "dark",
      },
      demo_url:
        "https://res.cloudinary.com/dqjkucbjn/image/upload/v1715428241/facottry_player_demo.jpg",
    },
  });
});

export default router;
