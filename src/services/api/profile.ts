import { supabase } from "../supabase";
import { getMe } from "./auth";
import { ApiError, request } from "./client";

export interface UserSettings {
  nickname: string;
  status_message: string | null;
  character_type: string | null;
  notification_enabled: boolean;
  notify_time: string; // "HH:MM"
  stress_threshold: number | null;
}

// 이메일 인증을 거치면 가입 직후에는 세션이 없어 프로필을 넣을 수 없다.
// 세션이 생기면 서버가 가입 때 넣은 닉네임(user_metadata)으로 프로필 행을 만든다.
// 이미 있으면 건드리지 않는다.
export async function ensureProfile() {
  try {
    await request("POST", "/api/me/profile");
  } catch (error) {
    console.log("[ensureProfile] 프로필 저장 실패:", error);
  }
}

// 프로필 행이 아직 없으면 null
export async function getSettings() {
  try {
    const res = await request<{ message: string; data: UserSettings }>(
      "GET",
      "/api/me/settings"
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateStressThreshold(stressThreshold: number) {
  await request('PUT', '/api/me/settings', {body: {stress_threshold: stressThreshold}});
}

// 서버에 못 붙거나 프로필 행이 아직 없으면 가입 때 넣은 닉네임을 쓴다.
export async function getProfile() {
  try {
    const me = await getMe();
    if (me.nickname) return me.nickname;
  } catch (apiError) {
    console.log("[getProfile] 프로필 조회 실패:", apiError);
  }

  const { data } = await supabase.auth.getSession();
  return (data.session?.user.user_metadata?.nickname ?? null) as string | null;
}
