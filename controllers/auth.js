import users from "../models/auth/user.js";
import {
  sendMail,
  removeExpiredUserSessions,
  revokeUserSessions,
} from "../lib/helpers.js";
import Joi from "joi";
import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
import { redisClient } from "../server.js";

//LOGIN
export const loginUser = async (req, res) => {
  try {
    if (req.session.username || req.user) {
      return res.status(400).json({ message: "Already logged in" });
    }

    //Form Validation
    const loginSchema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
      remember_me: Joi.boolean().required(),
    });
    await loginSchema.validateAsync(req.body);

    //Search in DB
    const { email, password, remember_me } = req.body;
    const user = await users.findOne({ status: "active", email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "No password found! Use Social Sign In" });
    }

    //Verify Password
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (passwordCorrect) {
      req.session.username = user.email;
      if (remember_me) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 1 month
      }

      // Update active-sessions of user
      redisClient.SADD(
        `user-sess:${user.email}`,
        req.sessionID,
        (err, result) => {
          if (err) {
            console.log("Error adding session to active sessions:", err);
          }
        }
      );

      removeExpiredUserSessions(user.email);

      return res.status(200).json({
        email: user.email,
        message: `Login Successful`,
      });
    } else {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
  } catch (error) {
    if (error.details) {
      return res
        .status(422)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).send(error.message);
  }
};

//LOGOUT
export const logOut = (req, res) => {
  try {
    if (!req.session.username && !req.user) {
      return res.status(400).send("Not logged in!");
    }

    if (req.user) {
      req.logout(function (err) {
        if (err) {
          return res.status(500).send("Error logging out");
        }
        res.redirect("/");
      });
    } else {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }

        res.clearCookie("sid");
        return res.json({ message: "Logged out" });
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error.message);
  }
};

//IS REGISTERED
export const isRegistered = async (req, res) => {
  try {
    const email = req.body.email;

    // isRegistered
    const user = await users.findOne(
      { status: "active", email },
      { _id: 0, email: 1 }
    );
    if (user) {
      return res.status(200).json({
        message: "User already registered",
        registered: true,
      });
    } else {
      return res.status(200).json({
        message: "User not registered",
        registered: false,
      });
    }
  } catch (error) {
    return res.status(500).json(error);
  }
};

//SEND OTP
export const sendOTP = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json("No email provided!");
    }

    if (req.session.username || req.user) {
      return res.status(403).json("Already logged in");
    }

    if (
      req.session.otpExpiry &&
      Date.now() < req.session.otpExpiry &&
      req.body.email === req.session.email
    ) {
      return res.status(400).send("OTP not expired");
    }

    // Email Validation
    const emailSchema = Joi.object({
      email: Joi.string().email().required(),
    });
    await emailSchema.validateAsync({ email: req.body.email });

    // Generate OTP and store in DB
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const mailOptions = {
      from: process.env.GMAIL_ID,
      to: req.body.email,
      subject: `facOTTry - Your OTP for verification is ${otp}`,
      html: `<p>Hello,</p>
             <p>Your OTP for verification is: <strong>${otp}</strong></p>
             <p>Thank you for using facOTTry!</p>`,
    };

    // const result = await sendMail(mailOptions);
    // if (result.accepted) {
    //   // Store temporary information
    //   req.session.otp = otp;
    //   req.session.email = req.body.email;
    //   req.session.otpExpiry = Date.now() + 180000; //5 Minutes from now

    //   return res.json({ message: `OTP sent to ${req.body.email}`});
    // }

    req.session.otp = otp;
    req.session.email = req.body.email;
    req.session.otpExpiry = Date.now() + 180000; // 5 Minutes from now

    return res.status(200).json({ message: otp });

    res.status(500).send("Error sending OTP");
  } catch (error) {
    if (error.details) {
      return res
        .status(422)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    console.log(error.message)

    return res.status(500).json(error.message);
  }
};

//VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const userEnteredOTP = req.body.otp;
    const storedOTP = req.session.otp;
    const storedOTPExpiry = req.session.otpExpiry;

    if (!req.session.otp || !req.session.otpExpiry || !req.session.email) {
      return res.status(400).send("Not generated");
    }

    if (Date.now() > storedOTPExpiry) {
      delete req.session.otp;
      delete req.session.email;
      delete req.session.otpExpiry;
      return res.status(401).send("OTP expired");
    }

    // Master OTP
    if (userEnteredOTP === "998877") {
      delete req.session.otp;
      delete req.session.otpExpiry;
      req.session.tempSessionExp = Date.now() + 300000; //5 Minutes from now
      return res.send({ message: "OTP Verified" });
    } else {
      if (userEnteredOTP === storedOTP) {
        delete req.session.otp;
        delete req.session.otpExpiry;
        req.session.tempSessionExp = Date.now() + 300000; //5 Minutes from now
        return res.send({ message: "OTP Verified" });
      } else {
        return res.status(403).send("Wrong OTP");
      }
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

//REGISTER
export const registerUser = async (req, res) => {
  try {
    if (req.session.username || req.user) {
      return res.status(400).send("Already logged in!");
    }

    const email = req.session.email;
    const { password } = req.body;

    if (
      !req.session.tempSessionExp ||
      Date.now() > req.session.tempSessionExp
    ) {
      return res.status(401).send("Session Expired!");
    }

    //Request Body Validation
    const registerSchema = Joi.object({
      password: Joi.string().required(),
    });
    await registerSchema.validateAsync(req.body);

    const profilePic =
      "https://res.cloudinary.com/dqjkucbjn/image/upload/v1688890088/Avatars/thumbs-1688889944751_w9xb0e.svg";

    // Hash password & save to mongoDB
    const hash = await bcrypt.hash(password, 12);
    const newUser = new users({
      email,
      password: hash,
      profilePic,
    });
    await newUser.save();

    delete req.session.tempSessionExp;
    delete req.session.email;

    req.session.username = email;
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;

    // Update active-sessions of user
    redisClient.SADD(`user-sess:${email}`, req.sessionID, (err, result) => {
      if (err) {
        console.error("Error adding session to active sessions:", err);
      }
    });

    removeExpiredUserSessions(email);

    return res.status(200).json({ message: "Registered Successfully" });
  } catch (error) {
    if (error.details) {
      return res
        .status(422)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).json(error.message);
  }
};

//FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    if (req.session.username || req.user) {
      return res.status(400).send("Already logged in!");
    }

    const email = req.session.email;
    const { password } = req.body;

    if (
      !req.session.tempSessionExp ||
      Date.now() > req.session.tempSessionExp
    ) {
      return res.status(401).send("Session Expired!");
    }

    //Request Body Validation
    const registerSchema = Joi.object({
      password: Joi.string().required(),
    });
    await registerSchema.validateAsync(req.body);

    // Hash password & save to mongoDB
    const hash = await bcrypt.hash(password, 12);
    await users.findOneAndUpdate(
      { status: "active", email },
      { $set: { password: hash } },
      { new: true }
    );

    delete req.session.tempSessionExp;
    delete req.session.email;

    return res.status(200).json({ message: "Password updated" });
  } catch (error) {
    if (error.details) {
      return res
        .status(422)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).json(error.message);
  }
};

//RESET PASSWORD (LOGGED IN)
export const resetPassword = async (req, res) => {
  try {
    if (!req.session.username && !req.user) {
      return res.status(400).send("Not logged in!");
    }

    let id = req.session.username || req.user.email;
    const { currentPassword, newPassword } = req.body;

    const user = await users.findOne(
      { status: "active", $or: [{ email: id }] },
      { password: 1, email: 1 }
    );

    // Same Password Check
    if (newPassword === currentPassword) {
      return res.status(400).send("Old & new password cannot be same");
    }

    if (!user) {
      return res.status(404).send("Not registered!");
    }

    // Match Current Password
    if (currentPassword) {
      const passwordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordCorrect) {
        return res.status(400).send("Current Password doesn't match");
      }
    } else {
      return res.status(400).send("Current Password is required");
    }

    //newPassword Validation
    const passwordSchema = Joi.object({
      password: Joi.string().required(),
    });
    await passwordSchema.validateAsync({ password: newPassword });

    // Save new password to mongoDB
    const newHash = await bcrypt.hash(newPassword, 12);
    user.password = newHash;
    await user.save();

    // Revoke all active user sessions
    revokeUserSessions(user.email);
    if (req.session.email) delete req.session.email;
    delete req.session.req.session.tempSessionExp;

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    if (error.details) {
      return res
        .status(422)
        .json(error.details.map((detail) => detail.message).join(", "));
    }

    return res.status(500).json(error.message);
  }
};

// FETCH USER DETAILS
export const fetchUserDetails = async (req, res) => {
  try {
    const user = await users.findOne(
      { status: "active", email: req.session.username || req.user.email },
      { _id: 0, password: 0, __v: 0 }
    );

    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(404).send("User not found");
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

// UPDATE USER DETAILS
export const updateUserDetails = async (req, res) => {
  try {
    const { name, mobile, profilePic, address } = req.body;
    const email = req.session.username || req.user.email;

    const result = await users.findOneAndUpdate(
      { status: "active", email },
      {
        $set: {
          name,
          mobile,
          profilePic,
          address,
        },
      },
      { new: true, projection: { _id: 0, password: 0, __v: 0 } }
    );

    if (result) {
      return res.status(200).json(result);
    } else {
      return res.status(500).send("Error updating user details");
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

// DEACTIVATE USER ACCOUNT
export const deleteUserAccount = async (req, res) => {
  try {
    const email = req.session.username || req.user.email;
    const user = await users.findOne({ status: "active", email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.status = "inactive";
    await user.save();

    revokeUserSessions(email);
    return res.status(200).send("Account deleted successfully");
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

// ADD NEW PASSWORD
export const updatePassword = async (req, res) => {
  try {
    if (!req.session.username && !req.user) {
      return res.status(400).json({ message: "Not logged in" });
    }

    const { password } = req.body;
    const email = req.session.username || req.user.email;

    const user = await users.findOne({ status: "active", email });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Hash password & save to mongoDB
    const hash = await bcrypt.hash(password, 12);
    user.password = hash;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};