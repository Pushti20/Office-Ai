require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const connectDB = require("./db");
connectDB();

const User = require("./models/User");
const Task = require("./models/Task");
const { getRoleFromAI, getTeamFromAI } = require("./ai");

const admin = {
  email: "admin@123",
  password: "123",
  role: "admin"
};

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    await User.create({ name, email, password, status: "pending" });
    res.json({ msg: "Request sent to admin" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Signup error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === admin.email && password === admin.password) return res.json(admin);
    const user = await User.findOne({ email, password });
    if (!user || user.status !== "approved") return res.status(400).json({ msg: "Invalid or not approved" });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Login error" });
  }
});

app.post("/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.password !== oldPassword) return res.status(400).json({ msg: "Old password is incorrect" });
    await User.findByIdAndUpdate(user._id, { password: newPassword });
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Change password error" });
  }
});

app.get("/get-employee/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ msg: "Employee not found" });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching employee" });
  }
});

app.get("/pending", async (req, res) => {
  try {
    const users = await User.find({ status: "pending" });
    res.json(users);
  } catch {
    res.status(500).json({ msg: "Error fetching pending users" });
  }
});

app.post("/approve/:id", async (req, res) => {
  try {
    const { role, salary } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role, salary, status: "approved" });
    res.json({ msg: "Approved" });
  } catch {
    res.status(500).json({ msg: "Approval error" });
  }
});

app.delete("/reject/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Rejected" });
  } catch {
    res.status(500).json({ msg: "Reject error" });
  }
});

app.put("/edit-salary/:id", async (req, res) => {
  try {
    const { salary } = req.body;
    await User.findByIdAndUpdate(req.params.id, { salary });
    res.json({ msg: "Salary updated" });
  } catch {
    res.status(500).json({ msg: "Edit salary error" });
  }
});

app.delete("/delete-employee/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Employee deleted" });
  } catch {
    res.status(500).json({ msg: "Delete employee error" });
  }
});

app.put("/edit-role-salary/:id", async (req, res) => {
  try {
    const { role, salary } = req.body;
    const updates = {};
    if (role !== undefined && role !== "") updates.role = role;
    if (salary !== undefined && salary !== "") updates.salary = salary;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: "No fields to update" });
    }
    await User.findByIdAndUpdate(req.params.id, updates);
    res.json({ msg: "Employee updated successfully" });
  } catch {
    res.status(500).json({ msg: "Edit role/salary error" });
  }
});

app.get("/all-employees", async (req, res) => {
  try {
    const users = await User.find({ status: "approved" });
    res.json(users);
  } catch {
    res.status(500).json({ msg: "Error fetching employees" });
  }
});

app.get("/employee-status", async (req, res) => {
  try {
    const users = await User.find({ status: "approved" });
    let result = [];
    for (let u of users) {
      const tasks = await Task.find({ assignedTo: u.email });
      const activeTasks = tasks.filter(t => t.status !== "Completed");
      result.push({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        salary: u.salary,
        working: activeTasks.length > 0
      });
    }
    res.json(result);
  } catch {
    res.status(500).json({ msg: "Error fetching employee status" });
  }
});

function findBestUser(users, role) {
  if (!users.length) return null;
  let matched = users.filter(u => u.role?.toLowerCase().trim() === role?.toLowerCase().trim());
  if (matched.length === 0) matched = users.filter(u => u.role?.toLowerCase().includes(role?.toLowerCase()));
  return matched.length ? matched[Math.floor(Math.random() * matched.length)] : users[Math.floor(Math.random() * users.length)];
}

app.post("/assign-task", async (req, res) => {
  try {
    const { title, days } = req.body;
    const users = await User.find({ status: "approved" });
    if (!users.length) return res.status(400).json({ msg: "No employees available" });

    const role = await getRoleFromAI(title, "individual");
    const user = findBestUser(users, role);
    if (!user) return res.status(400).json({ msg: "No matching user found" });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(days || 1));

    const task = await Task.create({
      title, assignedTo: user.email, role,
      type: "individual", status: "To Do", days, deadline
    });

    res.json({ msg: "Task Assigned", task });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error assigning task" });
  }
});

app.post("/assign-team", async (req, res) => {
  try {
    const { title, days } = req.body;
    const users = await User.find({ status: "approved" });
    if (users.length < 2) return res.status(400).json({ msg: "Not enough employees for team" });

    const availableRoles = users.map(u => u.role);
    const teamRoles = await getTeamFromAI(title, availableRoles);
    console.log("🤖 AI Team Roles:", teamRoles.map(r => r.role));

    const team = [];
    const usedEmails = new Set();

    for (let roleObj of teamRoles) {
      const role = roleObj.role.toLowerCase().trim();
      let candidates = users.filter(u => u.role?.toLowerCase().trim() === role);
      if (candidates.length === 0) {
        candidates = users.filter(u => u.role?.toLowerCase().includes(role));
      }
      const pick = candidates.find(u => !usedEmails.has(u.email));
      if (pick) {
        team.push(pick);
        usedEmails.add(pick.email);
      }
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(days || 1));

    const tasks = [];
    for (let member of team) {
      const t = await Task.create({
        title, assignedTo: member.email, role: member.role,
        type: "team", status: "To Do", days, deadline
      });
      tasks.push(t);
    }

    res.json({ msg: `Team Task Assigned to ${tasks.length} members`, tasks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error assigning team task" });
  }
});

app.get("/my-tasks/:email", async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.email }).sort({ deadline: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching tasks" });
  }
});

app.get("/all-tasks", async (req, res) => {
  const tasks = await Task.find().sort({ deadline: 1 });
  res.json(tasks);
});

app.post("/update-task/:id", async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ msg: "Updated" });
  } catch {
    res.status(500).json({ msg: "Update error" });
  }
});

app.put("/edit-task/:id", async (req, res) => {
  try {
    const { title, deadline } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (deadline) updates.deadline = new Date(deadline);
    await Task.findByIdAndUpdate(req.params.id, updates);
    res.json({ msg: "Task updated" });
  } catch {
    res.status(500).json({ msg: "Edit task error" });
  }
});

app.delete("/delete-task/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: "Task deleted" });
  } catch {
    res.status(500).json({ msg: "Delete task error" });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port 5000")
);