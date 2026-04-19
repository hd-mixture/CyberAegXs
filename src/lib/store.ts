import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScannedDocument {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  content: string; 
  size: string;
  type: 'pdf' | 'doc' | 'img';
  summary?: string;
  extractedText?: string;
  securityStatus?: {
    isSafe: boolean;
    threats: string[];
    pii: string[];
  };
}

export type PDFTool = 
  | 'none' 
  | 'scan-to-pdf' 
  | 'security-scan'
  | 'merge' 
  | 'split' 
  | 'remove' 
  | 'extract' 
  | 'organize' 
  | 'compress' 
  | 'pdf-to-word' 
  | 'pdf-to-jpg' 
  | 'ppt-to-pdf';

export type SubscriptionPlan = 'free' | 'trial' | 'basic' | 'advanced' | 'premium';

interface AppState {
  scanCount: number;
  documents: ScannedDocument[];
  activeTool: PDFTool;
  subscriptionPlan: SubscriptionPlan;
  isSyncing: boolean;
  
  setSyncing: (status: boolean) => void;
  incrementScanCount: () => void;
  addDocument: (doc: ScannedDocument) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<ScannedDocument>) => void;
  setActiveTool: (tool: PDFTool) => void;
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;
  setScanCount: (count: number) => void;
  resetState: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      scanCount: 0,
      documents: [],
      activeTool: 'none',
      subscriptionPlan: 'free',
      isSyncing: false,

      setSyncing: (status) => set({ isSyncing: status }),
      incrementScanCount: () => set((state) => ({ scanCount: state.scanCount + 1 })),
      addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
      removeDocument: (id) => set((state) => ({ documents: state.documents.filter(d => d.id !== id) })),
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setSubscriptionPlan: (plan) => set({ subscriptionPlan: plan }),
      setScanCount: (count) => set({ scanCount: count }),
      resetState: () => set({ 
        subscriptionPlan: 'free', 
        scanCount: 0, 
        documents: [],
        activeTool: 'none'
      }),
    }),
    {
      name: 'cyber-aegxs-vault-storage',
      // CRITICAL: Removed subscriptionPlan and scanCount from partialization 
      // to prevent local storage persistence. Data must come from Firestore.
      partialize: (state) => ({ 
        documents: state.documents,
      }),
    }
  )
);
