const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
router.use(require('../middleware/requireUser'), require('../middleware/ownUser'));
router.post('/reply', async (req, res) => {
  const {message, history = []} = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 2000 || !Array.isArray(history) || history.length > 10 || history.length % 2 ||
      history.some((r,i)=>!r || r.role !== (i%2 ? 'assistant':'user') || typeof r.content !== 'string' || !r.content.trim() || r.content.length > 4000))
    return res.status(400).json({message:'대화 요청 형식을 확인해 주세요.'});
  if (!process.env.AI_RELAY_URL || !process.env.AI_RELAY_TOKEN)
    return res.status(503).json({message:'백엔드 AI 중계 설정이 필요합니다.'});
  try {
    const context = await require('../services/healthContextService').getContext(req.user.id, message);
    const prompt = require('../../shared/healthRetrieval').groundedPrompt(message, context);
    const upstream = await fetch(process.env.AI_RELAY_URL.replace(/\/$/,'')+'/chat', {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${process.env.AI_RELAY_TOKEN}`},
      body:JSON.stringify({message:prompt,history}), signal:AbortSignal.timeout(50000)
    });
    const result = await upstream.json();
    if (!upstream.ok || typeof result.reply !== 'string') return res.status(upstream.status === 429 ? 429 : 502).json({message:'AI 연결 제한 또는 오류입니다. 잠시 후 다시 시도해 주세요.'});
    res.json({message:'건강 근거 기반 AI 답변', data:{reply:result.reply,context}});
  } catch {res.status(502).json({message:'건강 상담 연결에 실패했습니다. 서버 상태를 확인해 주세요.'});}
});
router.get('/context', async (req, res) => {
  const question = req.query.question;
  if (typeof question !== 'string' || !question.trim() || question.length > 2000)
    return res.status(400).json({message: 'question은 1~2000자입니다.'});
  try {
    const data = await require('../services/healthContextService').getContext(req.user.id, question);
    res.json({message: '본인 건강 근거 조회', data});
  } catch (error) {res.status(400).json({message: error.message});}
});

router.post("/messages", chatController.createMessage);
router.get("/messages", chatController.getMessages);
router.delete("/messages/:chat_id", chatController.deleteMessage);

router.post("/summary", chatController.createSummary);
router.get("/summary", chatController.getSummaries);

module.exports = router;
