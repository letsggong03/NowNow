// Preserve existing user_id contracts while preventing another user's IDs.
module.exports = function ownUser(req, res, next) {
  const ids = [req.query.user_id, req.body?.user_id, req.params?.user_id].filter(Boolean);
  if (ids.some(id => id !== req.user.id)) return res.status(403).json({message: '본인 기록만 조회할 수 있습니다.'});
  next();
};
