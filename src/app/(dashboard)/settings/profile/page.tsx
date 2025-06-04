'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page with profile tab
    router.replace('/settings#profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Redirecting to profile settings...</div>
    </div>
  );
} 