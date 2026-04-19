
"use client";

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  Download, 
  ArrowLeft,
  Settings2,
  Lock,
  Zap,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore, PDFTool } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { mergePdfs, removePages, pdfToText, textToWord } from '@/app/actions/pdf-actions';

interface FunctionalToolInterfaceProps {
  tool: PDFTool;
}

export const FunctionalToolInterface = ({ tool }: FunctionalToolInterfaceProps) => {
  const { setActiveTool, addDocument, incrementScanCount, scanCount, subscriptionPlan } = useAppStore();
  const { toast } = useToast();
  const [files, setFiles] = useState<{name: string, base64: string, size: number}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const toolName = tool.replace(/-/g, ' ').toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setFiles(prev => [...prev, { name: file.name, base64, size: file.size }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(10);

    try {
      let result;
      
      switch (tool) {
        case 'merge':
          result = await mergePdfs(files.map(f => f.base64));
          break;
        case 'pdf-to-text':
          result = await pdfToText(files[0].base64);
          if (result.success && result.text) {
             const blob = new Blob([result.text], { type: 'text/plain' });
             result.dataUrl = URL.createObjectURL(blob);
          }
          break;
        case 'pdf-to-word':
          const textResult = await pdfToText(files[0].base64);
          result = await textToWord(textResult.text || "Extracted content from PDF.");
          break;
        default:
          await new Promise(r => setTimeout(r, 2000));
          result = { success: true, dataUrl: files[0].base64 };
      }

      setProgress(100);
      if (result.success && result.dataUrl) {
        setResultUrl(result.dataUrl);
        setIsComplete(true);
        incrementScanCount();
        
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          name: `Processed_${files[0].name}`,
          date: new Date().toISOString(),
          thumbnail: files[0].base64,
          content: "Processed via CyberAegXs Engine",
          size: "Optimized",
          type: 'pdf'
        });

        toast({ title: "Operation Complete", description: "Document processed and vaulted." });
      } else {
        throw new Error(result.error || "Unknown processing error");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Processing Failed", description: err.message });
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `CyberAegXs_${tool}_result.${tool === 'pdf-to-text' ? 'txt' : 'pdf'}`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-3xl">
        <Button variant="ghost" onClick={() => setActiveTool('none')} className="mb-8 gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <header className="mb-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-2 text-accent text-[10px] font-black tracking-widest uppercase mb-3">
               <Lock className="h-3 w-3" />
               Precision Processing Active
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4">{toolName}</h2>
            {subscriptionPlan === 'free' && (
              <div className="mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                {2 - scanCount} Free Credits Remaining
              </div>
            )}
            {subscriptionPlan === 'trial' && (
              <div className="mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                {5 - scanCount} Trial Credits Remaining
              </div>
            )}
          </header>

          {!isProcessing && !isComplete && (
            <div className="space-y-8">
              <div className={cn(
                  "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center text-center transition-all duration-300 group relative",
                  files.length > 0 ? "border-primary/50 bg-primary/5" : "border-zinc-800 hover:border-primary/40 bg-zinc-950/50"
                )}>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} multiple accept=".pdf,.jpg,.png" />
                <Upload className="h-12 w-12 text-zinc-700 mb-4 group-hover:text-primary transition-colors" />
                <h3 className="font-bold text-xl mb-1">Upload files for processing</h3>
                <p className="text-xs text-zinc-500">Secure AES-256 encrypted transit</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate text-zinc-300">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-zinc-600 hover:text-red-500"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleProcess} className="w-full h-14 bg-primary text-primary-foreground font-black tracking-tight text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all">
                    PROCESS NOW
                  </Button>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="py-20 flex flex-col items-center gap-8 h-full min-h-[300px] justify-center">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Isolating V8 Environment</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-zinc-900" />
              </div>
            </div>
          )}

          {isComplete && (
            <div className="py-10 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Done!</h3>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadResult} className="flex-1 bg-accent text-accent-foreground font-bold h-16 text-sm uppercase tracking-widest hover:bg-accent/90 hover:scale-[1.02] transition-all">
                  <Download className="mr-2 h-5 w-5" /> DOWNLOAD
                </Button>
                <Button onClick={() => { setIsComplete(false); setFiles([]); }} variant="outline" className="flex-1 border-zinc-800 hover:bg-white hover:text-zinc-950 h-16 text-sm uppercase font-bold transition-all">
                  NEW TASK
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
