"use client";

import { useEffect } from "react";

function LandingPageStyles() {
  useEffect(() => {
    // Force light mode styling for landing page
    const originalHtmlStyle = document.documentElement.style.backgroundColor;
    const originalBodyStyle = document.body.style.backgroundColor;
    const originalHtmlColor = document.documentElement.style.color;
    const originalBodyColor = document.body.style.color;

    document.documentElement.style.backgroundColor = "white";
    document.body.style.backgroundColor = "white";
    document.documentElement.style.color = "rgb(17, 24, 39)";
    document.body.style.color = "rgb(17, 24, 39)";

    // Cleanup on unmount
    return () => {
      document.documentElement.style.backgroundColor = originalHtmlStyle;
      document.body.style.backgroundColor = originalBodyStyle;
      document.documentElement.style.color = originalHtmlColor;
      document.body.style.color = originalBodyColor;
    };
  }, []);

  return null;
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingPageStyles />
      <div className="relative flex min-h-screen flex-col bg-white">
        {/* Header will be included in the page component */}
        <main className="flex-1 pt-16 bg-white">{children}</main>
      </div>
    </>
  );
}
