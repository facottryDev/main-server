import {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTP,
  isRegistered,
  logOut,
  resetPassword,
  forgotPassword,
  fetchUserDetails,
  updateUserDetails,
  deleteUserAccount,
  updatePassword,
} from "../controllers/auth.js";
import { isAuth } from "../lib/middlewares.js";
import { Router } from "express";
import passport from "passport";

const router = Router();

//AUTH
router.post("/login", loginUser);
router.get("/logout", logOut);
router.post("/is-registered", isRegistered);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/register", registerUser);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.delete("/delete-user", deleteUserAccount);
router.post("/password/update", updatePassword);

//GOOGLE OAUTH
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failed" }),
  (req, res) => {
    res.redirect(
      process.env.CLIENT_URL + '/onboarding'
    );
  }
);

router.get("/failed", (req, res) => {
  res.redirect(
    process.env.CLIENT_URL + '/auth/login'
  );
});

//USER
router.get("/get-user", isAuth, fetchUserDetails);
router.patch("/update-user", isAuth, updateUserDetails);

router.get("/", isAuth, (req, res) => {
  return res
    .status(200)
    .json({ email: req.session.username || req.user.email });
});

export default router;
