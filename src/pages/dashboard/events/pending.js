import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PendingEventsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/events');
  }, [router]);
  return null;
}
