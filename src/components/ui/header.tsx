"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { LogoIcon } from "@/components/logo";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  User, 
  Settings, 
  ChevronDown, 
  Mail, 
  Shield, 
  Menu,
  User2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data, isPending } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [width, setWidth] = useState(100);
  const navRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 40; // 40% of the full height of the screen
  
  const user = data?.user;
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      handleResize(); // Initial check
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (window.scrollY > 10) {
        navRef.current?.classList.add("bg-white/90", "dark:bg-neutral-950/90");
        navRef.current?.classList.remove("bg-white/30", "dark:bg-neutral-950/30");
      } else {
        navRef.current?.classList.add("bg-white/30", "dark:bg-neutral-950/30");
        navRef.current?.classList.remove("bg-white/90", "dark:bg-neutral-950/90");
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobile) {
      return;
    }
    const fullHeight = document.documentElement.clientHeight;
    const threshold = fullHeight * THRESHOLD / 100;
    if (scrollY > threshold) {
      setWidth(50);
    } else {
      setWidth(100);
    }
  }, [scrollY, isMobile, THRESHOLD]);

  const handleSignout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.name) {
      const parts = user.name.split(" ");
      return parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-2">
      <div 
        ref={navRef}
        className={cn(
          "max-w-7xl mx-auto p-2 flex justify-between items-center backdrop-blur-sm border rounded-lg transition-all duration-200",
          "bg-white/30 dark:bg-neutral-950/30"
        )}
        style={{ width: isMobile ? '100%' : `${width}%` }}
      >
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8" />
          </Link>
        </div>
          
        <nav className="hidden md:flex items-center justify-center space-x-6 flex-1">
          <button 
            onClick={() => scrollToSection('features')} 
            className="relative text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group px-4 py-2"
          >
            <span className="relative z-10">Features</span>
            <span className="absolute inset-0 w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-md -z-10 scale-0 group-hover:scale-100 transition-transform duration-200 origin-center"></span>
          </button>
          
          <button 
            onClick={() => scrollToSection('pricing')} 
            className="relative text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group px-4 py-2"
          >
            <span className="relative z-10">Pricing</span>
            <span className="absolute inset-0 w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-md -z-10 scale-0 group-hover:scale-100 transition-transform duration-200 origin-center"></span>
          </button>
          
          <button 
            onClick={() => scrollToSection('faq')} 
            className="relative text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group px-4 py-2"
          >
            <span className="relative z-10">FAQ</span>
            <span className="absolute inset-0 w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-md -z-10 scale-0 group-hover:scale-100 transition-transform duration-200 origin-center"></span>
          </button>
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="md:hidden">
            <Sheet>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="px-3 pt-8">
                <div className="flex flex-col justify-between h-full">
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => scrollToSection('features')} 
                      className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-left"
                    >
                      Features
                    </button>
                    <button 
                      onClick={() => scrollToSection('pricing')} 
                      className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-left"
                    >
                      Pricing
                    </button>
                    <button 
                      onClick={() => scrollToSection('faq')} 
                      className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-left"
                    >
                      FAQ
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {!isPending && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center space-x-1 cursor-pointer">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/50 ring-offset-1 ring-offset-background">
                    <AvatarImage src={user.image ?? undefined} alt={user.name || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <div className="flex flex-col items-center p-4 space-y-3">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/50 ring-offset-1 ring-offset-background shadow-md">
                    <AvatarImage src={user.image ?? undefined} alt={user.name || "User"} className="object-cover" />
                    <AvatarFallback>{getUserInitials() || <User2 className="h-16 w-16" />}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold">{user.name || "User"}</h3>
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  <Separator className="my-1" />

                  <div className="w-full space-y-3 py-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary/70" />
                        <span className="font-medium">Account Status</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 border-green-500/50 px-3 py-1 rounded-xl"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-1" />
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <div className="flex flex-col">
                      <span>Dashboard</span>
                      <span className="text-xs text-muted-foreground">
                        Manage your projects
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/settings#profile" className="cursor-pointer">
                    <div className="flex flex-col">
                      <span>Settings</span>
                      <span className="text-xs text-muted-foreground">
                        Manage your account
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignout}
                  className="cursor-pointer text-red-600 focus:text-red-600">
                  <div className="flex items-center gap-2 w-full">
                    <LogOut className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Sign Out</span>
                      <span className="text-xs text-red-600/80">
                        Sign out of your account
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer px-6 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Log in</span>
              </Link>
              <Link href="/sign-up">
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium py-2 px-6 rounded-md transition-colors border-white hover:border hover:border-blue-100 dark:hover:border-blue-400">
                  Start free
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 