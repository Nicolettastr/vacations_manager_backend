const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, async (req, res) => {
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

router.post("/", authenticateToken, async (req, res) => {
  const { name, surname, email, color } = req.body;

  if (!name || !surname || !email) {
    return res
      .status(400)
      .json({ error: "All fields (name, surname, email) are required" });
  }

  const { data: existing } = await supabase
    .from("employees")
    .select("email")
    .eq("email", email)
    .eq("user_id", req.user.id)
    .single();

  if (existing) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const { data, error } = await supabase
    .from("employees")
    .insert([{ name, surname, email, user_id: req.user.id, color }])
    .select();

  if (error?.code === "23505") {
    return res.status(400).json({ error: "Email already exists" });
  }

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to create employee", details: error });
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

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to update employee", details: error });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Employee not found" });

  res.json(data[0]);
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error)
    return res
      .status(500)
      .json({ error: "Failed to delete employee", details: error });

  res.json({ message: "Employee deleted successfully" });
});

module.exports = router;
