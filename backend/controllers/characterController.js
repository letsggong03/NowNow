const characterService = require("../services/characterService");
const { isDate, kstToday } = require("../utils/kstDate");

const MAX_TEXT_LENGTH = 50;

const cleanText = value => (typeof value === "string" ? value.trim() : "");

async function createInteraction(req, res) {
  try {
    const action = cleanText(req.body?.action);
    const choice = cleanText(req.body?.choice) || null;

    if (!action || action.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        message: `action은 1~${MAX_TEXT_LENGTH}자 문자열이어야 합니다.`
      });
    }

    if (choice && choice.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        message: `choice는 ${MAX_TEXT_LENGTH}자 이하여야 합니다.`
      });
    }

    const data = await characterService.createInteraction(
      req.user.id,
      action,
      choice
    );

    res.status(201).json({
      message: "캐릭터 상호작용 저장 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "캐릭터 상호작용 저장 실패",
      error: error.message
    });
  }
}

async function getInteractions(req, res) {
  try {
    const date = req.query.date ?? kstToday();

    if (!isDate(date)) {
      return res.status(400).json({
        message: "date는 YYYY-MM-DD 형식이어야 합니다."
      });
    }

    const data = await characterService.getInteractions(req.user.id, date);

    res.json({
      message: "캐릭터 상호작용 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "캐릭터 상호작용 조회 실패",
      error: error.message
    });
  }
}

module.exports = {
  createInteraction,
  getInteractions
};
