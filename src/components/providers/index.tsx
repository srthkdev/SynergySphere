import { ThemeProvider } from "@/components/theme/provider";
import { Toaster } from "@/components/ui/sonner";
import { Providers as QueryProviders } from "./query-provider"; // Use relative path

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProviders>
        <Toaster position="top-right" />
        {children}
      </QueryProviders>
    </ThemeProvider>
  );
}