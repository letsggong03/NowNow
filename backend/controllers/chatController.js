const chatService = require("../services/chatService");

async function createMessage(req, res) {
  try {
    const { user_id, chat_role, message } = req.body;

    if (!user_id || !chat_role || !message) {
      return res.status(400).json({
        message: "user_id, chat_role, message가 필요합니다."
      });
    }

    const data = await chatService.createMessage({
      user_id,
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
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id가 필요합니다."
      });
    }

    const data = await chatService.getMessagesByUser(user_id);

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
    const { user_id } = req.body;

    if (!chat_id) {
      return res.status(400).json({
        message: "chat_id가 필요합니다."
      });
    }

    await chatService.deleteMessage(chat_id, user_id);

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
    const { chat_id, user_id, summary } = req.body;

    if (!chat_id || !user_id || !summary) {
      return res.status(400).json({
        message: "chat_id, user_id, summary가 필요합니다."
      });
    }

    const data = await chatService.createSummary({
      chat_id,
      user_id,
      summary
    });

    res.status(201).json({
      message: "채팅 요약 저장 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "채팅 요약 저장 실패",
      error: error.message
    });
  }
}

async function getSummaries(req, res) {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id가 필요합니다."
      });
    }

    const data = await chatService.getSummariesByUser(user_id);

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

module.exports = {
  createMessage,
  getMessages,
  deleteMessage,
  createSummary,
  getSummaries
};