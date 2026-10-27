const { createClient } = require("@supabase/supabase-js");
const {AsyncLocalStorage} = require('node:async_hooks');
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL이 .env에 없습니다.");
}

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_ANON_KEY가 .env에 없습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const context = new AsyncLocalStorage();
// User JWT + RLS is used per request. No service-role key is needed in the app.
module.exports = new Proxy(supabase, {
  get(target, property) {
    if (property === 'withUser') return (token, next) => {
      const client = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey, {
        global: {headers: {Authorization: `Bearer ${token}`}},
        auth: {persistSession: false, autoRefreshToken: false}
      });
      return context.run(client, next);
    };
    const client = context.getStore() || target;
    const value = client[property];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
