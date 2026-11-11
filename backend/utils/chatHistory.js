// 저장된 채팅 메시지로 AI에 넘길 대화 맥락(history)을 만든다.
//
// 예전에는 앱이 history를 직접 만들어 보냈다. 앱을 다시 켜면 DB에서 불러온 마지막 10개를
// 그대로 썼는데, 안내 카드처럼 뿡뿡이 메시지가 연달아 있으면 user/assistant 순서가 깨져서
// 서버가 400으로 거절했다. 이제는 서버가 DB 기록으로 직접 만든다.

const MAX_HISTORY = 10; // 최근 5회 문답 (utils/chatRelay.js와 같은 값)
const MAX_TURN = 4000;

// rows: 오래된 순 [{ chat_role: 'USER' | 'ASSISTANT', message }]
// 반환: user → assistant 순서의 짝, 최대 MAX_HISTORY개
function buildHistory(rows, maxTurns = MAX_HISTORY) {
  const turns = [];

  for (const row of rows ?? []) {
    const role = row?.chat_role === "USER" ? "user" : row?.chat_role === "ASSISTANT" ? "assistant" : null;
    const content = typeof row?.message === "string" ? row.message.trim() : "";
    if (!role || !content) continue;

    // 같은 쪽이 연달아 말하면 한 턴으로 합친다(답변 + 안내 카드, 답을 못 받은 질문 + 다시 보낸 질문).
    const last = turns[turns.length - 1];
    if (last?.role === role) last.content = `${last.content}\n${content}`;
    else turns.push({ role, content });
  }

  while (turns.length && turns[0].role !== "user") turns.shift();
  if (turns.length && turns[turns.length - 1].role === "user") turns.pop();

  // 짝수 길이이고 user로 시작하므로 뒤에서 짝수 개를 잘라도 순서가 유지된다.
  const limit = maxTurns - (maxTurns % 2);
  return turns.slice(-limit).map(({ role, content }) => ({
    role,
    content: content.length > MAX_TURN ? content.slice(-MAX_TURN) : content
  }));
}

module.exports = { buildHistory, MAX_HISTORY };
