import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site.config";
import { LayoutGrid } from "lucide-react"; 
import Link from "next/link";
import ThemeToggler from "@/components/theme/toggler";


export const AppNavbar = () => {
  return (
    <div 
      id="app-navbar" 
      style={{'--navbar-height': '56px'} as React.CSSProperties} 
      className="border-b border-dashed flex items-center justify-between h-[var(--navbar-height)] shrink-0 px-4 md:px-6"
    >
      <div id="brand" className="flex items-center">
        <Button variant="ghost" className="font-heading text-lg md:text-xl font-bold p-0 h-auto" asChild>
          <Link href="/dashboard">
            <LayoutGrid className="h-5 w-5 mr-2 text-primary" /> 
            <span>{siteConfig.name}</span>
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggler className="h-8 w-8" />
        
      </div>
    </div>
  )
} 