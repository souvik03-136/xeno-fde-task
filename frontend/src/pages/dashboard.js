import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Dashboard from '../components/Dashboard';
import api from '../lib/api';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [validatingTenant, setValidatingTenant] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    validateTenant();
  }, [session, status, router]);

  const validateTenant = async () => {
    setValidatingTenant(true);
    const tenantId = localStorage.getItem('tenantId');
    
    if (!tenantId) {
      router.push('/login');
      return;
    }

    try {
      const response = await api.get('/tenant');
      const userTenants = response.data;
      const currentTenant = userTenants.find(t => t.id === tenantId);
      
      if (!currentTenant) {
        localStorage.removeItem('tenantId');
        router.push('/login');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error validating tenant:', error);
      localStorage.removeItem('tenantId');
      router.push('/login');
    } finally {
      setValidatingTenant(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenantId');
    signOut({ callbackUrl: '/login' });
  };

  if (loading || status === 'loading' || validatingTenant) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Redirecting to login...</div>;
  }

  const tenantId = localStorage.getItem('tenantId');
  if (!tenantId) {
    return <div>Redirecting to tenant setup...</div>;
  }

  return <Dashboard onLogout={handleLogout} />;
}