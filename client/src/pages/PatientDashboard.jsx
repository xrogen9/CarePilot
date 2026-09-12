import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [doctorCode, setDoctorCode] = useState("");
  const [connectMessage, setConnectMessage] = useState("");
  const [changingDoctor, setChangingDoctor] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        historyResponse,
        documentResponse,
        doctorResponse
      ] = await Promise.all([
        API.get("/assessment/history"),
        API.get("/document/patient"),
        API.get("/auth/me")
      ]);

      setHistory(historyResponse.data);
      setDocuments(documentResponse.data);

      if (doctorResponse.data.connectedDoctor) {
        setDoctor(doctorResponse.data.connectedDoctor);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectDoctor = async () => {
    try {
      setConnectMessage("");

      const response = await API.post(
        "/auth/connect-doctor",
        { doctorCode }
      );

      setDoctor(response.data.doctor);
      setDoctorCode("");
      setChangingDoctor(false);

      setConnectMessage(
        "Successfully connected to your doctor."
      );

      setTimeout(() => {
        setConnectMessage("");
      }, 2500);
    } catch (error) {
      setConnectMessage(
        error.response?.data?.message ||
          "Could not connect to doctor."
      );
    }
  };

  const latestAssessment = history[0];
  const latestDocument = documents[0];

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

        {/* DOCTOR CONNECTION */}

        <section className="doctor-connect-card">
          <span className="card-label">
            YOUR DOCTOR
          </span>

          {doctor && !changingDoctor ? (
            <>
              <h2>
                Connected to Dr. {doctor.name}
              </h2>

              <p>
                Your future health assessments will be
                sent directly to this doctor.
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
                Enter the CarePilot code provided by
                your doctor.
              </p>

              <div className="doctor-code-input">
                <input
                  type="text"
                  placeholder="Enter doctor code"
                  value={doctorCode}
                  onChange={(e) =>
                    setDoctorCode(e.target.value)
                  }
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
            <p className="connect-message">
              {connectMessage}
            </p>
          )}
        </section>

        {/* WELCOME */}

        <section className="welcome-section">
          <p className="welcome-label">
            WELCOME BACK
          </p>

          <h2>
            Hello, {user?.name} 👋
          </h2>

          <p>
            Manage your health information and prepare
            for your next consultation.
          </p>
        </section>

        {/* NEW ASSESSMENT */}

        <section className="assessment-card">
          <div className="assessment-icon">
            +
          </div>

          <div className="assessment-info">
            <span className="card-label">
              PRE-CONSULTATION
            </span>

            <h2>Health Assessment</h2>

            <p>
              Answer a few simple questions about your
              symptoms. Your responses will help your
              doctor prepare before your consultation.
            </p>

            <button
              className="assessment-button"
              onClick={() =>
                navigate("/assessment")
              }
            >
              Start Health Assessment
              <span>→</span>
            </button>
          </div>
        </section>

        {/* STATS */}

        <section className="record-stats">

          <div
            className="record-stat-card"
            onClick={() =>
              navigate("/patient/assessments")
            }
          >
            <div className="record-stat-icon">
              📋
            </div>

            <div>
              <span>ASSESSMENTS</span>

              <strong>
                {history.length}
              </strong>

              <p>
                View assessment history →
              </p>
            </div>
          </div>

          <div
            className="record-stat-card"
            onClick={() =>
              navigate("/patient/documents")
            }
          >
            <div className="record-stat-icon">
              📄
            </div>

            <div>
              <span>MEDICAL DOCUMENTS</span>

              <strong>
                {documents.length}
              </strong>

              <p>
                View medical records →
              </p>
            </div>
          </div>

          <div className="record-stat-card">
            <div className="record-stat-icon">
              🔒
            </div>

            <div>
              <span>RECORD SECURITY</span>

              <strong>Protected</strong>

              <p>
                Your records are securely handled.
              </p>
            </div>
          </div>

        </section>

        {/* RECENT ACTIVITY */}

        <section className="recent-section">
          <div className="recent-header">
            <div>
              <span className="card-label">
                RECENT ACTIVITY
              </span>

              <h2>Your Latest Records</h2>
            </div>
          </div>

          <div className="recent-grid">

            {/* LATEST ASSESSMENT */}

            <div className="recent-card">
              <div className="recent-card-header">
                <div className="recent-icon">
                  📋
                </div>

                <button
                  onClick={() =>
                    navigate("/patient/assessments")
                  }
                >
                  View All →
                </button>
              </div>

              <span className="recent-label">
                LATEST ASSESSMENT
              </span>

              {latestAssessment ? (
                <>
                  <h3>
                    {latestAssessment.summary
                      ?.chiefComplaint ||
                      latestAssessment.answers?.[0]
                        ?.answer ||
                      "Health Assessment"}
                  </h3>

                  <p>
                    {new Date(
                      latestAssessment.createdAt
                    ).toLocaleString()}
                  </p>

                  <span
                    className={`recent-urgency ${
                      latestAssessment.urgency ||
                      "normal"
                    }`}
                  >
                    {latestAssessment.urgency ===
                    "urgent"
                      ? "🔴 Urgent"
                      : latestAssessment.urgency ===
                        "review"
                      ? "🟡 Review Recommended"
                      : "🟢 Normal"}
                  </span>
                </>
              ) : (
                <>
                  <h3>
                    No assessments yet
                  </h3>

                  <p>
                    Complete your first assessment
                    to see it here.
                  </p>
                </>
              )}
            </div>

            {/* LATEST DOCUMENT */}

            <div className="recent-card">
              <div className="recent-card-header">
                <div className="recent-icon">
                  📄
                </div>

                <button
                  onClick={() =>
                    navigate("/patient/documents")
                  }
                >
                  View All →
                </button>
              </div>

              <span className="recent-label">
                LATEST DOCUMENT
              </span>

              {latestDocument ? (
                <>
                  <h3>
                    {latestDocument.fileName}
                  </h3>

                  <p>
                    {latestDocument.type ===
                    "prescription"
                      ? "Prescription"
                      : latestDocument.type ===
                        "test-report"
                      ? "Test Report"
                      : "Other Document"}
                  </p>

                  <small>
                    Uploaded{" "}
                    {new Date(
                      latestDocument.createdAt
                    ).toLocaleString()}
                  </small>
                </>
              ) : (
                <>
                  <h3>
                    No documents yet
                  </h3>

                  <p>
                    Upload a medical record to see it
                    here.
                  </p>
                </>
              )}
            </div>

          </div>
        </section>

        <section className="dashboard-grid">
          <div className="info-card">
            <div className="info-icon">
              ✓
            </div>

            <div>
              <h3>Doctor Preparation</h3>

              <p>
                Your assessment is summarized for your
                doctor before your consultation.
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              🔒
            </div>

            <div>
              <h3>Private & Secure</h3>

              <p>
                Your health information is securely
                handled and shared only for your care.
              </p>
            </div>
          </div>
        </section>

        <div className="dashboard-note">
          <strong>How CarePilot helps:</strong>{" "}
          Complete your assessment before meeting your
          doctor to reduce repetitive questions and
          consultation time.
        </div>

      </main>
    </div>
  );
}

export default PatientDashboard;