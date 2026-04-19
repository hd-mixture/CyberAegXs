
"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { useRef, useState } from "react";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; onClick: () => void; isActive: boolean }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; onClick: () => void; isActive: boolean }[];
  className?: string;
}) => {
  return (
    <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-fit", className)}>
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {items.map((item) => (
          <button
            key={item.title}
            onClick={item.onClick}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300",
              item.isActive 
                ? "bg-[#007DE7]/10 text-[#007DE7]" 
                : "text-zinc-500 hover:text-white"
            )}
          >
            {item.isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-[#007DE7]/5 rounded-xl border border-[#007DE7]/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="h-5 w-5 relative z-10">{item.icon}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; onClick: () => void; isActive: boolean }[];
  className?: string;
}) => {
  return null; 
};
