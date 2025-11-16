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

  const hashPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ email, password: hashPassword }])
    .select();

  if (error?.code === "23505") {
    return res.status(400).json({ error: "Email already registered" });
  }

  if (error) return res.status(500).json({ error: error.message });

  res
    .status(201)
    .json({ message: "User registered succesfully", user: data[0] });
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

module.exports = router;
