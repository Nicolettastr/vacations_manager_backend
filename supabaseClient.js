require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE_URL:", supabaseUrl ? "OK" : "MISSING");
console.log("🔍 SUPABASE_ANON_KEY:", supabaseAnonKey ? "OK" : "MISSING");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
