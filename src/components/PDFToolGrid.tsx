
"use client";

import React, { useState } from 'react';
import { 
  Merge, 
  Scissors, 
  Trash2, 
  ExternalLink, 
  ArrowDownToLine, 
  Presentation,
  ImageIcon,
  FileType,
  Camera,
  Layers,
  ArrowUpDown,
  Lock,
  ShieldAlert,
  Zap,
  LockKeyhole,
  Clock
} from 'lucide-react';
import { useAppStore, PDFTool, SubscriptionPlan } from '@/lib/store';
import { cn } from '@/lib/utils';
import { RazorpayDemo } from '@/components/RazorpayDemo';

interface ToolCardProps {
  icon: any;
  title: string;
  description: string;
  tool: PDFTool;
  color: string;
  category: string;
  isNew?: boolean;
}

const ToolCard = ({ icon: Icon, title, description, tool, color, category, isNew }: ToolCardProps) => {
  const { setActiveTool, subscriptionPlan, scanCount } = useAppStore();
  const [isPayOpen, setIsPayOpen] = useState(false);

  // Locking Logic
  const isUnlocked = (tool: PDFTool, plan: SubscriptionPlan): boolean => {
    if (plan === 'premium' || plan === 'trial') return true;
    if (tool === 'security-scan' || tool === 'scan-to-pdf') return true;
    
    const unlockedTools: Record<string, PDFTool[]> = {
      free: ['merge', 'organize'],
      basic: ['merge', 'organize', 'split', 'compress'],
      advanced: ['merge', 'organize', 'split', 'compress', 'extract', 'remove'],
    };

    return unlockedTools[plan]?.includes(tool) || false;
  };

  const unlocked = isUnlocked(tool, subscriptionPlan);
  
  // Expiration logic
  const isTrialTool = tool === 'merge' || tool === 'organize' || tool === 'security-scan';
  const isExpired = 
    (subscriptionPlan === 'free' && isTrialTool && scanCount >= 2) ||
    (subscriptionPlan === 'trial' && scanCount >= 5);

  const handleToolClick = () => {
    if (isExpired) {
      setIsPayOpen(true);
      return;
    }
    if (unlocked) {
      setActiveTool(tool);
    } else {
      setIsPayOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleToolClick}
        className={cn(
          "group relative bg-card border p-6 rounded-2xl text-left transition-all duration-300 flex flex-col h-full overflow-hidden",
          unlocked && !isExpired
            ? "border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5" 
            : "border-zinc-800 opacity-80 cursor-default"
        )}
      >
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", 
          unlocked && !isExpired ? color : "bg-zinc-900 text-zinc-600"
        )}>
          {unlocked && !isExpired ? <Icon className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isNew && unlocked && !isExpired && (
            <span className="bg-accent/20 text-accent text-[8px] font-black px-1.5 py-0.5 rounded border border-accent/30 uppercase tracking-tighter">New</span>
          )}
          
          {subscriptionPlan === 'free' && isTrialTool && !isExpired && (
            <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded animate-pulse">
              <span className="text-primary text-[8px] font-black uppercase tracking-tighter">
                {2 - scanCount} Free Remaining
              </span>
            </div>
          )}

          {subscriptionPlan === 'trial' && !isExpired && (
            <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded animate-pulse">
              <span className="text-primary text-[8px] font-black uppercase tracking-tighter">
                {5 - scanCount} Trial Remaining
              </span>
            </div>
          )}

          {(isExpired || !unlocked) && (
            <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-tighter">LOCKED</span>
          )}
        </div>

        <h3 className={cn("text-lg font-bold mb-2 transition-colors", unlocked && !isExpired ? "group-hover:text-primary" : "text-zinc-500")}>{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed mb-4">{description}</p>
        
        <div className="mt-auto flex items-center justify-between">
          {unlocked && !isExpired ? (
            <div className="flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              LAUNCH TOOL <ExternalLink className="ml-2 h-3 w-3" />
            </div>
          ) : (
            <div className="flex items-center text-[10px] font-black text-amber-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              <Zap className="h-3 w-3 mr-1.5" /> UPGRADE TO UNLOCK
            </div>
          )}
          
          <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.25em] ml-auto">
            {category}
          </div>
        </div>
        
        {/* Greedy Overlay on hover for locked tools */}
        {(!unlocked || isExpired) && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-amber-500/[0.03] transition-colors pointer-events-none" />
        )}

        {unlocked && !isExpired && (
          <div className={cn("absolute -bottom-6 -right-6 h-20 w-20 opacity-5 blur-2xl rounded-full", color)} />
        )}
      </button>
      <RazorpayDemo isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
    </>
  );
};

