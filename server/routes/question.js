const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const auth = require("../middleware/auth");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.post("/next", auth, async (req, res) => {
  try {
    const { answers } = req.body;

    const answersText = answers
      .map((item) => `${item.question}: ${item.answer}`)
      .join("\n");

    const prompt = `
    You are an adaptive medical intake questionnaire assistant.

    Based ONLY on the information provided by the patient, generate the ONE most relevant next question.

    Rules:
    - Ask exactly ONE question.
    - Keep it simple and patient-friendly.
    - Do not diagnose.
    - Do not recommend medication or treatment.
    - Do not assume information that was not provided.
    - Do not repeat a question that has already been answered.
    - Focus on symptoms, duration, severity, associated symptoms, or other information useful to a doctor.
    - Generate 3 to 5 short multiple-choice options whenever possible.
    - Options should be mutually understandable and relevant to the question.
    - Do not make options overly specific or medically complicated.
    - Do not include an "Other" option in the generated choices. The application will provide an "Other" option separately.
    - Stop when enough useful information has been collected.

    Previous patient answers:

    ${answersText || "No answers yet."}

    Return ONLY valid JSON in this exact format:

    {
      "done": false,
      "question": "Your question here",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3"
      ]
    }

    If enough information has been collected, return:

    {
      "done": true,
      "question": null,
      "options": []
    }
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

    let result;

    try {
      result = JSON.parse(response.text);
    } catch (error) {
      console.log("Invalid AI JSON:", response.text);

      return res.status(500).json({
        message: "AI returned an invalid question"
      });
    }

    res.json(result);
  } catch (error) {
    console.log("AI question error:", error);

    res.status(500).json({
      message: "Failed to generate next question"
    });
  }
});

module.exports = router;