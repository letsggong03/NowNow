const chatService = require("../services/chatService");
const chatRelayService = require("../services/chatRelayService");
const { createRateLimiter, parseChatRequest } = require("../utils/chatRelay");
const { getContext } = require("../services/healthContextService");
const { findChatMemories } = require("../services/chatMemorySearch");
const { groundedPrompt } = require("../../shared/healthRetrieval");
const { personalizationHint } = require("../utils/personalization");
const { healthSafetyReply } = require("../../shared/careSafety");
const { kstToday } = require("../utils/kstDate");
const { getSettings } = require("../services/meService");
const { personalHealthCheck } = require("../services/personalHealthCheck");
const { MIN_SAMPLES_PER_HOUR, HIGH_STRESS_THRESHOLD } = require("../services/stressCalculator");

async function createMessage(req, res) {
  try {
    const { chat_role, message } = req.body;
    // Older app builds use AI; Supabase stores that role as ASSISTANT.
    const role = chat_role === 'AI' ? 'ASSISTANT' : chat_role;

    if (!chat_role || !message) {
      return res.status(400).json({
        message: "chat_role, message가 필요합니다."
      });
    }

    if (role !== 'USER' && role !== 'ASSISTANT') {
      return res.status(400).json({ message: '지원하지 않는 채팅 역할입니다.' });
    }

    const data = await chatService.createMessage({
      user_id: req.user.id,
      chat_role: role,
      message
    });

    res.status(201).json({
      message: "채팅 메시지 저장 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "채팅 메시지 저장 실패",
      error: error.message
    });
  }
}

async function getMessages(req, res) {
  try {
    const data = await chatService.getMessagesByUser(req.user.id);

    res.json({
      message: "채팅 기록 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "채팅 기록 조회 실패",
      error: error.message
    });
  }
}

async function deleteMessage(req, res) {
  try {
    const { chat_id } = req.params;

    if (!chat_id) {
      return res.status(400).json({
        message: "chat_id가 필요합니다."
      });
    }

    await chatService.deleteMessage(chat_id, req.user.id);

    res.json({
      message: "채팅 메시지 삭제 성공"
    });
  } catch (error) {
    res.status(500).json({
      message: "채팅 메시지 삭제 실패",
      error: error.message
    });
  }
}

async function createSummary(req, res) {
  try {
    const { chat_id, summary, keywords = [] } = req.body;

    if (!chat_id || !summary) {
      return res.status(400).json({
        message: "chat_id, summary가 필요합니다."
      });
    }

    // 리포트 스트레스 원인 통계에 쓰는 감정·원인 키워드
    if (
      !Array.isArray(keywords) ||
      keywords.length > 10 ||
      keywords.some(word => typeof word !== "string")
    ) {
      return res.status(400).json({
        message: "keywords는 문자열 배열(최대 10개)이어야 합니다."
      });
    }

    const data = await chatService.createSummary({
      chat_id,
      user_id: req.user.id,
      summary,
      keywords
    });

    res.status(201).json({
      message: "채팅 요약 저장 성공",
      data
    });
  } catch (error) {
    res.status(error.status ?? 500).json({
      message: error.status ? error.message : "채팅 요약 저장 실패",
      error: error.message
    });
  }
}

async function getSummaries(req, res) {
  try {
    const data = await chatService.getSummariesByUser(req.user.id);

    res.json({
      message: "채팅 요약 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "채팅 요약 조회 실패",
      error: error.message
    });
  }
}

// AI 서버 공유 한도(전체 분당 5회)를 한 사람이 다 쓰지 않게 사용자별로도 막는다.
const allowReply = createRateLimiter(5);

async function reply(req, res) {
  try {
    const { message, history, error } = parseChatRequest(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (/스트레스/.test(message) && /계산|산출|어떻게\s*(나와|정해|구해|매겨)/.test(message)) {
      const reply = `스트레스 지수는 두 단계로 계산해. 한 시간에 심박 기록이 ${MIN_SAMPLES_PER_HOUR}개 이상이면 평균 심박수 점수 60%, 심박수 표준편차 점수 40%를 합쳐 시간별 지수를 만들어.\n\n하루 점수는 시간별 평균 50%, ${HIGH_STRESS_THRESHOLD}점 이상인 시간의 비율 30%, 최고점 20%를 먼저 합쳐. 그 결과 80%에 수축기 혈압과 걸음수 점수를 각각 10% 더하고, 수면시간을 반영해 최대 100점으로 표시해. 심박 기록이 부족하면 점수가 없고, 혈압이나 걸음수 기록이 없으면 있는 항목만 다시 비율을 맞춰.\n\n내 설정의 스트레스 기준은 뿡뿡이가 생활관리를 제안할 때 참고해. 점수 계산에는 들어가지 않아.`;
      return res.json({data: {reply}});
    }

    if (!allowReply(req.user.id)) {
      return res.status(429).json({
        message: "메시지를 너무 빨리 보냈어요. 1분 뒤에 다시 시도해 주세요."
      });
    }

    let prompt = message;
    let suggestion;
    if (req.body.useHealthContext === true) {
      const [context, memories] = await Promise.all([
        getContext(req.user.id, message).catch(() => null),
        /예전|이전|전에|지난|요약|기억|원인|키워드/.test(message)
          ? findChatMemories(req.user.id, message).catch(() => [])
          : [],
      ]);
      const today = kstToday();
      const safety = healthSafetyReply(message, context, today);
      if (safety) return res.json({data: {reply: safety}});
      const check = await personalHealthCheck(req.user, message, context).catch(() => null);
      const score = context?.documents.find(doc => doc.kind === 'stress' && doc.date === today)?.facts.score;
      if (!check?.suggestion && /스트레스|건강\s*기록/.test(message) && typeof score === 'number') {
        const settings = await getSettings(req.user.id).catch(() => null);
        const threshold = settings?.stress_threshold ?? HIGH_STRESS_THRESHOLD;
        if (score >= threshold) suggestion = 'stress';
      }
      if (check) return res.json({data: {...check, suggestion: check.suggestion ?? suggestion}});
      prompt = groundedPrompt(message, context, memories, personalizationHint(req.user.user_metadata));
    }
    const answer = await chatRelayService.requestReply(prompt, history);
    const reply = answer
      .replace(/해볼까요\?/g, '해볼까?')
      .replace(/볼래요\?/g, '볼래?')
      .replace(/알려줄게요/g, '알려줄게')
      .replace(/해드릴게요/g, '해줄게')
      .replace(/(하면|하는 게|이|가) 좋겠어요/g, '$1 좋겠어')
      .replace(/괜찮아요/g, '괜찮아')
      .replace(/이에요/g, '이야')
      .replace(/예요/g, '야')
      .replace(/하세요/g, '해 줘')
      .replace(/주세요/g, '줘')
      .replace(/해요/g, '해');

    res.json({
      message: "AI 답변 성공",
      data: { reply, suggestion }
    });
  } catch (error) {
    res.status(error.status ?? 500).json({
      message: error.status ? error.message : "AI 답변 실패"
    });
  }
}

module.exports = {
  createMessage,
  getMessages,
  deleteMessage,
  createSummary,
  getSummaries,
  reply
};