export const PDFToolGrid = () => {
  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-2 text-accent text-xs font-bold tracking-[0.3em] uppercase mb-3">
          <Lock className="h-3 w-3" />
          Precision PDF Intelligence
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-4">
          Core <span className="text-primary">Capabilities</span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
          The ultimate cyber-secure toolkit for your document workflows. Every tool is powered by isolated AI nodes for maximum privacy and accuracy.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* SECURITY */}
        <ToolCard 
          icon={ShieldAlert} 
          title="Security Scan" 
          description="Detect viruses, malware, and sensitive PII data."
          tool="security-scan"
          color="bg-red-500/10 text-red-500 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
          category="Security"
          isNew
        />
        
        {/* CREATE */}
        <ToolCard 
          icon={Camera} 
          title="Scan to PDF" 
          description="High-precision OCR and auto edge detection."
          tool="scan-to-pdf"
          color="bg-emerald-500/10 text-emerald-500"
          category="Create"
        />

        {/* ORGANIZE */}
        <ToolCard 
          icon={Merge} 
          title="Merge PDF" 
          description="Combine multiple PDFs into one secure file."
          tool="merge"
          color="bg-primary/10 text-primary"
          category="Organize"
        />
        <ToolCard 
          icon={ArrowUpDown} 
          title="Organize" 
          description="Drag and drop to reorder document pages."
          tool="organize"
          color="bg-primary/10 text-primary"
          category="Organize"
        />
        <ToolCard 
          icon={Scissors} 
          title="Split PDF" 
          description="Extract ranges or separate every page."
          tool="split"
          color="bg-primary/10 text-primary"
          category="Organize"
        />
        <ToolCard 
          icon={Trash2} 
          title="Remove Pages" 
          description="Delete unnecessary pages from your file."
          tool="remove"
          color="bg-primary/10 text-primary"
          category="Organize"
        />
        <ToolCard 
          icon={Layers} 
          title="Extract Pages" 
          description="Pull specific pages into a new PDF."
          tool="extract"
          color="bg-primary/10 text-primary"
          category="Organize"
        />

        {/* OPTIMIZE */}
        <ToolCard 
          icon={ArrowDownToLine} 
          title="Compress" 
          description="Reduce file size without losing quality."
          tool="compress"
          color="bg-accent/10 text-accent"
          category="Optimize"
        />

        {/* CONVERT */}
        <ToolCard 
          icon={FileType} 
          title="PDF to Word" 
          description="Convert to editable Word docs via AI."
          tool="pdf-to-word"
          color="bg-blue-500/10 text-blue-500"
          category="Convert"
        />
        <ToolCard 
          icon={ImageIcon} 
          title="PDF to JPG" 
          description="Extract high-res images from any page."
          tool="pdf-to-jpg"
          color="bg-amber-500/10 text-amber-500"
          category="Convert"
        />
        <ToolCard 
          icon={Presentation} 
          title="PPT to PDF" 
          description="Convert slides to secure PDF documents."
          tool="ppt-to-pdf"
          color="bg-orange-500/10 text-orange-500"
          category="Convert"
          isNew
        />
      </div>
    </div>
  );
};
