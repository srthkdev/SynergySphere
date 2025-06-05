'use client'
import Image from 'next/image'
import { DotPattern } from '@/components/ui/dot-pattern'
import { Header } from '@/components/ui/header'
import { ColorfulText } from '@/components/ui/colourful-text'
import { SignupButton } from '@/components/ui/signup-button'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LayoutDashboard, Edit3, ListChecks, BarChart3, PieChart, FileImage, BookOpen, Plug, Settings } from "lucide-react"
import { Linkedin, Github, X } from "lucide-react";
import Footer from "@/components/ui/footer";
import { PricingSection } from "@/components/ui/pricing-section";
import { ChevronDown } from "lucide-react";
import dynamic from 'next/dynamic'
import ThemeToggler from '@/components/theme/toggler';
import { ThemeProvider } from '@/components/theme/provider';
import { useTheme } from 'next-themes'

// Lazily load heavy components
const MarqueeDemo = dynamic(() => import('@/components/magicui/marquee').then(mod => ({ default: mod.MarqueeDemo })), {
  loading: () => <div className="w-full h-[200px] flex items-center justify-center">Loading testimonials...</div>,
  ssr: false
})

const WobbleCardDemo = dynamic(() => import('@/components/ui/wobble-card').then(mod => ({ default: mod.WobbleCardDemo })), {
  loading: () => <div className="w-full h-[200px] flex items-center justify-center">Loading...</div>,
  ssr: false
})

// TabContent component for placeholder PNG and title
function TabContent({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Placeholder for PNG */}
      <div className="w-[900px] h-[540px] flex items-center justify-center mb-2">
        <Image src="/placeholder.png" alt="placeholder" width={900} height={540} className="object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50" />
      </div>
      
    </div>
  )
}

// FAQ Section Components
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/custom-accordion";

// Update FAQS for SynergySphere
const FAQS = [
  {
    question: "What is SynergySphere?",
    answer: "SynergySphere is an intelligent task management system that acts as your team's central nervous system—helping you organize work, communicate effectively, and deliver results by proactively addressing common team challenges.",
  },
  {
    question: "How does SynergySphere solve scattered information problems?",
    answer: "SynergySphere brings all your important files, conversations, and decisions into one unified platform, making it easy to find what you need when you need it—no more hunting through multiple tools.",
  },
  {
    question: "How does SynergySphere prevent deadline surprises?",
    answer: "Our system proactively monitors project progress and surfaces potential issues before they become problems, giving you time to adjust resources or timelines before deadlines are at risk.",
  },
  {
    question: "How does SynergySphere handle resource management?",
    answer: "SynergySphere provides clear visibility into team capacity and workloads, ensuring team members are neither overworked nor underutilized, with transparent assignment tracking and intelligent resource allocation.",
  },
  {
    question: "How does SynergySphere improve team communication?",
    answer: "By connecting conversations directly to tasks and projects, SynergySphere ensures updates don't get missed and everyone stays in the loop—eliminating the communication gaps that slow teams down.",
  },
];

const SectionBadge = ({ title }: { title: string }) => (
  <div className="flex justify-center items-center gap-2 bg-blue-100 px-2.5 py-1 rounded-full">
    <div className="relative flex justify-center items-center bg-blue-400/40 rounded-full w-1.5 h-1.5">
      <div className="flex justify-center items-center bg-blue-500 rounded-full w-2 h-2 animate-ping">
        <div className="flex justify-center items-center bg-blue-500 rounded-full w-2 h-2 animate-ping"></div>
      </div>
      <div className="top-1/2 left-1/2 absolute flex justify-center items-center bg-blue-600 rounded-full w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2"></div>
    </div>
    <span className="bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 font-medium text-transparent text-xs">
      {title}
    </span>
  </div>
);

