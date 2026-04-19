'use server';
/**
 * @fileOverview A Genkit flow for suggesting intelligent file names for PDF documents.
 *
 * - suggestSmartFileName - A function that suggests a smart file name for a PDF.
 * - SuggestSmartFileNameInput - The input type for the suggestSmartFileName function.
 * - SuggestSmartFileNameOutput - The return type for the suggestSmartFileName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSmartFileNameInputSchema = z.object({
  documentText: z
    .string()
    .describe(
      'The extracted text content from the PDF document for which a smart file name is to be suggested.'
    ),
  context: z
    .string()
    .optional()
    .describe(
      'Optional context or metadata about the document (e.g., sender, date, type) to help in naming.'
    ),
});
export type SuggestSmartFileNameInput = z.infer<
  typeof SuggestSmartFileNameInputSchema
>;

const SuggestSmartFileNameOutputSchema = z.object({
  suggestedFileName: z
    .string()
    .describe('The suggested intelligent file name for the PDF document.'),
});
export type SuggestSmartFileNameOutput = z.infer<
  typeof SuggestSmartFileNameOutputSchema
>;

export async function suggestSmartFileName(
  input: SuggestSmartFileNameInput
): Promise<SuggestSmartFileNameOutput> {
  return suggestSmartFileNameFlow(input);
}

const suggestFileNamePrompt = ai.definePrompt({
  name: 'suggestFileNamePrompt',
  input: { schema: SuggestSmartFileNameInputSchema },
  output: { schema: SuggestSmartFileNameOutputSchema },
  prompt: `You are an AI assistant specialized in organizing documents and suggesting concise, descriptive file names.

Based on the following document text and optional context, generate a single, intelligent, and user-friendly file name for a PDF document.
The file name should be descriptive enough to understand the document's content at a glance, and should be suitable for a computer file system (e.g., avoiding special characters that are problematic in file names).

If a 'context' is provided, prioritize it to infer the best file name.

Document Text:
"""{{{documentText}}}"""

{{#if context}}
Context: """{{{context}}}"""
{{/if}}

Provide only the suggested file name in your output, without any additional text or explanations.
`,
});

const suggestSmartFileNameFlow = ai.defineFlow(
  {
    name: 'suggestSmartFileNameFlow',
    inputSchema: SuggestSmartFileNameInputSchema,
    outputSchema: SuggestSmartFileNameOutputSchema,
  },
  async (input) => {
    const { output } = await suggestFileNamePrompt(input);
    return output!;
  }
);
