const { exec } = require("child_process");

function getRoleFromAI(task, mode = "individual") {
  return new Promise((resolve) => {
    const t = task.toLowerCase();

    exec(`python model/predict.py "${task}" ${mode}`, (err, stdout) => {
      if (err) {
        console.log("ML Error:", err);
        if (mode === "team") {
          return resolve("frontend developer,backend developer,full stack developer");
        }
        return resolve("full stack developer");
      }

      let result = stdout.trim().toLowerCase();
      console.log("RAW AI:", result);

      if (!result || result === "") {
        if (mode === "team") {
          return resolve("frontend developer,backend developer,full stack developer");
        }
        return resolve("full stack developer");
      }

      result = result
        .split(",")
        .map(r => r.trim())
        .filter(r => r !== "")
        .join(",");

      if (mode === "individual" && !result.includes(",")) {

        if (
          t.includes("full stack") ||
          t.includes("fullstack") ||
          (t.includes("frontend") && t.includes("backend")) ||
          (t.includes("ui") && t.includes("api")) ||
          (t.includes("react") && t.includes("node")) ||
          (t.includes("client") && t.includes("server"))
        ) {
          return resolve("full stack developer");
        }

        if (t.includes("aws") || t.includes("cloud")) {
          return resolve("cloud engineer");
        }

        if (t.includes("react") || t.includes("css") || t.includes("ui")) {
          return resolve("frontend developer");
        }

        if (t.includes("api") || t.includes("server") || t.includes("backend")) {
          return resolve("backend developer");
        }

        if (t.includes("test") || t.includes("bug") || t.includes("testing")) {
          return resolve("qa engineer");
        }

        if (t.includes("data") || t.includes("analysis") || t.includes("report")) {
          return resolve("data analyst");
        }

        if (t.includes("docker") || t.includes("pipeline") || t.includes("ci/cd")) {
          return resolve("devops engineer");
        }

        if (t.includes("linux") || t.includes("embedded") || t.includes("firmware")) {
          return resolve("embedded linux developer");
        }

        if (t.includes("security") || t.includes("attack") || t.includes("vulnerability")) {
          return resolve("cyber security analyst");
        }

        if (t.includes("penetration") || t.includes("hacking")) {
          return resolve("ethical hacker");
        }

        if (t.includes("sql") || t.includes("database")) {
          return resolve("sql developer");
        }

        if (t.includes("android")) {
          return resolve("android developer");
        }

        if (t.includes("ios") || t.includes("swift")) {
          return resolve("ios developer");
        }

        if (t.includes("hadoop") || t.includes("spark") || t.includes("big data")) {
          return resolve("big data engineer");
        }

        if (t.includes("design") || t.includes("figma") || t.includes("ux")) {
          return resolve("ui/ux designer");
        }

        return resolve(result);
      }

      return resolve(result);
    });
  });
}

async function getTeamFromAI(task, roles) {
  const t = task.toLowerCase();

  try {
    const mlRoles = await new Promise((resolve, reject) => {
      exec(`python model/predict.py "${task}" team`, (err, stdout) => {
        if (err) return reject(err);
        const result = stdout.trim().toLowerCase();
        if (!result) return reject(new Error("empty"));
        const parsed = result.split(",").map(r => r.trim()).filter(r => r.length > 0);
        resolve(parsed);
      });
    });

    if (mlRoles.length >= 2) {
      // Capitalize first letter of each word for display
      const capitalize = s => s.replace(/\b\w/g, c => c.toUpperCase());
      const team = mlRoles.map(r => ({ role: capitalize(r), task: `Handle ${capitalize(r)} responsibilities` }));
      console.log("🤖 ML Team Roles used:", team.map(r => r.role));
      return team;
    }
  } catch (e) {
    console.log("ML team fallback to keywords:", e.message);
  }

  let team = [];

  if (t.includes("full stack") || (t.includes("frontend") && t.includes("backend"))) {
    team.push({ role: "Full Stack Developer", task: "Handle complete system" });
    team.push({ role: "Backend Developer", task: "Build API" });
  }

  if (t.includes("website") || t.includes("web app") || t.includes("e-commerce") || t.includes("ecommerce")) {
    team.push({ role: "Frontend Developer", task: "Build UI" });
    team.push({ role: "Backend Developer", task: "Build API" });
  }

  if (t.includes("design") || t.includes("ux") || t.includes("figma")) {
    team.push({ role: "UI/UX Designer", task: "Design UI" });
    team.push({ role: "Frontend Developer", task: "Implement Design" });
  }

  if (t.includes("data") || t.includes("analytics") || t.includes("report")) {
    team.push({ role: "Data Analyst", task: "Analyze Data" });
    team.push({ role: "Backend Developer", task: "Build Data API" });
  }

  if (t.includes("deploy") || t.includes("aws") || t.includes("cloud") || t.includes("infrastructure")) {
    team.push({ role: "Cloud Engineer", task: "Deploy System" });
    team.push({ role: "DevOps Engineer", task: "Setup Pipeline" });
  }

  if (t.includes("security") || t.includes("hack") || t.includes("vulnerability") || t.includes("penetration")) {
    team.push({ role: "Cyber Security Analyst", task: "Security Assessment" });
    team.push({ role: "Ethical Hacker", task: "Penetration Testing" });
  }

  if (t.includes("test") || t.includes("bug") || t.includes("fix") || t.includes("defect")) {
    team.push({ role: "QA Engineer", task: "Test Application" });
    team.push({ role: "Full Stack Developer", task: "Fix Issues" });
  }

  if (t.includes("api") || t.includes("backend") || t.includes("server")) {
    team.push({ role: "Backend Developer", task: "Build API" });
    team.push({ role: "Full Stack Developer", task: "Integrate System" });
  }

  const seen = new Set();
  team = team.filter(item => {
    if (seen.has(item.role)) return false;
    seen.add(item.role);
    return true;
  });

  if (team.length === 0) {
    team.push({ role: "Full Stack Developer", task: task });
    team.push({ role: "Backend Developer", task: task });
  }

  return team.slice(0, 4);
}


module.exports = { getRoleFromAI, getTeamFromAI };