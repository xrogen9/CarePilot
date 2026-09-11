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
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["waiting", "completed", "reviewed"],
    default: "waiting"
  }
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema);