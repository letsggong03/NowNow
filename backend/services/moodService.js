const supabase = require("../config/supabase");

// 기록이 없으면 mood: null
async function getMood(user_id, date) {
  const { data, error } = await supabase
    .from("daily_moods")
    .select("mood, updated_at")
    .eq("user_id", user_id)
    .eq("record_date", date)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    date,
    mood: data?.mood ?? null,
    updatedAt: data?.updated_at ?? null
  };
}

// 하루에 하나. 다시 고르면 덮어쓴다.
async function setMood(user_id, date, mood) {
  const { data, error } = await supabase
    .from("daily_moods")
    .upsert(
      {
        user_id,
        record_date: date,
        mood,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,record_date" }
    )
    .select("mood, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { date, mood: data.mood, updatedAt: data.updated_at };
}

module.exports = {
  getMood,
  setMood
};
