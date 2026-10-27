const supabase = require("../config/supabase");

// Supabase 로그인 토큰(Authorization: Bearer <access_token>)을 확인하고 req.user에 사용자를 넣는다.
// 요청 body·query의 user_id는 믿지 않고 토큰의 사용자만 쓴다.
// (authMiddleware.js는 커뮤니티용 JWT_SECRET 방식이라 Supabase 토큰과 맞지 않는다.)
async function requireUser(req, res, next) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }

  req.user = data.user;
  supabase.withUser(token, next);
}

module.exports = requireUser;