const AnimationContainer = ({
  children,
  className,
  animation = "fadeUp",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  animation?: "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scaleUp";
  delay?: number;
}) => {
  // Simple implementation without animations
  const delayStyle = {
    animationDelay: `${delay * 0.2}s`
  };
  
  return (
    <div 
      className={cn(
        "animate-fade-in", 
        {
          "animate-fade-in-up": animation === "fadeUp",
          "animate-fade-in-down": animation === "fadeDown",
          "animate-fade-in-left": animation === "fadeLeft",
          "animate-fade-in-right": animation === "fadeRight",
          "animate-scale-in": animation === "scaleUp",
        },
        className
      )}
      style={delayStyle}
    >
      {children}
    </div>
  );
};

const Wrapper = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <section className={cn("h-full mx-auto w-full lg:max-w-screen-xl px-4 lg:px-20", className)}>
    {children}
  </section>
);

function FAQSection() {
  return (
    <Wrapper className="py-20 lg:py-32">
      <div className="flex flex-col items-center gap-4 text-center">
        <AnimationContainer animation="fadeUp" delay={0.2}>
          <SectionBadge title="FAQ" />
        </AnimationContainer>
        <AnimationContainer animation="fadeUp" delay={0.3}>
          <h2 className="font-black text-3xl md:text-4xl lg:text-5xl text-gray-900">
            Frequently Asked Questions
          </h2>
        </AnimationContainer>
        <AnimationContainer animation="fadeUp" delay={0.4}>
          <p className="mx-auto max-w-xl text-gray-600 text-base md:text-lg">
            Find answers to common questions about how SynergySphere solves your team's biggest task management and collaboration challenges.
          </p>
        </AnimationContainer>
      </div>
      <div className="mx-auto pt-10 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-4 w-full">
          {FAQS.map((item, index) => (
            <AnimationContainer
              key={index}
              animation="fadeUp"
              delay={0.5 + index * 0.1}
            >
              <AccordionItem
                value={`item-${index}`}
                className="bg-blue-50/50 px-6 border border-blue-100 rounded-2xl"
              >
                <AccordionTrigger className="py-6 font-medium text-gray-900 text-base md:text-lg text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 text-left">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            </AnimationContainer>
          ))}
        </Accordion>
      </div>
    </Wrapper>
  );
}

