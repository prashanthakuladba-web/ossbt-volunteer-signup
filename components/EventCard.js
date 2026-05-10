import Link from 'next/link';
import { formatDate } from '../lib/helpers';
import styles from '../styles/EventCard.module.css';

export default function EventCard({ event }) {
  const d = new Date(event.event_date);
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

  return (
    <Link href={`/events/${event.id}`} className={styles.card}>
      <div className={styles.dateBadge}>
        <span className={styles.dayName}>{dayName}</span>
        <span className={styles.dayNum}>{d.getDate()}</span>
      </div>
      <div className={styles.info}>
        <h2 className={styles.title}>{event.title}</h2>
        {event.location && <p className={styles.location}>{event.location}</p>}
        <p className={styles.date}>{formatDate(event.event_date)}</p>
      </div>
    </Link>
  );
}
