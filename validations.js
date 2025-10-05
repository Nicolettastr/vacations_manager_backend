const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function validateNoteType(type) {
  if (!type) return;

  const { data } = await supabase
    .from("note_types")
    .select("name")
    .eq("name", type)
    .single();

  if (!data) throw new Error("Invalid note type");
}

async function validateLeaveType(type) {
  if (!type) return;

  const { data } = await supabase
    .from("leave_types")
    .select("name")
    .eq("name", type)
    .single();

  if (!data) throw new Error("Invalid leave type");
}

module.exports = { validateNoteType, validateLeaveType };
