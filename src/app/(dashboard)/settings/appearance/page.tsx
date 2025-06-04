'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppearanceSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page with appearance tab
    router.replace('/settings#appearance');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Redirecting to appearance settings...</div>
    </div>
  );
} 