
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
  Scissors,
  Plus,
  Trash2,
  Lock,
  FileBox,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { splitPdf, getPdfInfo } from '@/app/actions/pdf-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SplitToolInterface = () => {
  const { setActiveTool, addDocument } = useAppStore();
  const { toast } = useToast();
  const [file, setFile] = useState<{name: string, base64: string, size: number} | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'range' | 'every'>('range');
  const [ranges, setRanges] = useState<{start: number, end: number}[]>([{ start: 1, end: 1 }]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<string[]>([]);
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
      // Import the core PDF.js build
      const pdfjs = await import('pdfjs-dist');
      
      // Set the worker source from a reliable CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const binaryData = atob(base64.split(',')[1]);
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      const loadingTask = pdfjs.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      const thumbs: Record<number, string> = {};
      
      // Render all pages for preview
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
          setRanges([{ start: 1, end: Math.min(1, info.pageCount) }]);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const addRange = () => {
    setRanges(prev => [...prev, { start: 1, end: Math.min(1, pageCount) }]);
  };

  const removeRange = (index: number) => {
    setRanges(prev => prev.filter((_, i) => i !== index));
  };

  const updateRange = (index: number, field: 'start' | 'end', value: string) => {
    const num = parseInt(value) || 0;
    setRanges(prev => prev.map((r, i) => 
      i === index ? { ...r, [field]: Math.min(Math.max(1, num), pageCount) } : r
    ));
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(10);

    try {
      let finalRanges = ranges;
      if (splitMode === 'every') {
        finalRanges = Array.from({ length: pageCount }, (_, i) => ({ start: i + 1, end: i + 1 }));
      }

      const result = await splitPdf(file.base64, finalRanges);
      setProgress(100);

      if (result.success && result.dataUrls) {
        setResults(result.dataUrls);
        setIsComplete(true);
        
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          name: `Split_Result_${file.name}`,
          date: new Date().toISOString(),
          thumbnail: thumbnails[1] || file.base64,
          content: "Extracted via Split Engine",
          size: "Optimized",
          type: 'pdf'
        });

        toast({ title: "Split Successful", description: `Created ${result.dataUrls.length} separate PDF files.` });
      } else {
        throw new Error(result.error || "Processing error");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Split Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = () => {
    results.forEach((url, i) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `CyberAegXs_Split_${i + 1}.pdf`;
      link.click();
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-5xl">
        <Button variant="ghost" onClick={() => setActiveTool('none')} className="mb-8 gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <header className="mb-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-2 text-accent text-[10px] font-black tracking-widest uppercase mb-3">
               <Lock className="h-3 w-3" />
               PDF Precision Extraction
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Split PDF</h2>
          </header>

          {!isProcessing && !isComplete && !file && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-12 flex flex-col items-center text-center cursor-pointer hover:border-primary/60 hover:bg-zinc-900/50 transition-all bg-zinc-950/50 group">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
              <Upload className="h-12 w-12 text-zinc-700 mb-4 group-hover:text-primary transition-colors" />
              <h3 className="font-bold text-xl mb-1">Select PDF to split</h3>
              <p className="text-xs text-zinc-500">Encrypted byte-stream upload active</p>
            </div>
          )}

          {file && !isProcessing && !isComplete && (
            <div className="space-y-10">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black">{pageCount} PAGES DETECTED</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Page Inspector Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Document Overview
                  </Label>
                  {isRendering && <span className="text-[10px] text-primary animate-pulse font-bold">GENERATING PREVIEWS...</span>}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-white/5 max-h-64 overflow-y-auto custom-scrollbar">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5 items-center">
                      <div className="aspect-[3/4] w-full bg-zinc-900 rounded border border-zinc-800 overflow-hidden relative group">
                        {thumbnails[i + 1] ? (
                          <img src={thumbnails[i + 1]} alt={`Page ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-3 w-3 animate-spin text-zinc-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors pointer-events-none" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600">P{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSplitMode('range')}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all text-left",
                    splitMode === 'range' ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(127,191,242,0.1)]" : "border-zinc-800 hover:border-zinc-600 bg-zinc-950/30 hover:bg-zinc-900/50"
                  )}
                >
                  <Scissors className={cn("h-6 w-6 mb-3", splitMode === 'range' ? "text-primary" : "text-zinc-600")} />
                  <h4 className="font-bold text-sm">Split by Range</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Extract specific page sequences.</p>
                </button>
                <button 
                  onClick={() => setSplitMode('every')}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all text-left",
                    splitMode === 'every' ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(127,191,242,0.1)]" : "border-zinc-800 hover:border-zinc-600 bg-zinc-950/30 hover:bg-zinc-900/50"
                  )}
                >
                  <FileBox className={cn("h-6 w-6 mb-3", splitMode === 'every' ? "text-primary" : "text-zinc-600")} />
                  <h4 className="font-bold text-sm">Every Page</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Every page becomes its own PDF.</p>
                </button>
              </div>

              {splitMode === 'range' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Extraction Ranges</Label>
                    <Button variant="outline" size="sm" onClick={addRange} className="h-8 text-xs gap-1 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600 transition-colors">
                      <Plus className="h-3 w-3" /> Add New Range
                    </Button>
                  </div>
                  
                  <div className="space-y-8 p-2">
                    {ranges.map((range, index) => (
                      <div key={index} className="flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-bold text-zinc-400">Range {index + 1}</span>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeRange(index)}
                            className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            disabled={ranges.length === 1}
                           >
                            <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>

                        {/* Visual Range Display */}
                        <div className="relative border-2 border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/30 flex items-center justify-center gap-12">
                          {/* Start Page Thumbnail */}
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-28 aspect-[3/4] bg-zinc-900 rounded-lg shadow-2xl relative overflow-hidden flex items-center justify-center border border-white/5">
                              {thumbnails[range.start] ? (
                                <img src={thumbnails[range.start]} alt="Start Page" className="w-full h-full object-cover" />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-700" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                            <span className="text-xs font-bold text-zinc-500">Page {range.start}</span>
                          </div>

                          {/* Connector */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                              <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse [animation-delay:200ms]" />
                              <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse [animation-delay:400ms]" />
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-zinc-700 uppercase">Extracting</span>
                          </div>

                          {/* End Page Thumbnail */}
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-28 aspect-[3/4] bg-zinc-900 rounded-lg shadow-2xl relative overflow-hidden flex items-center justify-center border border-white/5">
                              {thumbnails[range.end] ? (
                                <img src={thumbnails[range.end]} alt="End Page" className="w-full h-full object-cover" />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-700" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                            <span className="text-xs font-bold text-zinc-500">Page {range.end}</span>
                          </div>
                        </div>

                        {/* Numerical Inputs */}
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                           <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">From Page</Label>
                            <Input 
                              type="number" 
                              value={range.start} 
                              onChange={(e) => updateRange(index, 'start', e.target.value)}
                              className="bg-zinc-900 border-zinc-800 h-10 text-center font-bold focus:border-primary transition-colors"
                            />
                           </div>
                           <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">To Page</Label>
                            <Input 
                              type="number" 
                              value={range.end} 
                              onChange={(e) => updateRange(index, 'end', e.target.value)}
                              className="bg-zinc-900 border-zinc-800 h-10 text-center font-bold focus:border-primary transition-colors"
                            />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleProcess} className="w-full h-14 bg-primary text-primary-foreground font-black tracking-tight text-lg mt-6 shadow-lg shadow-primary/20 hover:scale-[1.01] hover:bg-primary/90 transition-all">
                INITIATE EXTRACTION
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="py-24 flex flex-1 flex-col items-center justify-center gap-8">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <div className="w-full max-w-sm space-y-4 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Byte-Stream Partitioning...</p>
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
                <h3 className="text-3xl font-black uppercase tracking-tighter">SUCCESSFUL EXTRACTION</h3>
                <p className="text-zinc-500 mt-2 font-medium">{results.length} unique PDF segments generated and encrypted.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadAll} className="flex-1 bg-accent text-accent-foreground font-black h-16 text-sm uppercase tracking-widest hover:scale-[1.02] hover:bg-accent/90 transition-all">
                  <Download className="mr-3 h-5 w-5" /> DOWNLOAD ALL
                </Button>
                <Button onClick={() => { setIsComplete(false); setFile(null); setResults([]); }} variant="outline" className="flex-1 border-zinc-800 h-16 text-sm uppercase font-bold hover:bg-white hover:text-zinc-950 hover:border-white transition-all">
                  START NEW SESSION
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
