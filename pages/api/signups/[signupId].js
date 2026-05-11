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

  const { data: profile } = await supabaseUser
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'organizer') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { signupId } = req.query;

  // RLS UPDATE policy verifies this signup belongs to the organizer's event
  const { error } = await supabaseUser
    .from('signups')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', signupId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
