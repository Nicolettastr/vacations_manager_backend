// require("dotenv").config();
// const { createClient } = require("@supabase/supabase-js");

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// console.log("🔍 SUPABASE_URL:", supabaseUrl ? "✅ Definida" : "❌ NO definida");
// console.log("🔍 SUPABASE_KEY:", supabaseKey ? "✅ Definida" : "❌ NO definida");

// if (!supabaseUrl || !supabaseKey) {
//   console.warn("Supabase no se inicializó. Algunas rutas no funcionarán ⚠️");
// }

// const supabase = createClient(supabaseUrl, supabaseKey);

// module.exports = { supabase };

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Cambiado

console.log("🔍 SUPABASE_URL:", supabaseUrl ? "✅ Definida" : "❌ NO definida");
console.log(
  "🔍 SUPABASE_ANON_KEY:",
  supabaseAnonKey ? "✅ Definida" : "❌ NO definida"
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase no se inicializó. Algunas rutas no funcionarán ⚠️");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
