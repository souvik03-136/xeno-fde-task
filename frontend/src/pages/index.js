import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      const tenantId = localStorage.getItem('tenantId');
      if (tenantId) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  return <div>Loading...</div>;
}