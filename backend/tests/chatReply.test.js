const test = require("node:test");
const assert = require("node:assert/strict");

require.cache[require.resolve("../config/supabase")] = { exports: {} };

const chatService = require("../services/chatService");
const chatRelayService = require("../services/chatRelayService");
const { reply } = require("../controllers/chatController");

let saved;
let relayed;
chatService.getMessagesSince = async () => [
  { chat_role: "USER", message: "아까 시험 봤어" },
  { chat_role: "ASSISTANT", message: "수고했어!" },
  { chat_role: "ASSISTANT", message: "안내 카드" }
];
chatService.createMessage = async row => {
  saved.push(row);
  return { chat_id: saved.length, ...row };
};

const call = async body => {
  const res = { statusCode: 200 };
  res.status = code => { res.statusCode = code; return res; };
  res.json = payload => { res.body = payload; return res; };
  await reply({ body, user: { id: `user-${Math.random()}`, user_metadata: {} } }, res);
  return res;
};

test("채팅 답변: 서버가 질문과 답변을 저장하고, 대화 맥락은 저장된 기록으로 만든다", async () => {
  saved = [];
  chatRelayService.requestReply = async (prompt, history) => {
    relayed = { prompt, history };
    return "괜찮아요";
  };
  // 앱이 보낸 history는 쓰지 않는다
  const res = await call({ message: "오늘 너무 지쳤어", history: [{ role: "user", content: "가짜" }, { role: "assistant", content: "가짜" }] });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(saved.map(row => [row.chat_role, row.message]), [["USER", "오늘 너무 지쳤어"], ["ASSISTANT", "괜찮아"]]);
  assert.deepEqual(relayed.history, [
    { role: "user", content: "아까 시험 봤어" },
    { role: "assistant", content: "수고했어!\n안내 카드" }
  ]);
  assert.equal(res.body.data.reply, "괜찮아");
  assert.equal(res.body.data.userMessageId, 1);
  assert.equal(res.body.data.assistantMessageId, 2);
});

test("채팅 답변: AI가 실패해도 질문은 저장되고 id를 돌려준다", async () => {
  saved = [];
  chatRelayService.requestReply = async () => {
    throw Object.assign(new Error("AI 서버에 연결하지 못했어요."), { status: 502 });
  };
  const res = await call({ message: "안녕" });

  assert.equal(res.statusCode, 502);
  assert.deepEqual(saved.map(row => row.chat_role), ["USER"]);
  assert.equal(res.body.data.userMessageId, 1);
});

test("채팅 답변: 해결책 버튼은 지시문을 사용자 메시지로 저장하지 않는다", async () => {
  saved = [];
  chatRelayService.requestReply = async prompt => {
    relayed = { prompt };
    return "산책 10분 어때?";
  };
  const res = await call({ intent: "solution", keywords: ["학업", "학업", "수면"] });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(saved.map(row => row.chat_role), ["ASSISTANT"]);
  assert.match(relayed.prompt, /키워드\(학업, 수면\)/);
  assert.equal(res.body.data.userMessageId, null);

  assert.equal((await call({ intent: "solution", keywords: "학업" })).statusCode, 400);
});
