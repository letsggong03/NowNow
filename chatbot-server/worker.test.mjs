import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from './worker.mjs';
test('cloud relay requires authorization, limits calls and preserves conversation', async () => {
  let calls = 0;
  const history = [{role:'user',content:'별명은 구름'}, {role:'assistant',content:'반가워요'}];
  const request = (token = 'demo') => new Request('https://example.com/chat', {method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({message:'내 별명은?',history})});
  const env = {OPENAI_API_KEY:'test-only',DEMO_TOKEN:'demo',CHAT_LIMITER:{limit:async()=>({success:true})}};
  const upstream = async (url,init) => {calls++; const data = JSON.parse(init.body); assert.deepEqual(data.input,[...history,{role:'user',content:'내 별명은?'}]); assert.equal(data.store,false); return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'구름이에요'}]}]});};
  assert.equal((await handle(request(), {}, upstream)).status,503);
  assert.equal((await handle(request('wrong'), env, upstream)).status,401);
  assert.deepEqual(await (await handle(request(), env, upstream)).json(),{reply:'구름이에요'});
  env.CHAT_LIMITER.limit = async()=>({success:false});
  assert.equal((await handle(request(), env, upstream)).status,429);
  assert.equal(calls,1);
});
