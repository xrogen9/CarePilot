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

    Analyze ONLY information explicitly reported by the patient.

    Create a concise, structured intake summary for a doctor who needs to understand the patient's situation quickly.

    Do NOT:
    - diagnose the patient
    - recommend medication or treatment
    - invent symptoms
    - infer medical conditions
    - add information that was not explicitly reported

    Extract the following:

    1. chiefComplaint
      - The main problem or reason for consultation.

    2. duration
      - How long the patient has reported having the problem.

    3. severity
      - The reported severity, intensity, or relevant severity description.
      - If no severity information was provided, use "Not reported".

    4. symptoms
      - A list of relevant symptoms explicitly reported by the patient.
      - Do not include the chief complaint again unless it is also clearly a separate symptom.
      - Use short, clear phrases.

    5. otherInformation
      - Any other useful information explicitly provided that does not fit the above categories.
      - If there is none, use an empty string.

    Keep everything concise and easy for a doctor to scan.

    Return ONLY valid JSON in exactly this structure:

    {
      "summary": {
        "chiefComplaint": "",
        "duration": "",
        "severity": "",
        "symptoms": [],
        "otherInformation": ""
      },
      "urgency": "normal",
      "flagReason": "",
      "redFlags": []
    }

    Urgency must be exactly one of:

    "normal"
    - No obvious urgent warning signs are explicitly reported.

    "review"
    - Something concerning, unusual, or unclear is explicitly reported and should receive additional clinical review.

    "urgent"
    - Explicitly reported symptoms/signs could indicate a potentially serious situation requiring prompt medical evaluation.

    If urgency is "normal":
    - flagReason must be ""
    - redFlags must be []

    If urgency is "review" or "urgent":
    - redFlags must contain ONLY concerning symptoms explicitly reported by the patient.
    - flagReason must briefly explain why those reported symptoms deserve attention.
    - Do not diagnose the patient.

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
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text);

    await Assessment.findByIdAndUpdate(assessmentId, {
      summary: result.summary,
      urgency: result.urgency,
      flagReason: result.flagReason,
      redFlags: result.redFlags
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
