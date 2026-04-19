"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Clock, 
  Share2, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  BrainCircuit,
  Lock,
  LockKeyhole,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore, ScannedDocument } from '@/lib/store';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { DocumentEditor } from '@/components/DocumentEditor';
import { RazorpayDemo } from '@/components/RazorpayDemo';

export const Dashboard = () => {
  const { documents, removeDocument, subscriptionPlan } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ScannedDocument | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isVaultLocked = subscriptionPlan === 'free';

  if (selectedDoc) {
    return <DocumentEditor doc={selectedDoc} onBack={() => setSelectedDoc(null)} />;
  }

  return (
    <div className="flex-1 h-full bg-background overflow-y-auto custom-scrollbar relative pb-10">
      {isVaultLocked && (
        <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 lg:p-8 text-center animate-in fade-in duration-500">
          <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 shadow-2xl">
            <LockKeyhole className="h-10 w-10 lg:h-12 lg:w-12 text-zinc-600" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tighter mb-4 uppercase">Vault Offline</h2>
          <p className="text-zinc-500 max-w-md mb-10 text-base lg:text-lg leading-relaxed">Your encrypted document storage is restricted to Pro members. Upgrade now to secure your scans.</p>
          <Button 
            onClick={() => setIsPayOpen(true)}
            className="h-14 lg:h-16 px-10 lg:px-12 bg-primary text-primary-foreground font-black tracking-widest uppercase text-[10px] lg:text-xs shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <Zap className="mr-2 h-4 w-4" /> Start Pro Trial
          </Button>
          <RazorpayDemo isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 lg:p-10 pt-16 lg:pt-10">
        <header className="mb-8 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-accent text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-2">
              <Lock className="h-3 w-3" />
              Vault Encrypted
            </div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">Your Documents</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search scans..." 
                className="pl-10 h-11 lg:h-10 bg-zinc-900 border-zinc-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-11 lg:h-10 border-zinc-800 bg-zinc-900 hidden sm:flex">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredDocs.map((doc) => (
              <div 
                key={doc.id}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full"
              >
                <div 
                  className="aspect-[16/9] lg:aspect-[4/3] relative bg-zinc-800 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <Image 
                    src={doc.thumbnail} 
                    alt={doc.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                      <ShieldCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-accent" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-primary/20 backdrop-blur-md px-2 py-1 rounded text-[8px] lg:text-[10px] font-bold text-primary border border-primary/30 uppercase tracking-widest">
                      {doc.type}
                    </div>
                  </div>
                </div>

                <div className="p-4 lg:p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-base lg:text-lg truncate flex-1 group-hover:text-primary transition-colors pr-2">
                      {doc.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem onClick={() => setSelectedDoc(doc)} className="gap-2">
                          <ExternalLink className="h-4 w-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Share2 className="h-4 w-4" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] lg:text-xs text-zinc-500 mt-auto">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(doc.date))} ago
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {doc.size}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                     <div className="flex items-center gap-1 text-[8px] lg:text-[10px] font-bold text-accent">
                        <BrainCircuit className="h-3 w-3" />
                        AI READY
                     </div>
                     <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] lg:text-xs hover:text-primary h-7"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      Quick Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center">
            <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 lg:h-12 lg:w-12 text-zinc-700" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-2">No documents found</h3>
            <p className="text-zinc-500 max-w-xs text-sm">Start scanning documents to see them here in your secure CyberAegXs vault.</p>
          </div>
        )}
      </div>
    </div>
  );
};