// PUT /api/me/settings 요청 검증. 보낸 항목만 바꾼다.
// 반환: { updates } 또는 { error }

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseSettingsUpdate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "요청 본문이 필요합니다." };
  }

  const updates = {};

  if ("nickname" in body) {
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    if (!nickname || nickname.length > 20) {
      return { error: "nickname은 1~20자여야 합니다." };
    }
    updates.nickname = nickname;
  }

  if ("status_message" in body) {
    if (body.status_message !== null && typeof body.status_message !== "string") {
      return { error: "status_message는 문자열 또는 null이어야 합니다." };
    }
    const message = body.status_message?.trim() || null;
    if (message && message.length > 60) {
      return { error: "status_message는 60자 이하여야 합니다." };
    }
    updates.status_message = message;
  }

  if ("character_type" in body) {
    if (typeof body.character_type !== "string" || !body.character_type.trim()) {
      return { error: "character_type은 문자열이어야 합니다." };
    }
    updates.character_type = body.character_type.trim();
  }

  if ("notification_enabled" in body) {
    if (typeof body.notification_enabled !== "boolean") {
      return { error: "notification_enabled는 true/false여야 합니다." };
    }
    updates.notification_enabled = body.notification_enabled;
  }

  // 알림 시각 "HH:MM", null이면 지운다
  if ("notify_time" in body) {
    if (body.notify_time !== null && !TIME_RE.test(body.notify_time)) {
      return { error: "notify_time은 HH:MM 형식 또는 null이어야 합니다." };
    }
    updates.notify_time = body.notify_time;
  }

  // 이 점수 이상이면 스트레스가 높다고 본다
  if ("stress_threshold" in body) {
    const threshold = body.stress_threshold;
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
      return { error: "stress_threshold는 0~100 사이 정수여야 합니다." };
    }
    updates.stress_threshold = threshold;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "바꿀 항목이 없습니다." };
  }

  return { updates };
}

module.exports = { parseSettingsUpdate };
