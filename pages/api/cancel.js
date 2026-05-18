import { createClient } from '@supabase/supabase-js';
import { formatDate, formatSlotTime } from '../../lib/helpers';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required.' });

    const { data } = await supabase
      .from('signups')
      .select('name, email, checked_in_at, slots!inner(title, start_time, end_time, events!inner(title, event_date, location))')
      .eq('id', id)
      .eq('status', 'confirmed')
      .single();

    if (!data) return res.status(404).json({ error: 'Signup not found or already cancelled.' });

    return res.status(200).json({
      name: data.name,
      alreadyCheckedIn: !!data.checked_in_at,
      eventTitle: data.slots.events.title,
      eventDate: formatDate(data.slots.events.event_date),
      location: data.slots.events.location || '',
      slotTitle: data.slots.title,
      slotTime: formatSlotTime(data.slots.start_time, data.slots.end_time),
    });
  }

  if (req.method === 'POST') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });

    const { data } = await supabase
      .from('signups')
      .select('id, checked_in_at, status')
      .eq('id', id)
      .single();

    if (!data || data.status !== 'confirmed') return res.status(404).json({ error: 'Signup not found or already cancelled.' });
    if (data.checked_in_at) return res.status(400).json({ error: 'You have already checked in and cannot cancel your signup.' });

    const { error } = await supabase.from('signups').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
