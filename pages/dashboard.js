import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabase';
import { formatDate, formatSlotTime } from '../lib/helpers';
import styles from '../styles/Dashboard.module.css';

function Dashboard() {
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase
      .from('signups')
      .select('*, slots(*, events(*))')
      .eq('volunteer_id', session.user.id)
      .eq('status', 'confirmed')
      .order('signed_up_at', { ascending: false });
    setSignups(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(signupId) {
    setCancelling(signupId);
    await supabase
      .from('signups')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', signupId);
    setCancelling(null);
    load();
  }

  const now = new Date();
  const upcoming = signups.filter(s => new Date(s.slots.start_time) >= now);
  const past = signups.filter(s => new Date(s.slots.start_time) < now);

  function SignupRow({ signup }) {
    const slot = signup.slots;
    const event = slot.events;
    return (
      <div className={styles.signupCard}>
        <div className={styles.signupInfo}>
          <Link href={`/events/${event.id}`} className={styles.eventTitle}>{event.title}</Link>
          <p className={styles.slotTitle}>{slot.title}</p>
          <p className={styles.slotMeta}>
            {formatDate(event.event_date)} &middot; {formatSlotTime(slot.start_time, slot.end_time)}
          </p>
          {event.location && <p className={styles.location}>{event.location}</p>}
        </div>
        {new Date(slot.start_time) >= now && (
          <button
            className={styles.cancelBtn}
            onClick={() => handleCancel(signup.id)}
            disabled={cancelling === signup.id}
          >
            {cancelling === signup.id ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1>My signups</h1>

        {loading ? (
          <p>Loading…</p>
        ) : signups.length === 0 ? (
          <div className={styles.empty}>
            <p>You have not signed up for any slots yet.</p>
            <Link href="/" className={styles.browseLink}>Browse events</Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className={styles.sectionHeading}>Upcoming</h2>
                {upcoming.map(s => <SignupRow key={s.id} signup={s} />)}
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className={styles.sectionHeading}>Past</h2>
                {past.map(s => <SignupRow key={s.id} signup={s} />)}
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}
