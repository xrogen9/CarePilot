import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [history, setHistory] = useState([]);
  const [doctorCode, setDoctorCode] = useState("");
  const [doctor, setDoctor] = useState(null);
  const [connectMessage, setConnectMessage] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [changingDoctor, setChangingDoctor] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await API.get("/assessment/history");
        setHistory(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await API.get("/auth/me");

        if (response.data.connectedDoctor) {
          setDoctor(response.data.connectedDoctor);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchDoctor();
  }, []);

  const connectDoctor = async () => {
    try {
      setConnectMessage("");

      const response = await API.post("/auth/connect-doctor", {
        doctorCode
      });

      setDoctor(response.data.doctor);
      setDoctorCode("");
      setChangingDoctor(false);

      setConnectMessage("Successfully connected to your doctor.");

      setTimeout(() => {
        setConnectMessage("");
      }, 2500);
    } catch (error) {
      setConnectMessage(
        error.response?.data?.message || "Could not connect to doctor."
      );
    }
  };

  return (
    <div className="patient-page">
      <header className="patient-header">
        <div>
          <h1>CarePilot</h1>
          <p>Patient Portal</p>
        </div>

        <div className="patient-profile">
          <div className="profile-icon">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user?.name}</strong>
            <span>Patient</span>
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

      <main className="patient-content">
        <section className="doctor-connect-card">
          <div>
            <span className="card-label">YOUR DOCTOR</span>

            {doctor && !changingDoctor ? (
              <>
                <h2>Connected to Dr. {doctor.name}</h2>

                <p>
                  Your future health assessments will be sent directly to this
                  doctor.
                </p>

                <button
                  className="change-doctor-btn"
                  onClick={() => {
                    setChangingDoctor(true);
                    setConnectMessage("");
                  }}
                >
                  Change Doctor
                </button>
              </>
            ) : (
              <>
                <h2>
                  {doctor
                    ? "Connect to a different doctor"
                    : "Connect to your doctor"}
                </h2>

                <p>
                  Enter the CarePilot code provided by your doctor.
                </p>

                <div className="doctor-code-input">
                  <input
                    type="text"
                    placeholder="Enter doctor code"
                    value={doctorCode}
                    onChange={(e) => setDoctorCode(e.target.value)}
                  />

                  <button onClick={connectDoctor}>
                    {doctor ? "Change Doctor" : "Connect"}
                  </button>
                </div>

                {doctor && (
                  <button
                    className="cancel-change-btn"
                    onClick={() => {
                      setChangingDoctor(false);
                      setDoctorCode("");
                      setConnectMessage("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            {connectMessage && (
              <p className="connect-message">{connectMessage}</p>
            )}
          </div>
        </section>

        <section className="welcome-section">
          <p className="welcome-label">WELCOME BACK</p>
          <h2>Hello, {user?.name} 👋</h2>
          <p>
            Manage your health information and prepare for your next
            consultation.
          </p>
        </section>

        <section className="assessment-card">
          <div className="assessment-icon">+</div>

          <div className="assessment-info">
            <span className="card-label">PRE-CONSULTATION</span>
            <h2>Health Assessment</h2>
            <p>
              Answer a few simple questions about your symptoms. Your
              responses will help your doctor prepare before your consultation.
            </p>

            <button
              className="assessment-button"
              onClick={() => navigate("/assessment")}
            >
              Start Health Assessment
              <span>→</span>
            </button>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="info-card">
            <div className="info-icon">✓</div>

            <div>
              <h3>Doctor Preparation</h3>
              <p>
                Your assessment is summarized for your doctor before your
                consultation.
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">🔒</div>

            <div>
              <h3>Private & Secure</h3>
              <p>
                Your health information is securely handled and shared only
                for your care.
              </p>
            </div>
          </div>
        </section>

        <section className="history-section">
          <div className="history-header">
            <div>
              <span className="card-label">YOUR RECORD</span>
              <h2>Assessment History</h2>
              <p>Review your previous health assessments.</p>
            </div>

            <div className="history-count">
              {history.length}{" "}
              {history.length === 1 ? "Assessment" : "Assessments"}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📋</div>
              <h3>No assessment history yet</h3>
              <p>Your completed assessments will appear here.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((assessment) => (
                <div
                  className="history-card"
                  key={assessment._id}
                  onClick={() => setSelectedHistory(assessment)}
                >
                  <div className="history-card-top">
                    <div>
                      <span className="history-date">
                        {new Date(assessment.createdAt).toLocaleString()}
                      </span>

                      <h3>
                        {assessment.summary?.chiefComplaint ||
                          assessment.answers?.[0]?.answer ||
                          "Health Assessment"}
                      </h3>
                    </div>

                    <span
                      className={`history-urgency ${
                        assessment.urgency || "normal"
                      }`}
                    >
                      {assessment.urgency === "urgent"
                        ? "🔴 Urgent"
                        : assessment.urgency === "review"
                        ? "🟡 Review"
                        : "🟢 Normal"}
                    </span>
                  </div>

                  {assessment.summary?.symptoms?.length > 0 && (
                    <div className="history-symptoms">
                      {assessment.summary.symptoms.map((symptom, index) => (
                        <span key={index}>{symptom}</span>
                      ))}
                    </div>
                  )}

                  {assessment.summary?.otherInformation && (
                    <p className="history-summary">
                      {assessment.summary.otherInformation}
                    </p>
                  )}

                  {assessment.doctor && (
                    <div className="history-doctor">
                      <span>Doctor</span>
                      <strong>Dr. {assessment.doctor.name}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="dashboard-note">
          <strong>How CarePilot helps:</strong> Complete your assessment
          before meeting your doctor to reduce repetitive questions and
          consultation time.
        </div>
      </main>

      {selectedHistory && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedHistory(null)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <span className="card-label">ASSESSMENT RECORD</span>

                <h2>
                  {selectedHistory.summary?.chiefComplaint ||
                    "Health Assessment"}
                </h2>

                <p>
                  {new Date(
                    selectedHistory.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <button
                className="history-close-btn"
                onClick={() => setSelectedHistory(null)}
              >
                ×
              </button>
            </div>

            <div className="history-modal-content">
              <div className="history-detail-grid">
                <div className="history-detail">
                  <span>CHIEF COMPLAINT</span>
                  <strong>
                    {selectedHistory.summary?.chiefComplaint ||
                      "Not reported"}
                  </strong>
                </div>

                <div className="history-detail">
                  <span>DURATION</span>
                  <strong>
                    {selectedHistory.summary?.duration ||
                      "Not reported"}
                  </strong>
                </div>

                <div className="history-detail">
                  <span>SEVERITY</span>
                  <strong>
                    {selectedHistory.summary?.severity ||
                      "Not reported"}
                  </strong>
                </div>

                <div className="history-detail">
                  <span>URGENCY</span>
                  <strong>
                    {selectedHistory.urgency === "urgent"
                      ? "🔴 Urgent"
                      : selectedHistory.urgency === "review"
                      ? "🟡 Review Recommended"
                      : "🟢 No Urgent Indicators"}
                  </strong>
                </div>
              </div>

              {selectedHistory.summary?.symptoms?.length > 0 && (
                <div className="history-modal-section">
                  <span className="history-section-label">
                    REPORTED SYMPTOMS
                  </span>

                  <div className="history-symptoms">
                    {selectedHistory.summary.symptoms.map(
                      (symptom, index) => (
                        <span key={index}>{symptom}</span>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedHistory.summary?.otherInformation && (
                <div className="history-modal-section">
                  <span className="history-section-label">
                    OTHER RELEVANT INFORMATION
                  </span>

                  <p className="history-modal-text">
                    {selectedHistory.summary.otherInformation}
                  </p>
                </div>
              )}

              {selectedHistory.urgency &&
                selectedHistory.urgency !== "normal" && (
                  <div
                    className={`history-warning ${
                      selectedHistory.urgency
                    }`}
                  >
                    <strong>
                      {selectedHistory.urgency === "urgent"
                        ? "🔴 Urgent Attention"
                        : "🟡 Clinical Review Recommended"}
                    </strong>

                    {selectedHistory.flagReason && (
                      <p>{selectedHistory.flagReason}</p>
                    )}

                    {selectedHistory.redFlags?.length > 0 && (
                      <div>
                        <strong>Reported warning signs:</strong>

                        <ul>
                          {selectedHistory.redFlags.map(
                            (flag, index) => (
                              <li key={index}>{flag}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              <div className="history-doctor-detail">
                <span>ASSESSMENT SENT TO</span>

                <strong>
                  {selectedHistory.doctor
                    ? `Dr. ${selectedHistory.doctor.name}`
                    : "Doctor information unavailable"}
                </strong>
              </div>

              <div className="history-ai-note">
                <strong>AI-assisted intake summary</strong>
                <span>Not a diagnosis</span>
              </div>
            </div>

            <div className="history-modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setSelectedHistory(null)}
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

export default PatientDashboard;