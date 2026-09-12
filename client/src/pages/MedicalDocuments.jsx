import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./MedicalDocuments.css";

function CustomDropdown({
  value,
  options,
  onChange,
  placeholder
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  return (
    <div
      className={`medical-dropdown ${open ? "open" : ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className="medical-dropdown-button"
        onClick={() => setOpen(!open)}
      >
        <span>
          {selectedOption?.label || placeholder}
        </span>

        <span className="medical-dropdown-arrow">
          ˅
        </span>
      </button>

      {open && (
        <div className="medical-dropdown-menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`medical-dropdown-option ${
                option.value === value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicalDocuments() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [documentType, setDocumentType] =
    useState("prescription");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [selectedAssessment, setSelectedAssessment] =
    useState("");

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        documentResponse,
        assessmentResponse
      ] = await Promise.all([
        API.get("/document/patient"),
        API.get("/assessment/history")
      ]);

      setDocuments(documentResponse.data);
      setAssessments(assessmentResponse.data);
    } catch (error) {
      console.log(error);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) {
      setUploadMessage(
        "Please select a document first."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");

      const formData = new FormData();

      formData.append(
        "document",
        selectedFile
      );

      formData.append(
        "type",
        documentType
      );

      if (selectedAssessment) {
        formData.append(
          "assessment",
          selectedAssessment
        );
      }

      const response = await API.post(
        "/document/upload",
        formData
      );

      setUploadMessage(
        response.data.message
      );

      setSelectedFile(null);
      setSelectedAssessment("");

      const fileInput =
        document.getElementById(
          "medical-document-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchData();
    } catch (error) {
      console.log(error);

      setUploadMessage(
        error.response?.data?.message ||
          "Could not upload document."
      );
    } finally {
      setUploading(false);
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
        {
          type: document.mimeType
        }
      );

      const fileUrl =
        URL.createObjectURL(fileBlob);

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

  const deleteDocument = async (document) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.fileName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(document._id);

      await API.delete(
        `/document/${document._id}`
      );

      setDocuments((previousDocuments) =>
        previousDocuments.filter(
          (item) =>
            item._id !== document._id
        )
      );
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Could not delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getDocumentType = (type) => {
    if (type === "prescription") {
      return "Prescription";
    }

    if (type === "test-report") {
      return "Test Report";
    }

    return "Other Document";
  };

  const getDocumentIcon = (type) => {
    if (type === "prescription") {
      return "💊";
    }

    if (type === "test-report") {
      return "🧪";
    }

    return "📄";
  };

  return (
    <div className="medical-documents-page">
      <header className="medical-documents-header">
        <div>
          <button
            className="medical-back-button"
            onClick={() => navigate("/patient")}
          >
            ← Dashboard
          </button>

          <span className="medical-page-label">
            YOUR RECORD
          </span>

          <h1>Medical Documents</h1>

          <p>
            Store your prescriptions, test reports and
            other medical documents securely in CarePilot.
          </p>
        </div>
      </header>

      <main className="medical-documents-content">

        {/* UPLOAD */}

        <section className="document-upload-card">
          <div className="document-upload-header">
            <div>
              <span className="medical-card-label">
                ADD DOCUMENT
              </span>

              <h2>Upload Medical Record</h2>

              <p>
                Upload a prescription or medical report
                for future reference.
              </p>
            </div>
          </div>

          <div className="medical-document-upload">
            <CustomDropdown
              value={selectedAssessment}
              onChange={setSelectedAssessment}
              placeholder="General Medical Record"
              options={[
                {
                  value: "",
                  label: "General Medical Record"
                },
                ...assessments.map(
                  (assessment) => ({
                    value: assessment._id,
                    label: `${
                      assessment.summary
                        ?.chiefComplaint ||
                      "Medical Assessment"
                    } - ${new Date(
                      assessment.createdAt
                    ).toLocaleDateString()}`
                  })
                )
              ]}
            />

            <CustomDropdown
              value={documentType}
              onChange={setDocumentType}
              options={[
                {
                  value: "prescription",
                  label: "Prescription"
                },
                {
                  value: "test-report",
                  label: "Test Report"
                },
                {
                  value: "other",
                  label: "Other"
                }
              ]}
            />

            <input
              id="medical-document-file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files[0]
                )
              }
            />

            <button
              onClick={uploadDocument}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload Document"}
            </button>
          </div>

          {uploadMessage && (
            <p className="medical-upload-message">
              {uploadMessage}
            </p>
          )}

          <div className="upload-note">
            Supported formats: JPG, PNG, WEBP and PDF.
            Maximum file size: 10 MB.
          </div>
        </section>

        {/* DOCUMENT LIST */}

        <section className="medical-records-section">
          <div className="medical-records-header">
            <div>
              <span className="medical-card-label">
                YOUR RECORDS
              </span>

              <h2>All Medical Documents</h2>

              <p>
                Your uploaded medical documents appear
                here.
              </p>
            </div>

            <div className="medical-document-count">
              {documents.length}{" "}
              {documents.length === 1
                ? "Document"
                : "Documents"}
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="medical-documents-empty">
              <div className="medical-empty-icon">
                📄
              </div>

              <h3>
                No medical documents yet
              </h3>

              <p>
                Upload your first prescription or
                medical report above.
              </p>
            </div>
          ) : (
            <div className="medical-document-list">
              {documents.map((document) => (
                <div
                  className="medical-document-item"
                  key={document._id}
                >
                  <div className="medical-document-icon">
                    {getDocumentIcon(
                      document.type
                    )}
                  </div>

                  <div className="medical-document-info">
                    <strong>
                      {document.fileName}
                    </strong>

                    <span>
                      {getDocumentType(
                        document.type
                      )}
                    </span>

                    <small>
                      Uploaded{" "}
                      {new Date(
                        document.createdAt
                      ).toLocaleString()}
                    </small>

                    {document.assessment && (
                      <small className="related-assessment">
                        Related to:{" "}
                        {document.assessment
                          .summary
                          ?.chiefComplaint ||
                          "Medical Assessment"}
                      </small>
                    )}

                    {!document.assessment && (
                      <small className="general-record">
                        General Medical Record
                      </small>
                    )}
                  </div>

                  <div className="medical-document-actions">

                    <button
                      className="medical-view-button"
                      onClick={() =>
                        viewDocument(document)
                      }
                    >
                      View
                    </button>

                    <button
                      className="medical-delete-button"
                      onClick={() =>
                        deleteDocument(document)
                      }
                      disabled={
                        deletingId === document._id
                      }
                    >
                      {deletingId === document._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                  <span
                    className={`medical-ocr-status ${
                      document.ocrStatus
                    }`}
                  >
                    {document.ocrStatus ===
                    "pending"
                      ? "Processing"
                      : document.ocrStatus ===
                        "completed"
                      ? "Processed"
                      : document.ocrStatus ===
                        "failed"
                      ? "Failed"
                      : "Processing"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default MedicalDocuments;