import { createClient } from '@supabase/supabase-js';
import { formatSlotTime } from '../../lib/helpers';
import { generateCertificate } from '../../lib/certificate';
import { sendCertificate } from '../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, signupId } = req.body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let signup;

  if (signupId) {
    // Organizer manual checkout by signupId
    const { data } = await supabase
      .from('signups')
      .select('*, slots!inner(*, events!inner(*))')
      .eq('id', signupId)
      .single();
    if (!data) return res.status(404).json({ error: 'Signup not found.' });
    if (!data.checked_in_at) return res.status(400).json({ error: 'Volunteer has not checked in yet.' });
    if (data.checked_out_at) return res.status(409).json({ error: 'Volunteer has already checked out.' });
    signup = data;
  } else {
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const today = new Date().toISOString().split('T')[0];
    const { data: signups } = await supabase
      .from('signups')
      .select('*, slots!inner(*, events!inner(*))')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'confirmed')
      .eq('slots.events.event_date', today);

    if (!signups || signups.length === 0) {
      return res.status(404).json({ error: 'No confirmed signup found for today with this email.' });
    }

    const now = new Date();
    signup = [...signups].sort((a, b) =>
      Math.abs(new Date(a.slots.start_time) - now) - Math.abs(new Date(b.slots.start_time) - now)
    )[0];

    if (signup.checked_in_at && signup.checked_out_at) {
      return res.status(409).json({ error: 'You have already checked in and out for today.' });
    }
  }

  const slotTime = formatSlotTime(signup.slots.start_time, signup.slots.end_time);
  const eventTitle = signup.slots.events.title;

  if (!signup.checked_in_at) {
    const checkedInAt = new Date().toISOString();
    await supabase.from('signups').update({ checked_in_at: checkedInAt }).eq('id', signup.id);

    return res.status(200).json({
      action: 'checkin',
      event_title: eventTitle,
      slot_time: slotTime,
      checked_in_at: checkedInAt,
    });
  }

  // Check out
  const checkoutTime = new Date();
  const diffMinutes = (checkoutTime - new Date(signup.checked_in_at)) / 1000 / 60;
  const total_minutes = Math.round(diffMinutes / 30) * 30;
  const hours = total_minutes / 60;
  const hours_display = Number.isInteger(hours)
    ? `${hours} hr${hours !== 1 ? 's' : ''}`
    : `${hours} hrs`;

  await supabase
    .from('signups')
    .update({ checked_out_at: checkoutTime.toISOString(), total_minutes })
    .eq('id', signup.id);

  // Send certificate email
  if (process.env.RESEND_API_KEY && signup.email && signup.name) {
    const date = checkoutTime.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
    });
    try {
      const certBuffer = await generateCertificate({ name: signup.name, hours: hours, date });
      await sendCertificate(signup.email, { name: signup.name, hoursDisplay: hours_display, certBuffer, cc: 'volunteerscoordination@omsrisaibalajitemple.org' });
    } catch (err) {
      console.error('Certificate generation failed:', err);
    }
  }

  return res.status(200).json({
    action: 'checkout',
    event_title: eventTitle,
    slot_time: slotTime,
    total_minutes,
    hours_display,
  });
}
