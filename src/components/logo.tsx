import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Icon } from './icons';

export function LogoIcon({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  // Use filter for static SVG, or swap fill for inline SVG
  return (
    <div className={`flex flex-row items-center ${className || ''}`}>
      <Image 
        src={Icon.logo} 
        alt="SynergySphere Logo" 
        width={28} 
        height={28} 
        className={resolvedTheme === 'dark' ? '' : 'filter invert-0'}
        style={resolvedTheme === 'dark' ? { filter: 'invert(1)' } : { filter: 'invert(0)' }}
        priority 
      />
      <span className="text-xl font-bold text-gray-900 dark:text-white">Syn</span>
    </div>
  );
} 