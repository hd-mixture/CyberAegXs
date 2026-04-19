
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Zap, 
  Lock, 
  Database,
  History,
  Fingerprint,
  LogOut,
  RefreshCw,
  Shield,
  User as UserIcon,
  Activity,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useUser, useAuth } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { RazorpayDemo } from '@/components/RazorpayDemo';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const SystemConfig = () => {
  const { user: firebaseUser } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const { subscriptionPlan, scanCount } = useAppStore();
  
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (firebaseUser?.displayName) {
      setDisplayName(firebaseUser.displayName);
    }
  }, [firebaseUser]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleUpdateName = async () => {
    if (!auth.currentUser || displayName === firebaseUser?.displayName) return;
    
    setIsSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      toast({ 
        title: "Node Identity Updated", 
        description: `Credentials synchronized. Hello, ${displayName}.` 
      });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: err.message 
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const getUsageLimit = () => {
    switch (subscriptionPlan) {
      case 'free': return 2;
      case 'trial': return 5;
      case 'basic': return 20; 
      case 'advanced': return 100; 
      case 'premium': return 9999; 
      default: return 0;
    }
  };

  const usageLimit = getUsageLimit();
  const usagePercentage = usageLimit === 9999 ? 0 : Math.min(100, (scanCount / usageLimit) * 100);
  const isNameChanged = displayName !== (firebaseUser?.displayName || '');

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto custom-scrollbar">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-accent text-xs font-bold tracking-[0.3em] uppercase mb-2">
          <Settings className="h-3 w-3" />
          Hardware & Neural Interface
        </div>
        <h2 className="text-4xl font-black tracking-tight uppercase">System <span className="text-primary">Config</span></h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile / Node Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card border-border shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-zinc-900/50 border-b border-border/50 py-6 px-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight uppercase text-white">Node Identity</CardTitle>
                  <CardDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">Verified Hardware Signature</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Fingerprint className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="node-name" className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Display Name</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 group-focus-within:text-accent transition-colors" />
                    <Input 
                      id="node-name"
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 h-12 pl-11 text-sm font-bold text-white focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all"
                      placeholder="Neural Agent"
                    />
                    {isNameChanged && (
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={handleUpdateName}
                        disabled={isSavingName}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-accent hover:bg-accent/10"
                      >
                        {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email Address</Label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                    <Input 
                      value={firebaseUser?.email || 'unauthorized@node.io'} 
                      readOnly 
                      className="bg-zinc-950 border-zinc-800 h-12 pl-11 text-sm font-bold text-zinc-500 focus:ring-0 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-800/50 mt-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Node Status: Online & Encrypted</span>
                </div>
                <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10" onClick={handleLogout}>
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Terminate Session
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="py-6 px-8 border-b border-border/50">
              <CardTitle className="text-xl font-black tracking-tight uppercase text-white">Neural Configuration</CardTitle>
              <CardDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">AI Model & Processing Preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase text-white tracking-tight group-hover:text-primary transition-colors">Precision OCR Engine</h4>
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase">Prioritize high-fidelity character recognition for complex layouts.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-zinc-800/50" />
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase text-white tracking-tight group-hover:text-primary transition-colors">Deep Threat Audit</h4>
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase">Perform full byte-stream analysis on all ingested documents.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-zinc-800/50" />
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase text-white tracking-tight group-hover:text-primary transition-colors">Smart Context Naming</h4>
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase">Auto-suggest filenames based on AI summary results.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription / Plan Side */}
        <div className="space-y-8">
          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden relative group border">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardHeader className="pt-10 pb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Zap className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter uppercase text-white">Vault Architecture</CardTitle>
              <div className="mt-2 inline-block">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1 text-[10px] tracking-[0.2em] font-black uppercase">
                  {subscriptionPlan.toUpperCase()} TIER
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Node Utilization</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {scanCount} / {usageLimit === 9999 ? '∞' : usageLimit} Scans
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2 bg-zinc-900" />
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center leading-relaxed">
                  Resetting hardware cache every 30 days.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full h-14 bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95"
                  onClick={() => setIsPayOpen(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Expand Architecture
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="py-6 px-8 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase text-white tracking-widest">System Logs</CardTitle>
              <Activity className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50">
                {[
                  { event: 'Node Identity Sync', time: 'Just now', icon: UserIcon, color: 'text-emerald-500' },
                  { event: 'Node Auth Success', time: '2m ago', icon: Lock, color: 'text-emerald-500' },
                  { event: 'OCR Engine Boot', time: '15m ago', icon: Database, color: 'text-primary' },
                  { event: 'Vault Sync Complete', time: '1h ago', icon: History, color: 'text-accent' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between px-8 py-4 hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <log.icon className={cn("h-3.5 w-3.5", log.color)} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{log.event}</span>
                    </div>
                    <span className="text-[9px] font-medium text-zinc-600 uppercase">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RazorpayDemo isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
    </div>
  );
};
