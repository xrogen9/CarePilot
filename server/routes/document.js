const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const Document = require("../models/Document");
const Assessment = require("../models/Assessment");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = "medical-documents";

const upload = multer({
  storage: multer.memoryStorage(),

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


/* =========================
   UPLOAD DOCUMENT
========================= */

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
        return res.status(400).json({
          message: "Invalid document type"
        });
      }

      let assessmentId = null;
      let assessmentDoctor = patient.connectedDoctor || null;

      if (assessment) {
        const selectedAssessment =
          await Assessment.findOne({
            _id: assessment,
            patient: patient._id
          });

        if (!selectedAssessment) {
          return res.status(400).json({
            message: "Invalid assessment selected"
          });
        }

        assessmentId = selectedAssessment._id;
        assessmentDoctor = selectedAssessment.doctor;
      }

      const fileExtension =
        path.extname(req.file.originalname);

      const storagePath =
        `${patient._id}/${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;

      const { error: uploadError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(
            storagePath,
            req.file.buffer,
            {
              contentType: req.file.mimetype,
              upsert: false
            }
          );

      if (uploadError) {
        console.log(
          "Supabase upload error:",
          uploadError
        );

        return res.status(500).json({
          message: "Could not upload document"
        });
      }

      const document = await Document.create({
        patient: patient._id,
        doctor: assessmentDoctor,
        assessment: assessmentId,
        type,
        fileName: req.file.originalname,
        fileUrl: storagePath,
        mimeType: req.file.mimetype,
        ocrStatus: "pending"
      });

      res.status(201).json({
        message: "Document uploaded successfully",
        document
      });

    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);


/* =========================
   GET PATIENT DOCUMENTS
========================= */

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


/* =========================
   GET DOCTOR DOCUMENTS
========================= */

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


/* =========================
   VIEW DOCUMENT
========================= */

router.get("/:id/view", auth, async (req, res) => {
  try {
    const document =
      await Document.findById(req.params.id);

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
        message:
          "You do not have access to this document"
      });
    }

    const {
      data: signedUrlData,
      error: signedUrlError
    } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(
        document.fileUrl,
        60 * 5
      );

    if (signedUrlError) {
      console.log(
        "Supabase signed URL error:",
        signedUrlError
      );

      return res.status(500).json({
        message: "Could not access document"
      });
    }

    res.redirect(signedUrlData.signedUrl);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================
   DELETE DOCUMENT
========================= */

router.delete("/:id", auth, async (req, res) => {
  try {
    const document =
      await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const isPatient =
      req.user.role === "patient" &&
      document.patient.toString() === req.user.id;

    if (!isPatient) {
      return res.status(403).json({
        message:
          "You can only delete your own documents"
      });
    }

    const { error: deleteError } =
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([document.fileUrl]);

    if (deleteError) {
      console.log(
        "Supabase delete error:",
        deleteError
      );

      return res.status(500).json({
        message: "Could not delete document file"
      });
    }

    await Document.findByIdAndDelete(
      document._id
    );

    res.json({
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;