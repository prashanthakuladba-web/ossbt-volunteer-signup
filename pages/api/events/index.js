import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader || '' } } }
  );

  if (req.method === 'GET') {
    const { data } = await supabaseUser
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: true });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return res.status(401).json({ error: 'Not authenticated' });

    const { title, description, location, event_date } = req.body;
    if (!title || !event_date) return res.status(400).json({ error: 'title and event_date are required' });

    const { data, error } = await supabaseUser
      .from('events')
      .insert({ title, description, location, event_date, organizer_id: user.id })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).end();
}
