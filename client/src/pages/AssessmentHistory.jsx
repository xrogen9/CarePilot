import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AssessmentHistory.css";

function AssessmentHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [connectMessage, setConnectMessage] = useState("");

  const formatComplaint = (value) => {
    if (!value || typeof value !== "string") return value;

    const text = value.trim();

    if (!text) return text;

    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  useEffect(() => {
    fetchData();
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const response = await API.get("/auth/me");
      setDoctor(response.data.connectedDoctor || null);
    } catch (error) {
      console.log(error);
    }
  };

  const startAssessment = () => {
    if (!doctor) {
      setConnectMessage("Please connect to a doctor before starting an assessment.");
      return;
    }

    navigate("/assessment");
  };

  const fetchData = async () => {
    try {
      const [assessmentResponse, documentResponse] =
        await Promise.all([
          API.get("/assessment/history"),
          API.get("/document/patient")
        ]);

      setHistory(assessmentResponse.data);
      setDocuments(documentResponse.data);
    } catch (error) {
      console.log(error);
    }
  };

  const viewDocument = async (document) => {
    try {
      const response = await API.get(
        `/document/${document._id}/view`,
        {
          responseType: "blob"
        }
      );

      const fileBlob = new Blob(
        [response.data],
        { type: document.mimeType }
      );

      const fileUrl = URL.createObjectURL(fileBlob);

      window.open(fileUrl, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000);
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Could not open document."
      );
    }
  };

  const attachedDocuments = selectedAssessment
    ? documents.filter(
        (document) =>
          document.assessment?._id ===
          selectedAssessment._id
      )
    : [];

  return (
    <div className="assessment-history-page">
      <header className="assessment-history-header">
        <div>
          <button
            className="history-back-button"
            onClick={() => navigate("/patient")}
          >
            ← Dashboard
          </button>

          <span className="history-page-label">
            YOUR RECORD
          </span>

          <h1>Assessment History</h1>

          <p>
            Review your previous health assessments and
            the medical documents attached to each one.
          </p>
        </div>

        <button
          className={`new-assessment-button ${!doctor ? "disabled" : ""}`}
          onClick={startAssessment}
          disabled={!doctor}
        >
          {doctor ? "+ New Assessment" : "Connect Doctor First"}
        </button>
      </header>

      <main className="assessment-history-content">
        <div className="history-count">
          {history.length}{" "}
          {history.length === 1
            ? "Assessment"
            : "Assessments"}
        </div>

        {history.length === 0 ? (
          <div className="history-empty-page">
            <div className="history-empty-icon">
              📋
            </div>

            <h2>No assessment history yet</h2>

            <p>
              Complete your first health assessment and
              it will appear here.
            </p>

            <button
              onClick={startAssessment}
              disabled={!doctor}
            >
              {doctor ? "Start Health Assessment" : "Connect Doctor First"}
            </button>

            {!doctor && (
              <p className="assessment-history-connect-message">
                Connect to a doctor before starting your assessment.
              </p>
            )}
          </div>
        ) : (
          <div className="assessment-history-list">
            {history.map((assessment) => (
              <div
                className="assessment-history-card"
                key={assessment._id}
                onClick={() =>
                  setSelectedAssessment(assessment)
                }
              >
                <div className="assessment-history-main">
                  <span className="assessment-history-date">
                    {new Date(
                      assessment.createdAt
                    ).toLocaleString()}
                  </span>

                  <h2>
                    {formatComplaint(
                      assessment.summary?.chiefComplaint ||
                        assessment.answers?.[0]?.answer ||
                        "Health Assessment"
                    )}
                  </h2>

                  {assessment.summary?.symptoms?.length >
                    0 && (
                    <div className="assessment-history-symptoms">
                      {assessment.summary.symptoms.map(
                        (symptom, index) => (
                          <span key={index}>
                            {symptom}
                          </span>
                        )
                      )}
                    </div>
                  )}

                  {assessment.doctor && (
                    <p className="assessment-history-doctor">
                      Assessment sent to{" "}
                      <strong>
                        Dr. {assessment.doctor.name}
                      </strong>
                    </p>
                  )}
                </div>

                <div className="assessment-history-side">
                  <span
                    className={`assessment-history-status ${
                      assessment.status || "waiting"
                    }`}
                  >
                    {assessment.status === "reviewed"
                      ? "✓ Reviewed by Doctor"
                      : assessment.status === "completed"
                      ? "✓ Completed"
                      : "⏳ Awaiting Review"}
                  </span>

                  <span
                    className={`assessment-history-urgency ${
                      assessment.urgency || "normal"
                    }`}
                  >
                    {assessment.urgency === "urgent"
                      ? "🔴 Urgent"
                      : assessment.urgency === "review"
                      ? "🟡 Review"
                      : "🟢 Normal"}
                  </span>

                  <span className="view-assessment">
                    View →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedAssessment && (
        <div
          className="assessment-history-modal-overlay"
          onClick={() =>
            setSelectedAssessment(null)
          }
        >
          <div
            className="assessment-history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="assessment-history-modal-header">
              <div>
                <span className="history-page-label">
                  ASSESSMENT RECORD
                </span>

                <h2>
                  {formatComplaint(
                    selectedAssessment.summary?.chiefComplaint ||
                      "Health Assessment"
                  )}
                </h2>

                <p>
                  {new Date(
                    selectedAssessment.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <button
                className="history-modal-close"
                onClick={() =>
                  setSelectedAssessment(null)
                }
              >
                ×
              </button>
            </div>

            <div className="assessment-history-modal-content">
              <div className="assessment-detail-box assessment-status-box">
                <span>DOCTOR STATUS</span>

                <strong className={
                  selectedAssessment.status === "reviewed"
                    ? "reviewed-status-text"
                    : "pending-status-text"
                }>
                  {selectedAssessment.status === "reviewed"
                    ? "✓ Reviewed by Doctor"
                    : selectedAssessment.status === "completed"
                    ? "✓ Completed"
                    : "⏳ Awaiting Doctor Review"}
                </strong>
              </div>

              <div className="assessment-detail-grid">
                <div className="assessment-detail-box">
                  <span>CHIEF COMPLAINT</span>

                  <strong>
                    {formatComplaint(
                      selectedAssessment.summary?.chiefComplaint ||
                        "Not reported"
                    )}
                  </strong>
                </div>

                <div className="assessment-detail-box">
                  <span>DURATION</span>

                  <strong>
                    {selectedAssessment.summary?.duration ||
                      "Not reported"}
                  </strong>
                </div>

                <div className="assessment-detail-box">
                  <span>SEVERITY</span>

                  <strong>
                    {selectedAssessment.summary?.severity ||
                      "Not reported"}
                  </strong>
                </div>

                <div className="assessment-detail-box">
                  <span>URGENCY</span>

                  <strong>
                    {selectedAssessment.urgency ===
                    "urgent"
                      ? "🔴 Urgent"
                      : selectedAssessment.urgency ===
                        "review"
                      ? "🟡 Review Recommended"
                      : "🟢 No Urgent Indicators"}
                  </strong>
                </div>
              </div>

              {selectedAssessment.summary?.symptoms
                ?.length > 0 && (
                <div className="history-modal-section">
                  <span className="history-section-label">
                    REPORTED SYMPTOMS
                  </span>

                  <div className="assessment-history-symptoms">
                    {selectedAssessment.summary.symptoms.map(
                      (symptom, index) => (
                        <span key={index}>
                          {symptom}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedAssessment.summary
                ?.otherInformation && (
                <div className="history-modal-section">
                  <span className="history-section-label">
                    OTHER RELEVANT INFORMATION
                  </span>

                  <p className="history-modal-text">
                    {
                      selectedAssessment.summary
                        .otherInformation
                    }
                  </p>
                </div>
              )}

              {selectedAssessment.urgency &&
                selectedAssessment.urgency !== "normal" && (
                  <div
                    className={`assessment-history-warning ${
                      selectedAssessment.urgency
                    }`}
                  >
                    <strong>
                      {selectedAssessment.urgency ===
                      "urgent"
                        ? "🔴 Urgent Attention"
                        : "🟡 Clinical Review Recommended"}
                    </strong>

                    {selectedAssessment.flagReason && (
                      <p>
                        {selectedAssessment.flagReason}
                      </p>
                    )}

                    {selectedAssessment.redFlags?.length >
                      0 && (
                      <div>
                        <strong>
                          Reported warning signs:
                        </strong>

                        <ul>
                          {selectedAssessment.redFlags.map(
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

              {selectedAssessment.status === "reviewed" && (
                <div className="assessment-reviewed-notice">
                  <strong>✓ Your doctor has reviewed this assessment.</strong>
                  <span>The assessment is now part of your reviewed medical record.</span>
                </div>
              )}

              <div className="history-modal-section">
                <span className="history-section-label">
                  ATTACHED DOCUMENTS
                </span>

                {attachedDocuments.length === 0 ? (
                  <p className="history-modal-text">
                    No documents attached to this
                    assessment.
                  </p>
                ) : (
                  <div className="history-attached-documents">
                    {attachedDocuments.map(
                      (document) => (
                        <div
                          className="history-attached-document"
                          key={document._id}
                        >
                          <div className="history-attached-icon">
                            {document.type ===
                            "prescription"
                              ? "💊"
                              : document.type ===
                                "test-report"
                              ? "🧪"
                              : "📄"}
                          </div>

                          <div className="history-document-details">
                            <strong>
                              {document.fileName}
                            </strong>

                            <span>
                              {document.type ===
                              "prescription"
                                ? "Prescription"
                                : document.type ===
                                  "test-report"
                                ? "Test Report"
                                : "Other Document"}
                            </span>
                          </div>

                          <button
                            className="history-view-document"
                            onClick={() =>
                              viewDocument(document)
                            }
                          >
                            View
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="history-doctor-detail">
                <span>ASSESSMENT SENT TO</span>

                <strong>
                  {selectedAssessment.doctor
                    ? `Dr. ${selectedAssessment.doctor.name}`
                    : "Doctor information unavailable"}
                </strong>
              </div>

              <div className="history-ai-note">
                <strong>
                  AI-assisted intake summary
                </strong>

                <span>Not a diagnosis</span>
              </div>
            </div>

            <div className="assessment-history-modal-footer">
              <button
                onClick={() =>
                  setSelectedAssessment(null)
                }
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

export default AssessmentHistory;