import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import authRouter from "./router/authRouter.js";
import adminRouter from "./router/adminRouter.js";
import configRouter from "./router/configRouter.js";
import scaleRouter from "./router/scaleRouter.js";
import analyticsRouter from "./router/analyticsRouter.js";
import { createClient } from "redis";
import RedisStore from "connect-redis";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import User from "./models/auth/user.js";
import { startCronJobs } from "./lib/cron.js";
import crypto from "crypto";

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
      ? [
          "https://facottry-website-pearl.vercel.app",
          "https://client-sdk.vercel.app",
          "http://localhost:3000",
          "http://localhost:5173"
        ]
      : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(express.json());
app.use(morgan("tiny"));
app.use(helmet());

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

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        const user = await User.findOne({ email: profile.email });

        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          googleId: profile.id,
          email: profile.email,
          name: profile.displayName,
          profilePic: profile.picture,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// MongoDB Connection
mongoose
  .connect(process.env.MONG_URI)
  .then(
    app.listen(PORT, () => {
      console.log("Connected to MongoDB");
      startCronJobs();
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
  // const secret = crypto.randomBytes(32).toString('hex');
  // console.log(secret);
  return res.send("FacOTTry Backend");
});

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/config", configRouter);
app.use("/scale", scaleRouter);
app.use("/analytics", analyticsRouter);
