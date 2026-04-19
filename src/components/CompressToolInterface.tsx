
'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  Download, 
  ArrowLeft,
  Zap,
  Gauge,
  ShieldCheck,
  ArrowDownToLine,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { compressPdf } from '@/app/actions/pdf-actions';

type CompressionLevel = 'low' | 'medium' | 'high';

export const CompressToolInterface = () => {
  const { setActiveTool, addDocument } = useAppStore();
  const { toast } = useToast();
  
  const [file, setFile] = useState<{name: string, base64: string, size: number} | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFile({ name: selectedFile.name, base64, size: selectedFile.size });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(10);

    try {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 300);

      const result = await compressPdf(file.base64, level);
      clearInterval(interval);
      setProgress(100);

      if (result.success && result.dataUrl) {
        setResultUrl(result.dataUrl);
        setIsComplete(true);
        
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          name: `Compressed_${file.name}`,
          date: new Date().toISOString(),
          thumbnail: file.base64,
          content: `Optimized via CyberAegXs Compression Engine at ${level.toUpperCase()} intensity.`,
          size: "Optimized",
          type: 'pdf'
        });

        toast({ title: "Optimization Complete", description: "PDF compressed and vaulted successfully." });
      } else {
        throw new Error(result.error || "Optimization error");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Process Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `CyberAegXs_Optimized_${file?.name || 'document'}.pdf`;
    link.click();
  };

  const LevelButton = ({ id, title, desc, icon: Icon, color }: { id: CompressionLevel, title: string, desc: string, icon: any, color: string }) => (
    <button
      onClick={() => setLevel(id)}
      className={cn(
        "flex flex-col items-start p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
        level === id 
          ? "border-primary bg-primary/10 shadow-2xl shadow-primary/10" 
          : "border-zinc-800 hover:border-zinc-600 bg-zinc-950/30 hover:bg-zinc-900/50"
      )}
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <h4 className={cn("font-bold text-lg mb-1", level === id ? "text-white" : "text-zinc-400")}>{title}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed pr-4">{desc}</p>
      
      {level === id && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
      )}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl">
        <Button variant="ghost" onClick={() => setActiveTool('none')} className="mb-8 gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <header className="mb-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-2 text-accent text-[10px] font-black tracking-widest uppercase mb-3">
               <ShieldCheck className="h-3 w-3" />
               High-Efficiency Optimization active
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Compress PDF</h2>
            <p className="text-zinc-500 max-w-lg">Our engine strips redundant metadata, optimizes font subsets, and re-encodes streams for maximum portability without visible loss.</p>
          </header>

          {!isProcessing && !isComplete && !file && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center text-center cursor-pointer hover:border-primary/60 hover:bg-zinc-900/50 transition-all bg-zinc-950/50 group relative">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
              <Upload className="h-16 w-16 text-zinc-700 mb-6 group-hover:text-primary transition-colors" />
              <h3 className="font-bold text-2xl mb-2">Upload document to shrink</h3>
              <p className="text-sm text-zinc-500">Atomic compression environment</p>
            </div>
          )}

          {file && !isProcessing && !isComplete && (
            <div className="space-y-10">
              <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • SOURCE FILE</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <Gauge className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Select Optimization Intensity</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <LevelButton 
                    id="low" 
                    title="Basic" 
                    desc="High quality, slight structural optimization." 
                    icon={Sparkles}
                    color="bg-emerald-500/10 text-emerald-500"
                  />
                  <LevelButton 
                    id="medium" 
                    title="Recommended" 
                    desc="Perfect balance of quality and file size." 
                    icon={Zap}
                    color="bg-primary/10 text-primary"
                  />
                  <LevelButton 
                    id="high" 
                    title="Extreme" 
                    desc="Minimum file size, lower image quality." 
                    icon={ArrowDownToLine}
                    color="bg-red-500/10 text-red-500"
                  />
                </div>
              </div>

              <Button 
                onClick={handleProcess} 
                className="w-full h-16 bg-primary text-primary-foreground font-black tracking-tight text-xl shadow-lg shadow-primary/20 hover:scale-[1.01] hover:bg-primary/90 transition-all group"
              >
                INITIATE COMPRESSION
                <ChevronRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="py-24 flex flex-1 flex-col items-center justify-center gap-10">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                <div className="h-24 w-24 rounded-full border-4 border-zinc-800 border-t-primary animate-spin" />
                <ArrowDownToLine className="absolute h-8 w-8 text-primary animate-bounce" />
              </div>
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-zinc-500">
                  <span>Re-encoding Byte Streams</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-zinc-900" />
                <p className="text-[10px] text-zinc-600 font-bold italic">Removing unreferenced XObjects...</p>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="py-12 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="h-24 w-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">OPTIMIZATION READY</h3>
                <p className="text-zinc-500 mt-2 font-medium">Internal structure cleaned and streams compressed. File size reduced.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadResult} className="flex-1 bg-accent text-accent-foreground font-black h-16 text-sm uppercase tracking-widest hover:scale-[1.02] hover:bg-accent/90 transition-all">
                  <Download className="mr-3 h-5 w-5" /> DOWNLOAD OPTIMIZED PDF
                </Button>
                <Button onClick={() => { setIsComplete(false); setFile(null); }} variant="outline" className="flex-1 border-zinc-800 h-16 text-sm uppercase font-bold hover:bg-white hover:text-zinc-950 hover:border-white transition-all">
                  NEW COMPRESSION
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
