import { createClient } from '@supabase/supabase-js';
import { formatSlotTime } from '../../../lib/helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { slotId, email, phone } = req.body;
  if (!slotId) return res.status(400).json({ error: 'slotId is required' });
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!phone) return res.status(400).json({ error: 'phone is required' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: slot } = await supabase
    .from('slots')
    .select('*, events(*)')
    .eq('id', slotId)
    .single();

  if (!slot) return res.status(404).json({ error: 'Slot not found' });

  // Check if this email has already signed up for any slot in the same event
  const { data: eventSlots } = await supabase
    .from('slots')
    .select('id')
    .eq('event_id', slot.event_id);

  const { count: existingCount } = await supabase
    .from('signups')
    .select('id', { count: 'exact', head: true })
    .eq('email', email.toLowerCase().trim())
    .eq('status', 'confirmed')
    .in('slot_id', eventSlots.map(s => s.id));

  if (existingCount > 0) {
    return res.status(409).json({ error: 'This email is already signed up for this event.' });
  }

  const { count } = await supabase
    .from('signups')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slotId)
    .eq('status', 'confirmed');

  if (count >= slot.max_capacity) {
    return res.status(409).json({ error: 'This slot is full. Please choose another.' });
  }

  const { data: signup, error: insertErr } = await supabase
    .from('signups')
    .insert({
      slot_id: slotId,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      volunteer_id: null,
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === '23505') {
      return res.status(409).json({ error: 'This email is already signed up for this slot.' });
    }
    return res.status(500).json({ error: insertErr.message });
  }

  return res.status(201).json({
    signup_id: signup.id,
    event_title: slot.events.title,
    slot_time: formatSlotTime(slot.start_time, slot.end_time),
  });
}
