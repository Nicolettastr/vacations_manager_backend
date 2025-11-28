const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;

    const { error: dbError } = await supabase.from("users").insert([
      {
        id: user.id,
        email: user.email,
      },
    ]);

    if (dbError) {
      if (dbError.code === "23505") {
        return res
          .status(400)
          .json({ error: "User already exists in the database" });
      }
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

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    delete user.password;

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", err });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `http://localhost:9002/reset-password`,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send reset email" });
    console.error(error);
  }
});

router.post("/reset-password", async (req, res) => {
  const { password, access_token } = req.body;

  if (!password || !access_token) {
    return res.status(400).json({
      error: "Password and access token are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters",
    });
  }

  try {
    const supabaseWithToken = require("@supabase/supabase-js").createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      }
    );

    const { error } = await supabaseWithToken.auth.updateUser({
      password: password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
    console.error(error);
  }
});

module.exports = router;
