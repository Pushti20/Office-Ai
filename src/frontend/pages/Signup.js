import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaUser, FaLock, FaRobot, FaIdBadge } from "react-icons/fa";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const nav = useNavigate();

  const signup = async () => {
    if (!name || !email || !password) return alert("Fill all fields");

    if (password !== confirm) {
      return alert("Passwords do not match");
    }

    try {
      await axios.post("http://localhost:5000/signup", {
        name,
        email,
        password
      });

      alert("Request sent! Wait for admin approval.");
      nav("/");
    } catch {
      alert("Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-header">
          <FaRobot className="auth-icon" />
          <h2>Office AI</h2>
          <p>Create your account</p>
        </div>

        <div className="form-group">
          <FaIdBadge className="input-icon" />
          <input
            className="form-control"
            placeholder="Enter your full name"
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <FaUser className="input-icon" />
          <input
            className="form-control"
            placeholder="Enter your email"
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <FaLock className="input-icon" />
          <input
            type="password"
            className="form-control"
            placeholder="Create password"
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <FaLock className="input-icon" />
          <input
            type="password"
            className="form-control"
            placeholder="Confirm password"
            onChange={e => setConfirm(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={signup}>
          <FaUserPlus style={{ marginRight: "8px" }} />
          Create Account
        </button>

        <div className="link-btn" onClick={() => nav("/")}>
          Already have an account? Login
        </div>

      </div>
    </div>
  );
}