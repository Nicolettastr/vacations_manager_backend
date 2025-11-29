require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE_URL:", supabaseUrl ? "OK" : "MISSING");
console.log("🔍 SUPABASE_ANON_KEY:", supabaseAnonKey ? "OK" : "MISSING");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ⬇️ AGREGAR ESTAS LÍNEAS
const { initSupabase } = require("./validations");
initSupabase(supabase);
console.log("✅ Supabase y validaciones inicializados");

module.exports = { supabase };
