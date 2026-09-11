import { useNavigate } from "react-router-dom";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

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

        <div className="dashboard-note">
          <strong>How CarePilot helps:</strong> Complete your assessment
          before meeting your doctor to reduce repetitive questions and
          consultation time.
        </div>
      </main>
    </div>
  );
}

export default PatientDashboard;