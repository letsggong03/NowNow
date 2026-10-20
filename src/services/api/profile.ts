import { supabase } from "../supabase";

// 회원가입(SignupPage)에서 저장하는 테이블/컬럼과 동일하게 맞춘다.
export async function getProfile() {
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
