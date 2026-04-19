
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
  RotateCcw,
  Trash2,
  Lock,
  GripVertical,
  ShieldCheck,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { organizePdf, getPdfInfo } from '@/app/actions/pdf-actions';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
}

const SortablePage = ({ 
  id, 
  page, 
  thumbnail, 
  onRotate, 
  onRemove 
}: { 
  id: string, 
  page: PageItem, 
  thumbnail: string, 
  onRotate: (id: string) => void, 
  onRemove: (id: string) => void 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative flex flex-col gap-2">
      <div className={cn(
        "aspect-[3/4] w-full rounded-xl overflow-hidden relative border-2 bg-zinc-900 shadow-xl transition-all duration-300",
        isDragging ? "border-primary scale-105" : "border-zinc-800 hover:border-primary/50"
      )}>
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={`Page ${page.originalIndex + 1}`} 
            style={{ transform: `rotate(${page.rotation}deg)` }}
            className="w-full h-full object-cover transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
          </div>
        )}

        <div 
          {...attributes} 
          {...listeners}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors"
        >
          <GripVertical className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
          <span className="text-[10px] font-bold text-white">{page.originalIndex + 1}</span>
        </div>

        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-7 w-7 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onRotate(id); }}
          >
            <RefreshCw className="h-3 w-3 text-white" />
          </Button>
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-7 w-7 bg-red-500/60 hover:bg-red-500/80 backdrop-blur-md border border-red-500/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          >
            <Trash2 className="h-3 w-3 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const OrganizeToolInterface = () => {
  const { setActiveTool, addDocument, incrementScanCount, scanCount, subscriptionPlan } = useAppStore();
  const { toast } = useToast();
  
  const [file, setFile] = useState<{name: string, base64: string, size: number} | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (file && file.base64) {
      renderThumbnails(file.base64);
    } else {
      setThumbnails({});
      setPages([]);
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
      
      const initialPages: PageItem[] = [];
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
          thumbs[i - 1] = canvas.toDataURL();
          initialPages.push({ id: `page-${i-1}`, originalIndex: i - 1, rotation: 0 });
        }
      }
      setThumbnails(thumbs);
      setPages(initialPages);
    } catch (err) {
      console.error("PDF Preview Error:", err);
      toast({ variant: "destructive", title: "Preview Error", description: "Failed to load document thumbnails." });
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
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const rotatePage = (id: string) => {
    setPages(items => items.map(item => 
      item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
    ));
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) {
      toast({ variant: "destructive", title: "Forbidden", description: "Document must have at least one page." });
      return;
    }
    setPages(items => items.filter(item => item.id !== id));
  };

  const handleProcess = async () => {
    if (!file || pages.length === 0) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      const config = pages.map(p => ({ originalIndex: p.originalIndex, rotation: p.rotation }));
      const result = await organizePdf(file.base64, config);
      setProgress(100);

      if (result.success && result.dataUrl) {
        setResultUrl(result.dataUrl);
        setIsComplete(true);
        incrementScanCount();
        
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          name: `Organized_${file.name}`,
          date: new Date().toISOString(),
          thumbnail: thumbnails[pages[0].originalIndex],
          content: "Reordered and rotated via CyberAegXs Organize Engine.",
          size: "Optimized",
          type: 'pdf'
        });

        toast({ title: "Document Organized", description: "Changes saved to the vault." });
      } else {
        throw new Error(result.error || "Organization failed");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `CyberAegXs_Organized_${file?.name || 'document'}.pdf`;
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
               <ShieldCheck className="h-3 w-3" />
               Structural Realignment Active
             </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Organize PDF</h2>
            <p className="text-zinc-500 max-w-lg">Drag pages to reorder, use controls to rotate, or strip pages entirely. Our engine handles the structural heavy lifting.</p>
            {subscriptionPlan === 'free' && (
              <div className="mt-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                {2 - scanCount} Free Credits Remaining
              </div>
            )}
            {subscriptionPlan === 'trial' && (
              <div className="mt-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                {5 - scanCount} Trial Credits Remaining
              </div>
            )}
          </header>

          {!isProcessing && !isComplete && !file && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-12 flex flex-col items-center text-center cursor-pointer hover:border-primary/60 hover:bg-zinc-900/50 transition-all bg-zinc-950/50 group">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf" />
              <Upload className="h-12 w-12 text-zinc-700 mb-4 group-hover:text-primary transition-colors" />
              <h3 className="font-bold text-xl mb-1">Select PDF to organize</h3>
              <p className="text-xs text-zinc-500">Atomic processing environment</p>
            </div>
          )}

          {file && !isProcessing && !isComplete && (
            <div className="space-y-10">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black">{pages.length} PAGES IN SEQUENCE</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isRendering && <span className="text-[10px] text-primary animate-pulse font-bold">LOADING ASSETS...</span>}
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={pages.map(p => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-6 bg-zinc-950/50 rounded-3xl border border-white/5 min-h-[300px]">
                    {pages.map((page) => (
                      <SortablePage 
                        key={page.id} 
                        id={page.id} 
                        page={page} 
                        thumbnail={thumbnails[page.originalIndex]}
                        onRotate={rotatePage}
                        onRemove={removePage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center justify-center gap-4 p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20">
                <GripVertical className="h-5 w-5 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-500 italic">Tip: Drag and drop pages to reorder them in the final document.</p>
              </div>

              <Button 
                onClick={handleProcess} 
                className="w-full h-16 bg-primary text-primary-foreground font-black tracking-tight text-xl shadow-lg shadow-primary/20 hover:scale-[1.01] hover:bg-primary/90 transition-all"
              >
                <Save className="mr-3 h-6 w-6" />
                SAVE ORGANIZED PDF
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="py-24 flex flex-1 flex-col items-center justify-center gap-8 h-full min-h-[300px]">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <div className="w-full max-w-sm space-y-4 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Re-mapping Document Bytes...</p>
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
                <h3 className="text-3xl font-black uppercase tracking-tighter">RE-ORGANIZED</h3>
                <p className="text-zinc-500 mt-2 font-medium">Page order and orientation saved to your secure vault.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button onClick={downloadResult} className="flex-1 bg-accent text-accent-foreground font-black h-16 text-sm uppercase tracking-widest hover:scale-[1.02] hover:bg-accent/90 transition-all">
                  <Download className="mr-3 h-5 w-5" /> DOWNLOAD ORGANIZED PDF
                </Button>
                <Button onClick={() => { setIsComplete(false); setFile(null); }} variant="outline" className="flex-1 border-zinc-800 h-16 text-sm uppercase font-bold hover:bg-white hover:text-zinc-950 hover:border-white transition-all">
                  START NEW TASK
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
