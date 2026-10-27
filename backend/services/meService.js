const supabase = require("../config/supabase");

const SETTINGS_COLUMNS =
  "nickname, status_message, character_type, notification_enabled, notify_time, stress_threshold";

// notify_time은 DB에서 "HH:MM:SS"로 오므로 "HH:MM"으로 맞춘다.
const toSettings = row => ({
  ...row,
  notify_time: row.notify_time ? row.notify_time.slice(0, 5) : null
});

async function getSettings(user_id) {
  const { data, error } = await supabase
    .from("user_informations")
    .select(SETTINGS_COLUMNS)
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toSettings(data) : null;
}

async function updateSettings(user_id, updates) {
  const { data, error } = await supabase
    .from("user_informations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", user_id)
    .select(SETTINGS_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toSettings(data) : null;
}

// 같은 기기 토큰이 다른 계정에 있었으면 지금 계정으로 옮긴다.
async function savePushToken(user_id, token, platform) {
  const { data, error } = await supabase
    .from("push_tokens")
    .upsert(
      { user_id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    )
    .select("push_token_id, platform, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deletePushToken(user_id, token) {
  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", user_id)
    .eq("token", token);

  if (error) {
    throw new Error(error.message);
  }
}

// auth 사용자를 지우면 FK ON DELETE CASCADE로 사용자 데이터가 모두 지워진다.
async function deleteAccount(user_id) {
  const { error } = await supabase.auth.admin.deleteUser(user_id);

  if (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  savePushToken,
  deletePushToken,
  deleteAccount
};
