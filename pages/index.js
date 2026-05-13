import { useEffect, useState } from 'react';
import Image from 'next/image';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supabase';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });
      setEvents(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className={styles.hero}>
        <h1>Find volunteer opportunities at our OSSBT</h1>
        <p>Browse upcoming events and sign up for a slot that works for you.</p>
        <input
          type="text"
          placeholder="Search by event name or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.search}
        />
      </div>

      {loading ? (
        <p className={styles.status}>Loading events…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.status}>No upcoming events found.</p>
      ) : (
        <div className={styles.threeCol}>
          <div className={styles.sideCards}>
            {filtered.filter((_, i) => i % 2 === 0).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className={styles.centerLogo}>
            <Image src="/watermark.png" alt="OSSBT logo" width={300} height={300} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className={styles.sideCards}>
            {filtered.filter((_, i) => i % 2 === 1).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
