"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { siteConfig } from "@/config/site.config";
import { cn } from "@/lib/utils";
import { ArrowUpRight} from "lucide-react";
import Link from "next/link";


export default function Home() {
 

  return (
    <div className="w-full h-auto overflow-y-auto flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl mx-auto border border-dashed flex flex-col my-2">
        <div className="w-full flex justify-between divide-x sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex-1 flex flex-col">
            <div id="nav" className="w-full flex items-center justify-end border-b border-dashed divide-x">
              <div id="brand" className="font-mono text-sm flex-1 flex items-center h-full px-3 border-dashed">
                <Link href="/" className="hover:underline">{siteConfig.name}</Link>
              </div>
               
                <Button className="h-full border-dashed" size="lg" variant="ghost" asChild>
                  <Link href="/sign-in" className="flex items-center gap-2 group/nav">
                    <span>Sign In</span>
                    <div className="relative z-10 size-4 overflow-hidden flex items-center justify-center">
                      <ArrowUpRight className="-z-10 absolute opacity-100 scale-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/nav:-translate-y-5 group-hover/nav:translate-x-5 group-hover/nav:opacity-0 group-hover/nav:scale-0 transition-all duration-200" />
                      <ArrowUpRight className="absolute -z-10 -bottom-4 -left-4 opacity-0 scale-0 group-hover/nav:-translate-y-[15px] group-hover/nav:translate-x-4 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-200" />
                    </div>
                  </Link>
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
