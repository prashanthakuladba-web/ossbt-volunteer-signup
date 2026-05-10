import { useState } from 'react';
import styles from '../styles/SignupSummaryCard.module.css';

export default function SignupSummaryCard({ summary }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(summary.signup_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = summary.signup_link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.checkIcon}>✓</div>
      <h2 className={styles.heading}>You are signed up!</h2>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Event</span>
          <span className={styles.value}>{summary.event.title}</span>
        </div>
        {summary.event.location && (
          <div className={styles.row}>
            <span className={styles.label}>Location</span>
            <span className={styles.value}>{summary.event.location}</span>
          </div>
        )}
        <div className={styles.row}>
          <span className={styles.label}>Date</span>
          <span className={styles.value}>{summary.event.formatted_date}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Slot</span>
          <span className={styles.value}>{summary.slot.title}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Time</span>
          <span className={styles.value}>{summary.slot.time}</span>
        </div>
      </div>

      <div className={styles.linkSection}>
        <p className={styles.linkLabel}>Share this event:</p>
        <div className={styles.linkRow}>
          <input
            readOnly
            value={summary.signup_link}
            className={styles.linkInput}
            onFocus={e => e.target.select()}
          />
          <button onClick={copyLink} className={styles.copyBtn}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
}
