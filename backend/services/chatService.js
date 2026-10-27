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
  let query = supabase
    .from("chat_messages")
    .delete()
    .eq("chat_id", chat_id);

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

async function createSummary({ chat_id, user_id, summary }) {
  const { data, error } = await supabase
    .from("chat_summaries")
    .insert([
      {
        chat_id,
        user_id,
        summary
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