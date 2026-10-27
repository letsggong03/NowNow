const authService = require("../services/authService");

async function signup(req, res) {
  try {
    const { email, password, nickname, character_type, notification_enabled } =
      req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email과 password가 필요합니다."
      });
    }

    const result = await authService.signup({
      email,
      password,
      nickname,
      character_type,
      notification_enabled
    });

    res.status(201).json({
      message: "회원가입 성공",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      message: "회원가입 실패",
      error: error.message
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email과 password가 필요합니다."
      });
    }

    const result = await authService.login({ email, password });

    res.json({
      message: "로그인 성공",
      token: result.token,
      user: result.user,
      user_information: result.user_information
    });
  } catch (error) {
    res.status(401).json({
      message: "로그인 실패",
      error: error.message
    });
  }
}

async function getMyInfo(req, res) {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id가 필요합니다."
      });
    }

    const data = await authService.getMyInfo(user_id);

    res.json({
      message: "내 정보 조회 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "내 정보 조회 실패",
      error: error.message
    });
  }
}

async function updateMyInfo(req, res) {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id가 필요합니다."
      });
    }

    const data = await authService.updateMyInfo(user_id, req.body);

    res.json({
      message: "내 정보 수정 성공",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "내 정보 수정 실패",
      error: error.message
    });
  }
}

module.exports = {
  signup,
  login,
  getMyInfo,
  updateMyInfo
};