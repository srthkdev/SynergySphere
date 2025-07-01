"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from 'next-themes';

export function ColorfulText({ text, forceTheme }: { text: string; forceTheme?: 'light' | 'dark' }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Blue-themed colors that match the UI
  const lightColors = [
    "rgb(37, 99, 235)",  // blue-600
    "rgb(59, 130, 246)", // blue-500
    "rgb(96, 165, 250)", // blue-400
    "rgb(59, 130, 246)", // blue-500
    "rgb(37, 99, 235)",  // blue-600
  ];
  const darkColors = [
    "#60a5fa", // blue-400
    "#93c5fd", // blue-300
    "#bae6fd", // blue-200
    "#93c5fd", // blue-300
    "#60a5fa", // blue-400
  ];
  
  // Use forceTheme if provided, otherwise use the resolved theme
  let colors = lightColors; // Default to light colors
  
  if (forceTheme) {
    colors = forceTheme === 'dark' ? darkColors : lightColors;
  } else if (mounted && resolvedTheme === 'dark') {
    colors = darkColors;
  }

  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return text.split("").map((char, index) => (
    <motion.span
      key={`${char}-${count}-${index}`}
      initial={{ color: colors[0] }}
      animate={{
        color: colors[index % colors.length],
        y: [0, -2, 0],
        scale: [1, 1.01, 1],
      }}
      transition={{
        duration: 0.8,
        delay: index * 0.03,
      }}
      className="inline-block whitespace-pre font-sans tracking-tight"
    >
      {char}
    </motion.span>
  ));
} 