"use client";

import { useState } from "react";
import ThemeToggler from "@/components/theme/toggler";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/user-profile";
import { siteConfig } from "@/config/site.config";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkle, Github, ArrowUpRight, ListChecks, MessageSquare, BarChart3, PackageSearch, AlertTriangle, Users2, Target, Rocket, ClipboardCheck, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="w-full h-auto overflow-y-auto flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl mx-auto border border-dashed flex flex-col my-2">
        <div className="w-full flex justify-between divide-x sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex-1 flex flex-col">
            <div id="nav" className="w-full flex items-center justify-end border-b border-dashed divide-x">
              <div id="brand" className="font-mono text-sm flex-1 flex items-center h-full px-3 border-dashed">
                <Link href="/" className="hover:underline">{siteConfig.name}</Link>
              </div>
              {!isPending && (session ? (
                <Button className="h-full border-dashed" size="lg" variant="ghost" asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 group/nav">
                    <span>Dashboard</span>
                    <div className="relative z-10 size-4 overflow-hidden flex items-center justify-center">
                      <ArrowUpRight className="-z-10 absolute opacity-100 scale-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/nav:-translate-y-5 group-hover/nav:translate-x-5 group-hover/nav:opacity-0 group-hover/nav:scale-0 transition-all duration-200" />
                      <ArrowUpRight className="absolute -z-10 -bottom-4 -left-4 opacity-0 scale-0 group-hover/nav:-translate-y-[15px] group-hover/nav:translate-x-4 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-200" />
                    </div>
                  </Link>
                </Button>
              ) : (
                <Button className="h-full border-dashed" size="lg" variant="ghost" asChild>
                  <Link href="/sign-in" className="flex items-center gap-2 group/nav">
                    <span>Sign In</span>
                    <div className="relative z-10 size-4 overflow-hidden flex items-center justify-center">
                      <ArrowUpRight className="-z-10 absolute opacity-100 scale-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/nav:-translate-y-5 group-hover/nav:translate-x-5 group-hover/nav:opacity-0 group-hover/nav:scale-0 transition-all duration-200" />
                      <ArrowUpRight className="absolute -z-10 -bottom-4 -left-4 opacity-0 scale-0 group-hover/nav:-translate-y-[15px] group-hover/nav:translate-x-4 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-200" />
                    </div>
                  </Link>
                </Button>
              ))}
              <UserProfile className="border-dashed size-10 md:size-14" />
              <ThemeToggler className="border-dashed size-10 md:size-14" />
            </div>
              </div>
            </div>
        <div id="hero" className="flex flex-col p-8 md:p-12 items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading tracking-tight mb-6">{siteConfig.name}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-8">{siteConfig.description}</p>
          <div id="cta" className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up" className="gap-2 group">
                <span>Get Started Free</span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-all duration-150" />
                </Link>
              </Button>
            <Button size="lg" variant="outline" asChild className="relative border-dashed">
              <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer" className="gap-2 group">
                <Github className="size-4" />
                <span>View on GitHub</span>
              </a>
            </Button>
          </div>
        </div>
        <section id="features" className="py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 font-heading">Core Pillars of SynergySphere</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {featureConfig.map((feature, index) => (
                <div
                  key={index}
                  className="relative w-full p-6 bg-card hover:shadow-lg transition-all duration-300 rounded-lg border border-dashed group/item"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-primary/10 rounded-md group-hover/item:scale-110 transition-transform duration-300">{feature.icon}</span>
                    <h3 className="text-xl font-semibold font-heading tracking-tight">{feature.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="challenges" className="py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 font-heading">Stop Headaches, Start Collaborating</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {painPointsConfig.map((item, index) => (
                <div
              key={index}
                  className="relative w-full p-6 bg-card hover:shadow-lg transition-all duration-300 rounded-lg border border-dashed group/item"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-primary/10 rounded-md group-hover/item:scale-110 transition-transform duration-300">{item.icon}</span>
                    <h3 className="text-xl font-semibold font-heading tracking-tight">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 font-heading">Get Going in Minutes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {howItWorksConfig.map((step, index) => (
                <div
                  key={index}
                  className="relative w-full p-6 bg-card hover:shadow-lg transition-all duration-300 rounded-lg border border-dashed group/item flex flex-col items-center text-center"
                >
                  <div className="p-3 bg-primary/10 rounded-full mb-4 group-hover/item:scale-110 transition-transform duration-300">
                    {step.icon}
              </div>
                  <h3 className="text-xl font-semibold font-heading tracking-tight mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                    {step.description}
              </p>
                </div>
          ))}
        </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const featureConfig = [
  {
    icon: <ListChecks className="size-6 text-primary" />,
    name: "Task & Project Management",
    description: "Create projects, add members, assign tasks with deadlines, and track progress from To-Do to Done.",
  },
  {
    icon: <MessageSquare className="size-6 text-primary" />,
    name: "Team Communication",
    description: "Engage in project-specific threaded discussions to keep conversations organized and context-rich.",
  },
  {
    icon: <BarChart3 className="size-6 text-primary" />,
    name: "Progress Visualization",
    description: "Visualize task progress with intuitive boards and lists to understand project status at a glance.",
  },
];

const painPointsConfig = [
  {
    icon: <PackageSearch className="size-6 text-primary" />,
    title: "Unified Workspace, Clear Communication",
    description: "Tired of scattered files and missed updates? SynergySphere brings all your project assets, discussions, and decisions into one organized hub, ensuring everyone stays informed."
  },
  {
    icon: <AlertTriangle className="size-6 text-primary" />,
    title: "Track Progress, Prevent Surprises",
    description: "Gain crystal-clear visibility into task progress and project timelines. Proactively identify bottlenecks and stay ahead of deadlines before they become urgent issues."
  },
  {
    icon: <Users2 className="size-6 text-primary" />,
    title: "Optimize Resources, Clarify Roles",
    description: "Streamline assignments and manage team capacity effectively. Ensure team members are utilized optimally with clear responsibilities, avoiding burnout and confusion."
  }
];

const howItWorksConfig = [
  {
    icon: <Rocket className="size-7 text-primary" />,
    title: "1. Create & Define",
    description: "Kickstart your projects, outline clear objectives, and easily invite your team members to collaborate."
  },
  {
    icon: <ClipboardCheck className="size-7 text-primary" />,
    title: "2. Assign & Track",
    description: "Assign tasks with clear owners and due dates. Monitor progress with intuitive Kanban boards or lists."
  },
  {
    icon: <MessagesSquare className="size-7 text-primary" />,
    title: "3. Collaborate & Deliver",
    description: "Engage in focused discussions, share files, and keep everyone aligned to deliver results efficiently."
  }
];