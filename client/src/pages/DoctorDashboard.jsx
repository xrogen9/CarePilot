import { useEffect, useState } from "react";
import API from "../services/api";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await API.get("/assessment/doctor");
        setAssessments(response.data);

        setSelected((current) => {
          if (!current) return null;

          return (
            response.data.find(
              (assessment) => assessment._id === current._id
            ) || current
          );
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchAssessments();

    const interval = setInterval(fetchAssessments, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="doctor-page">
      <header className="doctor-header">
        <div>
          <h1>CarePilot</h1>
          <p>Doctor Dashboard</p>
        </div>

        <div className="doctor-profile">
          <div className="profile-icon">DR</div>

          <div>
            <strong>Dr. {user?.name}</strong>
            <span>Medical Professional</span>
          </div>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="doctor-content">
        <div className="dashboard-title">
          <div>
            <h2>Patients Waiting</h2>
            <p>Review patient assessments before consultation.</p>
          </div>

          <div className="patient-count">
            {assessments.length}{" "}
            {assessments.length === 1 ? "Patient" : "Patients"}
          </div>
        </div>

        {assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h3>No patients waiting</h3>
            <p>New patient assessments will appear here.</p>
          </div>
        ) : (
          <div className="patient-list">
            {assessments.map((assessment) => (
              <div className="patient-card" key={assessment._id}>
                <div className="patient-info">
                  <div className="patient-avatar">
                    {assessment.patient.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{assessment.patient.name}</h3>
                    <p>{assessment.patient.email}</p>

                    <span
                      className={`status-badge ${
                        assessment.urgency || "normal"
                      }`}
                    >
                      {assessment.urgency === "urgent"
                        ? "🔴 Urgent Attention"
                        : assessment.urgency === "review"
                        ? "🟡 Needs Review"
                        : assessment.summary
                        ? "🟢 No Urgent Indicators"
                        : "⏳ AI Processing..."}
                    </span>
                  </div>
                </div>

                <div className="patient-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => setSelected(assessment)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div
          className="modal-overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="patient-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{selected.patient.name}</h2>
                <p>{selected.patient.email}</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <h3>Patient Assessment</h3>

              <div className="answers-list">
                {selected.answers.map((answer, index) => (
                  <div className="answer-item" key={index}>
                    <span>{answer.question}</span>
                    <strong>{answer.answer}</strong>
                  </div>
                ))}
              </div>

              {selected.urgency &&
                selected.urgency !== "normal" && (
                  <div
                    className={`urgency-alert ${selected.urgency}`}
                  >
                    <div className="urgency-alert-title">
                      {selected.urgency === "urgent"
                        ? "🔴 Urgent Attention"
                        : "🟡 Clinical Review Recommended"}
                    </div>

                    <p>{selected.flagReason}</p>

                    {selected.redFlags?.length > 0 && (
                      <div className="red-flags">
                        <strong>Reported warning signs:</strong>

                        <ul>
                          {selected.redFlags.map((flag, index) => (
                            <li key={index}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              {selected.summary &&
              typeof selected.summary === "object" ? (
                <div className="ai-summary">
                  <div className="ai-summary-header">
                    <div className="ai-icon">AI</div>

                    <div>
                      <h3>AI Intake Summary</h3>
                      <span>
                        Structured from reported patient information
                      </span>
                    </div>
                  </div>

                  <div className="summary-grid">
                    <div className="summary-item summary-wide">
                      <span className="summary-label">
                        CHIEF COMPLAINT
                      </span>

                      <strong>
                        {selected.summary.chiefComplaint ||
                          "Not reported"}
                      </strong>
                    </div>

                    <div className="summary-item">
                      <span className="summary-label">
                        DURATION
                      </span>

                      <strong>
                        {selected.summary.duration ||
                          "Not reported"}
                      </strong>
                    </div>

                    <div className="summary-item">
                      <span className="summary-label">
                        SEVERITY
                      </span>

                      <strong>
                        {selected.summary.severity ||
                          "Not reported"}
                      </strong>
                    </div>
                  </div>

                  {selected.summary.symptoms?.length > 0 && (
                    <div className="summary-symptoms">
                      <span className="summary-label">
                        REPORTED SYMPTOMS
                      </span>

                      <div className="symptom-tags">
                        {selected.summary.symptoms.map(
                          (symptom, index) => (
                            <span
                              className="symptom-tag"
                              key={index}
                            >
                              {symptom}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {selected.summary.otherInformation && (
                    <div className="summary-other">
                      <span className="summary-label">
                        OTHER RELEVANT INFORMATION
                      </span>

                      <p>
                        {selected.summary.otherInformation}
                      </p>
                    </div>
                  )}

                  <div className="summary-footer">
                    <span>AI-assisted intake summary</span>
                    <small>Not a diagnosis</small>
                  </div>
                </div>
              ) : (
                <div className="ai-summary processing-summary">
                  <div className="ai-summary-header">
                    <div className="ai-icon">AI</div>

                    <div>
                      <h3>AI Summary Processing</h3>
                      <span>
                        Preparing a structured clinical summary
                      </span>
                    </div>
                  </div>

                  <p>
                    The AI summary is being prepared. It will
                    appear automatically when processing is
                    complete.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;