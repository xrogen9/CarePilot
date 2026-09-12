import { useEffect, useState } from "react";
import API from "../services/api";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);

  const [selected, setSelected] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [activePanel, setActivePanel] =
    useState("dashboard");

  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const [codeMessage, setCodeMessage] = useState("");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  /* =========================
     FETCH DATA
  ========================= */

  const fetchDashboardData = async () => {
    try {
      const [
        pendingResponse,
        historyResponse,
        patientsResponse
      ] = await Promise.all([
        API.get("/doctor/pending"),
        API.get("/doctor/history"),
        API.get("/doctor/patients")
      ]);

      setPending(pendingResponse.data);
      setHistory(historyResponse.data);
      setPatients(patientsResponse.data);

      setSelected((current) => {
        if (!current) return null;

        const updated =
          [...pendingResponse.data, ...historyResponse.data]
            .find(
              (assessment) =>
                assessment._id === current._id
            );

        return updated || current;
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(
      fetchDashboardData,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  /* =========================
     DOCTOR CODE
  ========================= */

  const regenerateCode = async () => {
    try {
      setCodeMessage("");

      const response = await API.post(
        "/auth/regenerate-doctor-code"
      );

      const updatedUser = {
        ...user,
        doctorCode: response.data.doctorCode,
        doctorCodeExpiresAt:
          response.data.doctorCodeExpiresAt
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setCodeMessage("New code generated.");

      window.location.reload();
    } catch (error) {
      setCodeMessage(
        error.response?.data?.message ||
          "Could not generate a new code."
      );
    }
  };

  /* =========================
     MARK REVIEWED
  ========================= */

  const markAsReviewed = async (assessment) => {
    const confirmed = window.confirm(
      `Mark ${assessment.patient?.name}'s assessment as reviewed?`
    );

    if (!confirmed) return;

    try {
      setReviewing(true);

      await API.patch(
        `/doctor/assessment/${assessment._id}/review`
      );

      setSelected(null);

      await fetchDashboardData();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Could not mark assessment as reviewed."
      );
    } finally {
      setReviewing(false);
    }
  };

  /* =========================
     HELPERS
  ========================= */

  const getInitial = (name) => {
    return (
      name?.charAt(0)?.toUpperCase() || "P"
    );
  };

  const getComplaint = (assessment) => {
    return (
      assessment.summary?.chiefComplaint ||
      assessment.answers?.[0]?.answer ||
      "Health assessment"
    );
  };

  const getTime = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString();
  };

  const getStatus = (assessment) => {
    if (assessment.urgency === "urgent") {
      return "🔴 Urgent";
    }

    if (assessment.urgency === "review") {
      return "🟡 Review";
    }

    return "🟢 Normal";
  };

  const urgentAssessments = pending.filter(
    (assessment) =>
      assessment.urgency === "urgent"
  );

  const reviewAssessments = pending.filter(
    (assessment) =>
      assessment.urgency === "review"
  );

  const openPatient = async (patient) => {
    try {
      const response = await API.get(
        `/doctor/patients/${patient.patient._id}`
      );

      setSelectedPatient(response.data);
    } catch (error) {
      console.log(error);

      alert(
        "Could not load this patient's records."
      );
    }
  };

  const closePatient = () => {
    setSelectedPatient(null);
  };

  return (
    <div className="doctor-page">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="doctor-sidebar">

        <div className="sidebar-brand">
          <h1>CarePilot</h1>
          <span>Doctor Portal</span>
        </div>

        <nav className="sidebar-nav">

          <button
            className={
              activePanel === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePanel("dashboard")
            }
          >
            <span className="nav-icon">▦</span>
            Dashboard
          </button>

          <div className="nav-section-title">
            PATIENT CARE
          </div>

          <button
            className={
              activePanel === "pending"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePanel("pending")
            }
          >
            <span className="nav-icon">◷</span>
            Pending Patients

            {pending.length > 0 && (
              <span className="nav-count">
                {pending.length}
              </span>
            )}
          </button>

          <button
            className={
              activePanel === "urgent"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePanel("urgent")
            }
          >
            <span className="nav-icon">!</span>
            Urgent Attention

            {urgentAssessments.length > 0 && (
              <span className="nav-count urgent-count">
                {urgentAssessments.length}
              </span>
            )}
          </button>

          <button
            className={
              activePanel === "patients"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePanel("patients")
            }
          >
            <span className="nav-icon">♙</span>
            All Patients

            {patients.length > 0 && (
              <span className="nav-count">
                {patients.length}
              </span>
            )}
          </button>

          <div className="nav-section-title">
            RECORDS
          </div>

          <button
            className={
              activePanel === "history"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePanel("history")
            }
          >
            <span className="nav-icon">↺</span>
            Case History

            {history.length > 0 && (
              <span className="nav-count">
                {history.length}
              </span>
            )}
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-doctor">

            <div className="sidebar-avatar">
              {getInitial(user?.name)}
            </div>

            <div>
              <strong>
                Dr. {user?.name}
              </strong>

              <span>
                Medical Professional
              </span>
            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <div className="doctor-main">

        <header className="doctor-topbar">

          <div>
            <span className="topbar-label">
              CAREPILOT
            </span>

            <h2>
              {activePanel === "dashboard"
                ? "Dashboard"
                : activePanel === "pending"
                ? "Pending Patients"
                : activePanel === "urgent"
                ? "Urgent Attention"
                : activePanel === "history"
                ? "Case History"
                : "All Patients"}
            </h2>
          </div>

          <div className="topbar-profile">

            <div className="topbar-avatar">
              {getInitial(user?.name)}
            </div>

            <div>
              <strong>
                Dr. {user?.name}
              </strong>

              <span>Doctor</span>
            </div>

          </div>

        </header>

        <main className="doctor-content">

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>
                Loading your patient records...
              </p>
            </div>
          ) : (
            <>

              {/* =========================
                  DASHBOARD
              ========================= */}

              {activePanel === "dashboard" && (
                <>

                  <div className="welcome-section">
                    <h1>
                      Good morning, Dr. {user?.name}
                    </h1>

                    <p>
                      Here's an overview of your
                      patient activity.
                    </p>
                  </div>

                  <div className="overview-stats">

                    <div className="overview-stat">
                      <div className="overview-stat-icon">
                        ♙
                      </div>

                      <div>
                        <span>
                          Total Patients
                        </span>

                        <strong>
                          {patients.length}
                        </strong>
                      </div>
                    </div>

                    <div className="overview-stat">
                      <div className="overview-stat-icon pending-icon">
                        ◷
                      </div>

                      <div>
                        <span>
                          Pending Cases
                        </span>

                        <strong>
                          {pending.length}
                        </strong>
                      </div>
                    </div>

                    <div className="overview-stat urgent-stat">
                      <div className="overview-stat-icon urgent-icon">
                        !
                      </div>

                      <div>
                        <span>
                          Urgent Cases
                        </span>

                        <strong>
                          {urgentAssessments.length}
                        </strong>
                      </div>
                    </div>

                    <div className="overview-stat">
                      <div className="overview-stat-icon review-icon">
                        ✓
                      </div>

                      <div>
                        <span>
                          Completed Reviews
                        </span>

                        <strong>
                          {history.length}
                        </strong>
                      </div>
                    </div>

                  </div>

                  <div className="dashboard-panels">

                    {/* PENDING */}

                    <section className="dashboard-panel">

                      <div className="panel-header">

                        <div>
                          <h3>
                            Pending Patients
                          </h3>

                          <p>
                            Cases waiting for your review
                          </p>
                        </div>

                        <button
                          className="panel-link"
                          onClick={() =>
                            setActivePanel("pending")
                          }
                        >
                          View All →
                        </button>

                      </div>

                      {pending.length === 0 ? (
                        <div className="panel-empty">
                          <span>✓</span>
                          <p>
                            No pending cases
                          </p>
                        </div>
                      ) : (
                        <div className="panel-list">

                          {pending
                            .slice(0, 4)
                            .map((assessment) => (
                              <div
                                className="panel-patient-row"
                                key={assessment._id}
                              >

                                <div className="row-avatar">
                                  {getInitial(
                                    assessment.patient
                                      ?.name
                                  )}
                                </div>

                                <div className="row-main">

                                  <strong>
                                    {
                                      assessment
                                        .patient?.name
                                    }
                                  </strong>

                                  <span>
                                    {getComplaint(
                                      assessment
                                    )}
                                  </span>

                                </div>

                                <div className="row-right">

                                  <span
                                    className={`status-badge ${
                                      assessment.urgency ||
                                      "normal"
                                    }`}
                                  >
                                    {getStatus(
                                      assessment
                                    )}
                                  </span>

                                  <button
                                    className="row-review-btn"
                                    onClick={() =>
                                      setSelected(
                                        assessment
                                      )
                                    }
                                  >
                                    Review
                                  </button>

                                </div>

                              </div>
                            ))}

                        </div>
                      )}

                    </section>

                    {/* URGENT */}

                    <section className="dashboard-panel urgent-panel">

                      <div className="panel-header">

                        <div>
                          <h3>
                            Urgent Attention
                          </h3>

                          <p>
                            Cases requiring priority review
                          </p>
                        </div>

                        <button
                          className="panel-link urgent-link"
                          onClick={() =>
                            setActivePanel("urgent")
                          }
                        >
                          View All →
                        </button>

                      </div>

                      {urgentAssessments.length ===
                      0 ? (
                        <div className="panel-empty">
                          <span>✓</span>
                          <p>
                            No urgent cases
                          </p>
                        </div>
                      ) : (
                        <div className="panel-list">

                          {urgentAssessments
                            .slice(0, 3)
                            .map((assessment) => (
                              <div
                                className="urgent-row"
                                key={assessment._id}
                              >

                                <div className="urgent-indicator">
                                  !
                                </div>

                                <div className="row-main">

                                  <strong>
                                    {
                                      assessment
                                        .patient?.name
                                    }
                                  </strong>

                                  <span>
                                    {getComplaint(
                                      assessment
                                    )}
                                  </span>

                                </div>

                                <button
                                  className="urgent-review-btn"
                                  onClick={() =>
                                    setSelected(
                                      assessment
                                    )
                                  }
                                >
                                  Review
                                </button>

                              </div>
                            ))}

                        </div>
                      )}

                    </section>

                    {/* HISTORY */}

                    <section className="dashboard-panel">

                      <div className="panel-header">

                        <div>
                          <h3>
                            Recently Reviewed
                          </h3>

                          <p>
                            Your recently completed cases
                          </p>
                        </div>

                        <button
                          className="panel-link"
                          onClick={() =>
                            setActivePanel("history")
                          }
                        >
                          View History →
                        </button>

                      </div>

                      {history.length === 0 ? (
                        <div className="panel-empty">
                          <span>↺</span>
                          <p>
                            No reviewed cases yet
                          </p>
                        </div>
                      ) : (
                        <div className="panel-list">

                          {history
                            .slice(0, 4)
                            .map((assessment) => (
                              <div
                                className="panel-patient-row"
                                key={assessment._id}
                              >

                                <div className="row-avatar">
                                  {getInitial(
                                    assessment.patient
                                      ?.name
                                  )}
                                </div>

                                <div className="row-main">

                                  <strong>
                                    {
                                      assessment
                                        .patient?.name
                                    }
                                  </strong>

                                  <span>
                                    {getComplaint(
                                      assessment
                                    )}
                                  </span>

                                </div>

                                <button
                                  className="row-review-btn"
                                  onClick={() =>
                                    setSelected(
                                      assessment
                                    )
                                  }
                                >
                                  View
                                </button>

                              </div>
                            ))}

                        </div>
                      )}

                    </section>

                    {/* PATIENTS */}

                    <section className="dashboard-panel">

                      <div className="panel-header">

                        <div>
                          <h3>
                            All Patients
                          </h3>

                          <p>
                            Your complete patient directory
                          </p>
                        </div>

                        <button
                          className="panel-link"
                          onClick={() =>
                            setActivePanel("patients")
                          }
                        >
                          Manage →
                        </button>

                      </div>

                      <div className="patient-overview-box">

                        <strong>
                          {patients.length}
                        </strong>

                        <span>
                          total patients have visited
                          you
                        </span>

                        <button
                          className="primary-btn"
                          onClick={() =>
                            setActivePanel("patients")
                          }
                        >
                          Open Patient Directory
                        </button>

                      </div>

                    </section>

                  </div>

                  {/* CODE */}

                  <section className="doctor-code-panel">

                    <div>
                      <span>
                        YOUR CAREPILOT CODE
                      </span>

                      <strong>
                        {user?.doctorCode ||
                          "No code available"}
                      </strong>

                      <p>
                        Share this code with patients
                        so their assessments are sent
                        directly to you.
                      </p>
                    </div>

                    <div className="code-actions">

                      <small>
                        Expires:{" "}
                        {user?.doctorCodeExpiresAt
                          ? new Date(
                              user.doctorCodeExpiresAt
                            ).toLocaleString()
                          : "—"}
                      </small>

                      <button
                        className="secondary-btn"
                        onClick={regenerateCode}
                      >
                        Generate New Code
                      </button>

                      {codeMessage && (
                        <small className="code-message">
                          {codeMessage}
                        </small>
                      )}

                    </div>

                  </section>

                </>
              )}

              {/* =========================
                  PENDING
              ========================= */}

              {activePanel === "pending" && (
                <section className="full-panel">

                  <div className="full-panel-header">

                    <div>
                      <h1>
                        Pending Patients
                      </h1>

                      <p>
                        Review these assessments and
                        mark them as completed.
                      </p>
                    </div>

                    <span className="large-panel-count">
                      {pending.length}
                    </span>

                  </div>

                  {pending.length === 0 ? (
                    <div className="large-empty">
                      <span>✓</span>

                      <h3>
                        You're all caught up
                      </h3>

                      <p>
                        No patients are waiting for
                        review.
                      </p>
                    </div>
                  ) : (
                    <div className="full-assessment-list">

                      {pending.map((assessment) => (
                        <div
                          className="full-assessment-row"
                          key={assessment._id}
                        >

                          <div className="row-avatar">
                            {getInitial(
                              assessment.patient?.name
                            )}
                          </div>

                          <div className="full-row-main">

                            <strong>
                              {
                                assessment.patient
                                  ?.name
                              }
                            </strong>

                            <span>
                              {
                                assessment.patient
                                  ?.email
                              }
                            </span>

                            <small>
                              {getComplaint(
                                assessment
                              )}
                            </small>

                          </div>

                          <div className="full-row-date">
                            {getTime(
                              assessment.createdAt
                            )}
                          </div>

                          <span
                            className={`status-badge ${
                              assessment.urgency ||
                              "normal"
                            }`}
                          >
                            {getStatus(assessment)}
                          </span>

                          <button
                            className="primary-btn"
                            onClick={() =>
                              setSelected(
                                assessment
                              )
                            }
                          >
                            Review
                          </button>

                        </div>
                      ))}

                    </div>
                  )}

                </section>
              )}

              {/* =========================
                  URGENT
              ========================= */}

              {activePanel === "urgent" && (
                <section className="full-panel">

                  <div className="full-panel-header">

                    <div>
                      <h1>
                        Urgent Attention
                      </h1>

                      <p>
                        Priority cases based on the
                        assessment warning system.
                      </p>
                    </div>

                    <span className="large-panel-count urgent-count-box">
                      {urgentAssessments.length}
                    </span>

                  </div>

                  {urgentAssessments.length ===
                  0 ? (
                    <div className="large-empty">
                      <span>✓</span>

                      <h3>
                        No urgent cases
                      </h3>

                      <p>
                        No pending assessments currently
                        require urgent attention.
                      </p>
                    </div>
                  ) : (
                    <div className="urgent-case-list">

                      {urgentAssessments.map(
                        (assessment) => (
                          <div
                            className="urgent-case"
                            key={assessment._id}
                          >

                            <div className="urgent-case-icon">
                              !
                            </div>

                            <div className="urgent-case-main">

                              <div className="urgent-case-title">

                                <h3>
                                  {
                                    assessment
                                      .patient?.name
                                  }
                                </h3>

                                <span>
                                  {getTime(
                                    assessment.createdAt
                                  )}
                                </span>

                              </div>

                              <strong>
                                {getComplaint(
                                  assessment
                                )}
                              </strong>

                              <p>
                                {assessment.flagReason ||
                                  "Warning signs reported during assessment."}
                              </p>

                              {assessment.redFlags
                                ?.length > 0 && (
                                <div className="flag-tags">

                                  {assessment.redFlags.map(
                                    (flag, index) => (
                                      <span
                                        key={index}
                                      >
                                        {flag}
                                      </span>
                                    )
                                  )}

                                </div>
                              )}

                            </div>

                            <button
                              className="urgent-review-btn large-review-btn"
                              onClick={() =>
                                setSelected(
                                  assessment
                                )
                              }
                            >
                              Review Case →
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </section>
              )}

              {/* =========================
                  HISTORY
              ========================= */}

              {activePanel === "history" && (
                <section className="full-panel">

                  <div className="full-panel-header">

                    <div>
                      <h1>
                        Case History
                      </h1>

                      <p>
                        Previously reviewed patient
                        assessments.
                      </p>
                    </div>

                    <span className="large-panel-count">
                      {history.length}
                    </span>

                  </div>

                  {history.length === 0 ? (
                    <div className="large-empty">

                      <span>↺</span>

                      <h3>
                        No case history yet
                      </h3>

                      <p>
                        Cases you mark as reviewed
                        will appear here.
                      </p>

                    </div>
                  ) : (
                    <div className="full-assessment-list">

                      {history.map((assessment) => (
                        <div
                          className="full-assessment-row"
                          key={assessment._id}
                        >

                          <div className="row-avatar">
                            {getInitial(
                              assessment.patient?.name
                            )}
                          </div>

                          <div className="full-row-main">

                            <strong>
                              {
                                assessment.patient
                                  ?.name
                              }
                            </strong>

                            <span>
                              {
                                assessment.patient
                                  ?.email
                              }
                            </span>

                            <small>
                              {getComplaint(
                                assessment
                              )}
                            </small>

                          </div>

                          <div className="full-row-date">
                            Reviewed{" "}
                            {getTime(
                              assessment.updatedAt
                            )}
                          </div>

                          <span className="status-badge completed">
                            ✓ Reviewed
                          </span>

                          <button
                            className="secondary-btn"
                            onClick={() =>
                              setSelected(
                                assessment
                              )
                            }
                          >
                            View
                          </button>

                        </div>
                      ))}

                    </div>
                  )}

                </section>
              )}

              {/* =========================
                  ALL PATIENTS
              ========================= */}

              {activePanel === "patients" && (
                <section className="full-panel">

                  <div className="full-panel-header">

                    <div>
                      <h1>
                        All Patients
                      </h1>

                      <p>
                        Every patient who has had an
                        assessment with you.
                      </p>
                    </div>

                    <span className="large-panel-count">
                      {patients.length}
                    </span>

                  </div>

                  {patients.length === 0 ? (
                    <div className="large-empty">

                      <span>♙</span>

                      <h3>
                        No patients yet
                      </h3>

                      <p>
                        Patients will appear here after
                        their first assessment.
                      </p>

                    </div>
                  ) : (
                    <div className="managed-patients-grid">

                      {patients.map((patient) => (
                        <div
                          className="managed-patient-card"
                          key={patient.patient._id}
                        >

                          <div className="managed-patient-top">

                            <div className="managed-avatar">
                              {getInitial(
                                patient.patient.name
                              )}
                            </div>

                            <div>
                              <h3>
                                {
                                  patient.patient
                                    .name
                                }
                              </h3>

                              <p>
                                {
                                  patient.patient
                                    .email
                                }
                              </p>
                            </div>

                          </div>

                          <div className="managed-patient-stats">

                            <div>
                              <span>
                                Assessments
                              </span>

                              <strong>
                                {
                                  patient.assessmentCount
                                }
                              </strong>
                            </div>

                            <div>
                              <span>
                                Pending
                              </span>

                              <strong>
                                {patient.pendingCount}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Urgent
                              </span>

                              <strong
                                className={
                                  patient.urgentCount >
                                  0
                                    ? "danger-text"
                                    : ""
                                }
                              >
                                {patient.urgentCount}
                              </strong>
                            </div>

                          </div>

                          <div className="patient-last-date">
                            Last assessment:{" "}
                            {patient.lastAssessment
                              ? new Date(
                                  patient.lastAssessment
                                ).toLocaleDateString()
                              : "—"}
                          </div>

                          <button
                            className="secondary-btn patient-view-btn"
                            onClick={() =>
                              openPatient(patient)
                            }
                          >
                            View Patient Record →
                          </button>

                        </div>
                      ))}

                    </div>
                  )}

                </section>
              )}

            </>
          )}

        </main>

      </div>

      {/* =========================
          ASSESSMENT MODAL
      ========================= */}

      {selected && (
        <div
          className="modal-overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="patient-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {selected.patient?.name}
                </h2>

                <p>
                  {selected.patient?.email}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setSelected(null)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-content">

              <div className="assessment-meta">

                <span
                  className={`status-badge ${
                    selected.urgency || "normal"
                  }`}
                >
                  {getStatus(selected)}
                </span>

                <span>
                  {getTime(selected.createdAt)}
                </span>

              </div>

              {/* URGENCY */}

              {selected.urgency &&
                selected.urgency !== "normal" && (
                  <div
                    className={`urgency-alert ${
                      selected.urgency
                    }`}
                  >

                    <div className="urgency-alert-title">
                      {selected.urgency ===
                      "urgent"
                        ? "🔴 Urgent Attention"
                        : "🟡 Clinical Review Recommended"}
                    </div>

                    <p>
                      {selected.flagReason}
                    </p>

                    {selected.redFlags?.length >
                      0 && (
                      <div className="red-flags">

                        <strong>
                          Reported warning signs:
                        </strong>

                        <ul>
                          {selected.redFlags.map(
                            (flag, index) => (
                              <li key={index}>
                                {flag}
                              </li>
                            )
                          )}
                        </ul>

                      </div>
                    )}

                  </div>
                )}

              {/* AI SUMMARY */}

              {selected.summary &&
              typeof selected.summary ===
                "object" ? (
                <div className="ai-summary">

                  <div className="ai-summary-header">

                    <div className="ai-icon">
                      AI
                    </div>

                    <div>
                      <h3>
                        AI Intake Summary
                      </h3>

                      <span>
                        Structured from reported
                        patient information
                      </span>
                    </div>

                  </div>

                  <div className="summary-grid">

                    <div className="summary-item summary-wide">

                      <span className="summary-label">
                        CHIEF COMPLAINT
                      </span>

                      <strong>
                        {selected.summary
                          .chiefComplaint ||
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

                  {selected.summary.symptoms
                    ?.length > 0 && (
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

                  {selected.summary
                    .otherInformation && (
                    <div className="summary-other">

                      <span className="summary-label">
                        OTHER RELEVANT INFORMATION
                      </span>

                      <p>
                        {
                          selected.summary
                            .otherInformation
                        }
                      </p>

                    </div>
                  )}

                  <div className="summary-footer">

                    <span>
                      AI-assisted intake summary
                    </span>

                    <small>
                      Not a diagnosis
                    </small>

                  </div>

                </div>
              ) : (
                <div className="ai-summary processing-summary">

                  <div className="ai-summary-header">

                    <div className="ai-icon">
                      AI
                    </div>

                    <div>
                      <h3>
                        AI Summary Processing
                      </h3>

                      <span>
                        Preparing a structured
                        clinical summary
                      </span>
                    </div>

                  </div>

                  <p>
                    The AI summary is being prepared.
                  </p>

                </div>
              )}

              {/* ANSWERS */}

              <div className="assessment-section">

                <h3>
                  Reported Information
                </h3>

                <div className="answers-list">

                  {selected.answers?.map(
                    (answer, index) => (
                      <div
                        className="answer-item"
                        key={index}
                      >

                        <span>
                          {answer.question}
                        </span>

                        <strong>
                          {answer.answer}
                        </strong>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="secondary-btn"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </button>

              {selected.status === "waiting" && (
                <button
                  className="primary-btn"
                  onClick={() =>
                    markAsReviewed(selected)
                  }
                  disabled={reviewing}
                >
                  {reviewing
                    ? "Marking..."
                    : "✓ Mark as Reviewed"}
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* =========================
          PATIENT RECORD MODAL
      ========================= */}

      {selectedPatient && (
        <div
          className="modal-overlay"
          onClick={closePatient}
        >
          <div
            className="patient-modal patient-record-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {selectedPatient.patient.name}
                </h2>

                <p>
                  {selectedPatient.patient.email}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={closePatient}
              >
                ×
              </button>

            </div>

            <div className="modal-content">

              <div className="patient-record-stats">

                <div>
                  <span>Assessments</span>

                  <strong>
                    {
                      selectedPatient.assessments
                        .length
                    }
                  </strong>
                </div>

                <div>
                  <span>Reviewed</span>

                  <strong>
                    {
                      selectedPatient.assessments.filter(
                        (a) =>
                          a.status === "reviewed"
                      ).length
                    }
                  </strong>
                </div>

                <div>
                  <span>Pending</span>

                  <strong>
                    {
                      selectedPatient.assessments.filter(
                        (a) =>
                          a.status === "waiting"
                      ).length
                    }
                  </strong>
                </div>

              </div>

              <h3>
                Assessment History
              </h3>

              <div className="patient-history-list">

                {selectedPatient.assessments.map(
                  (assessment) => (
                    <div
                      className="patient-history-row"
                      key={assessment._id}
                    >

                      <div>
                        <strong>
                          {getComplaint(
                            assessment
                          )}
                        </strong>

                        <span>
                          {getTime(
                            assessment.createdAt
                          )}
                        </span>
                      </div>

                      <div className="patient-history-actions">

                        <span
                          className={`status-badge ${
                            assessment.urgency ||
                            "normal"
                          }`}
                        >
                          {assessment.status ===
                          "reviewed"
                            ? "✓ Reviewed"
                            : getStatus(
                                assessment
                              )}
                        </span>

                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setSelected(
                              assessment
                            );
                            setSelectedPatient(
                              null
                            );
                          }}
                        >
                          View
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="secondary-btn"
                onClick={closePatient}
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