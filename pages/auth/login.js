import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import styles from '../../styles/Auth.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, must_change_password')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.role !== 'organizer') {
      await supabase.auth.signOut();
      setError('Access denied. This login is for organizers only.');
      setLoading(false);
      return;
    }

    if (profile.must_change_password) {
      router.replace('/auth/change-password');
    } else {
      router.replace('/organizer/events');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Organizer Sign In</h1>
        <p>Enter your credentials to access the organizer dashboard.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
