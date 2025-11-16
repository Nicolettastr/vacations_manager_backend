const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend funcionando en puerto ${PORT}`));

module.exports = app;
