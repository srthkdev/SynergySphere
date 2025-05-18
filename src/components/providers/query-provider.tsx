"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// If you want to use React Query Devtools, uncomment the next line
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Uncomment the line below to enable React Query Devtools */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
} 