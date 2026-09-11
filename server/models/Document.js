const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    default: null
  },

  type: {
    type: String,
    enum: ["prescription", "test-report", "other"],
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  fileUrl: {
    type: String,
    required: true
  },

  mimeType: {
    type: String,
    required: true
  },

  extractedText: {
    type: String,
    default: ""
  },

  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  ocrStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Document", documentSchema);