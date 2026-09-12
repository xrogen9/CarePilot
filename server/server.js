const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  cachedConnection = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000
  });

  try {
    await cachedConnection;

    console.log("MongoDB connected");

    return cachedConnection;
  } catch (error) {
    cachedConnection = null;

    console.log("MongoDB error:", error.message);
    console.log("MongoDB reason:", error.reason);

    throw error;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.log("Database unavailable:", error.message);

    res.status(503).json({
      message: "Database temporarily unavailable"
    });
  }
});

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

const documentRoutes = require("./routes/document");
app.use("/api/document", documentRoutes);

const doctorRoutes = require("./routes/doctor");
app.use("/api/doctor", doctorRoutes);

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(5000, () => {
        console.log("Server running on port 5000");
      });
    })
    .catch((error) => {
      console.log("Could not start server:", error.message);
    });
}

module.exports = app;