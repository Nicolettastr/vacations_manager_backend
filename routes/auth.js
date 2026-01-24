const express = require("express");
const router = express.Router();
const { supabase, supabaseAdmin } = require("../supabaseClient");
const { authenticateToken } = require("../middleware/authMiddleware");
const { createClient } = require("@supabase/supabase-js");

router.post("/register", async (req, res) => {
  const { email, password, name, lastname, avatar, theme } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;

    const { error: dbError } = await supabaseAdmin.from("users").insert([
      {
        id: user.id,
        email: user.email,
        name: name || null,
        lastname: lastname || null,
        avatar: avatar || "default.png",
        theme: theme || "light",
        extra: { lang: "es" },
      },
    ]);

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return res.status(500).json({ error: dbError.message });
    }

    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // const token = jwt.sign(
    //   { id: data.user.id, email: data.user.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "2h" },
    // );

    // res.json({
    //   message: "Login successful",
    //   token,
    //   supabaseToken: data.session.access_token,
    //   user: data.user
    // });

    res.json({
      message: "Login successful",
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://teamtracker-omega.vercel.app/reset-password`,
    });

    if (error) {
      console.error("Supabase forgot-password error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message:
        "If the email exists in our system, a password reset link has been sent successfully.",
    });
  } catch (err) {
    console.error("Unexpected error in forgot-password:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to send reset email" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { password, access_token } = req.body;

  if (!password || !access_token) {
    return res
      .status(400)
      .json({ error: "Password and access token are required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );

    const { error: sessionError } = await supabaseClient.auth.setSession({
      access_token: access_token,
      refresh_token: access_token,
    });

    if (sessionError) {
      console.error("Session error:", sessionError);
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const { error: updateError } = await supabaseClient.auth.updateUser({
      password,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    await supabaseClient.auth.signOut();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.post("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const accessToken = authHeader.replace("Bearer ", "");

  try {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user?.email) {
      console.log("user", userError);
      console.log("user", user);
      return res.status(401).json({ error: "Invalid session" });
    }

    const { error: signError } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signError) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;
