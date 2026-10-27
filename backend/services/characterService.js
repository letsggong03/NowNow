const supabase = require("../config/supabase");
const { kstDayRange } = require("../utils/kstDate");

async function createInteraction(user_id, action, choice) {
  const { data, error } = await supabase
    .from("character_interactions")
    .insert([{ user_id, action, choice }])
    .select("interaction_id, action, choice, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// 그날(한국 시간) 상호작용, 오래된 순
async function getInteractions(user_id, date) {
  const { start, end } = kstDayRange(date);

  const { data, error } = await supabase
    .from("character_interactions")
    .select("interaction_id, action, choice, created_at")
    .eq("user_id", user_id)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  createInteraction,
  getInteractions
};
