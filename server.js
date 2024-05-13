import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import authRouter from "./router/authRouter.js";
import adminRouter from "./router/adminRouter.js";
import configRouter from "./router/configRouter.js";
import userRouter from "./router/userRouter.js";
import { createClient } from "redis";
import RedisStore from "connect-redis";
import session from "express-session";

// Const declarations
dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Configure Redis Client
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});
redisClient.connect().then(console.log("Redis Connected")).catch(console.error);

// Middlewares
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://facottry-website-pearl.vercel.app", "https://client-sdk.vercel.app/"]
      : "http://localhost:3000, http://localhost:5173",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(
  session({
    store: new RedisStore({
      client: redisClient,
    }),
    credentials: true,
    name: "sid",
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESS_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      expires: null,
    },
  })
);

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(express.json());
app.use(morgan("tiny"));
app.use(helmet());

// MongoDB Connection
mongoose
  .connect(process.env.MONG_URI)
  .then(
    app.listen(PORT, () => {
      console.log("Connected to MongoDB");
      if (process.env.NODE_ENV === "production") {
        console.log("Production Ready");
      } else {
        console.log(`Server: http://localhost:${PORT}`);
      }
    })
  )
  .catch((err) => {
    console.log(err);
  });

// Routes
app.get("/", (req, res) => {
  return res.send("FacOTTry Backend");
});

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/config", configRouter);
app.use("/user", userRouter);
