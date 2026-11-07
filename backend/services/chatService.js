const supabase = require("../config/supabase");

async function createMessage({ user_id, chat_role, message }) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([
      {
        user_id,
        chat_role,
        message
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getMessagesByUser(user_id) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function deleteMessage(chat_id, user_id) {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("chat_id", chat_id)
    .eq("user_id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

async function createSummary({ chat_id, user_id, summary, keywords = [] }) {
  const { data: message, error: lookupError } = await supabase
    .from("chat_messages").select("chat_id").eq("chat_id", chat_id)
    .eq("user_id", user_id).maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (!message) throw Object.assign(new Error("본인의 채팅 기록을 찾을 수 없습니다."), { status: 404 });
  const { data: existing, error: existingError } = await supabase
    .from("chat_summaries").select("summary_id, created_at")
    .eq("chat_id", chat_id).eq("user_id", user_id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) {
    const { data, error } = await supabase.from("chat_summaries")
      .update({ summary, keywords, created_at: existing.created_at ?? new Date().toISOString() })
      .eq("summary_id", existing.summary_id)
      .eq("user_id", user_id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase
    .from("chat_summaries")
    .insert([
      {
        chat_id,
        user_id,
        summary,
        created_at: new Date().toISOString(),
        keywords
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getSummariesByUser(user_id) {
  const { data, error } = await supabase
    .from("chat_summaries")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  createMessage,
  getMessagesByUser,
  deleteMessage,
  createSummary,
  getSummariesByUser
};
