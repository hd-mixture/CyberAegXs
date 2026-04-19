"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldCheck, Zap, Crown, Loader2, Sparkles, Lock, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore, SubscriptionPlan } from '@/lib/store';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { AuthDialog } from '@/components/AuthDialog';
import { cn } from '@/lib/utils';
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

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    price: '9', 
    period: ' One-time',
    features: ['5 Scans Total', 'All Tools Unlocked', 'Full AI Access'],
    icon: Sparkles,
    color: 'text-zinc-400'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '49',
    period: ' / 14 Days',
    features: ['Merge & Organize', 'Split Pages', 'Compress (7 Tools)'],
    icon: Zap,
    color: 'text-blue-400'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: '147',
    period: ' / 42 Days',
    popular: true,
    features: ['All Basic Features', 'Extract Pages', 'Remove Pages'],
    icon: ShieldCheck,
    color: 'text-primary'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '441',
    period: ' / 252 Days',
    features: ['Everything Unlocked', 'Premium Scan Engine', 'Priority AI Nodes'],
    icon: Crown,
    color: 'text-accent'
  }
];

const RAZORPAY_KEY_ID = "rzp_live_SbcfOhiSPrUQ7Y"; 

interface RazorpayDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RazorpayDemo = ({ isOpen, onClose }: RazorpayDemoProps) => {
  const { toast } = useToast();
  const { user: firebaseUser } = useUser();
  const firestore = useFirestore();
  const { setSubscriptionPlan, subscriptionPlan } = useAppStore();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showDevBypass, setShowDevBypass] = useState(false);

  useEffect(() => {
    if (isProcessing) {
      const originalStyle = document.body.style.pointerEvents;
      document.body.style.pointerEvents = 'auto';
      return () => {
        document.body.style.pointerEvents = originalStyle;
      };
    }
  }, [isProcessing]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const visiblePlans = PLANS.filter(plan => {
    const planOrder = ['free', 'trial', 'basic', 'advanced', 'premium'];
    const currentIndex = planOrder.indexOf(subscriptionPlan);
    const planIndex = planOrder.indexOf(plan.id);
    if (plan.id === subscriptionPlan) return false;
    if (subscriptionPlan !== 'free' && plan.id === 'trial') return false;
    return planIndex > currentIndex;
  });

  const syncPlanToCloud = async (planId: string, paymentId: string = 'bypass') => {
    if (!firebaseUser) return;

    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const updateData = {
      subscriptionPlanId: planId,
      updatedAt: new Date().toISOString(),
      lastPaymentId: paymentId,
      subscriptionStartDate: new Date().toISOString(),
    };

    updateDocumentNonBlocking(userRef, updateData);
    setSubscriptionPlan(planId as SubscriptionPlan);
  };

  const handlePayment = (plan: any) => {
    if (!firebaseUser) {
      setIsAuthOpen(true);
      return;
    }

    setIsProcessing(plan.id);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: parseInt(plan.price) * 100, 
      currency: "INR",
      name: "CyberAegXs",
      description: `Upgrade to ${plan.name} Architecture`,
      image: "/CyberAegXs%20Logo.png",
      handler: async function (response: any) {
        await syncPlanToCloud(plan.id, response.razorpay_payment_id);
        setIsProcessing(null);
        toast({
          title: "Architecture Upgraded",
          description: `Vault tier updated to ${plan.name.toUpperCase()} and synced to cloud.`,
        });
        onClose();
      },
      prefill: {
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
      },
      notes: {
        plan_id: plan.id,
        user_id: firebaseUser.uid
      },
      theme: { color: "#007DE7" },
      modal: {
        ondismiss: function() {
          setIsProcessing(null);
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessing(null);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "Payment failed. Please try again.",
        });
      });
      rzp.open();
    } catch (e) {
      setIsProcessing(null);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: "Could not initialize payment gateway.",
      });
    }
  };

  const handleBypass = async (planId: string) => {
    await syncPlanToCloud(planId, 'dev_override');
    toast({
      title: "Developer Override",
      description: `Bypassed payment for ${planId.toUpperCase()} and synced to cloud.`,
    });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isProcessing) return;
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="sm:max-w-[95vw] lg:max-w-[1100px] bg-card border-border p-0 overflow-hidden rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300"
          onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}
        >
          <div className="bg-[#007DE7] h-1 w-full shrink-0" />
          
          <div className="relative max-h-[85vh] overflow-y-auto overflow-x-hidden custom-scrollbar p-6 md:p-8 lg:p-10">
            {/* Watermark Splash Logo - Positioned Top Right, Clipped to half */}
            <div className="absolute -top-32 -right-[300px] pointer-events-none opacity-[0.03] select-none z-0 shrink-0">
              <img 
                src="/CyberAegXs%20Logo.png" 
                alt="Watermark" 
                className="w-[600px] h-[600px] object-contain"
              />
            </div>

            <DialogHeader className="mb-8 text-center relative">
              <div 
                className="flex justify-center mb-2 cursor-help absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10" 
                onDoubleClick={() => setShowDevBypass(!showDevBypass)}
              >
                <div className="h-32 w-32 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full scale-150 animate-pulse" />
                </div>
              </div>
              
              <div className="relative z-10 pt-4 flex flex-col items-center" onDoubleClick={() => setShowDevBypass(!showDevBypass)}>
                <DialogTitle className="flex justify-center mb-4">
                   <BrandLogo size="large" className="text-6xl" />
                </DialogTitle>
                <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] text-center w-full max-w-md mx-auto">
                  Secure Tier Expansion • Linked to Node Identity
                </DialogDescription>
              </div>
            </DialogHeader>

            {!firebaseUser ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-md space-y-3">
                  <div className="flex justify-center">
                    <Lock className="h-10 w-10 text-zinc-700" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Identity Authentication Required</h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium uppercase tracking-widest">Subscriptions are tied to your unique neural ID. Please verify identity to continue.</p>
                </div>
                <Button 
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-[#007DE7] text-white px-12 h-14 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-2xl shadow-blue-900/20 hover:scale-[1.02] transition-all"
                >
                  INITIALIZE SIGN IN
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className={cn(
                  "grid grid-cols-1 gap-6 pt-2 relative z-10",
                  visiblePlans.length === 1 ? "max-w-sm mx-auto w-full" : 
                  visiblePlans.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto w-full" : 
                  visiblePlans.length === 3 ? "sm:grid-cols-3 max-w-6xl mx-auto w-full" : 
                  "sm:grid-cols-2 lg:grid-cols-4"
                )}>
                  {visiblePlans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div 
                        key={plan.id}
                        className={cn(
                          "relative flex flex-col p-6 rounded-[2rem] bg-zinc-950/90 backdrop-blur-md border transition-all duration-500 group min-h-[420px]",
                          plan.popular 
                            ? 'border-[#007DE7] shadow-[0_0_40px_-15px_rgba(0,125,231,0.2)] lg:scale-[1.03] z-10' 
                            : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                        )}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                            <Badge className="bg-[#007DE7] text-white font-black px-4 py-1 text-[8px] tracking-[0.15em] uppercase border-2 border-zinc-950 shadow-2xl">
                              RECOMMENDED
                            </Badge>
                          </div>
                        )}
                        
                        <div className={cn("h-10 w-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500", plan.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-3xl font-black text-white">₹{plan.price}</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{plan.period}</span>
                        </div>
                        
                        <ul className="space-y-3.5 mb-8 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-zinc-300 uppercase tracking-tight leading-snug">
                              <Check className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <div className="space-y-3">
                          <Button 
                            className={cn(
                              "w-full h-12 font-black uppercase tracking-[0.1em] text-[10px] rounded-xl transition-all shadow-lg",
                              plan.popular 
                                ? "bg-[#007DE7] text-white hover:bg-[#007DE7]/90 shadow-blue-900/20" 
                                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
                            )}
                            onClick={() => handlePayment(plan)}
                            disabled={isProcessing !== null}
                          >
                            {isProcessing === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'AUTHORIZE UPGRADE'}
                          </Button>

                          {showDevBypass && (
                            <Button 
                              variant="outline" 
                              className="w-full h-8 border-red-500/20 bg-red-500/5 text-red-500 text-[7px] font-black uppercase tracking-widest hover:bg-red-500/10 animate-in slide-in-from-top-2"
                              onClick={() => handleBypass(plan.id)}
                            >
                              <Terminal className="mr-1 h-3 w-3" /> Cloud Bypass
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {firebaseUser && visiblePlans.length === 0 && (
              <div className="py-16 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-blue-600/30 blur-[60px] rounded-full" />
                  <Check className="h-12 w-12 text-emerald-500 relative z-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Maximum Architecture Active</h3>
                  <p className="text-zinc-500 mt-2 font-bold uppercase text-[10px] tracking-[0.3em]">Your vault is expanded to the highest logical tier.</p>
                </div>
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-zinc-800/50 flex flex-wrap items-center justify-center gap-10 opacity-30">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">IDENTITY LINKED PERSISTENCE</span>
               </div>
               <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-zinc-500" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">AES-256 CLOUD VAULT</span>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
