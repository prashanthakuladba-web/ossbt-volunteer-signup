import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import styles from '../../styles/Auth.module.css';

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/auth/login');
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setError('');
    setLoading(true);

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) { setError(updateErr.message); setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', session.user.id);

    router.replace('/organizer/events');
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Set your password</h1>
        <p>Please choose a new password before continuing.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            required
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            minLength={8}
          />
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
