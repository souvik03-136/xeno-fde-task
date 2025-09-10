import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    
    if (!token || !tenantId) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    router.push('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Dashboard onLogout={handleLogout} />;
}