import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import SignupSummaryCard from '../../../components/SignupSummaryCard';
import styles from '../../../styles/Confirmed.module.css';

export default function Confirmed() {
  const router = useRouter();
  let summary = null;

  try {
    if (router.query.summary) {
      summary = JSON.parse(router.query.summary);
    }
  } catch {
    // malformed query — fall through to fallback
  }

  if (!summary) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>No signup information found. <Link href="/">Browse events</Link></p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <SignupSummaryCard summary={summary} />
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.dashLink}>View my signups</Link>
          <Link href="/" className={styles.homeLink}>Browse more events</Link>
        </div>
      </div>
    </Layout>
  );
}
