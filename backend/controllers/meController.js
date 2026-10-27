const meService = require("../services/meService");
const { parseSettingsUpdate } = require("../utils/settings");

async function getSettings(req, res) {
  try {
    const data = await meService.getSettings(req.user.id);

    if (!data) {
      return res.status(404).json({ message: "프로필이 없습니다." });
    }

    res.json({
      message: "설정 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "설정 조회 실패",
      error: error.message
    });
  }
}

async function updateSettings(req, res) {
  try {
    const { updates, error: validationError } = parseSettingsUpdate(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = await meService.updateSettings(req.user.id, updates);

    if (!data) {
      return res.status(404).json({ message: "프로필이 없습니다." });
    }

    res.json({
      message: "설정 수정 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "설정 수정 실패",
      error: error.message
    });
  }
}

async function savePushToken(req, res) {
  try {
    const { token, platform } = req.body ?? {};

    if (typeof token !== "string" || !token.trim() || token.length > 4096) {
      return res.status(400).json({ message: "token이 필요합니다." });
    }

    if (!["android", "ios"].includes(platform)) {
      return res.status(400).json({
        message: "platform은 android 또는 ios여야 합니다."
      });
    }

    const data = await meService.savePushToken(req.user.id, token.trim(), platform);

    res.status(201).json({
      message: "푸시 토큰 저장 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "푸시 토큰 저장 실패",
      error: error.message
    });
  }
}

async function deletePushToken(req, res) {
  try {
    await meService.deletePushToken(req.user.id, req.params.token);

    res.json({ message: "푸시 토큰 삭제 성공" });
  } catch (error) {
    res.status(500).json({
      message: "푸시 토큰 삭제 실패",
      error: error.message
    });
  }
}

async function deleteAccount(req, res) {
  try {
    await meService.deleteAccount(req.user.id);

    res.json({ message: "회원 탈퇴 성공" });
  } catch (error) {
    res.status(500).json({
      message: "회원 탈퇴 실패",
      error: error.message
    });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  savePushToken,
  deletePushToken,
  deleteAccount
};
