const supabase = require('../config/supabase');
const { addDays, kstDayRange, kstDateOf, kstToday } = require('../utils/kstDate');

const MODEL = 'text-embedding-3-small';
const DIMENSIONS = 1536;

async function embed(input, key) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, dimensions: DIMENSIONS, input }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Embedding HTTP ${response.status}`);
  const {data} = await response.json();
  const vectors = input.map((_, index) => data?.find(row => row.index === index)?.embedding);
  if (vectors.some(vector => !Array.isArray(vector) || vector.length !== DIMENSIONS || !vector.every(Number.isFinite))) {
    throw new Error('Invalid embedding response');
  }
  return vectors;
}

async function findChatMemories(userId, question) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !userId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

  const {start} = kstDayRange(addDays(kstToday(), -29));
  const {data, error} = await supabase.from('chat_summaries')
    .select('summary_id,summary').eq('user_id', userId)
    .gte('created_at', start).order('created_at', {ascending: false}).limit(12);
  if (error) throw error;
  const summaries = data.filter(row => row.summary?.trim())
    .map(row => ({id: row.summary_id, text: Array.from(row.summary).slice(0, 800).join('')}));
  if (!summaries.length) return [];

  const ids = summaries.map(row => row.id);
  const cached = await supabase.from('memory_embeddings').select('nownow_summary_id,content')
    .eq('user_id', userId).in('nownow_summary_id', ids);
  if (cached.error) throw cached.error;
  const indexed = new Map(cached.data.map(row => [row.nownow_summary_id, row.content]));
  const pending = summaries.filter(row => indexed.get(row.id) !== row.text);
  const [query, ...vectors] = await embed([question, ...pending.map(row => row.text)], key);
  if (pending.length) {
    const write = await supabase.from('memory_embeddings').upsert(pending.map((row, index) => ({
      user_id: userId,
      nownow_summary_id: row.id,
      source_type: 'CHAT_SUMMARY',
      content: row.text,
      embedding: vectors[index],
      metadata: {model: MODEL},
    })), {onConflict: 'nownow_summary_id'});
    if (write.error) throw write.error;
  }
  const matches = await supabase.rpc('match_nownow_chat_memories', {
    owner_id: userId, query_vector: query, candidate_ids: ids,
  });
  if (matches.error) throw matches.error;
  return matches.data.map(row => ({date: kstDateOf(row.created_at), summary: row.content.slice(0, 180)}));
}

module.exports = {findChatMemories};
