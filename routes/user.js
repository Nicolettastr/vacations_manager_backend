const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { supabaseAdmin } = require("../supabaseClient");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Server error" }, err);
  }
});

router.patch("/users", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const allowedFields = ["name", "lastname", "avatar", "theme", "extra"];

  const updates = {};

  for (const field of allowedFields) {
    if (field in req.body) {
      updates[field] = req.body[field];
    }
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  if (updates.extra && typeof updates.extra !== "object") {
    return res
      .status(400)
      .json({ error: "The 'extra' field must be an object" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/email", authenticateToken, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        email,
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ email })
      .eq("id", req.user.id)
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res.json({
      message: "Email updated. Check your inbox.",
      user: authData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return res.status(500).json({ error: authError.message });
    }

    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
