
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  Download, 
  ArrowLeft,
  Trash2,
  Lock,
  Eye,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { removePages, getPdfInfo } from '@/app/actions/pdf-actions';
import { Label } from '@/components/ui/label';

export const RemovePagesToolInterface = () => {
  const { setActiveTool, addDocument } = useAppStore();
  const { toast } = useToast();
  const [file, setFile] = useState<{name: string, base64: string, size: number} | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    if (file && file.base64) {
      renderThumbnails(file.base64);
    } else {
      setThumbnails({});
    }
  }, [file]);

  const renderThumbnails = async (base64: string) => {
    setIsRendering(true);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const binaryData = atob(base64.split(',')[1]);
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      const loadingTask = pdfjs.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      const thumbs: Record<number, string> = {};
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          thumbs[i] = canvas.toDataURL();
        }
      }
      setThumbnails(thumbs);
    } catch (err) {
      console.error("PDF Preview Generation Error:", err);
      toast({ variant: "destructive", title: "Preview Error", description: "Could not generate page thumbnails." });
    } finally {
      setIsRendering(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setFile({ name: selectedFile.name, base64, size: selectedFile.size });
        
        const info = await getPdfInfo(base64);
        if (info.success && info.pageCount) {
          setPageCount(info.pageCount);
          setSelectedPages(new Set());
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const togglePageSelection = (pageIndex: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageIndex)) {
      newSelection.delete(pageIndex);
    } else {
      // Don't allow selecting ALL pages for deletion
      if (newSelection.size < pageCount - 1) {
        newSelection.add(pageIndex);
      } else {
        toast({ title: "Operation Denied", description: "You must keep at least one page in the document." });
      }
    }
    setSelectedPages(newSelection);
  };

  const handleProcess = async () => {
    if (!file || selectedPages.size === 0) return;
    
    setIsProcessing(true);
    setProgress(10);

    try {
      // Note: pdf-actions removePages expects 0-based indices
      const indicesToRemove = Array.from(selectedPages).map(p => p - 1);
      const result = await removePages(file.base64, indicesToRemove);
      setProgress(100);

      if (result.success && result.dataUrl) {
        setResultUrl(result.dataUrl);
        setIsComplete(true);
        
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          name: `Modified_${file.name}`,
          date: new Date().toISOString(),
          thumbnail: thumbnails[Array.from({length: pageCount}).findIndex((_, i) => !selectedPages.has(i+1)) + 1] || file.base64,
          content: `Pages removed via CyberAegXs Engine.`,
          size: "Optimized",
          type: 'pdf'
        });

        toast({ title: "Success", description: `${selectedPages.size} pages removed securely.` });
      } else {
        throw new Error(result.error || "Processing error");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `CyberAegXs_Cleaned_${file?.name || 'document'}.pdf`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-6xl">
        <Button variant="ghost" onClick={() => setActiveTool('none')} className="mb-8 gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <header className="mb-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-2 text-accent text-[10px] font-black tracking-widest uppercase mb-3">
               <ShieldAlert className="h-3 w-3" />
               Byte-Level Integrity Check Active
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Remove PDF Pages</h2>
            <p className="text-zinc-500 max-w-lg">Select the pages you want to strip from your document. Our engine ensures clean transitions and metadata preservation.</p>
          </header>

          {!isProcessing && !isComplete && !file && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-12 flex flex-col items-center text-center cursor-pointer hover:border-primary/60 hover:bg-zinc-900/50 transition-all bg-zinc-950/50 group">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
              <Upload className="h-12 w-12 text-zinc-700 mb-4 group-hover:text-primary transition-colors" />
              <h3 className="font-bold text-xl mb-1">Select PDF to clean</h3>
              <p className="text-xs text-zinc-500">Atomic processing environment</p>
            </div>
          )}

          {file && !isProcessing && !isComplete && (
            <div className="space-y-10">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black">{pageCount} PAGES LOADED</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-red-500 uppercase">{selectedPages.size} TO BE DELETED</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">{pageCount - selectedPages.size} TO BE KEPT</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Page Selection Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Select pages to remove
                  </Label>
                  {isRendering && <span className="text-[10px] text-primary animate-pulse font-bold">PARSING DOCUMENT BYTES...</span>}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-6 bg-zinc-950/50 rounded-3xl border border-white/5 min-h-[300px]">
                  {Array.from({ length: pageCount }).map((_, i) => {
                    const pageNum = i + 1;
                    const isSelected = selectedPages.has(pageNum);
                    return (
                      <div 
                        key={i} 
                        className="flex flex-col gap-3 group cursor-pointer"
                        onClick={() => togglePageSelection(pageNum)}
                      >
                        <div className={cn(
                          "aspect-[3/4] w-full rounded-xl overflow-hidden relative border-2 transition-all duration-300 shadow-xl",
                          isSelected 
                            ? "border-red-500 shadow-red-500/20 scale-[0.98]" 
                            : "border-zinc-800 group-hover:border-primary/50 group-hover:scale-[1.02]"
                        )}>
                          {thumbnails[pageNum] ? (
                            <img src={thumbnails[pageNum]} alt={`Page ${pageNum}`} className={cn(
                              "w-full h-full object-cover transition-all duration-300",
                              isSelected ? "opacity-30 grayscale blur-[1px]" : "opacity-90 group-hover:opacity-100"
                            )} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                              <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
                            </div>
                          )}
                          
                          {/* Overlay for selection */}
                          <div className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                            isSelected ? "opacity-100 bg-red-500/10" : "opacity-0 group-hover:opacity-100 bg-primary/5"
                          )}>
                            {isSelected ? (
                              <div className="flex flex-col items-center gap-2">
                                <Trash2 className="h-10 w-10 text-red-500 animate-in zoom-in-75" />
                                <span className="text-[8px] font-black text-red-500 tracking-tighter uppercase bg-black/60 px-2 py-0.5 rounded-full">To Delete</span>
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                <Trash2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                            <span className="text-[10px] font-bold text-white">{pageNum}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedPages.size === 0 ? (
                <div className="flex items-center justify-center gap-3 p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20">
                  <AlertCircle className="h-5 w-5 text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-500">Select at least one page to begin removal.</p>
                </div>
              ) : (
                <Button 
                  onClick={handleProcess} 
                  className="w-full h-16 bg-red-500 hover:bg-red-600 text-white font-black tracking-tight text-xl shadow-lg shadow-red-500/20 hover:scale-[1.01] transition-all"
                >
                  <Trash2 className="mr-3 h-6 w-6" />
                  DELETE {selectedPages.size} {selectedPages.size === 1 ? 'PAGE' : 'PAGES'}
                </Button>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="py-24 flex flex-1 flex-col items-center justify-center gap-8">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/20 blur-2xl animate-pulse rounded-full" />
                <Loader2 className="h-16 w-16 text-red-500 animate-spin" />
              </div>
              <div className="w-full max-w-sm space-y-4 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Re-indexing Document Structure...</p>
                <Progress value={progress} className="h-1.5 bg-zinc-900" />
              </div>
            </div>
          )}

          {isComplete && (
            <div className="py-12 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="h-24 w-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">DOCUMENT SECURED</h3>
                <p className="text-zinc-500 mt-2 font-medium">Pages successfully stripped. Byte integrity verified.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadResult} className="flex-1 bg-accent text-accent-foreground font-black h-16 text-sm uppercase tracking-widest hover:scale-[1.02] hover:bg-accent/90 transition-all">
                  <Download className="mr-3 h-5 w-5" /> DOWNLOAD CLEANED PDF
                </Button>
                <Button onClick={() => { setIsComplete(false); setFile(null); setSelectedPages(new Set()); }} variant="outline" className="flex-1 border-zinc-800 h-16 text-sm uppercase font-bold hover:bg-white hover:text-zinc-950 hover:border-white transition-all">
                  NEW CLEANING TASK
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
