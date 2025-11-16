const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { supabase } = require("../supabaseClient");
const { validateLeaveType } = require("../validations");

// LEAVES

router.get("/", authenticateToken, async (req, res) => {
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

router.post("/", authenticateToken, async (req, res) => {
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

router.patch("/:id", authenticateToken, async (req, res) => {
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
    .eq("user_id", req.user.id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update employee leave", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Leave not found" });

  res.json(data[0]);
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("leaves")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete employee leave", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Leave not found" });

  res.json({ message: "Leave deleted successfully" });
});

module.exports = router;
