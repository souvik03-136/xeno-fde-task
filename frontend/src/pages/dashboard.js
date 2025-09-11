import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [session, status]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Dashboard onLogout={signOut} />;
}