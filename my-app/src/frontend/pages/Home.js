import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaUser, FaTasks, FaSignOutAlt, FaLock } from "react-icons/fa";
import API_URL from "../../config";

export default function Home() {
  const { state } = useLocation();
  const nav = useNavigate();

  const [tasks, setTasks]           = useState([]);
  const [active, setActive]         = useState("profile");
  const [oldPwd, setOldPwd]         = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg]         = useState("");
  const [profile, setProfile]       = useState(null);

  useEffect(() => {
    if (state?.email) localStorage.setItem("emp_email", state.email);
  }, [state?.email]);

  const email = state?.email || localStorage.getItem("emp_email");

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / 86400000);
  };

  const loadProfile = useCallback(async () => {
    if (!email) return;
    try {
      const res = await axios.get(`${API_URL}/get-employee/${email}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  }, [email]);

  const loadTasks = useCallback(async () => {
    if (!email) return;
    try {
      const res = await axios.get(`${API_URL}/my-tasks/${email}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  }, [email]);

  useEffect(() => {
    loadProfile();
    loadTasks();
  }, [loadProfile, loadTasks]);

  const updateStatus = async (id, status) => {
    await axios.post(`${API_URL}/update-task/${id}`, { status });
    loadTasks();
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) return setPwdMsg("Please fill all fields.");
    if (newPwd !== confirmPwd) return setPwdMsg("Passwords do not match.");
    if (newPwd.length < 4) return setPwdMsg("Minimum 4 characters required.");
    try {
      const res = await axios.post(`${API_URL}/change-password`, {
        email: email, oldPassword: oldPwd, newPassword: newPwd
      });
      setPwdMsg("✅ " + res.data.msg);
      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      setPwdMsg("❌ " + (err.response?.data?.msg || "An error occurred."));
    }
  };

  const todo   = tasks.filter(t => t.status === "To Do");
  const inprog = tasks.filter(t => t.status === "In Progress");
  const done   = tasks.filter(t => t.status === "Completed");
  const total  = tasks.length;
  const pct    = total === 0 ? 0 : Math.round((done.length / total) * 100);
  const initial = (profile?.name || profile?.email || "?").charAt(0).toUpperCase();

  return (
    <div>
      <div className="sidebar">
        <h2>Employee</h2>

        <div className={`sidebar-item ${active === "profile" ? "active" : ""}`} onClick={() => setActive("profile")}>
          <FaUser /> Profile
        </div>

        <div className={`sidebar-item ${active === "tasks" ? "active" : ""}`} onClick={() => setActive("tasks")} style={{ position: "relative" }}>
          <FaTasks /> Tasks
          {todo.length > 0 && <span className="notif-badge">{todo.length}</span>}
        </div>

        <div className={`sidebar-item ${active === "password" ? "active" : ""}`} onClick={() => setActive("password")}>
          <FaLock /> Change Password
        </div>

        <div className="sidebar-item" onClick={() => { localStorage.removeItem("emp_email"); nav("/"); }}>
          <FaSignOutAlt /> Logout
        </div>
      </div>

      <div className="main-content">

        <div className="dashboard-header">
          <h2>Employee Dashboard</h2>
          <p>Welcome back, <strong>{profile?.name || profile?.email}</strong></p>
        </div>

        {active === "profile" && (
          <div className="content-card">

            <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: "white", flexShrink: 0
              }}>{initial}</div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{profile?.name || profile?.email}</p>
                <p style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>{profile?.role}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
              {[
                { label: "Email",  value: profile?.email,          color: "#3b82f6" },
                { label: "Role",   value: profile?.role,           color: "#8b5cf6" },
                { label: "Salary", value: `₹ ${profile?.salary}`, color: "#10b981" },
                { label: "Status", value: "Active Employee",        color: "#0f172a" },
              ].map((row, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                    {row.label}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{row.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
              {[
                { label: "Total",       count: total,         bg: "#f8fafc", color: "#0f172a", border: "#e2e8f0" },
                { label: "To Do",       count: todo.length,   bg: "#fefce8", color: "#ca8a04", border: "#fde68a" },
                { label: "In Progress", count: inprog.length, bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
                { label: "Completed",   count: done.length,   bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${s.border}`, textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 4, opacity: 0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>📈 Task Progress</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{done.length} / {total} completed &nbsp;—&nbsp; {pct}%</p>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 999, height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 999,
                  background: "linear-gradient(90deg, #1e3a5f, #3b82f6)",
                  transition: "width 0.8s ease"
                }} />
              </div>
            </div>

          </div>
        )}

        {active === "tasks" && (
          <div className="content-card">
            <h3 style={{ marginBottom: 18 }}>📋 My Task Board</h3>

            <div className="task-board">

              <div style={{ background: "#fffbeb", borderRadius: 14, padding: 15, minHeight: 400, border: "1px solid #fde68a" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "#92400e", fontSize: 14 }}>
                  🟡 To Do
                  <span style={{ marginLeft: "auto", background: "#f59e0b", color: "white", borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>{todo.length}</span>
                </h3>
                {todo.length === 0 && <p className="empty">No tasks here</p>}
                {todo.map(t => {
                  const days = getDaysLeft(t.deadline);
                  return (
                    <div key={t._id} className="task-card">
                      <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{t.title}</p>
                      {days !== null && (
                        <p style={{ fontSize: 12, marginTop: 6, color: days <= 0 ? "#ef4444" : days <= 2 ? "#f97316" : "#64748b", fontWeight: 600 }}>
                          {days <= 0 ? "⚠️ Overdue" : `⏳ ${days} day${days !== 1 ? "s" : ""} left`}
                        </p>
                      )}
                      <button className="start-btn" onClick={() => updateStatus(t._id, "In Progress")}>
                        Start Task
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#eff6ff", borderRadius: 14, padding: 15, minHeight: 400, border: "1px solid #bfdbfe" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "#1e40af", fontSize: 14 }}>
                  🔵 In Progress
                  <span style={{ marginLeft: "auto", background: "#3b82f6", color: "white", borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>{inprog.length}</span>
                </h3>
                {inprog.length === 0 && <p className="empty">No tasks here</p>}
                {inprog.map(t => {
                  const days = getDaysLeft(t.deadline);
                  return (
                    <div key={t._id} className="task-card">
                      <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{t.title}</p>
                      {days !== null && (
                        <p style={{ fontSize: 12, marginTop: 6, color: days <= 0 ? "#ef4444" : days <= 2 ? "#f97316" : "#64748b", fontWeight: 600 }}>
                          {days <= 0 ? "⚠️ Overdue" : `⏳ ${days} day${days !== 1 ? "s" : ""} left`}
                        </p>
                      )}
                      <button className="complete-btn" onClick={() => updateStatus(t._id, "Completed")}>
                        Mark Complete
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 15, minHeight: 400, border: "1px solid #bbf7d0" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "#166534", fontSize: 14 }}>
                  🟢 Completed
                  <span style={{ marginLeft: "auto", background: "#22c55e", color: "white", borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>{done.length}</span>
                </h3>
                {done.length === 0 && <p className="empty">No tasks here</p>}
                {done.map(t => (
                  <div key={t._id} className="task-card done">
                    <p style={{ fontWeight: 600, fontSize: 14 }}>✅ {t.title}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {active === "password" && (
          <div className="content-card" style={{ maxWidth: 440 }}>
            <h3 style={{ marginBottom: 20 }}>🔑 Change Password</h3>

            <input
              type="password" placeholder="Current password"
              value={oldPwd} onChange={e => setOldPwd(e.target.value)}
            />
            <input
              type="password" placeholder="New password"
              value={newPwd} onChange={e => setNewPwd(e.target.value)}
            />
            <input
              type="password" placeholder="Confirm new password"
              value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            />

            {pwdMsg && (
              <p className={pwdMsg.startsWith("✅") ? "msg-success" : "msg-error"} style={{ marginTop: 6 }}>
                {pwdMsg}
              </p>
            )}

            <button onClick={handleChangePassword} style={{ marginTop: 6, width: "100%" }}>
              Update Password
            </button>
          </div>
        )}

      </div>
    </div>
  );
}