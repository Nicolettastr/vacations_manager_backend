const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const { authenticateToken } = require("../middleware/authMiddleware");

// NOTE TYPES

router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("note_types").select("*");
  if (error)
    return res
      .status(500)
      .json({ error: "Failed to fetch note types", details: error });
  res.json(data);
});

module.exports = router;
