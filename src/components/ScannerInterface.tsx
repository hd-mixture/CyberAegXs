"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCcw, 
  ScanLine, 
  X, 
  ShieldCheck, 
  Zap, 
  Files, 
  Loader2, 
  CheckCircle2, 
  ChevronRight, 
  Trash2,
  Layers,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { AuthDialog } from '@/components/AuthDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { imagesToPdf } from '@/app/actions/pdf-actions';

export const ScannerInterface = () => {
  const { addDocument, setActiveTool } = useAppStore();
  const { toast } = useToast();
  
  const [capturedPages, setCapturedPages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [view, setView] = useState<'camera' | 'preview' | 'review' | 'processing'>('camera');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (view === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [view]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to use the scanner.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    setTimeout(() => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.filter = 'contrast(1.1) brightness(1.05)';
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCurrentPreview(dataUrl);
        setView('preview');
      }
      setIsCapturing(false);
    }, 300);
  };

  const addCurrentPage = () => {
    if (currentPreview) {
      setCapturedPages(prev => [...prev, currentPreview]);
      setCurrentPreview(null);
      setView('camera');
      toast({ title: `Page ${capturedPages.length + 1} Captured`, description: "Ready for next scan." });
    }
  };

  const removePage = (index: number) => {
    setCapturedPages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (capturedPages.length === 0) return;

    setView('processing');
    try {
      const result = await imagesToPdf(capturedPages);
      if (result.success && result.dataUrl) {
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          name: `Scan_${new Date().toLocaleDateString().replace(/\//g, '-')}_${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString(),
          thumbnail: capturedPages[0],
          content: `Multi-page document (${capturedPages.length} pages) scanned via CyberAegXs Engine.`,
          size: "Optimized",
          type: 'pdf' as const,
        };

        addDocument(newDoc);
        toast({ title: "Synthesis Complete", description: "Multi-page PDF vaulted successfully." });
        setActiveTool('none');
      } else {
        throw new Error(result.error || "Failed to generate PDF");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Synthesis Failed", description: err.message });
      setView('review');
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center overflow-hidden">
      {/* HUD Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
        <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')} className="text-white hover:bg-white/10 pointer-events-auto rounded-full h-10 w-10 lg:h-12 lg:w-12">
          <X className="h-5 w-5 lg:h-6 lg:w-6" />
        </Button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-accent h-3.5 w-3.5 lg:h-4 lg:w-4 animate-pulse" />
            <span className="text-[8px] lg:text-[10px] font-black tracking-[0.3em] text-white uppercase">Neural Lens v4.0</span>
          </div>
          {capturedPages.length > 0 && (
            <div className="bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/30 flex items-center gap-1.5 lg:gap-2">
              <Layers className="h-3 w-3 text-primary" />
              <span className="text-[8px] lg:text-[10px] text-primary font-bold uppercase tracking-widest">{capturedPages.length} Pages</span>
            </div>
          )}
        </div>

        <div className="w-10 lg:w-12 h-10 lg:h-12" />
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 w-full max-w-5xl bg-zinc-950 overflow-hidden flex items-center justify-center">
        {view === 'camera' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover grayscale-[0.2] brightness-110 contrast-125"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Edge Detection HUD */}
            <div className="absolute inset-0 border-[20px] md:border-[80px] border-black/60 pointer-events-none transition-all duration-500">
              <div className="w-full h-full border border-white/10 relative rounded-sm">
                <div className="absolute -top-2 -left-2 w-10 h-10 lg:w-16 lg:h-16 border-t-[4px] lg:border-t-[6px] border-l-[4px] lg:border-l-[6px] border-accent rounded-tl-lg shadow-[0_0_15px_hsl(var(--accent))]" />
                <div className="absolute -top-2 -right-2 w-10 h-10 lg:w-16 lg:h-16 border-t-[4px] lg:border-t-[6px] border-r-[4px] lg:border-r-[6px] border-accent rounded-tr-lg shadow-[0_0_15px_hsl(var(--accent))]" />
                <div className="absolute -bottom-2 -left-2 w-10 h-10 lg:w-16 lg:h-16 border-b-[4px] lg:border-b-[6px] border-l-[4px] lg:border-l-[6px] border-accent rounded-bl-lg shadow-[0_0_15px_hsl(var(--accent))]" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 lg:w-16 lg:h-16 border-b-[4px] lg:border-b-[6px] border-r-[4px] lg:border-r-[6px] border-accent rounded-br-lg shadow-[0_0_15px_hsl(var(--accent))]" />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/20" />
                   <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-0.5 bg-white/20" />
                </div>

                <div className="absolute top-1/4 left-0 w-full h-[2px] lg:h-[3px] bg-accent/80 shadow-[0_0_30px_hsl(var(--accent))] animate-[scan_3s_ease-in-out_infinite]" />
                
                <div className="absolute top-3 left-3 lg:top-4 lg:left-4 flex flex-col gap-1">
                   <span className="text-[7px] lg:text-[8px] font-black text-accent tracking-tighter uppercase opacity-80">Sync: Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'preview' && currentPreview && (
          <div className="relative w-full h-full p-6 lg:p-10 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-500">
            <div className="relative w-full max-w-sm aspect-[3/4] shadow-2xl shadow-primary/20 bg-white p-1">
               <Image 
                src={currentPreview} 
                alt="Capture Preview" 
                fill 
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 right-4 bg-accent text-accent-foreground text-[8px] lg:text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase">
                Enhanced
              </div>
            </div>
            <div className="mt-6 lg:mt-8 text-center px-4">
               <h3 className="text-xl lg:text-2xl font-black tracking-tighter text-white uppercase">Neural Preview</h3>
               <p className="text-zinc-500 text-xs lg:text-sm mt-1">Applying perspective & contrast correction...</p>
            </div>
          </div>
        )}

        {view === 'review' && (
          <div className="w-full h-full p-4 lg:p-8 overflow-y-auto custom-scrollbar bg-zinc-950 flex flex-col animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto py-8 lg:py-12">
              {capturedPages.map((page, i) => (
                <div key={i} className="group relative aspect-[3/4] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300">
                  <Image src={page} alt={`Page ${i+1}`} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/40 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="destructive" size="icon" className="h-9 w-9 lg:h-10 lg:w-10 rounded-full" onClick={() => removePage(i)}>
                      <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] lg:text-[10px] font-bold text-white uppercase tracking-widest">
                    P{i+1}
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setView('camera')}
                className="aspect-[3/4] border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 lg:gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Camera className="h-5 w-5 lg:h-6 lg:w-6 text-zinc-600 group-hover:text-primary" />
                </div>
                <span className="text-[8px] lg:text-[10px] font-black text-zinc-600 group-hover:text-primary uppercase tracking-widest">Add Page</span>
              </button>
            </div>
          </div>
        )}

        {view === 'processing' && (
          <div className="py-24 flex flex-1 flex-col items-center justify-center gap-8 lg:gap-10">
            <div className="relative h-24 w-24 lg:h-32 lg:w-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
              <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full border-4 border-zinc-800 border-t-primary animate-spin" />
              <Sparkles className="absolute h-6 w-6 lg:h-8 lg:w-8 text-primary" />
            </div>
            <div className="text-center space-y-2 lg:space-y-4 px-6">
              <h4 className="font-black text-xl lg:text-2xl tracking-tighter uppercase">Synthesizing Vault PDF</h4>
              <p className="text-[10px] lg:text-xs text-zinc-500 font-bold tracking-[0.2em] uppercase">Encrypting Byte Streams...</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="w-full bg-zinc-900/90 backdrop-blur-xl p-6 lg:p-8 flex flex-col items-center gap-4 lg:gap-6 z-30 border-t border-white/5">
        {view === 'camera' && (
          <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-md">
             <div className="flex items-center justify-center w-full gap-8 lg:gap-12">
                <Button variant="ghost" className="text-zinc-500 hover:text-white flex flex-col h-auto py-2 gap-1 min-w-[60px]" onClick={() => capturedPages.length > 0 && setView('review')}>
                   <Layers className={cn("h-5 w-5 lg:h-6 lg:w-6", capturedPages.length > 0 ? "text-primary" : "text-zinc-800")} />
                   <span className="text-[8px] font-bold uppercase tracking-tighter">Stack</span>
                </Button>

                <button 
                  onClick={handleCapture}
                  disabled={isCapturing}
                  className={cn(
                    "w-20 h-20 lg:w-24 lg:h-24 rounded-full border-[4px] lg:border-[6px] flex items-center justify-center transition-all duration-300 shadow-2xl",
                    isCapturing ? "border-zinc-800 bg-zinc-900" : "border-white bg-white/5 hover:scale-105 active:scale-95"
                  )}
                >
                  <div className={cn(
                    "rounded-full transition-all duration-300",
                    isCapturing ? "w-6 h-6 lg:w-8 lg:h-8 bg-accent animate-pulse" : "w-12 h-12 lg:w-16 lg:h-16 bg-white"
                  )} />
                </button>

                <Button variant="ghost" className="text-zinc-500 hover:text-white flex flex-col h-auto py-2 gap-1 min-w-[60px]" onClick={() => capturedPages.length > 0 && handleFinish()}>
                   <CheckCircle2 className={cn("h-5 w-5 lg:h-6 lg:w-6", capturedPages.length > 0 ? "text-emerald-500" : "text-zinc-800")} />
                   <span className="text-[8px] font-bold uppercase tracking-tighter">Finish</span>
                </Button>
             </div>
             
             <div className="flex items-center gap-2 text-zinc-600 text-[8px] lg:text-[10px] font-black tracking-[0.2em] uppercase">
                <ScanLine className="h-3 w-3 text-accent animate-pulse" />
                Edge Detection Active
             </div>
          </div>
        )}

        {view === 'preview' && (
          <div className="flex gap-3 lg:gap-4 w-full max-w-md">
            <Button 
              variant="outline" 
              className="flex-1 py-6 lg:py-7 border-zinc-700 hover:bg-white hover:text-zinc-950 font-black uppercase text-[10px] lg:text-xs tracking-widest transition-all"
              onClick={() => { setCurrentPreview(null); setView('camera'); }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button 
              className="flex-1 py-6 lg:py-7 bg-primary text-primary-foreground font-black uppercase text-[10px] lg:text-xs tracking-widest accent-glow transition-all"
              onClick={addCurrentPage}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </div>
        )}

        {view === 'review' && (
          <div className="flex flex-col gap-3 lg:gap-4 w-full max-w-md">
            <div className="flex gap-3 lg:gap-4">
              <Button 
                variant="outline" 
                className="flex-1 py-6 lg:py-7 border-zinc-700 hover:bg-white hover:text-zinc-950 font-black uppercase text-[10px] lg:text-xs tracking-widest transition-all"
                onClick={() => setView('camera')}
              >
                <Camera className="mr-2 h-4 w-4" />
                Add Page
              </Button>
              <Button 
                className="flex-1 py-6 lg:py-7 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] lg:text-xs tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
                onClick={handleFinish}
              >
                <Download className="mr-2 h-4 w-4" />
                Save PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};