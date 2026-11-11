const test = require("node:test");
const assert = require("node:assert/strict");

const { buildHistory } = require("../utils/chatHistory");
const { parseChatRequest } = require("../utils/chatRelay");

const row = (chat_role, message) => ({ chat_role, message });

test("대화 맥락: 연달아 말한 쪽은 합치고 user→assistant 짝으로 만든다", () => {
  const history = buildHistory([
    row("ASSISTANT", "안녕, 뿡뿡이야!"), // 앞쪽 인사는 짝이 없어 버린다
    row("USER", "오늘 힘들었어"),
    row("ASSISTANT", "무슨 일 있었어?"),
    row("ASSISTANT", "산책 카드"), // 답변 + 안내 카드
    row("USER", "과제가 많아"),
    row("USER", "다시 보낼게"), // 답을 못 받고 다시 보냄
    row("ASSISTANT", "많이 바빴구나"),
    row("USER", "아직 답 없는 질문") // 마지막 질문은 버린다
  ]);

  assert.deepEqual(history, [
    { role: "user", content: "오늘 힘들었어" },
    { role: "assistant", content: "무슨 일 있었어?\n산책 카드" },
    { role: "user", content: "과제가 많아\n다시 보낼게" },
    { role: "assistant", content: "많이 바빴구나" }
  ]);
  // AI 서버 규칙을 항상 만족한다
  assert.ok(!parseChatRequest({ message: "x", history }).error);
});

test("대화 맥락: 최근 5회 문답, 턴당 4000자까지", () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(i % 2 ? "ASSISTANT" : "USER", `m${i}`));
  rows[29] = row("ASSISTANT", "a".repeat(5000));
  const history = buildHistory(rows);

  assert.equal(history.length, 10);
  assert.equal(history[0].role, "user");
  assert.equal(history[0].content, "m20");
  assert.equal(history[9].content.length, 4000);
  assert.ok(!parseChatRequest({ message: "x", history }).error);
});

test("대화 맥락: 비었거나 이상한 행은 무시한다", () => {
  assert.deepEqual(buildHistory([]), []);
  assert.deepEqual(buildHistory(null), []);
  assert.deepEqual(buildHistory([row("SYSTEM", "x"), row("USER", "  "), { chat_role: "USER" }]), []);
});
