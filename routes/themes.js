const { authenticateToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClient");

router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("themes").select("*");

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch themes", details: error });
  }

  return res.json(data);
});

module.exports = router;
