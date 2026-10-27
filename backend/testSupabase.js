const supabase = require("./config/supabase");

async function testConnection() {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase 연결 실패:", error.message);
    return;
  }

  console.log("Supabase 연결 성공:", data);
}

testConnection();