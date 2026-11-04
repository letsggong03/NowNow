const { createClient } = require("@supabase/supabase-js");
const supabase = require("../config/supabase");

// 공용 클라이언트로 로그인하면 그 사용자 세션이 서버의 다른 DB 요청에도 붙는다.
// 로그인은 요청마다 따로 만든 클라이언트로 한다.
const createSignInClient = () =>
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

async function signup({ email, password, nickname, character_type, notification_enabled }) {
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user.id;

  const { data: userInfo, error: infoError } = await supabase
    .from("user_informations")
    .insert([
      {
        user_id: userId,
        nickname: nickname || "사용자",
        character_type: character_type || "default",
        notification_enabled:
          notification_enabled === undefined ? true : notification_enabled
      }
    ])
    .select()
    .single();

  if (infoError) {
    throw new Error(infoError.message);
  }

  return {
    user: authData.user,
    user_information: userInfo
  };
}

async function login({ email, password }) {
  const { data, error } = await createSignInClient().auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user.id;

  const { data: userInfo, error: infoError } = await supabase
    .from("user_informations")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (infoError) {
    throw new Error(infoError.message);
  }

  return {
    token: data.session.access_token,
    user: data.user,
    user_information: userInfo
  };
}

async function getMyInfo(user_id) {
  const { data, error } = await supabase
    .from("user_informations")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateMyInfo(user_id, updateData) {
  const { data, error } = await supabase
    .from("user_informations")
    .update({
      nickname: updateData.nickname,
      character_type: updateData.character_type,
      notification_enabled: updateData.notification_enabled,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  signup,
  login,
  getMyInfo,
  updateMyInfo
};