import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, requireRole }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      if (requireRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, must_change_password')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.role !== requireRole) {
          router.replace('/auth/login');
          return;
        }
        if (profile.must_change_password) {
          router.replace('/auth/change-password');
          return;
        }
      }
      setReady(true);
    });
  }, [router, requireRole]);

  if (!ready) return <p style={{ padding: '2rem' }}>Loading…</p>;
  return children;
}
