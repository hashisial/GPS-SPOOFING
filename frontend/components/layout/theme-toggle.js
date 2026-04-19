"use client";

import { motion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { mounted, theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Toggle theme"
      className="ghost-button"
      onClick={toggleTheme}
      type="button"
    >
      {mounted && theme === "light" ? <MoonStar size={16} /> : <SunMedium size={16} />}
      {mounted && theme === "light" ? "Dark mode" : "Light mode"}
    </motion.button>
  );
}

