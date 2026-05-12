import { createClient } from '@supabase/supabase-js';
import { formatSlotTime, formatDate } from '../../../lib/helpers';
import { sendVolunteerConfirmation, sendOrganizerNotification } from '../../../lib/email';

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
    .select('*, events(*, profiles(email))')
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

  const slotTime = formatSlotTime(slot.start_time, slot.end_time);
  const formattedDate = formatDate(slot.events.event_date);
  const emailPayload = {
    eventTitle: slot.events.title,
    formattedDate,
    location: slot.events.location || '',
    slotTitle: slot.title,
    slotTime,
  };

  if (process.env.RESEND_API_KEY) {
    const organizerEmail = slot.events.profiles?.email;
    await Promise.allSettled([
      sendVolunteerConfirmation(email.toLowerCase().trim(), emailPayload),
      organizerEmail
        ? sendOrganizerNotification(organizerEmail, {
            ...emailPayload,
            volunteerEmail: email.toLowerCase().trim(),
            volunteerPhone: phone.trim(),
          })
        : Promise.resolve(),
    ]);
  }

  return res.status(201).json({
    signup_id: signup.id,
    event_title: slot.events.title,
    slot_time: slotTime,
  });
}
