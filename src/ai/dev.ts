import { config } from 'dotenv';
config();

import '@/ai/flows/chat-with-pdf-document.ts';
import '@/ai/flows/suggest-smart-file-name-flow.ts';
import '@/ai/flows/summarize-pdf-content-flow.ts';
import '@/ai/flows/extract-editable-text-from-pdf.ts';
import '@/ai/flows/security-audit-flow.ts';
