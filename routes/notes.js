const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { supabaseAdmin } = require("../supabaseClient");

const { validateNoteType } = require("../validations");

router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("notes")
    .select("*")
    .eq("user_id", req.user.id);
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch notes", details: error });
  res.json(data);
});

router.post("/", authenticateToken, async (req, res) => {
  const { date, content, employee_id, type, title } = req.body;

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

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert([{ date, content, employee_id, type, title, user_id: req.user.id }])
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to create note", details: error });
  res.status(201).json(data[0]);
});

router.patch("/:id", authenticateToken, async (req, res) => {
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

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update note", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Note not found" });

  res.json(data[0]);
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete note", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Note not found" });

  res.json({ message: "Note deleted successfully" });
});

module.exports = router;
