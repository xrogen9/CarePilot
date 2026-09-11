const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  answers: [
    {
      question: String,
      answer: String
    }
  ],
  summary: {
    chiefComplaint: {
      type: String,
      default: ""
    },
    duration: {
      type: String,
      default: ""
    },
    severity: {
      type: String,
      default: ""
    },
    symptoms: {
      type: [String],
      default: []
    },
    otherInformation: {
      type: String,
      default: ""
    }
  },
  urgency: {
    type: String,
    enum: ["normal", "review", "urgent"],
    default: "normal"
  },
  flagReason: {
    type: String,
    default: ""
  },
  redFlags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ["waiting", "completed", "reviewed"],
    default: "waiting"
  }
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema);