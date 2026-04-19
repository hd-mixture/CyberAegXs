
"use client";

import React, { useState, useEffect } from 'react';
import { ScannerInterface } from '@/components/ScannerInterface';
import { SecurityScanner } from '@/components/SecurityScanner';
import { Dashboard } from '@/components/Dashboard';
import { SystemConfig } from '@/components/SystemConfig';
import { PDFToolGrid } from '@/components/PDFToolGrid';
import { FunctionalToolInterface } from '@/components/FunctionalToolInterface';
import { SplitToolInterface } from '@/components/SplitToolInterface';
import { RemovePagesToolInterface } from '@/components/RemovePagesToolInterface';
import { ExtractPagesToolInterface } from '@/components/ExtractPagesToolInterface';
import { OrganizeToolInterface } from '@/components/OrganizeToolInterface';
import { CompressToolInterface } from '@/components/CompressToolInterface';
import { PdfToWordToolInterface } from '@/components/PdfToWordToolInterface';
import { PdfToJpgToolInterface } from '@/components/PdfToJpgToolInterface';
import { PptToPdfToolInterface } from '@/components/PptToPdfToolInterface';
import { RazorpayDemo } from '@/components/RazorpayDemo';
import { AuthDialog } from '@/components/AuthDialog';
import { FloatingDock } from '@/components/ui/floating-dock';
import { 
  Home as HomeIcon,
  LayoutDashboard, 
  Settings, 
  LogOut, 
  User, 
  Zap,
  ChevronRight,
  Loader2,
  Clock,
  Crown,
  Shield,
  Activity,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, SubscriptionPlan } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

const BrandLogo = ({ className = "", size = "normal" }: { className?: string, size?: "large" | "normal" | "small" }) => {
  return (
    <div className={cn("inline-flex items-center tracking-tight leading-none font-semibold", className)} style={{ fontFamily: "'Poppins', sans-serif" }}>
      <span className="text-[#007DE7] drop-shadow-[0_0_12px_rgba(0,125,231,0.5)]">C</span>
      <span className="text-[#007DE7] drop-shadow-[0_0_12px_rgba(0,125,231,0.4)]">yber</span>
      <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">A</span>
      <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">eg</span>
      <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">X</span>
      <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">s</span>
    </div>
  );
};

