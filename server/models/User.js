const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["patient", "doctor"],
    required: true
  },

  doctorCode: {
    type: String,
    unique: true,
    sparse: true
  },

  doctorCodeExpiresAt: {
    type: Date
  },
  connectedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);