import Image from 'next/image';
import { Icon } from './icons';

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center mb-6 ${className || ''}`}>
      <Image 
        src={Icon.logo} 
        alt="Acash Logo" 
        width={24} 
        height={24} 
        className="mr-2 invert dark:invert-0" 
        priority 
      />
      <span className="text-xl font-bold">Syn</span>
    </div>
  );
} 