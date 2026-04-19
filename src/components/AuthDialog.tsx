"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, CheckCircle2, Loader2, Fingerprint } from 'lucide-react';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const AuthDialog = ({ isOpen, onClose }: AuthDialogProps) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const initUserProfile = async (credential: UserCredential) => {
    const user = credential.user;
    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'Neural Agent',
        trialScanCount: 0,
        subscriptionPlanId: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
        await initUserProfile(result);
        toast({ title: "Neural Access Granted", description: "Identity verified. Vault decrypted." });
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await initUserProfile(result);
        toast({ title: "Vault Reserved", description: "Encryption keys generated. Welcome, Agent." });
      }
      onClose();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Failed", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await initUserProfile(result);
        toast({ 
          title: "Protocol Success", 
          description: `Logged in as ${result.user.displayName}. Syncing with global nodes.` 
        });
        onClose();
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Google Auth Failed", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-0 overflow-hidden rounded-[2rem] shadow-2xl border-t-[#007DE7]/20">
        <div className="bg-[#007DE7] h-1 w-full shrink-0" />
        
        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar px-8 pb-8 pt-4">
          <DialogHeader className="mb-4">
            <div className="flex justify-center mb-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#007DE7]/10 blur-xl rounded-full group-hover:bg-[#007DE7]/20 transition-all duration-500" />
                <div className="h-20 w-16 flex items-center justify-center relative z-10 logo-container-shine">
                  <img 
                    src="/CyberAegXs%20Logo.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,125,231,0.4)]" 
                  />
                </div>
              </div>
            </div>
            <DialogTitle className="flex justify-center mb-1">
              <BrandLogo size="normal" className="text-2xl" />
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-500 font-bold uppercase text-[8px] tracking-[0.2em] mt-1">
              Secure Architecture Handshake
            </DialogDescription>
          </DialogHeader>

          {isLogin && (
            <div className="space-y-3 mb-4">
              <Button 
                variant="outline" 
                className="w-full h-12 border-zinc-800 bg-zinc-950/50 hover:bg-white hover:text-zinc-950 flex items-center justify-center gap-3 rounded-xl transition-all duration-500 group font-black uppercase text-[9px] tracking-widest overflow-hidden relative"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Sync via Google
              </Button>
            </div>
          )}

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800/50" />
            </div>
            <div className="relative flex justify-center text-[7px] font-black uppercase tracking-[0.2em]">
              <span className="bg-card px-3 text-zinc-600">{isLogin ? 'Manual ID Override' : 'Initialize New Account'}</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[8px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="agent@cyberaegxs.com" 
                  className="pl-10 h-11 bg-zinc-950/50 border-zinc-800/50 focus:border-[#007DE7] rounded-lg text-white text-xs font-medium transition-all" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[8px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 bg-zinc-950/50 border-zinc-800/50 focus:border-[#007DE7] rounded-lg text-white text-xs font-medium transition-all" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#007DE7] text-white font-black uppercase tracking-[0.1em] rounded-xl shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.01] active:scale-[0.98] group text-[10px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>DECRYPTING...</span>
                </div>
              ) : isLogin ? "INITIALIZE LOGIN" : "AUTHORIZE NEW AGENT"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            {isLogin ? "New Node?" : "ID Registered?"}{" "}
            <button 
              className="text-[#007DE7] hover:text-white transition-colors font-black ml-1"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Generate Credentials" : "Sync Node"}
            </button>
          </p>

          <div className="mt-4 pt-4 border-t border-zinc-800/30 flex items-center justify-center gap-4 opacity-30 hover:opacity-50 transition-opacity duration-500">
            <div className="flex items-center gap-1 text-[6px] font-black tracking-widest uppercase text-[#007DE7]">
              <CheckCircle2 className="h-2 w-2" />
              AES-256
            </div>
            <div className="flex items-center gap-1 text-[6px] font-black tracking-widest uppercase text-[#007DE7]">
              <CheckCircle2 className="h-2 w-2" />
              TLS 1.3
            </div>
            <div className="flex items-center gap-1 text-[6px] font-black tracking-widest uppercase text-[#007DE7]">
              <CheckCircle2 className="h-2 w-2" />
              FIPS 140-2
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
