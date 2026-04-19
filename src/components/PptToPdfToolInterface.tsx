
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
  Presentation,
  ShieldCheck,
  Zap,
  Bot,
  ChevronRight,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { convertPptToPdf } from '@/app/actions/pdf-actions';

export const PptToPdfToolInterface = () => {
  const { setActiveTool, addDocument } = useAppStore();
  const { toast } = useToast();
  
  const [file, setFile] = useState<{name: string, base64: string, size: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

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
    setStatusMessage('Initializing Presentation Engine...');

    try {
      const step1Timer = setTimeout(() => {
        setProgress(30);
        setStatusMessage('Extracting Slide Structure...');
      }, 1000);

      const step2Timer = setTimeout(() => {
        setProgress(60);
        setStatusMessage('Synthesizing PDF Pages...');
      }, 2500);

      const result = await convertPptToPdf(file.base64, file.name);
      
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);

      if (result.success && result.dataUrl) {
        setProgress(100);
        setStatusMessage('Encryption Complete.');
        setResultUrl(result.dataUrl);
        setIsComplete(true);
        
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.(pptx|ppt)$/, '.pdf'),
          date: new Date().toISOString(),
          thumbnail: result.dataUrl, // Use PDF result as thumbnail
          content: `Converted from ${file.name} via CyberAegXs AI Core.`,
          size: "Optimized",
          type: 'pdf'
        });

        toast({ title: "Conversion Successful", description: "Presentation synthesized into a secure PDF." });
      } else {
        throw new Error(result.error || "Synthesis failed.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Synthesis Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `CyberAegXs_Synthetic_${file?.name.replace(/\.(pptx|ppt)$/, '')}.pdf`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl">
        <Button variant="ghost" onClick={() => setActiveTool('none')} className="mb-8 gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <header className="mb-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-widest uppercase mb-3">
               <Presentation className="h-3 w-3" />
               AI-Powered Slide Synthesis active
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">PowerPoint to PDF</h2>
            <p className="text-zinc-500 max-w-lg">Transform static presentations into high-fidelity PDF documents. Our engine preserves layout, text flow, and visual hierarchy.</p>
          </header>

          {!isProcessing && !isComplete && !file && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center text-center cursor-pointer hover:border-primary/60 hover:bg-zinc-900/50 transition-all bg-zinc-950/50 group relative">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".ppt,.pptx" />
              <Presentation className="h-16 w-16 text-zinc-700 mb-6 group-hover:text-primary transition-colors" />
              <h3 className="font-bold text-2xl mb-2">Drop Presentation to convert</h3>
              <p className="text-sm text-zinc-500">Supports .ppt and .pptx (Max 50MB)</p>
            </div>
          )}

          {file && !isProcessing && !isComplete && (
            <div className="space-y-10">
              <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • SOURCE ASSET</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
                    <Zap className="h-3 w-3" /> Vector Synthesis
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">Generated PDF maintains vector quality for sharp text and shapes at any zoom.</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-tighter">
                    <ShieldCheck className="h-3 w-3" /> Secure Transit
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">All slide processing happens in an ephemeral memory container. No data is stored.</p>
                </div>
              </div>

              <Button 
                onClick={handleProcess} 
                className="w-full h-16 bg-primary text-primary-foreground font-black tracking-tight text-xl shadow-lg shadow-primary/20 hover:scale-[1.01] hover:bg-primary/90 transition-all group"
              >
                CONVERT TO PDF
                <ChevronRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="py-24 flex flex-1 flex-col items-center justify-center gap-10">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                <div className="h-24 w-24 rounded-full border-4 border-zinc-800 border-t-primary animate-spin" />
                <Bot className="absolute h-8 w-8 text-primary" />
              </div>
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-zinc-500">
                  <span>{statusMessage}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-zinc-900" />
                <p className="text-[10px] text-zinc-600 font-bold italic">Synthesizing document bytes from slide XML...</p>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="py-12 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="h-24 w-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">SYNTHESIS COMPLETE</h3>
                <p className="text-zinc-500 mt-2 font-medium">Your presentation has been transformed into a secure PDF document.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadResult} className="flex-1 bg-accent text-accent-foreground font-black h-16 text-sm uppercase tracking-widest hover:scale-[1.02] hover:bg-accent/90 transition-all">
                  <Download className="mr-3 h-5 w-5" /> DOWNLOAD PDF
                </Button>
                <Button variant="outline" className="flex-1 border-zinc-800 h-16 text-sm uppercase font-bold hover:bg-white hover:text-zinc-950 hover:border-white transition-all">
                  <Share2 className="mr-3 h-5 w-5" /> SHARE PDF
                </Button>
              </div>
              <Button onClick={() => { setIsComplete(false); setFile(null); }} variant="ghost" className="text-xs text-zinc-500 hover:text-white uppercase font-bold tracking-widest hover:bg-white/5 transition-colors">
                Convert Another Presentation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
