const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClient");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("extra_days")
    .select("*, employees(name, surname)")
    .eq("user_id", req.user.id)
    .order("date", { ascending: false });

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch extra days", details: error });
  res.json(data);
});

router.get("/:id", authenticateToken, async (req, res) => {
  const { employeeId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("extra_days")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("user_id", req.user.id)
    .order("date", { ascending: false });

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch employee extra days", details: error });
  res.json(data);
});

router.post("/", authenticateToken, async (req, res) => {
  const { employee_id, extra_hours, reason, date } = req.body;

  if (!employee_id || extra_hours === undefined) {
    return res.status(400).json({ error: "employee_id and days are required" });
  }

  const { data, error } = await supabaseAdmin
    .from("extra_days")
    .insert([
      {
        employee_id,
        user_id: req.user.id,
        extra_hours,
        reason,
        date: date || new Date().toISOString().split("T")[0],
      },
    ])
    .select("*, employees(name, surname)");

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to create extra days", details: error });
  res.status(201).json(data[0]);
});

router.patch("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field must be provided to update" });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("extra_days")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update extra days", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Extra days record not found" });

  res.json(data[0]);
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("extra_days")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete extra days", details: error });

  res.json({ message: "Extra days deleted successfully" });
});

module.exports = router;
