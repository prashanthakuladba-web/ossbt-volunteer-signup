import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../../components/Layout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { supabase } from '../../../../lib/supabase';
import { formatDate, formatSlotTime } from '../../../../lib/helpers';
import styles from '../../../../styles/Roster.module.css';

function Roster() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [signupsBySlot, setSignupsBySlot] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [{ data: ev }, { data: sl }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('slots').select('*').eq('event_id', id).order('start_time'),
      ]);
      setEvent(ev);
      const slotList = sl || [];
      setSlots(slotList);

      if (slotList.length > 0) {
        const slotIds = slotList.map(s => s.id);
        const { data: sg } = await supabase
          .from('signups')
          .select('id, slot_id, email, phone, signed_up_at, status')
          .in('slot_id', slotIds)
          .eq('status', 'confirmed');
        const bySlot = {};
        slotList.forEach(s => { bySlot[s.id] = []; });
        (sg || []).forEach(s => { bySlot[s.slot_id]?.push(s); });
        setSignupsBySlot(bySlot);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete(slotId, signupId) {
    if (!window.confirm('Remove this volunteer signup?')) return;
    setDeletingId(signupId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/signups/${signupId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setDeletingId(null);
    if (!res.ok) { alert('Failed to remove signup.'); return; }
    setSignupsBySlot(prev => ({
      ...prev,
      [slotId]: prev[slotId].filter(sg => sg.id !== signupId),
    }));
  }

  function exportCSV() {
    const rows = [['Slot', 'Time', 'Email', 'Phone']];
    slots.forEach(slot => {
      (signupsBySlot[slot.id] || []).forEach(sg => {
        rows.push([
          slot.title,
          formatSlotTime(slot.start_time, slot.end_time),
          sg.email || '',
          sg.phone || '',
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title || 'roster'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !event) return <Layout><p style={{ padding: '2rem' }}>Loading…</p></Layout>;

  const totalSignups = Object.values(signupsBySlot).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div>
            <Link href="/organizer/events" className={styles.back}>&larr; My signups</Link>
            <h1>{event.title}</h1>
            <p className={styles.meta}>{formatDate(event.event_date)}</p>
          </div>
          <div className={styles.topActions}>
            <span className={styles.totalBadge}>{totalSignups} volunteer{totalSignups !== 1 ? 's' : ''}</span>
            <button onClick={exportCSV} className={styles.exportBtn}>Export CSV</button>
          </div>
        </div>

        {slots.length === 0 ? (
          <p>No slots created for this event.</p>
        ) : (
          slots.map(slot => {
            const sgs = signupsBySlot[slot.id] || [];
            return (
              <div key={slot.id} className={styles.slotSection}>
                <div className={styles.slotHeader}>
                  <h2>{slot.title}</h2>
                  <span className={styles.slotMeta}>{formatSlotTime(slot.start_time, slot.end_time)}</span>
                  <span className={styles.capacityBadge}>{sgs.length} / {slot.max_capacity}</span>
                </div>
                {sgs.length === 0 ? (
                  <p className={styles.noSignups}>No volunteers yet.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr><th>#</th><th>Email</th><th>Phone</th><th></th></tr>
                    </thead>
                    <tbody>
                      {sgs.map((sg, i) => (
                        <tr key={sg.id}>
                          <td>{i + 1}</td>
                          <td>{sg.email || '—'}</td>
                          <td>{sg.phone || '—'}</td>
                          <td>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(slot.id, sg.id)}
                              disabled={deletingId === sg.id}
                            >
                              {deletingId === sg.id ? '…' : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}

export default function RosterPage() {
  return <ProtectedRoute requireRole="organizer"><Roster /></ProtectedRoute>;
}
