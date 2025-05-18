"use client"; // Mark as a Client Component

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react"; // Assuming other icons like Settings might be used later

// Define nav item type directly here or import from a shared types file if it grows
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType; // Use React.ElementType for component icons
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  // { href: "/settings", label: "Settings", icon: Settings }, 
];

export const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <aside 
      id="app-sidebar" 
      className="w-[260px] border-r border-dashed hidden md:flex flex-col justify-between py-4 bg-card"
    >
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                         (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Button 
              key={item.label}
              variant={isActive ? "secondary" : "ghost"} 
              className={cn(
                "h-9 text-left justify-start px-3", 
                isActive && "font-semibold"
              )}
              asChild
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
      {/* Optional Footer actions */}
    </aside>
  )
} 