import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUserCheck,
  FaUser,
  FaSignOutAlt,
  FaTasks,
  FaUsers,
  FaBriefcase,
  FaTrash,
  FaUserEdit
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({});
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [active, setActive] = useState("approval");
  const [days, setDays] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [assignMsg, setAssignMsg] = useState("");

  const [manageSearch, setManageSearch] = useState("");
  const [editForm, setEditForm] = useState({});  
  const [editMsg, setEditMsg] = useState({});     

  const nav = useNavigate();

  const loadUsers = async () => {
    const res = await axios.get("http://localhost:5000/pending");
    setUsers(res.data);
  };

  const loadTasks = async () => {
    const res = await axios.get("http://localhost:5000/all-tasks");
    setTasks(res.data);
  };

  const loadEmployees = async () => {
    const res = await axios.get("http://localhost:5000/employee-status");
    setEmployees(res.data);
  };

  useEffect(() => {
    loadUsers();
    loadTasks();
    loadEmployees();
  }, []);

  // Refresh employees whenever the manage tab is opened
  useEffect(() => {
    if (active === "manage") loadEmployees();
  }, [active]);

  const handleChange = (id, field, value) => {
    setForm(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const approve = async (id) => {
    const role = form[id]?.role;
    const salary = form[id]?.salary;
    if (!role || !salary) return alert("Enter role & salary");
    await axios.post(`http://localhost:5000/approve/${id}`, { role, salary });
    loadUsers();
    loadEmployees();
  };

  const rejectUser = async (id) => {
    await axios.delete(`http://localhost:5000/reject/${id}`);
    loadUsers();
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await axios.delete(`http://localhost:5000/delete-task/${id}`);
    loadTasks();
  };

  const assignIndividual = async () => {
    if (!task) return alert("Enter task title");
    setAssignMsg("⏳ AI is analyzing and assigning...");
    try {
      const res = await axios.post("http://localhost:5000/assign-task", { title: task, days });
      setAssignMsg(`✅ Assigned to: ${res.data.task?.assignedTo} (${res.data.task?.role})`);
      setTask("");
      loadTasks();
    } catch (err) {
      setAssignMsg("❌ " + (err.response?.data?.msg || "Error assigning task"));
    }
  };

  const assignTeam = async () => {
    if (!task) return alert("Enter task title");
    setAssignMsg("⏳ AI is building team and assigning...");
    try {
      await axios.post("http://localhost:5000/assign-team", { title: task, days });
      setAssignMsg("✅ Team task assigned successfully!");
      setTask("");
      setTimeout(() => loadTasks(), 500);
    } catch (err) {
      setAssignMsg("❌ " + (err.response?.data?.msg || "Error assigning team task"));
    }
  };

  const deleteEmployee = async (emp) => {
    if (!window.confirm(`Delete ${emp.name || emp.email}? This cannot be undone.`)) return;
    await axios.delete(`http://localhost:5000/delete-employee/${emp._id}`);
    loadEmployees();
  };

  const handleEditChange = (id, field, value) => {
    setEditForm(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveRoleSalary = async (emp) => {
    const role = editForm[emp._id]?.role ?? "";
    const salary = editForm[emp._id]?.salary ?? "";
    if (!role && !salary) {
      setEditMsg(prev => ({ ...prev, [emp._id]: { text: "Enter at least one field to update.", type: "error" } }));
      return;
    }
    try {
      await axios.put(`http://localhost:5000/edit-role-salary/${emp._id}`, { role, salary });
      setEditMsg(prev => ({ ...prev, [emp._id]: { text: "Updated successfully!", type: "success" } }));
      setEditForm(prev => ({ ...prev, [emp._id]: {} }));
      loadEmployees();
      setTimeout(() => setEditMsg(prev => ({ ...prev, [emp._id]: null })), 3000);
    } catch (err) {
      setEditMsg(prev => ({ ...prev, [emp._id]: { text: err.response?.data?.msg || "Update failed.", type: "error" } }));
    }
  };

  const filteredTasks = tasks
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => !taskFilter || t.title === taskFilter)
    .filter(t => !employeeFilter || t.assignedTo === employeeFilter);

  const filteredEmployees = employees.filter(e =>
    !employeeSearch ||
    e.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.email?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const manageEmployees = employees.filter(e =>
    !manageSearch ||
    e.name?.toLowerCase().includes(manageSearch.toLowerCase()) ||
    e.email?.toLowerCase().includes(manageSearch.toLowerCase())
  );

  return (
    <div>
      <div className="sidebar">
        <h2>Office AI</h2>

        <div className={`sidebar-item ${active === "approval" && "active"}`} onClick={() => setActive("approval")}>
          <FaUserCheck /> Approval
          {users.length > 0 && <span className="notif-badge">{users.length}</span>}
        </div>

        <div className={`sidebar-item ${active === "assign" && "active"}`} onClick={() => setActive("assign")}>
          <FaTasks /> Assign Task
        </div>

        <div className={`sidebar-item ${active === "monitor" && "active"}`} onClick={() => setActive("monitor")}>
          <FaBriefcase /> Task Monitoring
        </div>

        <div className={`sidebar-item ${active === "employees" && "active"}`} onClick={() => setActive("employees")}>
          <FaUsers /> Employees
        </div>

        <div className={`sidebar-item ${active === "manage" && "active"}`} onClick={() => setActive("manage")}>
          <FaUserEdit /> Manage Role & Salary
        </div>

        <div className="sidebar-item" onClick={() => nav("/")}>
          <FaSignOutAlt /> Logout
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <p>Manage employees, tasks, performance and approvals</p>
        </div>

        {active === "approval" && (
          <div className="content-card">
            <h3>Employee Approval Requests</h3>
            {users.length === 0 && (
              <p style={{ color: "#999", marginTop: "15px" }}>✅ No pending approval requests.</p>
            )}
            {users.map((u) => (
              <div key={u._id} className="admin-card">
                {u.name && <p style={{ fontWeight: 700, color: "#0b2a63", fontSize: "16px" }}>👤 {u.name}</p>}
                <p><FaUser style={{ marginRight: 6 }} />{u.email}</p>
                <input placeholder="Assign Role (e.g. Frontend Developer)" onChange={(e) => handleChange(u._id, "role", e.target.value)} />
                <input placeholder="Assign Salary (₹)" onChange={(e) => handleChange(u._id, "salary", e.target.value)} />
                <button onClick={() => approve(u._id)}>✅ Approve</button>
                <button style={{ background: "#ef4444" }} onClick={() => rejectUser(u._id)}>❌ Reject</button>
              </div>
            ))}
          </div>
        )}

        {active === "assign" && (
          <div className="content-card">
            <h3>🤖 AI Task Assignment</h3>
            <input
              placeholder="Enter task title (e.g. Build login page, Fix API bug)..."
              value={task}
              onChange={(e) => { setTask(e.target.value); setAssignMsg(""); }}
            />
            <input
              type="number"
              placeholder="Deadline (number of days)"
              value={days}
              min={1}
              onChange={(e) => setDays(e.target.value)}
            />
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <button onClick={assignIndividual}>🤖 AI Assign Individual</button>
              <button onClick={assignTeam} style={{ background: "#7c3aed" }}>👥 AI Assign Team</button>
            </div>
            {assignMsg && (
              <p className={assignMsg.startsWith("✅") ? "msg-success" : assignMsg.startsWith("❌") ? "msg-error" : "msg-info"} style={{ marginTop: "12px" }}>
                {assignMsg}
              </p>
            )}
          </div>
        )}

        {active === "monitor" && (
          <div className="content-card">
            <div className="task-header">
              <div className="left-group">
                <h3>Task Monitoring</h3>
                <div className="filter-left">
                  {["all", "To Do", "In Progress", "Completed"].map(s => (
                    <button
                      key={s}
                      className={statusFilter === s ? "active-btn" : ""}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-right">
                <Select
                  placeholder="Search Task..."
                  isClearable
                  options={[
                    { value: "", label: "All Tasks" },
                    ...[...new Set(tasks.map(t => t.title))].map(t => ({ value: t, label: t }))
                  ]}
                  onChange={(selected) => setTaskFilter(selected?.value || "")}
                />
                <Select
                  placeholder="Search Employee..."
                  isClearable
                  options={[
                    { value: "", label: "All Employees" },
                    ...[...new Set(tasks.map(t => t.assignedTo))].map(e => ({ value: e, label: e }))
                  ]}
                  onChange={(selected) => setEmployeeFilter(selected?.value || "")}
                />
              </div>
            </div>

            {filteredTasks.length === 0 && (
              <p style={{ color: "#999", marginTop: "15px" }}>No tasks found.</p>
            )}

            {filteredTasks.map((t) => (
              <div key={t._id} className="admin-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "15px" }}>{t.title}</p>
                  <p><b>Employee:</b> {t.assignedTo}</p>
                  <p><b>Role:</b> {t.role}</p>
                  <p>
                    <b>Status:</b>{" "}
                    <span style={{
                      padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                      background: t.status === "Completed" ? "#dcfce7" : t.status === "In Progress" ? "#dbeafe" : "#fef9c3",
                      color: t.status === "Completed" ? "#16a34a" : t.status === "In Progress" ? "#1d4ed8" : "#ca8a04"
                    }}>
                      {t.status}
                    </span>
                  </p>
                  <p><b>Deadline:</b> {t.deadline ? new Date(t.deadline).toLocaleDateString("en-IN") : "—"}</p>
                </div>
                <button
                  style={{ background: "#ef4444", padding: "8px 12px", marginLeft: "10px", flexShrink: 0 }}
                  onClick={() => deleteTask(t._id)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}

        {active === "employees" && (
          <div className="content-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0 }}>👥 All Employees</h3>
                <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{employees.length} employees registered</p>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 16, pointerEvents: "none" }}>🔍</span>
                <input
                  style={{ paddingLeft: 38, margin: 0, borderRadius: 12, border: "1.5px solid #e2e8f0", height: 42, fontSize: 14, background: "#f8fafc", width: 260, outline: "none", transition: "border 0.2s" }}
                  placeholder="Search by name or email..."
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredEmployees.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 15, padding: "20px 0" }}>No employees found.</p>
            )}

            {filteredEmployees.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 4px", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#2563eb", marginBottom: 6 }}>
                    {e.name || e.email}
                  </p>
                  {e.name && (
                    <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 6 }}>{e.email}</p>
                  )}
                  <p style={{ fontSize: 16, color: "#374151", marginBottom: 6 }}>{e.role}</p>
                  <p style={{ fontSize: 16, color: "#374151", marginBottom: 12 }}>₹{e.salary}</p>

                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 16px", borderRadius: 999,
                    fontSize: 14, fontWeight: 700,
                    background: e.working ? "#dcfce7" : "#f3f4f6",
                    color: e.working ? "#16a34a" : "#6b7280",
                    border: `1px solid ${e.working ? "#86efac" : "#e5e7eb"}`
                  }}>
                    {e.working ? "🟢 Working" : "⚪ Idle"}
                  </span>
                </div>

                <button
                  title="Delete employee"
                  style={{ background: "#ef4444", padding: "8px 12px", flexShrink: 0, marginTop: 4 }}
                  onClick={() => deleteEmployee(e)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}

        {active === "manage" && (
          <div className="content-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0 }}>✏️ Manage Role & Salary</h3>
                <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                  Update employee role and/or salary. Leave a field blank to keep it unchanged.
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 16, pointerEvents: "none" }}>🔍</span>
                <input
                  style={{ paddingLeft: 38, margin: 0, borderRadius: 12, border: "1.5px solid #e2e8f0", height: 42, fontSize: 14, background: "#f8fafc", width: 260, outline: "none" }}
                  placeholder="Search by name or email..."
                  value={manageSearch}
                  onChange={e => setManageSearch(e.target.value)}
                />
              </div>
            </div>

            {manageEmployees.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 15, padding: "20px 0" }}>No employees found.</p>
            )}

            {manageEmployees.map((emp) => (
              <div key={emp._id} style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 16,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 16
              }}>
                <div style={{ minWidth: 180, flex: "1 1 180px" }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: "#2563eb", margin: 0 }}>
                    {emp.name || emp.email}
                  </p>
                  {emp.name && <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>{emp.email}</p>}
                  <p style={{ fontSize: 13, color: "#374151", margin: "4px 0 0" }}>
                    Current Role: <b>{emp.role || "—"}</b>
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", margin: "2px 0 0" }}>
                    Current Salary: <b>₹{emp.salary || "—"}</b>
                  </p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, flex: "2 1 320px", alignItems: "center" }}>
                  <input
                    style={{ flex: "1 1 150px", margin: 0, borderRadius: 10, border: "1.5px solid #e2e8f0", height: 40, fontSize: 14, padding: "0 12px", background: "#fff", outline: "none" }}
                    placeholder={`New role (e.g. ${emp.role || "Developer"})`}
                    value={editForm[emp._id]?.role ?? ""}
                    onChange={e => handleEditChange(emp._id, "role", e.target.value)}
                  />
                  <input
                    style={{ flex: "1 1 130px", margin: 0, borderRadius: 10, border: "1.5px solid #e2e8f0", height: 40, fontSize: 14, padding: "0 12px", background: "#fff", outline: "none" }}
                    placeholder={`New salary (₹)`}
                    type="number"
                    min={0}
                    value={editForm[emp._id]?.salary ?? ""}
                    onChange={e => handleEditChange(emp._id, "salary", e.target.value)}
                  />
                  <button
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 22px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      height: 40,
                      whiteSpace: "nowrap"
                    }}
                    onClick={() => saveRoleSalary(emp)}
                  >
                    💾 Save
                  </button>
                </div>

                {editMsg[emp._id] && (
                  <p style={{
                    width: "100%",
                    margin: "4px 0 0",
                    fontSize: 13,
                    fontWeight: 600,
                    color: editMsg[emp._id].type === "success" ? "#16a34a" : "#ef4444"
                  }}>
                    {editMsg[emp._id].type === "success" ? "✅" : "❌"} {editMsg[emp._id].text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
