import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { signupId } = req.query;

  const { error } = await supabaseUser
    .from('signups')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', signupId)
    .eq('volunteer_id', user.id); // RLS + explicit check

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
