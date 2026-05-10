import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { formatDate, formatSlotTime } from '../../lib/helpers';
import styles from '../../styles/EventDetail.module.css';

export default function EventSignup() {
  const router = useRouter();
  const { id } = router.query;

  const [event, setEvent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [signupCounts, setSignupCounts] = useState({});
  const [form, setForm] = useState({ email: '', phone: '', slotId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [{ data: ev }, { data: sl }, { data: sg }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('slots').select('*').eq('event_id', id).order('start_time'),
        supabase.from('signups').select('slot_id').eq('status', 'confirmed'),
      ]);
      setEvent(ev);
      setSlots(sl || []);
      const counts = {};
      (sg || []).forEach(s => { counts[s.slot_id] = (counts[s.slot_id] || 0) + 1; });
      setSignupCounts(counts);
    }
    load();
  }, [id]);

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.slotId) { setError('Please select a slot.'); return; }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/signups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: form.slotId, email: form.email, phone: form.phone }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error || 'Signup failed. Please try again.'); return; }
    setSuccess(true);
  }

  if (!event) return <Layout><p style={{ padding: '2rem' }}>Loading…</p></Layout>;

  if (success) {
    const selectedSlot = slots.find(s => s.id === form.slotId);
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.successBox}>
            <div className={styles.successCheck}>✓</div>
            <h1>You&apos;re signed up!</h1>
            <p>Thanks for volunteering for <strong>{event.title}</strong>.</p>
            {selectedSlot && (
              <p className={styles.successSlot}>Your slot: {formatSlotTime(selectedSlot.start_time, selectedSlot.end_time)}</p>
            )}
            <p className={styles.successEmail}>We&apos;ll be in touch at <strong>{form.email}</strong>.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{event.title}</h1>
          <p className={styles.date}>{formatDate(event.event_date)}</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.signupForm}>
          <section className={styles.formSection}>
            <h2>Your details</h2>
            <label className={styles.fieldLabel}>Email address *
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="you@example.com"
                className={styles.fieldInput}
              />
            </label>
            <label className={styles.fieldLabel}>Phone number *
              <input
                type="tel"
                required
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="555-123-4567"
                className={styles.fieldInput}
              />
            </label>
          </section>

          <section className={styles.formSection}>
            <h2>Select a slot</h2>
            {slots.length === 0 ? (
              <p>No slots available for this event.</p>
            ) : (
              <div className={styles.slotOptions}>
                {slots.map(slot => {
                  const count = signupCounts[slot.id] || 0;
                  const available = slot.max_capacity - count;
                  const isFull = available <= 0;
                  const isSelected = form.slotId === slot.id;
                  return (
                    <label
                      key={slot.id}
                      className={`${styles.slotOption} ${isFull ? styles.slotFull : ''} ${isSelected ? styles.slotSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.id}
                        disabled={isFull}
                        checked={isSelected}
                        onChange={() => setField('slotId', slot.id)}
                        className={styles.slotRadio}
                      />
                      <div className={styles.slotInfo}>
                        <span className={styles.slotTime}>{formatSlotTime(slot.start_time, slot.end_time)}</span>
                        <span className={`${styles.slotSpots} ${isFull ? styles.spotsNone : ''}`}>
                          {isFull ? 'Full' : `${available} spot${available !== 1 ? 's' : ''} left`}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <button type="submit" className={styles.submitBtn} disabled={submitting || slots.length === 0}>
            {submitting ? 'Signing up…' : 'Sign up to volunteer'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
