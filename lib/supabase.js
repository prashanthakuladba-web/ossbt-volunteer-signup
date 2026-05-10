import { createClient } from '@supabase/supabase-js';

let _client;

export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return _client;
}

// Proxy so callers can still write `supabase.from(...)` etc.
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  },
});
