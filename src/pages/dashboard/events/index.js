import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EventsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to pending events page by default
    router.replace('/dashboard/events/pending');
  }, [router]);

  return null;
}

