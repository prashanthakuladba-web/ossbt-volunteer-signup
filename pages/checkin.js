import { useState } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/Checkin.module.css';

export default function CheckIn() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.');
      return;
    }
    setResult(data);
    setEmail('');
  }

  function reset() {
    setResult(null);
    setError('');
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.card}>
          {!result ? (
            <>
              <div className={styles.icon}>👋</div>
              <h1 className={styles.title}>Volunteer Check-in</h1>
              <p className={styles.subtitle}>Enter your email to check in or check out</p>
              {error && <p className={styles.error}>{error}</p>}
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={styles.input}
                  autoFocus
                />
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Looking up…' : 'Submit'}
                </button>
              </form>
            </>
          ) : result.action === 'checkin' ? (
            <>
              <div className={styles.icon}>✅</div>
              <h1 className={styles.title}>Checked In!</h1>
              <p className={styles.eventName}>{result.event_title}</p>
              <p className={styles.slotTime}>{result.slot_time}</p>
              <p className={styles.hint}>Scan the QR code again when you leave.</p>
              <button onClick={reset} className={styles.resetBtn}>Done</button>
            </>
          ) : (
            <>
              <div className={styles.icon}>🎉</div>
              <h1 className={styles.title}>Checked Out!</h1>
              <p className={styles.eventName}>{result.event_title}</p>
              <p className={styles.slotTime}>{result.slot_time}</p>
              <p className={styles.totalTime}>
                Total time volunteered: <strong>{result.hours_display}</strong>
              </p>
              <p className={styles.hint}>Thank you for volunteering!</p>
              <button onClick={reset} className={styles.resetBtn}>Done</button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
