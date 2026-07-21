const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  assignedTo: {
    type: String,
    required: true
  },

  role: {
    type: String
  },

  status: {
    type: String,
    enum: ["To Do", "In Progress", "Completed"],
    default: "To Do"
  },

  type: {
    type: String,
    enum: ["individual", "team"],
    default: "individual"
  },

  teamId: {
    type: String,
    default: null
  },

  days: {
    type: Number,
    required: true
  },

  deadline: {
    type: Date,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Task", taskSchema);