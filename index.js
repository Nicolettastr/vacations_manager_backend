require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { validateLeaveType, validateNoteType } = require("./validations");
const { authenticateToken } = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:9002",
    credentials: true,
  })
);
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente 🚀");
});

// AUTHENTICATION

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ email, password: hashPassword }])
    .select();

  if (error?.code === "23505") {
    return res.status(400).json({ error: "Email already registered" });
  }

  if (error) return res.status(500).json({ error: error.message });

  res
    .status(201)
    .json({ message: "User registered succesfully", user: data[0] });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    delete user.password;

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// EMPLOYEES

app.get("/api/employees", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", req.user.id);
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch employees", details: error });
  res.json(data);
});

app.post("/api/employees", authenticateToken, async (req, res) => {
  const { name, surname, email } = req.body;

  if (!name || !surname || !email) {
    return res
      .status(400)
      .json({ error: "All fields (name, surname, email) are required" });
  }

  const { data, error } = await supabase
    .from("employees")
    .insert([{ name, surname, email, user_id: req.user.id }])
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to create employee", details: error });
  res.status(201).json(data[0]);
});

app.patch("/api/employees/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field must be provided to update" });
  }

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update employee", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Employee not found" });

  res.json(data[0]);
});

app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete employee", details: error });

  res.json({ message: "Employee deleted successfully" });
});

// NOTES

app.get("/api/notes", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", req.user.id);
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch notes", details: error });
  res.json(data);
});

app.post("/api/notes", authenticateToken, async (req, res) => {
  const { date, content, employee_id, type } = req.body;

  if (!date || !content || !type) {
    return res
      .status(400)
      .json({ error: "Fields 'date', 'content' and 'type' are required" });
  }

  try {
    await validateNoteType(type);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const { data, error } = await supabase
    .from("notes")
    .insert([{ date, content, employee_id, type, user_id: req.user.id }])
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to create note", details: error });
  res.status(201).json(data[0]);
});

app.patch("/api/notes/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0)
    return res
      .status(400)
      .json({ error: "At least one field must be provided to update" });
  if (updates.type) {
    try {
      await validateNoteType(updates.type);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update note", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Note not found" });

  res.json(data[0]);
});

app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete note", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Note not found" });

  res.json({ message: "Note deleted successfully" });
});

// NOTE TYPES

app.get("/api/notes/types", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("note_types").select("*");
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch note types", details: error });
  res.json(data);
});

// LEAVE TYPES

app.get("/api/leaves/types", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("leave_types").select("*");
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch leave types", details: error });
  res.json(data);
});

// LEAVES

app.get("/api/leaves", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("user_id", req.user.id);
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch leaves", details: error });
  res.json(data);
});

app.post("/api/leaves", authenticateToken, async (req, res) => {
  const { employee_id, type, start_date, end_date, note } = req.body;

  if (!employee_id || !type || !start_date || !end_date) {
    return res.status(400).json({
      error:
        "Fields 'start_date', 'end_date', 'employee_id' and 'type' are required",
    });
  }

  if (type) {
    try {
      await validateLeaveType(type);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  const { data, error } = await supabase
    .from("leaves")
    .insert([
      { employee_id, type, start_date, end_date, note, user_id: req.user.id },
    ])
    .select();

  if (error)
    return res.status(500).json({ error: "Failed to create employee leave" });
  res.status(201).json(data[0]);
});

app.patch("/api/leaves/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0)
    return res
      .status(400)
      .json({ error: "At least one field must be provided to update" });
  if (updates.type) {
    try {
      await validateLeaveType(updates.type);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  const { data, error } = await supabase
    .from("leaves")
    .update(updates)
    .eq("id", id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update employee leave", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Leave not found" });

  res.json(data[0]);
});

app.delete("/api/leaves/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("leaves")
    .delete()
    .eq("id", id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete employee leave", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Leave not found" });

  res.json({ message: "Leave deleted successfully" });
});

// START SERVER

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
