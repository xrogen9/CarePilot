import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import Assessment from "./pages/Assessment";
import DoctorDashboard from "./pages/DoctorDashboard";
import AssessmentHistory from "./pages/AssessmentHistory";
import MedicalDocuments from "./pages/MedicalDocuments";

function ProtectedRoute({ role, children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assessment"
          element={
            <ProtectedRoute role="patient">
              <Assessment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/assessments"
          element={
            <ProtectedRoute role="patient">
              <AssessmentHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/documents"
          element={
            <ProtectedRoute role="patient">
              <MedicalDocuments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;