export default function Home() {
  const { resolvedTheme } = useTheme();
  // Determine background color based on theme
  const bgColor = resolvedTheme === 'dark' ? 'bg-neutral-950' : 'bg-white';
  const dotColor = resolvedTheme === 'dark' ? '#23272f' : '#e5e7eb';
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <div className={`relative w-full min-h-screen flex flex-col transition-colors duration-300 ${bgColor}`}>
        <DotPattern
          className="absolute inset-0 w-full h-full z-0"
          glow={false}
          width={18}
          height={18}
          maxDots={12000}
          cr={1}
          color={dotColor}
        />
        {/* Theme toggler in top-right */}
        <div className="relative z-10 flex flex-col w-full min-h-screen">
          <Header />
          {/* Hero Section */}
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-20 flex flex-col items-center justify-center">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
                Your Team's <ColorfulText text="Intelligent" /> Task Management System
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto leading-snug">
                SynergySphere orchestrates your team's work intelligently. Eliminate scattered information, track progress clearly, manage resources effectively, prevent deadline surprises, and close communication gaps—all in one unified platform.
              </p>
              <div className="flex justify-center mb-6">
                <div className={cn(
                  "group rounded-full border border-gray-200 bg-white text-base transition-all ease-in hover:cursor-pointer hover:bg-gray-50 hover:shadow-sm"
                )}>
                  <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out text-gray-800 font-medium hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                    <span>✨ Powered by</span>
                    <Image src="/odoo.png" alt="Odoo" width={40} height={18} className="inline-block mx-1" />
                  </AnimatedShinyText>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <SignupButton href="/dashboard">
                  Get Started Free
                </SignupButton>
                <button 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-50 text-blue-600 text-sm font-medium py-3 px-8 rounded-md transition-colors border border-blue-100 hover:bg-blue-100"
                >
                  Explore Features
                </button>
              </div>
            </div>
          </div>
          {/* Tabs Section */}
          <div id="features" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-15 flex flex-col items-center justify-center">
            <Tabs defaultValue="overview" className="w-full max-w-4xl">
              <TabsList className="flex flex-wrap justify-center items-center gap-2 mb-6 bg-transparent p-0 w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:border-gray-900 bg-white text-gray-900 font-medium text-base shadow-none transition-colors">
                  <LayoutDashboard className="w-5 h-5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="task-management" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:border-gray-900 bg-white text-gray-900 font-medium text-base shadow-none transition-colors">
                  <Edit3 className="w-5 h-5" /> Task Management
                </TabsTrigger>
                <TabsTrigger value="team-communication" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:border-gray-900 bg-white text-gray-900 font-medium text-base shadow-none transition-colors">
                  <ListChecks className="w-5 h-5" /> Team Communication
                </TabsTrigger>
                <TabsTrigger value="resource-management" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:border-gray-900 bg-white text-gray-900 font-medium text-base shadow-none transition-colors">
                  <BarChart3 className="w-5 h-5" /> Resource Management
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:border-gray-900 bg-white text-gray-900 font-medium text-base shadow-none transition-colors">
                  <PieChart className="w-5 h-5" /> Analytics
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-[900px] h-auto flex items-center justify-center mb-2">
                    <Image src="/placeholder.png" alt="overview" width={900} height={540} className="object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                  </div>
                  <p className="text-lg text-center max-w-2xl mt-4 text-gray-700 dark:text-gray-200">
                    SynergySphere acts as your team's central nervous system—bringing scattered information together, providing clear visibility into progress, and helping you stay ahead of deadlines instead of constantly reacting.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="task-management">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-[900px] h-auto flex items-center justify-center mb-2">
                    <Image src="/placeholder.png" alt="task management" width={900} height={540} className="object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                  </div>
                  <p className="text-lg text-center max-w-2xl mt-4 text-gray-700 dark:text-gray-200">
                    Our intelligent task management system proactively surfaces potential issues before they become problems. Optimize resource allocation, prevent deadline surprises, and ensure your team is always working on what matters most.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="team-communication">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-[900px] h-auto flex items-center justify-center mb-2">
                    <Image src="/placeholder.png" alt="team communication" width={900} height={540} className="object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                  </div>
                  <p className="text-lg text-center max-w-2xl mt-4 text-gray-700 dark:text-gray-200">
                    Close communication gaps with integrated team discussions. Keep everyone in the loop with contextual conversations tied directly to tasks, preventing important updates from getting buried in email or lost in scattered chats.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="resource-management">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-[900px] h-auto flex items-center justify-center mb-2">
                    <Image src="/placeholder.png" alt="resource management" width={900} height={540} className="object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                  </div>
                  <p className="text-lg text-center max-w-2xl mt-4 text-gray-700 dark:text-gray-200">
                    Eliminate resource overload and confusion with intelligent workload balancing. Ensure team members are neither overworked nor underutilized, with clear assignments and transparent capacity planning.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="analytics">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-[900px] h-auto flex items-center justify-center mb-2">
                    <Image src="/placeholder.png" alt="analytics" width={900} height={540} className="object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                  </div>
                  <p className="text-lg text-center max-w-2xl mt-4 text-gray-700 dark:text-gray-200">
                    Gain crystal-clear visibility into project progress with powerful analytics. Identify bottlenecks before they impact deadlines, track team performance, and make data-driven decisions that keep work flowing smoothly.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          {/* Wall Of Love Section */}
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
            <span className="text-[15px] font-semibold text-orange-600 mb-3" style={{letterSpacing: 0}}>What our users say about working with SynergySphere</span>
            <h2
              className="text-[44px] leading-tight font-black text-neutral-900 mb-10"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Wall of love
            </h2>
            <div className="w-full max-w-5xl">
              <MarqueeDemo />
            </div>
          </div>
          {/* Pricing Section */}
          <div id="pricing" className="max-w-7xl w-full mx-auto">
            <PricingSection />
          </div>
          {/* Wobble Card Section */}
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center">
            <WobbleCardDemo />
          </div>
          {/* FAQ Section */}
          <div id="faq" className="w-full">
            <FAQSection />
          </div>
          {/* Footer */}
          <div className="w-full">
            <Footer />
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
