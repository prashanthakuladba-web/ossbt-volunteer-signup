import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/helpers';
import styles from '../../../styles/OrgEvents.module.css';

const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false });
const CHECKIN_URL = 'https://ossbt-volunteers.org/checkin';

function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showQR, setShowQR] = useState(false);

  function copyLink(eventId) {
    const link = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase
        .from('events')
        .select('*, slots(id)')
        .order('event_date', { ascending: true });
      setEvents(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function togglePublish(event) {
    await supabase
      .from('events')
      .update({ is_published: !event.is_published })
      .eq('id', event.id);
    setEvents(prev => prev.map(e =>
      e.id === event.id ? { ...e, is_published: !e.is_published } : e
    ));
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event and all its slots and signups?')) return;
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <h1>All events</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowQR(v => !v)} className={styles.qrBtn}>
              {showQR ? 'Hide QR Code' : 'Check-in QR Code'}
            </button>
            <Link href="/organizer/events/new" className={styles.createBtn}>+ Create event</Link>
          </div>
        </div>

        {showQR && (
          <div className={styles.qrSection}>
            <div className={styles.qrBox} id="qr-print-area">
              <QRCodeSVG value={CHECKIN_URL} size={200} />
              <p className={styles.qrLabel}>OSSBT Volunteers — Check In / Out</p>
              <p className={styles.qrSub}>Scan to check in or check out</p>
            </div>
            <button onClick={() => window.print()} className={styles.printBtn}>Print QR Code</button>
          </div>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : events.length === 0 ? (
          <div className={styles.empty}>
            <p>No events yet.</p>
            <Link href="/organizer/events/new" className={styles.createBtn}>Create your first event</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {events.map(event => (
              <div key={event.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <Link href={`/organizer/events/${event.id}/roster`} className={styles.eventTitle}>
                    {event.title}
                  </Link>
                  <p className={styles.meta}>
                    {formatDate(event.event_date)}
                    {event.location && ` · ${event.location}`}
                    {` · ${event.slots?.length || 0} slot(s)`}
                  </p>
                </div>
                <div className={styles.rowActions}>
                  <span className={event.is_published ? styles.badgePublished : styles.badgeDraft}>
                    {event.is_published ? 'Published' : 'Draft'}
                  </span>
                  <button onClick={() => copyLink(event.id)} className={styles.copyLinkBtn}>
                    {copiedId === event.id ? 'Copied!' : 'Copy signup link'}
                  </button>
                  <Link href={`/organizer/events/${event.id}/roster`} className={styles.actionBtn}>Roster</Link>
                  <button onClick={() => deleteEvent(event.id)} className={styles.deleteBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function OrganizerEventsPage() {
  return <ProtectedRoute requireRole="organizer"><OrganizerEvents /></ProtectedRoute>;
}
