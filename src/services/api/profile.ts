import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { getMe } from "./auth";
import { chatAiConfig } from './chatAiConfig';

// 이메일 인증을 거치면 가입 직후에는 세션이 없어 RLS 때문에 프로필을 넣을 수 없다.
// 그래서 닉네임은 가입 때 user_metadata에 담아 두고, 세션이 생기면 프로필 행을 만든다.
// 이미 있으면 건드리지 않는다.
export async function ensureProfile(user: User) {
  const { error } = await supabase.from("user_informations").upsert(
    {
      user_id: user.id,
      nickname: user.user_metadata?.nickname ?? "사용자",
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  if (error) {
    console.log("[ensureProfile] 프로필 저장 실패:", error.message);
  }
}

// 백엔드(/api/auth/me)를 먼저 쓰고, 서버에 못 붙으면 Supabase에서 직접 읽는다.
export async function getProfile() {
  const {data: auth} = await supabase.auth.getSession();
  if (!auth.session && chatAiConfig.demoMode === true) return '시연 사용자';
  try {
    const me = await getMe();
    return me.nickname ?? null;
  } catch (apiError) {
    console.log("[getProfile] API 실패, Supabase로 폴백:", apiError);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_informations")
    .select("nickname")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.log(error);
  }

  // 프로필 행이 아직 없으면 가입 때 넣은 닉네임을 쓴다.
  return (data?.nickname ?? user.user_metadata?.nickname ?? null) as
    | string
    | null;
}
