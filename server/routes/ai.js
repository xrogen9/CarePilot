const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const Assessment = require("../models/Assessment");
const mongoose = require("mongoose");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.post("/summary/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid assessment ID"
      });
    }

    const assessment = await Assessment.findById(req.params.id)
      .populate("patient", "name email");

    if (!assessment) {
      return res.status(404).json({
        message: "Assessment not found"
      });
    }

    const answersText = assessment.answers
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
1. Chief complaint
2. Duration
3. Severity
4. Relevant reported symptoms
5. Other relevant information explicitly provided

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
            thinkingLevel: "minimal"
            }
        }
        });

    const summary = response.text;

    assessment.summary = summary;
    assessment.status = "completed";

    await assessment.save();

    res.json({
      message: "Summary generated",
      summary
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to generate summary"
    });
  }
});

module.exports = router;