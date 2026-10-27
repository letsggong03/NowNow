import { supabase } from "../supabase";
import { getMe } from "./auth";
import { chatAiConfig } from './chatAiConfig';

// 백엔드(/api/auth/me)를 먼저 쓰고, 서버에 못 붙으면 Supabase에서 직접 읽는다.
export async function getProfile() {
  if (chatAiConfig.demoMode === true) return '시연 사용자';
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
    .eq("id", user.id)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data.nickname as string | null;
}
