import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAccessToken } from '../lib/api/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = getAccessToken();
      if (accessToken) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="text-white text-lg">Redirecting...</div>
    </div>
  );
}
