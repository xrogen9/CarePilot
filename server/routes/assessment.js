const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const Assessment = require("../models/Assessment");
const auth = require("../middleware/auth");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateAISummary = async (assessmentId, answers) => {
  try {
    const answersText = answers
      .map((item) => `${item.question}: ${item.answer}`)
      .join("\n");

    const prompt = `
You are a medical intake summarization assistant.

Your task is ONLY to summarize information explicitly provided by the patient.

Do NOT:
- diagnose the patient
- recommend medication
- invent symptoms
- infer medical conditions
- make claims that are not supported by the answers

Create a concise summary for a doctor.

Include:
1. Chief Complaint
2. Duration
3. Severity
4. Relevant Reported Symptoms
5. Other Relevant Information explicitly provided

Use plain text only.
Do not use Markdown.
Do not use asterisks.
Keep the summary concise and easy to scan.

Patient intake answers:

${answersText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: "minimal",
        },
      },
    });

    await Assessment.findByIdAndUpdate(assessmentId, {
      summary: response.text,
    });

    console.log("AI summary generated:", assessmentId);
  } catch (error) {
    console.log("AI summary error:", error);
  }
};

router.post("/", auth, async (req, res) => {
  try {
    const { patient, answers } = req.body;

    const assessment = await Assessment.create({
      patient,
      answers,
      status: "waiting",
    });

    // Send success to patient immediately
    res.status(201).json({
      message: "Assessment submitted successfully",
      assessment,
    });

    // Generate AI summary in background
    generateAISummary(assessment._id, answers);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

router.get("/doctor", auth, (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({
      message: "Doctor access required"
    });
  }

  next();
}, async (req, res) => {
  try {
    const assessments = await Assessment.find({
      status: "waiting",
    })
      .populate("patient", "name email")
      .sort({ createdAt: 1 });

    res.json(assessments);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
