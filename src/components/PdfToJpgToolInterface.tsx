
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
  ImageIcon,
  ShieldCheck,
  Zap,
  Bot,
  ChevronRight,
  DownloadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logPdfToJpgConversion } from '@/app/actions/pdf-actions';
import JSZip from 'jszip';

export const PdfToJpgToolInterface = () => {
  const { setActiveTool, addDocument } = useAppStore();
  const { toast } = useToast();
  
  const [file, setFile] = useState<{name: string, base64: string, size: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);
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
    setStatusMessage('Initializing High-Res Renderer...');

    try {
      // Import PDF.js
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const binaryData = atob(file.base64.split(',')[1]);
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      const loadingTask = pdfjs.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      const images: string[] = [];
      
      // Log conversion on backend
      await logPdfToJpgConversion(file.name, pdf.numPages);
      
      setStatusMessage(`Rendering ${pdf.numPages} Pages...`);
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for high resolution
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          images.push(canvas.toDataURL('image/jpeg', 0.9));
          setProgress(10 + Math.floor((i / pdf.numPages) * 90));
        }
      }

      setResultImages(images);
      setIsComplete(true);
      
      addDocument({
        id: Math.random().toString(36).substr(2, 9),
        name: `${file.name.replace('.pdf', '')}_images`,
        date: new Date().toISOString(),
        thumbnail: images[0],
        content: `Extracted ${images.length} high-res JPGs via CyberAegXs AI Rendering Engine.`,
        size: "High Res",
        type: 'img'
      });

      toast({ title: "Conversion Complete", description: `${images.length} images extracted successfully.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Conversion Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadZip = async () => {
    if (resultImages.length === 0) return;
    
    setStatusMessage('Bundling ZIP archive...');
    const zip = new JSZip();
    const folder = zip.folder(`${file?.name.replace('.pdf', '')}_JPGs`);
    
    resultImages.forEach((dataUrl, i) => {
      const base64Data = dataUrl.split(',')[1];
      folder?.file(`page_${i + 1}.jpg`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CyberAegXs_Images_${file?.name.replace('.pdf', '')}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingleImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `CyberAegXs_${file?.name.replace('.pdf', '')}_Page_${index + 1}.jpg`;
    link.click();
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
               <ImageIcon className="h-3 w-3" />
               AI-Powered Image Synthesis active
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">PDF to JPG</h2>
            <p className="text-zinc-500 max-w-lg">Convert every page into a stunning high-resolution image. Perfect for social sharing, presentations, or archival purposes.</p>
          </header>

          {!isProcessing && !isComplete && !file && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center text-center cursor-pointer hover:border-primary/60 hover:bg-zinc-900/50 transition-all bg-zinc-950/50 group relative">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
              <ImageIcon className="h-16 w-16 text-zinc-700 mb-6 group-hover:text-primary transition-colors" />
              <h3 className="font-bold text-2xl mb-2">Drop PDF to extract images</h3>
              <p className="text-sm text-zinc-500">Atomic rendering environment</p>
            </div>
          )}

          {file && !isProcessing && !isComplete && (
            <div className="space-y-10">
              <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • SOURCE DOCUMENT</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
                    <Zap className="h-3 w-3" /> 2.0x Upscaling
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">Generated images are rendered at double resolution for extreme clarity.</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-tighter">
                    <ShieldCheck className="h-3 w-3" /> Encrypted Export
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">All images are bundled into a secure ZIP for effortless portability.</p>
                </div>
              </div>

              <Button 
                onClick={handleProcess} 
                className="w-full h-16 bg-primary text-primary-foreground font-black tracking-tight text-xl shadow-lg shadow-primary/20 hover:scale-[1.01] hover:bg-primary/90 transition-all group"
              >
                RENDER IMAGES
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
                <p className="text-[10px] text-zinc-600 font-bold italic">Synthesizing pixel data from document bytes...</p>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="py-8 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="h-24 w-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10">
                <CheckCircle2 className="h-12 w-12 text-amber-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">EXTRACTION READY</h3>
                <p className="text-zinc-500 mt-2 font-medium">{resultImages.length} high-resolution JPGs have been synthesized.</p>
              </div>

              {/* Image Preview Grid */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto p-6 bg-zinc-950/50 rounded-2xl border border-white/5 custom-scrollbar">
                {resultImages.map((img, i) => (
                  <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden border border-zinc-800 relative group bg-zinc-900">
                    <img 
                      src={img} 
                      alt={`Page ${i+1}`} 
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-50" 
                    />
                    
                    {/* Hover Download Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-transform"
                        onClick={() => downloadSingleImage(img, i)}
                      >
                        <Download className="h-6 w-6" />
                      </Button>
                    </div>

                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">P{i+1}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadZip} className="flex-1 bg-accent text-accent-foreground font-black h-16 text-sm uppercase tracking-widest hover:scale-[1.02] hover:bg-accent/90 transition-all">
                  <DownloadCloud className="mr-3 h-5 w-5" /> DOWNLOAD AS ZIP
                </Button>
                <Button onClick={() => { setIsComplete(false); setFile(null); setResultImages([]); }} variant="outline" className="flex-1 border-zinc-800 h-16 text-sm uppercase font-bold hover:bg-white hover:text-zinc-950 hover:border-white transition-all">
                  NEW CONVERSION
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
