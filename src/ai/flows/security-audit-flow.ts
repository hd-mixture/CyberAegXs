'use server';
/**
 * @fileOverview A high-fidelity Genkit flow for performing multi-vector security audits on document content.
 *
 * - securityAudit - Deep analysis function for threats and PII.
 * - SecurityAuditInput - The input type containing document text and context.
 * - SecurityAuditOutput - Detailed report including risk scores and categorization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SecurityAuditInputSchema = z.object({
  documentText: z.string().describe('The extracted text from the PDF or image.'),
  fileName: z.string().optional().describe('Name of the file for context.'),
});
export type SecurityAuditInput = z.infer<typeof SecurityAuditInputSchema>;

const SecurityAuditOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the document is considered safe.'),
  riskScore: z.number().min(0).max(100).describe('Overall risk score (0-100).'),
  status: z.enum(['safe', 'warning', 'dangerous']).describe('Simplified safety status.'),
  threats: z.array(z.object({
    category: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high'])
  })).describe('List of potential security threats.'),
  links: z.array(z.object({
    url: z.string(),
    status: z.enum(['clean', 'suspicious', 'malicious']),
    reason: z.string().optional()
  })).describe('Analysis of extracted URLs.'),
  piiDetected: z.array(z.object({
    type: z.string().describe('e.g., Aadhaar, PAN, Email, Phone'),
    value: z.string().describe('The masked or full sensitive value'),
    count: z.number()
  })).describe('List of detected sensitive information.'),
  summary: z.string().describe('AI summary of the security posture.'),
});
export type SecurityAuditOutput = z.infer<typeof SecurityAuditOutputSchema>;

export async function securityAudit(input: SecurityAuditInput): Promise<SecurityAuditOutput> {
  return securityAuditFlow(input);
}

const auditPrompt = ai.definePrompt({
  name: 'securityAuditPrompt',
  input: { schema: SecurityAuditInputSchema },
  output: { schema: SecurityAuditOutputSchema },
  prompt: `You are a Tier-3 Cybersecurity Analyst specializing in Data Loss Prevention (DLP) and Document Forensics.

Analyze the following document content extracted from "{{fileName}}":

CONTENT:
"""{{{documentText}}}"""

Your tasks:
1. IDENTIFY PII: Look for Aadhaar (12 digits), PAN (5 letters, 4 digits, 1 letter), Emails, and Phone Numbers.
2. ANALYZE LINKS: Evaluate any URLs found for suspicious patterns or phishing likelihood.
3. DETECT THREATS: Search for mentions of credentials, keys, or suspicious procedural instructions.
4. CALCULATE RISK: 0 is perfectly safe, 100 is highly malicious or contains massive data leaks.

Provide a structured, professional security report.`,
});

const securityAuditFlow = ai.defineFlow(
  {
    name: 'securityAuditFlow',
    inputSchema: SecurityAuditInputSchema,
    outputSchema: SecurityAuditOutputSchema,
  },
  async (input) => {
    const { output } = await auditPrompt(input);
    if (!output) throw new Error('Security analysis failed.');
    return output;
  }
);
