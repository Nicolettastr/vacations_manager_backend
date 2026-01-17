require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

const corsOptions = {
  origin: ["http://localhost:9002", "https://teamtracker-omega.vercel.app"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rutas
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const leaveRoutes = require("./routes/leaves");
const extraDaysRoutes = require("./routes/extraDays");
const noteTypesRoutes = require("./routes/noteTypes");
const leaveTypesRoutes = require("./routes/leavesTypes");
const noteRoutes = require("./routes/notes");
const userRoutes = require("./routes/user");
const themesRoutes = require("./routes/themes");

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/extradays", extraDaysRoutes);
app.use("/api/notes/types", noteTypesRoutes);
app.use("/api/leaves/types", leaveTypesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/themes", themesRoutes);

app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente 🚀");
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Backend funcionando en puerto ${PORT}`));
}
