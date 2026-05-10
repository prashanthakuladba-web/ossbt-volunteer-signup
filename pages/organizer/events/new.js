import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { supabase } from '../../../lib/supabase';
import styles from '../../../styles/OrgNew.module.css';

const emptySlot = () => ({ start_time: '', end_time: '', max_capacity: 1 });

function NewEvent() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', event_date: '' });
  const [numSlots, setNumSlots] = useState(3);
  const [slots, setSlots] = useState([emptySlot(), emptySlot(), emptySlot()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdEvent, setCreatedEvent] = useState(null);

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleNumSlotsChange(value) {
    const count = Math.max(1, parseInt(value) || 1);
    setNumSlots(count);
    setSlots(prev => {
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill(null).map(emptySlot)];
      }
      return prev.slice(0, count);
    });
  }

  function setSlotField(idx, field, value) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.event_date) { setError('Title and date are required.'); return; }
    for (const s of slots) {
      if (!s.start_time || !s.end_time) { setError('All slots need a start and end time.'); return; }
      if (s.start_time >= s.end_time) { setError('Each slot end time must be after its start time.'); return; }
      if (!s.max_capacity || Number(s.max_capacity) < 1) { setError('Volunteers needed must be at least 1.'); return; }
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    const { data: event, error: evErr } = await supabase
      .from('events')
      .insert({ title: form.title, event_date: form.event_date, organizer_id: session.user.id, is_published: true })
      .select()
      .single();

    if (evErr) { setError(evErr.message); setSaving(false); return; }

    const slotRows = slots.map((s, i) => ({
      event_id: event.id,
      title: `Slot ${i + 1}`,
      start_time: new Date(`${form.event_date}T${s.start_time}`).toISOString(),
      end_time: new Date(`${form.event_date}T${s.end_time}`).toISOString(),
      max_capacity: Number(s.max_capacity),
    }));

    const { error: slotErr } = await supabase.from('slots').insert(slotRows);
    if (slotErr) { setError(slotErr.message); setSaving(false); return; }

    setSaving(false);
    setCreatedEvent(event);
  }

  if (createdEvent) {
    const link = `${window.location.origin}/events/${createdEvent.id}`;
    return (
      <Layout>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h1>Signup created!</h1>
          <p>Share this link with your volunteers:</p>
          <div className={styles.linkRow}>
            <input readOnly value={link} className={styles.linkInput} onFocus={e => e.target.select()} />
            <button onClick={() => navigator.clipboard.writeText(link)} className={styles.copyBtn}>Copy link</button>
          </div>
          <div className={styles.successActions}>
            <a href={`/organizer/events/${createdEvent.id}/roster`} className={styles.rosterBtn}>View roster</a>
            <a href="/organizer/events" className={styles.backBtn}>My signups</a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1>Create volunteer signup</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.section}>
            <h2>Signup details</h2>
            <label>Title *
              <input required value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Park Cleanup Day" />
            </label>
            <label>Event date *
              <input type="date" required value={form.event_date} onChange={e => setField('event_date', e.target.value)} />
            </label>
            <label>Number of slots
              <input
                type="number"
                min={1}
                max={20}
                value={numSlots}
                onChange={e => handleNumSlotsChange(e.target.value)}
                className={styles.slotCountInput}
              />
            </label>
          </section>

          <section className={styles.section}>
            <h2>Time slots</h2>
            {slots.map((slot, i) => (
              <div key={i} className={styles.slotBlock}>
                <div className={styles.slotHeader}>
                  <span>Slot {i + 1}</span>
                </div>
                <div className={styles.timeRow}>
                  <label>Start time *
                    <input
                      type="time"
                      required
                      value={slot.start_time}
                      onChange={e => setSlotField(i, 'start_time', e.target.value)}
                    />
                  </label>
                  <label>End time *
                    <input
                      type="time"
                      required
                      value={slot.end_time}
                      onChange={e => setSlotField(i, 'end_time', e.target.value)}
                    />
                  </label>
                  <label>Volunteers needed *
                    <input
                      type="number"
                      min={1}
                      required
                      value={slot.max_capacity}
                      onChange={e => setSlotField(i, 'max_capacity', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Creating…' : 'Create signup'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default function NewEventPage() {
  return <ProtectedRoute requireRole="organizer"><NewEvent /></ProtectedRoute>;
}
