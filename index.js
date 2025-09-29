require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { validateLeaveType } = require("./validations");

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// EMPLOYEES

app.get("/api/employees", async (req, res) => {
  const { data, error } = await supabase.from("employees").select("*");
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch employees", details: error });
  res.json(data);
});

app.post("/api/employees", async (req, res) => {
  const { name, surname, email } = req.body;

  if (!name || !surname || !email) {
    return res
      .status(400)
      .json({ error: "All fields (name, surname, email) are required" });
  }

  const { data, error } = await supabase
    .from("employees")
    .insert([{ name, surname, email }])
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to create employee", details: error });
  res.status(201).json(data[0]);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);

app.patch("/api/employees/:id", async (req, res) => {
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

app.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete employee", details: error });

  res.json({ message: "Employee deleted successfully" });
});

// NOTES

app.get("/api/notes", async (req, res) => {
  const { data, error } = await supabase.from("notes").select("*");

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch notes", details: error });
  }

  res.json(data);
});

app.post("/api/notes", async (req, res) => {
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
    .insert([{ date, content, employee_id, type }])
    .select();

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to create note", details: error });
  }

  res.status(201).json(data[0]);
});

app.patch("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field must be provided to update" });
  }

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

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to update note", details: error });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Note not found" });
  }

  res.json(data[0]);
});

app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to delete note", details: error });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Note not found" });
  }

  res.json({ message: "Note deleted successfully" });
});

// LEAVES TYPES

app.get("/api/leaves/types", async (req, res) => {
  const { data, error } = await supabase.from("leave_types").select("*");

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch leave types", details: error });
  }

  res.json(data);
});

// NOTE TYPES

app.get("/api/notes/types", async (req, res) => {
  const { data, error } = await supabase.from("note_types").select("*");

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch note types", details: error });
  }

  res.json(data);
});

// LEAVES

app.get("/api/leaves", async (req, res) => {
  const { data, error } = await supabase.from("leaves").select("*");

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch leaves", details: error });
  }

  res.json(data);
});

app.post("/api/leaves", async (req, res) => {
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
    .insert([{ employee_id, type, start_date, end_date, note }])
    .select();

  if (error) {
    return res.status(500).json({ error: "Failed to create employee leave" });
  }

  res.status(201).json(data[0]);
});
app.patch("/api/leaves/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field must be provided to update" });
  }

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

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to update employee leave", details: error });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Leave not found" });
  }

  res.json(data[0]);
});

app.delete("/api/leaves/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("leaves")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to delete employee leave", details: error });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Leave not found" });
  }

  res.json({ message: "Leave deleted successfully" });
});
