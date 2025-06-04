"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SignupButtonProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function SignupButton({ href, className, children }: SignupButtonProps) {
  return (
    <Link href={href} className="block">
      <button
        className={cn(
          "group relative flex items-center justify-center gap-3 overflow-hidden rounded-md bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2 text-base font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25",
          className
        )}
      >
        <span className="relative z-10">{children}</span>
        <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:bg-white/20">
          <ArrowUpRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      </button>
    </Link>
  );
} 