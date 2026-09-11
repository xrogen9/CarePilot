import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Assessment.css";

function Assessment() {
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState(
    "What is your main health issue?"
  );
  const [options, setOptions] = useState([
    "Fever",
    "Pain",
    "Cough",
    "Stomach problem"
  ]);
  const [answers, setAnswers] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherAnswer, setOtherAnswer] = useState("");

  const getNextQuestion = async (newAnswers) => {
    try {
      setLoading(true);

      const response = await API.post("/question/next", {
        answers: newAnswers
      });

      if (response.data.done) {
        setSubmitting(true);

        const user = JSON.parse(localStorage.getItem("user"));

        await API.post("/assessment", {
          patient: user.id,
          answers: newAnswers
        });

        alert("Assessment submitted successfully!");
        navigate("/patient");
        return;
      }

      setCurrentQuestion(response.data.question);
      setOptions(response.data.options || []);
      setQuestionNumber((prev) => prev + 1);
      setOtherSelected(false);
      setOtherAnswer("");
    } catch (error) {
      console.log(error);
      alert("Failed to generate next question");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleAnswer = async (selectedAnswer) => {
    if (loading || submitting) return;

    const newAnswers = [
      ...answers,
      {
        question: currentQuestion,
        answer: selectedAnswer
      }
    ];

    setAnswers(newAnswers);

    await getNextQuestion(newAnswers);
  };

  const handleOtherSubmit = async () => {
    if (!otherAnswer.trim() || loading || submitting) return;

    await handleAnswer(otherAnswer.trim());
  };

  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <div>
          <h1>CarePilot</h1>
          <p>Patient Health Assessment</p>
        </div>

        <div className="secure-label">
          <span>●</span> Secure Assessment
        </div>
      </header>

      <main className="assessment-container">
        <div className="assessment-intro">
          <h2>Let's understand your symptoms</h2>
          <p>
            Answer a few questions to help your doctor understand your
            condition before your consultation.
          </p>
        </div>

        <div className="progress-section">
          <div className="progress-info">
            <span>Assessment Progress</span>
            <span>Question {questionNumber}</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min((questionNumber / 8) * 100, 95)}%`
              }}
            ></div>
          </div>
        </div>

        <div className="question-card">
          <div className="question-number">
            QUESTION {questionNumber}
          </div>

          <h2>{currentQuestion}</h2>

          <p className="question-help">
            Select the option that best describes your situation.
          </p>

          <div className="options">
            {options.map((option, index) => (
              <button
                className="option-button"
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={loading || submitting}
              >
                <span>{option}</span>
                <span className="option-arrow">→</span>
              </button>
            ))}

            <button
              className="option-button"
              onClick={() => setOtherSelected(true)}
              disabled={loading || submitting}
            >
              <span>Other</span>
              <span className="option-arrow">→</span>
            </button>
          </div>

          {otherSelected && (
            <div className="other-answer">
              <textarea
                className="answer-input"
                value={otherAnswer}
                onChange={(e) => setOtherAnswer(e.target.value)}
                placeholder="Please describe your answer..."
                rows="3"
                disabled={loading || submitting}
              />

              <button
                className="option-button"
                onClick={handleOtherSubmit}
                disabled={!otherAnswer.trim() || loading || submitting}
              >
                <span>Continue</span>
                <span className="option-arrow">→</span>
              </button>
            </div>
          )}
        </div>

        {loading || submitting ? (
          <div className="submitting-message">
            <div className="spinner"></div>

            <div>
              <strong>
                {submitting
                  ? "Preparing your assessment..."
                  : "Personalizing your next question..."}
              </strong>

              <p>
                {submitting
                  ? "Your responses are being securely submitted."
                  : "CarePilot is adapting the assessment to your answers."}
              </p>
            </div>
          </div>
        ) : (
          <div className="assessment-note">
            Questions are personalized based on your previous answers.
          </div>
        )}
      </main>
    </div>
  );
}

export default Assessment;