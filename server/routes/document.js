const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const Assessment = require("../models/Assessment");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG, WEBP and PDF files are allowed"
        )
      );
    }

    cb(null, true);
  }
});

router.post(
  "/upload",
  auth,
  upload.single("document"),
  async (req, res) => {
    try {
      if (req.user.role !== "patient") {
        return res.status(403).json({
          message: "Patient access required"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a document"
        });
      }

      const patient = await User.findById(req.user.id);

      if (!patient) {
        return res.status(404).json({
          message: "Patient not found"
        });
      }

      const { type, assessment } = req.body;

      if (
        !["prescription", "test-report", "other"].includes(type)
      ) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Invalid document type"
        });
      }

      let assessmentId = null;
      let assessmentDoctor = patient.connectedDoctor || null;

      if (assessment) {
        const selectedAssessment = await Assessment.findOne({
          _id: assessment,
          patient: patient._id
        });

        if (!selectedAssessment) {
          fs.unlinkSync(req.file.path);

          return res.status(400).json({
            message: "Invalid assessment selected"
          });
        }

        assessmentId = selectedAssessment._id;
        assessmentDoctor = selectedAssessment.doctor;
      }

      const document = await Document.create({
        patient: patient._id,
        doctor: assessmentDoctor,
        assessment: assessmentId,
        type,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        ocrStatus: "pending"
      });

      res.status(201).json({
        message: "Document uploaded successfully",
        document
      });
    } catch (error) {
      console.log(error);

      if (
        req.file?.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

router.get("/patient", auth, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Patient access required"
      });
    }

    const documents = await Document.find({
      patient: req.user.id
    })
      .populate("doctor", "name email")
      .populate("assessment", "summary createdAt")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.get("/doctor", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Doctor access required"
      });
    }

    const documents = await Document.find({
      doctor: req.user.id
    })
      .populate("patient", "name email")
      .populate("assessment", "summary createdAt")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* Secure document viewing */
router.get("/:id/view", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const isPatient =
      req.user.role === "patient" &&
      document.patient.toString() === req.user.id;

    const isDoctor =
      req.user.role === "doctor" &&
      document.doctor &&
      document.doctor.toString() === req.user.id;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        message: "You do not have access to this document"
      });
    }

    const fileName = path.basename(document.fileUrl);
    const filePath = path.join(uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Document file not found"
      });
    }

    res.setHeader(
      "Content-Type",
      document.mimeType
    );

    res.setHeader(
      "Content-Disposition",
      "inline"
    );

    res.sendFile(filePath);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;