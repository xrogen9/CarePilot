const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    if (require.main === module) {
      app.listen(5000, () => console.log("Server running on port 5000"));
    }
  })
  .catch(err => console.log("MongoDB error:", err));

app.get("/", (req, res) => {
  res.json({ message: "CarePilot API running" });
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const assessmentRoutes = require("./routes/assessment");
app.use("/api/assessment", assessmentRoutes);

const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);

const questionRoutes = require("./routes/question");
app.use("/api/question", questionRoutes);

module.exports = app;