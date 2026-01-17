const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { supabase, supabaseAdmin } = require("../supabaseClient");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Error del servidor" }, err);
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
    return res
      .status(400)
      .json({ error: "No hay campos válidos para actualizar" });
  }

  if (updates.extra && typeof updates.extra !== "object") {
    return res
      .status(400)
      .json({ error: "El campo 'extra' debe ser un objeto" });
  }

  try {
    const { data, error } = await supabase
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
    return res.status(400).json({ error: "Email requerido" });
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
      message: "Email actualizado. Revisa tu correo.",
      user: authData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      return res.status(500).json({ error: authError.message });
    }

    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    return res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
