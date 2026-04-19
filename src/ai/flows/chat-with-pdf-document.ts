'use server';
/**
 * @fileOverview A Genkit flow for answering questions based on PDF document content.
 *
 * - chatWithPdfDocument - A function that handles the Q&A process for a PDF.
 * - ChatWithPdfDocumentInput - The input type for the chatWithPdfDocument function.
 * - ChatWithPdfDocumentOutput - The return type for the chatWithPdfDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithPdfDocumentInputSchema = z.object({
  pdfContent: z
    .string()
    .describe('The extracted text content of the PDF document.'),
  question: z.string().describe('The question asked about the PDF content.'),
});
export type ChatWithPdfDocumentInput = z.infer<
  typeof ChatWithPdfDocumentInputSchema
>;

const ChatWithPdfDocumentOutputSchema = z.object({
  answer: z
    .string()
    .describe('The answer to the question based on the PDF content.'),
});
export type ChatWithPdfDocumentOutput = z.infer<
  typeof ChatWithPdfDocumentOutputSchema
>;

export async function chatWithPdfDocument(
  input: ChatWithPdfDocumentInput
): Promise<ChatWithPdfDocumentOutput> {
  return chatWithPdfDocumentFlow(input);
}

const chatWithPdfDocumentPrompt = ai.definePrompt({
  name: 'chatWithPdfDocumentPrompt',
  input: {schema: ChatWithPdfDocumentInputSchema},
  output: {schema: ChatWithPdfDocumentOutputSchema},
  prompt: `You are an AI assistant specialized in extracting information from PDF documents.

Given the content of a PDF document and a user's question, provide a concise and relevant answer based ONLY on the provided document content.
If the answer cannot be found in the document, state that the information is not available in the document.

PDF Document Content:
{{pdfContent}}

User Question: {{{question}}}`,
});

const chatWithPdfDocumentFlow = ai.defineFlow(
  {
    name: 'chatWithPdfDocumentFlow',
    inputSchema: ChatWithPdfDocumentInputSchema,
    outputSchema: ChatWithPdfDocumentOutputSchema,
  },
  async input => {
    const {output} = await chatWithPdfDocumentPrompt(input);
    return output!;
  }
);
