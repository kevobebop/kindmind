'use server';

/**
 * @fileOverview Generates a progress report based on multiple sessions.
 *
 * - generateProgressReport - A function that generates a progress report.
 * - GenerateProgressReportInput - The input type for the generateProgressReport function.
 * - GenerateProgressReportOutput - The return type for the generateProgressReport function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateProgressReportInputSchema = z.object({
  sessions: z.array(z.object({
    topic: z.string().describe('The topic of the session.'),
    successLevel: z.number().describe('The success level of the session.'),
    notes: z.string().optional().describe('Any notes from the session.'),
  })).describe('An array of session details.'),
});
export type GenerateProgressReportInput = z.infer<typeof GenerateProgressReportInputSchema>;

const GenerateProgressReportOutputSchema = z.object({
  report: z.string().describe('The generated progress report.'),
});
export type GenerateProgressReportOutput = z.infer<typeof GenerateProgressReportOutputSchema>;

export async function generateProgressReport(input: GenerateProgressReportInput): Promise<GenerateProgressReportOutput> {
  return generateProgressReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProgressReportPrompt',
  input: {
    schema: z.object({
      sessions: z.array(z.object({
        topic: z.string().describe('The topic of the session.'),
        successLevel: z.number().describe('The success level of the session.'),
        notes: z.string().optional().describe('Any notes from the session.'),
      })).describe('An array of session details.'),
    }),
  },
  output: {
    schema: z.object({
      report: z.string().describe('The generated progress report.'),
    }),
  },
  prompt: `You are an AI tutor writing a progress report.

Here are the session notes:
{{sessions}}

Summarize improvement, challenges, and encouragement.

Keep it positive, supportive, and appropriate for neurodiverse learners.`,
});

const generateProgressReportFlow = ai.defineFlow<
  typeof GenerateProgressReportInputSchema,
  typeof GenerateProgressReportOutputSchema
>({
  name: 'generateProgressReportFlow',
  inputSchema: GenerateProgressReportInputSchema,
  outputSchema: GenerateProgressReportOutputSchema,
}, async (input: GenerateProgressReportInput) => {
  const {output} = await prompt(input);
  return output!;
});