export default function Home() {
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { 
    activeTool, 
    setActiveTool, 
    subscriptionPlan, 
    setSubscriptionPlan, 
    setScanCount, 
    scanCount,
    resetState 
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'settings'>('home');
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  // --- Real-time User State Synchronization ---
  const userDocRef = useMemoFirebase(() => 
    firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null,
    [firebaseUser, firestore]
  );
  
  const { data: userData, isLoading: isDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (userData) {
      setSubscriptionPlan((userData.subscriptionPlanId || 'free') as SubscriptionPlan);
      setScanCount(userData.trialScanCount || 0);
    } else if (!firebaseUser && !isUserLoading) {
      resetState();
    }
  }, [userData, firebaseUser, isUserLoading, setSubscriptionPlan, setScanCount, resetState]);

  const handleLogout = async () => {
    await signOut(auth);
    resetState();
  };

  const dockItems = [
    {
      title: "Neural Toolkit",
      icon: <HomeIcon className="h-full w-full" />,
      onClick: () => { setActiveTab('home'); setActiveTool('none'); },
      isActive: activeTab === 'home'
    },
    {
      title: "Encrypted Vault",
      icon: <LayoutDashboard className="h-full w-full" />,
      onClick: () => { setActiveTab('dashboard'); setActiveTool('none'); },
      isActive: activeTab === 'dashboard'
    },
    {
      title: "System Config",
      icon: <Settings className="h-full w-full" />,
      onClick: () => { setActiveTab('settings'); setActiveTool('none'); },
      isActive: activeTab === 'settings'
    }
  ];

  const NavItem = ({ 
    icon: Icon, 
    label, 
    id, 
    isActive 
  }: { 
    icon: any, 
    label: string, 
    id: any, 
    isActive: boolean 
  }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setActiveTool('none');
      }}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group w-full text-left",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive ? "" : "group-hover:text-accent")} />
      <span className="font-medium">{label}</span>
      {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
    </button>
  );

  const getPlanDisplay = () => {
    switch (subscriptionPlan) {
      case 'trial': return { label: 'Trial Mode', sub: `${Math.max(0, 5 - scanCount)} Scans Left`, icon: Zap, color: 'text-zinc-400' };
      case 'basic': return { label: 'Basic Node', sub: '14 Days Coverage', icon: Zap, color: 'text-blue-400' };
      case 'advanced': return { label: 'Advanced Pro', sub: '42 Days Coverage', icon: Crown, color: 'text-primary' };
      case 'premium': return { label: 'Ultimate Tier', sub: 'Full Vault Access', icon: Crown, color: 'text-accent' };
      default: return null;
    }
  };

  const planInfo = getPlanDisplay();

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground selection:bg-accent/30 selection:text-accent-foreground">
      
      {/* Mobile Header Session */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-30 p-4 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-8 flex items-center justify-center logo-container-shine">
            <img 
              src="/CyberAegXs%20Logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,125,231,0.4)]" 
            />
          </div>
          <BrandLogo size="small" className="text-xl" />
        </div>

        {/* AUTH BUTTON TOP RIGHT (Mobile) */}
        {!isUserLoading && firebaseUser ? (
          <button 
            onClick={() => setActiveTab('settings')}
            className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden p-0.5"
          >
            {firebaseUser.photoURL ? (
              <img src={firebaseUser.photoURL} alt="P" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <User className="h-5 w-5 text-[#007DE7]" />
            )}
          </button>
        ) : (
          <button 
            onClick={() => setIsAuthDialogOpen(true)}
            className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <Fingerprint className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Sidebar - HIDDEN ON MOBILE */}
      <aside className="hidden lg:flex h-full w-80 bg-card border-r border-border flex-col shadow-none">
        <div className="p-8">
          <div className="flex flex-col gap-3 mb-12">
            <div className="flex items-center gap-3">
              <div className="h-28 w-22 flex items-center justify-center logo-container-shine">
                <img 
                  src="/CyberAegXs%20Logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,125,231,0.5)]" 
                />
              </div>
              <BrandLogo size="normal" className="text-3xl" />
            </div>
            <p className="text-[8px] text-zinc-500 font-black tracking-[0.4em] uppercase mt-2 ml-1">Core Architecture</p>
          </div>

          <nav className="space-y-2">
            <NavItem icon={HomeIcon} label="Neural Toolkit" id="home" isActive={activeTab === 'home'} />
            <NavItem icon={LayoutDashboard} label="Encrypted Vault" id="dashboard" isActive={activeTab === 'dashboard'} />
            <NavItem icon={Settings} label="System Config" id="settings" isActive={activeTab === 'settings'} />
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-6 pb-8">
          <div 
            className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 relative overflow-hidden group cursor-pointer hover:border-[#007DE7]/40 transition-all duration-300 shadow-lg shadow-black/20"
            onClick={() => setIsPayDialogOpen(true)}
          >
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              {planInfo ? <planInfo.icon className={cn("h-24 w-24", planInfo.color)} /> : <Activity className="h-24 w-24 text-[#007DE7]" />}
            </div>
            
            {planInfo ? (
              <div className="relative z-10">
                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1.5", planInfo.color)}>{planInfo.label}</h3>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold mb-3">
                  <Clock className="h-3.5 w-3.5" />
                  {planInfo.sub}
                </div>
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className={cn("h-full bg-current opacity-50 w-full animate-pulse", planInfo.color)} />
                </div>
                <button className="mt-4 text-[10px] font-black text-[#007DE7] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
                  UPGRADE VAULT <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <h3 className="text-sm font-black text-primary mb-1 uppercase tracking-widest flex items-center gap-2">
                  <Crown className="h-4 w-4" /> Pro Access
                </h3>
                <p className="text-[10px] text-zinc-500 mb-4 font-medium leading-relaxed uppercase">Unlock deep PII audits and unlimited AI processing nodes.</p>
                <Button size="sm" className="w-full h-9 text-[10px] font-black uppercase tracking-widest bg-[#007DE7] text-white hover:bg-[#007DE7]/90 shadow-lg shadow-blue-900/20">
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>

          {!isUserLoading && firebaseUser ? (
            <div className="flex items-center gap-3 pt-6 border-t border-zinc-800">
              <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden p-0.5 shadow-inner">
                {firebaseUser.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="Profile" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <div className="h-full w-full rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#007DE7]" />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-white tracking-tight">{firebaseUser.displayName || 'Neural Agent'}</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter truncate">Node Secure</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Disconnect Node"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : isUserLoading || isDataLoading ? (
            <div className="flex items-center justify-center py-6 border-t border-zinc-800">
              <Loader2 className="h-5 w-5 animate-spin text-[#007DE7]" />
            </div>
          ) : (
            <div className="pt-6 border-t border-zinc-800">
              <button 
                className="w-full group relative flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-[#007DE7]/40 transition-all duration-500 overflow-hidden"
                onClick={() => setIsAuthDialogOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-[#007DE7]/10 group-hover:border-[#007DE7]/30 transition-all duration-300">
                  <Fingerprint className="h-5 w-5 text-zinc-500 group-hover:text-[#007DE7] group-hover:scale-110 transition-all" />
                </div>
                
                <div className="flex-1 text-left">
                  <p className="text-[11px] font-black text-white uppercase tracking-[0.15em] mb-0.5">Sign In</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase group-hover:text-zinc-400 transition-colors">Access Architecture</p>
                </div>
                
                <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-[#007DE7] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col bg-background overflow-hidden pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'home' && (
            <>
              {activeTool === 'none' && <PDFToolGrid />}
              {activeTool === 'scan-to-pdf' && <ScannerInterface />}
              {activeTool === 'security-scan' && <SecurityScanner />}
              {activeTool === 'split' && <SplitToolInterface />}
              {activeTool === 'remove' && <RemovePagesToolInterface />}
              {activeTool === 'extract' && <ExtractPagesToolInterface />}
              {activeTool === 'organize' && <OrganizeToolInterface />}
              {activeTool === 'compress' && <CompressToolInterface />}
              {activeTool === 'pdf-to-word' && <PdfToWordToolInterface />}
              {activeTool === 'pdf-to-jpg' && <PdfToJpgToolInterface />}
              {activeTool === 'ppt-to-pdf' && <PptToPdfToolInterface />}
              {activeTool !== 'none' && 
               activeTool !== 'scan-to-pdf' && 
               activeTool !== 'security-scan' && 
               activeTool !== 'split' && 
               activeTool !== 'remove' && 
               activeTool !== 'extract' && 
               activeTool !== 'organize' && 
               activeTool !== 'compress' && 
               activeTool !== 'pdf-to-word' && 
               activeTool !== 'pdf-to-jpg' && 
               activeTool !== 'ppt-to-pdf' && (
                <FunctionalToolInterface tool={activeTool} />
              )}
            </>
          )}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'settings' && <SystemConfig />}
        </div>

        {/* MOBILE FLOATING DOCK - STATIC HORIZONTAL */}
        <div className="lg:hidden">
          <FloatingDock items={dockItems} />
        </div>
      </main>

      <RazorpayDemo isOpen={isPayDialogOpen} onClose={() => setIsPayDialogOpen(false)} />
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  );
}
