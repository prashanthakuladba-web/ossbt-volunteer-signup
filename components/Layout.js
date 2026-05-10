import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import styles from '../styles/Layout.module.css';

export default function Layout({ children }) {
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>VolunteerSignup</Link>
        <div className={styles.navLinks}>
          {profile ? (
            <>
              {profile.role === 'organizer' && (
                <Link href="/organizer/events">My Signups</Link>
              )}
              <button onClick={handleSignOut} className={styles.signOutBtn}>Sign out</button>
            </>
          ) : (
            <Link href="/auth/login">Organizer Login</Link>
          )}
        </div>
      </nav>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>VolunteerSignup &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
