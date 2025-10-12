// validations.js
let supabase = null;

function initSupabase(client) {
  supabase = client;
}

// Validaciones
async function validateNoteType(type) {
  if (!type) return;
  if (!supabase) throw new Error("Supabase no inicializado");

  const { data } = await supabase
    .from("note_types")
    .select("name")
    .eq("name", type)
    .single();

  if (!data) throw new Error("Invalid note type");
}

async function validateLeaveType(type) {
  if (!type) return;
  if (!supabase) throw new Error("Supabase no inicializado");

  const { data } = await supabase
    .from("leave_types")
    .select("name")
    .eq("name", type)
    .single();

  if (!data) throw new Error("Invalid leave type");
}

module.exports = { initSupabase, validateNoteType, validateLeaveType };
