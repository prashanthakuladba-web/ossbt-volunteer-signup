import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import styles from '../styles/Cancel.module.css';

export default function CancelPage() {
  const router = useRouter();
  const { id } = router.query;
  const [signup, setSignup] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | cancelled | error
  const [errorMsg, setErrorMsg] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cancel?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrorMsg(data.error); setStatus('error'); return; }
        if (data.alreadyCheckedIn) { setErrorMsg('You have already checked in and cannot cancel your signup.'); setStatus('error'); return; }
        setSignup(data);
        setStatus('ready');
      })
      .catch(() => { setErrorMsg('Something went wrong. Please try again.'); setStatus('error'); });
  }, [id]);

  async function handleCancel() {
    setConfirming(true);
    const res = await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setConfirming(false);
    if (!res.ok) { setErrorMsg(data.error || 'Cancellation failed. Please contact the organizer.'); setStatus('error'); return; }
    setStatus('cancelled');
  }

  return (
    <Layout>
      <div className={styles.container}>
        {status === 'loading' && <p className={styles.msg}>Loading your signup details…</p>}

        {status === 'error' && (
          <div className={styles.card}>
            <p className={styles.errorMsg}>{errorMsg}</p>
          </div>
        )}

        {status === 'ready' && signup && (
          <div className={styles.card}>
            <h1 className={styles.title}>Cancel your signup</h1>
            <p className={styles.sub}>Hi {signup.name}, are you sure you want to cancel your signup for:</p>
            <table className={styles.table}>
              <tbody>
                <tr><td><strong>Event</strong></td><td>{signup.eventTitle}</td></tr>
                <tr><td><strong>Date</strong></td><td>{signup.eventDate}</td></tr>
                {signup.location && <tr><td><strong>Location</strong></td><td>{signup.location}</td></tr>}
                <tr><td><strong>Slot</strong></td><td>{signup.slotTitle}</td></tr>
                <tr><td><strong>Time</strong></td><td>{signup.slotTime}</td></tr>
              </tbody>
            </table>
            <p className={styles.warning}>This cannot be undone. Your spot will be released for another volunteer.</p>
            <button onClick={handleCancel} disabled={confirming} className={styles.cancelBtn}>
              {confirming ? 'Cancelling…' : 'Yes, cancel my signup'}
            </button>
          </div>
        )}

        {status === 'cancelled' && (
          <div className={styles.card}>
            <div className={styles.check}>✓</div>
            <h1 className={styles.title}>Signup cancelled</h1>
            <p className={styles.sub}>Your signup has been cancelled. Your spot is now available for another volunteer.</p>
            <p className={styles.sub}>We hope to see you at a future event!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
