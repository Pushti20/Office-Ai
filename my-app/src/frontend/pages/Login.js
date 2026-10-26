import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaRobot } from "react-icons/fa";
import API_URL from "../../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      if (res.data.role === "admin") nav("/admin");
      else nav("/home", { state: res.data });

    } catch {
      alert("Invalid or not approved");
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <div className="auth-header">
          <FaRobot className="auth-icon" />
          <h2>Office AI</h2>
          <p>Smart Workplace Management</p>
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
            placeholder="Enter your password"
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={login}>
          Sign In
        </button>

        {/* LINK */}
        <div className="link-btn" onClick={() => nav("/signup")}>
          Create Account
        </div>

      </div>

    </div>
  );
}