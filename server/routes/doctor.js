const express = require("express");

const Assessment = require("../models/Assessment");
const User = require("../models/User");
const Document = require("../models/Document");
const auth = require("../middleware/auth");

const router = express.Router();

/* =========================
   GET PENDING ASSESSMENTS
========================= */

router.get("/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Doctor access required"
      });
    }

    const assessments = await Assessment.find({
      doctor: req.user.id,
      status: "waiting"
    })
      .populate("patient", "name email")
      .sort({ createdAt: 1 });

    res.json(assessments);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Could not fetch pending assessments"
    });
  }
});

/* =========================
   GET REVIEWED HISTORY
========================= */

router.get("/history", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Doctor access required"
      });
    }

    const assessments = await Assessment.find({
      doctor: req.user.id,
      status: "reviewed"
    })
      .populate("patient", "name email")
      .sort({ updatedAt: -1 });

    res.json(assessments);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Could not fetch assessment history"
    });
  }
});

/* =========================
   GET ALL PATIENTS
========================= */

router.get("/patients", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Doctor access required"
      });
    }

    const assessments = await Assessment.find({
      doctor: req.user.id
    })
      .populate("patient", "name email")
      .sort({ createdAt: -1 });

    const patientMap = new Map();

    assessments.forEach((assessment) => {
      if (!assessment.patient) return;

      const patientId =
        assessment.patient._id.toString();

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patient: assessment.patient,
          assessmentCount: 0,
          pendingCount: 0,
          urgentCount: 0,
          lastAssessment: assessment.createdAt
        });
      }

      const patient = patientMap.get(patientId);

      patient.assessmentCount++;

      if (assessment.status === "waiting") {
        patient.pendingCount++;
      }

      if (assessment.urgency === "urgent") {
        patient.urgentCount++;
      }

      if (
        new Date(assessment.createdAt) >
        new Date(patient.lastAssessment)
      ) {
        patient.lastAssessment =
          assessment.createdAt;
      }
    });

    res.json(Array.from(patientMap.values()));
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Could not fetch patients"
    });
  }
});

/* =========================
   MARK AS REVIEWED
========================= */

router.patch(
  "/assessment/:id/review",
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== "doctor") {
        return res.status(403).json({
          message: "Doctor access required"
        });
      }

      const assessment =
        await Assessment.findOne({
          _id: req.params.id,
          doctor: req.user.id
        });

      if (!assessment) {
        return res.status(404).json({
          message: "Assessment not found"
        });
      }

      if (assessment.status === "reviewed") {
        return res.status(400).json({
          message: "Assessment is already reviewed"
        });
      }

      assessment.status = "reviewed";

      await assessment.save();

      res.json({
        message: "Assessment marked as reviewed",
        assessment
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Could not mark assessment as reviewed"
      });
    }
  }
);

/* =========================
   GET PATIENT'S FULL HISTORY
========================= */

router.get(
  "/patients/:patientId",
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== "doctor") {
        return res.status(403).json({
          message: "Doctor access required"
        });
      }

      const assessments =
        await Assessment.find({
          doctor: req.user.id,
          patient: req.params.patientId
        })
          .populate("patient", "name email")
          .sort({ createdAt: -1 });

      if (assessments.length === 0) {
        return res.status(404).json({
          message: "Patient record not found"
        });
      }

      const documents = await Document.find({
        doctor: req.user.id,
        patient: req.params.patientId
      })
        .populate("assessment", "summary createdAt status")
        .sort({ createdAt: -1 });

      res.json({
        patient: assessments[0].patient,
        assessments,
        documents
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Could not fetch patient history"
      });
    }
  }
);

module.exports = router;