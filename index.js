const express = require("express");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:9002");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const leaveRoutes = require("./routes/leaves");
const extraDaysRoutes = require("./routes/extraDays");
const noteTypesRoutes = require("./routes/noteTypes");
const leaveTypesRoutes = require("./routes/leavesTypes");

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/extradays", extraDaysRoutes);
app.use("/api/notes/types", noteTypesRoutes);
app.use("/api/leaves/types", leaveTypesRoutes);

app.get("/", (req, res) => res.send("Backend funcionando correctamente 🚀"));

module.exports = app;
