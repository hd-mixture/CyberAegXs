'use server';
/**
 * @fileOverview An AI agent that summarizes PDF content.
 *
 * - summarizePdfContent - A function that handles the PDF summarization process.
 * - SummarizePdfContentInput - The input type for the summarizePdfContent function.
 * - SummarizePdfContentOutput - The return type for the summarizePdfContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizePdfContentInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The content of a PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizePdfContentInput = z.infer<typeof SummarizePdfContentInputSchema>;

const SummarizePdfContentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the PDF document content.'),
});
export type SummarizePdfContentOutput = z.infer<typeof SummarizePdfContentOutputSchema>;

export async function summarizePdfContent(input: SummarizePdfContentInput): Promise<SummarizePdfContentOutput> {
  return summarizePdfContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePdfContentPrompt',
  input: { schema: SummarizePdfContentInputSchema },
  output: { schema: SummarizePdfContentOutputSchema },
  prompt: `You are an expert assistant specialized in summarizing PDF documents.

Generate a concise summary of the provided PDF content, highlighting the main points and key information.

PDF Content: {{media url=pdfDataUri}}`,
});

const summarizePdfContentFlow = ai.defineFlow(
  {
    name: 'summarizePdfContentFlow',
    inputSchema: SummarizePdfContentInputSchema,
    outputSchema: SummarizePdfContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate summary.');
    }
    return output;
  }
);
