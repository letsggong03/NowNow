const urgentSymptoms = /가슴\s*(통증|이\s*(아파|답답)|이\s*조여)|흉통|숨\s*(이\s*)?(차|쉬기\s*힘들|을\s*못)|호흡곤란|실신|기절할\s*것/;
const heartOrPressure = /심박|맥박|심장|두근|혈압/;

function hasUrgentSymptoms(message) {
  return urgentSymptoms.test(message);
}

function healthSafetyReply(message, context, today) {
  if (hasUrgentSymptoms(message)) {
    return '지금 가슴 통증이나 숨쉬기 어려움, 실신할 것 같은 증상이 있다면 즉시 119에 연락해 주세요.';
  }
  if (!heartOrPressure.test(message)) return null;
  if (/어제|지난|\d{4}-\d{2}-\d{2}/.test(message)) return null;
  const pressure = context?.documents.find(doc => doc.kind === 'bp' && doc.date === today)?.facts;
  if (/혈압/.test(message) && (pressure?.systolic > 180 || pressure?.diastolic > 120)) {
    return '오늘 저장된 혈압이 매우 높아요. 지금도 그렇다면 앉아서 안정을 취한 뒤 1분 이상 지나 다시 재보세요. 계속 매우 높으면 즉시 의료진에게 연락하고, 가슴 통증·숨참·시야 변화가 있으면 바로 119에 연락해 주세요.';
  }
  if (/혈압/.test(message) && /높|올랐/.test(message)) {
    return '잠시 앉아 안정을 취한 뒤 혈압을 다시 재볼래요? 높게 나온 기록이 반복되면 의료진에게 상담해 주세요. 가슴 통증이나 숨참이 있으면 바로 119에 연락해 주세요.';
  }
  const pulse = context?.documents.find(doc => doc.kind === 'heart' && doc.date === today)?.facts;
  const pulseAge = Date.now() - Date.parse(pulse?.measuredAt);
  const recentPulse = pulse?.latestBpm > 100 && pulseAge >= 0 && pulseAge <= 15 * 60 * 1000;
  if (/두근|심박.*(높|빨라)|맥박.*(높|빨라)|심장.*빨리/.test(message)
    || (recentPulse && /심박|맥박|심장/.test(message))) {
    return '지금 움직이던 중이었나요, 쉬는 중이었나요? 두근거림이 가라앉지 않거나 가슴 통증·숨참·실신할 것 같은 느낌이 있으면 바로 119에 연락해 주세요. 반복된다면 의료진에게 상담해 보세요.';
  }
  return null;
}

module.exports = {hasUrgentSymptoms, healthSafetyReply};
