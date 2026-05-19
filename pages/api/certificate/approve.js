import { createClient } from '@supabase/supabase-js';
import { generateCertificate } from '../../../lib/certificate';
import { sendCertificate } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated.' });

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return res.status(401).json({ error: 'Not authenticated.' });

  const { data: profile } = await supabaseUser.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'organizer') return res.status(403).json({ error: 'Access denied.' });

  const { signupId } = req.body;
  if (!signupId) return res.status(400).json({ error: 'signupId is required.' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: signup } = await supabase
    .from('signups')
    .select('*, slots!inner(*, events!inner(*))')
    .eq('id', signupId)
    .single();

  if (!signup) return res.status(404).json({ error: 'Signup not found.' });
  if (!signup.certificate_pending) return res.status(400).json({ error: 'No pending certificate for this signup.' });
  if (signup.certificate_sent_at) return res.status(409).json({ error: 'Certificate already sent.' });

  const total_minutes = signup.total_minutes || 0;
  const hours = total_minutes / 60;
  const hours_display = Number.isInteger(hours)
    ? `${hours} hr${hours !== 1 ? 's' : ''}`
    : `${hours} hrs`;

  const sentAt = new Date();
  const date = sentAt.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
  });

  try {
    const certBuffer = await generateCertificate({ name: signup.name, hours, date });
    await sendCertificate(signup.email, {
      name: signup.name,
      hoursDisplay: hours_display,
      certBuffer,
      cc: 'volunteerscoordination@omsrisaibalajitemple.org',
    });
    await supabase
      .from('signups')
      .update({ certificate_sent_at: sentAt.toISOString(), certificate_pending: false })
      .eq('id', signupId);
  } catch (err) {
    console.error('Certificate approval failed:', err);
    return res.status(500).json({ error: 'Failed to generate or send certificate.' });
  }

  return res.status(200).json({ ok: true, hours_display });
}
