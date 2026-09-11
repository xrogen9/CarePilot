import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await API.post("/auth/register", {
          name,
          email,
          password,
          role
        });

        alert("Registration successful! Please login.");
        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        const response = await API.post("/auth/login", {
          email,
          password
        });

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        if (response.data.user.role === "doctor") {
          navigate("/doctor");
        } else {
          navigate("/patient");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="brand-mark">+</div>
          <span>CarePilot</span>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span>●</span> Smarter healthcare, simpler consultations
          </div>

          <h1>
            Better preparation.
            <br />
            <span>Better care.</span>
          </h1>

          <p>
            CarePilot helps patients prepare for consultations and gives
            doctors a concise, AI-powered view of the patient's concerns
            before they meet.
          </p>

          <div className="feature-list">
            <div className="feature">
              <div className="feature-icon">✓</div>
              <div>
                <strong>Pre-consultation assessment</strong>
                <span>Quick, adaptive health questions</span>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">AI</div>
              <div>
                <strong>AI-powered intake summary</strong>
                <span>Key information prepared for your doctor</span>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">🔒</div>
              <div>
                <strong>Designed with privacy in mind</strong>
                <span>Your health information stays protected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="left-footer">
          CarePilot · Healthcare pre-consultation platform
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-mark">+</div>
            <span>CarePilot</span>
          </div>

          <div className="form-heading">
            <span>{isRegister ? "GET STARTED" : "WELCOME BACK"}</span>

            <h2>
              {isRegister
                ? "Create your account"
                : "Sign in to CarePilot"}
            </h2>

            <p>
              {isRegister
                ? "Create an account to start using CarePilot."
                : "Access your healthcare dashboard."}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div className="input-group">
                <label>Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Sign In"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="switch-auth">
            <span>
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </div>

          <div className="security-note">
            <span>🔒</span>
            Your information is securely handled by CarePilot.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;