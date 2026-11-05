const chatService = require("../services/chatService");
const chatRelayService = require("../services/chatRelayService");
const { createRateLimiter, parseChatRequest } = require("../utils/chatRelay");
const { getContext } = require("../services/healthContextService");
const { groundedPrompt } = require("../../shared/healthRetrieval");

async function createMessage(req, res) {
  try {
    const { chat_role, message } = req.body;

    if (!chat_role || !message) {
      return res.status(400).json({
        message: "chat_role, message가 필요합니다."
      });
    }

    const data = await chatService.createMessage({
      user_id: req.user.id,
      chat_role,
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

    if (!allowReply(req.user.id)) {
      return res.status(429).json({
        message: "메시지를 너무 빨리 보냈어요. 1분 뒤에 다시 시도해 주세요."
      });
    }

    let prompt = message;
    if (req.body.useHealthContext === true) {
      const context = await getContext(req.user.id, message).catch(() => null);
      prompt = groundedPrompt(message, context);
    }
    const answer = await chatRelayService.requestReply(prompt, history);

    res.json({
      message: "AI 답변 성공",
      data: { reply: answer }
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
