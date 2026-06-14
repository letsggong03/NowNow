import { supabase } from "../supabase";

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_information")
    .select("nickname")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data.nickname;
}
