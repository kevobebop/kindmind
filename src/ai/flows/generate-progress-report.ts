'use server';

/**
 * @fileOverview Generates student progress reports based on their learning history.
 *
 * - generateProgressReport - A function that generates a progress report.
 * - GenerateProgressReportInput - The input type for the generateProgressReport function.
 * - GenerateProgressReportOutput - The return type for the generateProgressReport function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateProgressReportInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  learningHistory: z.string().describe('The student\'s learning history data.'),
});
export type GenerateProgressReportInput = z.infer<typeof GenerateProgressReportInputSchema>;

const GenerateProgressReportOutputSchema = z.object({
  progressReport: z.string().describe('The generated progress report.'),
});
export type GenerateProgressReportOutput = z.infer<typeof GenerateProgressReportOutputSchema>;

export async function generateProgressReport(input: GenerateProgressReportInput): Promise<GenerateProgressReportOutput> {
  return generateProgressReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProgressReportPrompt',
  input: {
    schema: z.object({
      studentId: z.string().describe('The ID of the student.'),
      learningHistory: z.string().describe('The student\'s learning history data.'),
    }),
  },
  output: {
    schema: z.object({
      progressReport: z.string().describe('The generated progress report.'),
    }),
  },
  prompt: `You are an AI assistant specializing in generating student progress reports.

  Based on the student's learning history, generate a comprehensive and informative progress report.

  Student ID: {{{studentId}}}
  Learning History: {{{learningHistory}}}
  `
});

const generateProgressReportFlow = ai.defineFlow<
  typeof GenerateProgressReportInputSchema,
  typeof GenerateProgressReportOutputSchema
>({
  name: 'generateProgressReportFlow',
  inputSchema: GenerateProgressReportInputSchema,
  outputSchema: GenerateProgressReportOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
