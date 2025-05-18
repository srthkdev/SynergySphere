"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserProfile } from "@/components/user-profile";
import ThemeToggler from "@/components/theme/toggler";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Home", href: "#hero" },
  { name: "How it Works", href: "#how" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [showFloating, setShowFloating] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const { data: session, isPending } = useSession();

  // Scroll spy for sections
  useEffect(() => {
    const handleScroll = () => {
      setShowFloating(window.scrollY > 8);
      const sectionIds = ["hero", "how", "features", "pricing"];
      let found = 0;
      for (let i = 0; i < sectionIds.length; i++) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) found = i;
        }
      }
      setActiveIdx(found);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animate highlight
  useEffect(() => {
    const activeLink = linkRefs.current[activeIdx];
    const highlight = highlightRef.current;
    if (activeLink && highlight) {
      const rect = activeLink.getBoundingClientRect();
      const parentRect = activeLink.parentElement?.getBoundingClientRect();
      if (parentRect) {
        highlight.style.left = `${rect.left - parentRect.left}px`;
        highlight.style.width = `${rect.width}px`;
      }
    }
  }, [activeIdx, showFloating]);

  return (
    <nav
      className={`
        fixed z-50 flex items-center justify-center
        transition-all duration-500
        ${showFloating
          ? "opacity-100 scale-100 bg-muted/70 border border-gray-700 shadow-lg h-12 max-w-[700px] w-[98vw] rounded-full top-4 left-1/2 -translate-x-1/2 px-2 backdrop-blur-sm pointer-events-auto"
          : "opacity-100 scale-100 bg-transparent border-0 shadow-none h-20 max-w-full w-full rounded-none top-0 left-0 translate-x-0 px-0 pointer-events-auto"
        }
      `}
      style={{ transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <div className="flex items-center justify-between w-full h-full">
        {/* Left - VENN */}
        <div className={showFloating ? "pl-4" : "flex-1 flex items-center pl-6"}>
          <Link className="flex text-sm items-center" href={"/"}>
            <h1 className={showFloating ? "text-xl font-extrabold tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent" : "text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"}>
              VENN
            </h1>
          </Link>
        </div>
        {/* Middle - Nav Links with highlight */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative flex items-center gap-2 text-md font-medium min-w-[260px]">
            {/* Highlight */}
            <div
              ref={highlightRef}
              className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full bg-white/10 backdrop-blur-md transition-all duration-300 pointer-events-none"
              style={{ zIndex: 0, left: 0, width: 0 }}
            />
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                ref={el => { linkRefs.current[i] = el; }}
                className={`relative px-3 py-1.5 z-10 transition-colors duration-200 ${
                  activeIdx === i
                    ? "text-white font-bold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
        {/* Right - Login & Theme */}
        <div className={showFloating ? "flex gap-1 items-center pr-4" : "flex-1 flex items-center justify-end pr-6 gap-1"}>
          {!isPending && !session ? (
            <Button size="sm" asChild>
              <Link href="/sign-in">Start Free</Link>
            </Button>
          ) : null}
          <UserProfile className="border-dashed size-10" />
          <ThemeToggler className="border-dashed size-10" />
        </div>
      </div>
    </nav>
  );
} 