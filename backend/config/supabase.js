const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL이 .env에 없습니다.");
}

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_ANON_KEY가 .env에 없습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;