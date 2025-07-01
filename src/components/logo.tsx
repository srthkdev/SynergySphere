import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Icon } from './icons';

export function LogoIcon({ className, forceLightMode }: { className?: string; forceLightMode?: boolean }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the actual theme to use
  const effectiveTheme = forceLightMode ? 'light' : resolvedTheme;

  // Prevent hydration mismatch by not applying theme-dependent styles until mounted
  if (!mounted) {
    return (
      <div className={`flex flex-row items-center ${className || ''}`}>
        <Image 
          src={Icon.logo} 
          alt="SynergySphere Logo" 
          width={28} 
          height={28} 
          priority 
        />
        <span className={`text-xl font-bold ${forceLightMode ? 'text-gray-900' : 'text-gray-900 dark:text-white'}`}>Syn</span>
      </div>
    );
  }

  // Use filter for static SVG, or swap fill for inline SVG
  return (
    <div className={`flex flex-row items-center ${className || ''}`}>
      <Image 
        src={Icon.logo} 
        alt="SynergySphere Logo" 
        width={28} 
        height={28} 
        className={effectiveTheme === 'dark' ? '' : 'filter invert-0'}
        style={effectiveTheme === 'dark' ? { filter: 'invert(1)' } : { filter: 'invert(0)' }}
        priority 
      />
      <span className={`text-xl font-bold ${forceLightMode ? 'text-gray-900' : 'text-gray-900 dark:text-white'}`}>Syn</span>
    </div>
  );
} 