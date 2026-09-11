const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let doctorCode;
    let doctorCodeExpiresAt;

    if (role === "doctor") {
      doctorCode =
        "CP-" + crypto.randomBytes(3).toString("hex").toUpperCase();

      doctorCodeExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      doctorCode,
      doctorCodeExpiresAt
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorCode: user.doctorCode,
        doctorCodeExpiresAt: user.doctorCodeExpiresAt,
        connectedDoctor: user.connectedDoctor
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }).populate(
      "connectedDoctor",
      "name email"
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorCode: user.doctorCode,
        doctorCodeExpiresAt: user.doctorCodeExpiresAt,
        connectedDoctor: user.connectedDoctor
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.post("/connect-doctor", auth, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Patient access required"
      });
    }

    const { doctorCode } = req.body;

    if (!doctorCode) {
      return res.status(400).json({
        message: "Doctor code is required"
      });
    }

    const doctor = await User.findOne({
      doctorCode: doctorCode.trim().toUpperCase(),
      role: "doctor"
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Invalid doctor code"
      });
    }

    if (
      !doctor.doctorCodeExpiresAt ||
      doctor.doctorCodeExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "This doctor code has expired"
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      connectedDoctor: doctor._id
    });

    res.json({
      message: "Successfully connected to doctor",
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "connectedDoctor",
      "name email"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    /*
      Automatically renew an expired doctor's code.
      This happens when /me is requested, so the doctor
      does not need to log out or manually regenerate it.
    */
    if (
      user.role === "doctor" &&
      (
        !user.doctorCodeExpiresAt ||
        user.doctorCodeExpiresAt < new Date()
      )
    ) {
      user.doctorCode =
        "CP-" + crypto.randomBytes(3).toString("hex").toUpperCase();

      user.doctorCodeExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await user.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      doctorCode: user.doctorCode,
      doctorCodeExpiresAt: user.doctorCodeExpiresAt,
      connectedDoctor: user.connectedDoctor
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.post("/regenerate-doctor-code", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Doctor access required"
      });
    }

    const doctorCode =
      "CP-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    const doctorCodeExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const doctor = await User.findByIdAndUpdate(
      req.user.id,
      {
        doctorCode,
        doctorCodeExpiresAt
      },
      {
        new: true
      }
    );

    res.json({
      message: "New doctor code generated",
      doctorCode: doctor.doctorCode,
      doctorCodeExpiresAt: doctor.doctorCodeExpiresAt
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;