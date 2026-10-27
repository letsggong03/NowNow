// The API key is configured as a Cloudflare secret, never bundled into the app.
const instructions = '너는 나우나우 앱의 AI 웰니스 대화 친구 뿡뿡이야. 따뜻한 한국어 존댓말로 짧게 공감하고 답해. 자신을 사람이나 의료 전문가로 소개하지 마. 건강 데이터나 과거 대화를 알고 있다고 꾸며내지 마. 진단이나 약물 처방을 하지 마. 건강 조언에는 의료 전문가의 진단을 대체하지 않는다는 안내를 짧게 포함해. 즉각적인 위험을 표현하면 주변 사람과 현지 응급 도움을 연결하도록 안내해.';
const json = (status, body) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});

export async function handle(request, env, fetchImpl = fetch) {
  const path = new URL(request.url).pathname;
  if (request.method === 'GET' && path === '/health') return json(200, {ok:true});
  if (request.method !== 'POST' || path !== '/chat') return json(404, {error:'NOT_FOUND'});
  // Fail closed until both secrets and the request limiter are configured.
  if (!env.OPENAI_API_KEY || !env.DEMO_TOKEN || !env.CHAT_LIMITER) return json(503, {error:'SERVER_NOT_READY'});
  if (request.headers.get('Authorization') !== `Bearer ${env.DEMO_TOKEN}`) return json(401, {error:'UNAUTHORIZED'});
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json(415, {error:'JSON_REQUIRED'});
  try {
    const reader = request.body?.getReader();
    if (!reader) return json(400, {error:'INVALID_INPUT'});
    const chunks = []; let size = 0;
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 150000) {await reader.cancel(); return json(413, {error:'INPUT_TOO_LARGE'});}
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
    let body;
    try {body = JSON.parse(new TextDecoder().decode(bytes));} catch {return json(400, {error:'INVALID_INPUT'});}
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = body?.history ?? [];
    if (!message || message.length > 2000 || !Array.isArray(history) || history.length > 10 || history.length % 2 !== 0 ||
        history.some((turn,index) => !turn || turn.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
          typeof turn.content !== 'string' || !turn.content.trim() || turn.content.length > 4000)) return json(400, {error:'INVALID_INPUT'});
    const {success} = await env.CHAT_LIMITER.limit({key:'nownow-demo'});
    if (!success) return json(429, {error:'BUSY'});
    const input = [...history.map(({role,content}) => ({role,content})), {role:'user',content:message}];
    const upstream = await fetchImpl('https://api.openai.com/v1/responses', {
      method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.OPENAI_API_KEY}`},
      body:JSON.stringify({model:'gpt-4o-mini',instructions,input,max_output_tokens:350,store:false}),
      signal:AbortSignal.timeout(45000),
    });
    if (!upstream.ok) return json(502, {error:upstream.status === 401 ? 'API_KEY_INVALID' : upstream.status === 429 ? 'API_LIMIT' : 'AI_UNAVAILABLE'});
    const data = await upstream.json();
    const text = (data.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
    if (data.status !== 'completed' || !text) return json(502, {error:'AI_EMPTY_RESPONSE'});
    return json(200, {reply:text});
  } catch {return json(502, {error:'AI_UNAVAILABLE'});}
}
export default {fetch(request, env) {return handle(request, env);}};
