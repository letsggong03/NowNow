const supabase = require("../config/supabase");
const { DEFAULT_NOTIFY_TIME } = require("../utils/settings");

const SETTINGS_COLUMNS =
  "nickname, status_message, character_type, notification_enabled, notify_time, stress_threshold";

// notify_time은 DB에서 "HH:MM:SS"로 오므로 "HH:MM"으로 맞춘다.
// 정하지 않은 값은 실제로 적용되는 기본값으로 보여 준다(알림 켜짐, 23:00).
const toSettings = row => ({
  ...row,
  notification_enabled: row.notification_enabled ?? true,
  notify_time: row.notify_time ? row.notify_time.slice(0, 5) : DEFAULT_NOTIFY_TIME
});

// 이메일 인증을 거치면 가입 때는 세션이 없어 프로필을 못 만든다.
// 닉네임은 가입 때 user_metadata에 담겨 있으니 그걸로 만든다.
async function ensureProfile(user) {
  const nickname = String(user.user_metadata?.nickname ?? "").trim().slice(0, 20) || "사용자";

  const { error } = await supabase
    .from("user_informations")
    .upsert(
      { user_id: user.id, nickname },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  if (error) {
    throw new Error(error.message);
  }
}

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
  ensureProfile,
  getSettings,
  updateSettings,
  savePushToken,
  deletePushToken,
  deleteAccount
};
