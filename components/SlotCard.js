import { formatSlotTime } from '../lib/helpers';
import styles from '../styles/SlotCard.module.css';

export default function SlotCard({ slot, signups = [], userSignupId, onSignup, onCancel, loading }) {
  const confirmed = signups.filter(s => s.slot_id === slot.id && s.status === 'confirmed').length;
  const available = slot.max_capacity - confirmed;
  const isFull = available <= 0;
  const isSignedUp = !!userSignupId;
  const pct = Math.round((confirmed / slot.max_capacity) * 100);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{slot.title}</h3>
          <p className={styles.time}>{formatSlotTime(slot.start_time, slot.end_time)}</p>
          {slot.description && <p className={styles.desc}>{slot.description}</p>}
        </div>
        <div className={styles.capacity}>
          <span className={isFull ? styles.full : styles.open}>
            {isFull ? 'Full' : `${available} spot${available !== 1 ? 's' : ''} left`}
          </span>
        </div>
      </div>

      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.barLabel}>{confirmed} / {slot.max_capacity} filled</p>

      {isSignedUp ? (
        <button
          className={styles.cancelBtn}
          onClick={() => onCancel(userSignupId)}
          disabled={loading}
        >
          {loading ? 'Cancelling…' : 'Cancel my signup'}
        </button>
      ) : (
        <button
          className={styles.signupBtn}
          onClick={() => onSignup(slot.id)}
          disabled={isFull || loading}
        >
          {loading ? 'Signing up…' : isFull ? 'Slot full' : 'Sign up'}
        </button>
      )}
    </div>
  );
}
