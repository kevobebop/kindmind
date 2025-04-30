'use server';

/**
 * @fileOverview Tracks a summary of the tutoring session.
 *
 * - trackSessionSummary - A function that tracks a summary of the tutoring session.
 * - TrackSessionSummaryInput - The input type for the trackSessionSummary function.
 * - TrackSessionSummaryOutput - The return type for the trackSessionSummary function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TrackSessionSummaryInputSchema = z.object({
  question: z.string().describe('The question asked during the session.'),
  answer: z.string().describe('The answer provided during the session.'),
  topic: z.string().describe('The topic of the session.'),
  date: z.string().describe('The date of the session.'),
});
export type TrackSessionSummaryInput = z.infer<typeof TrackSessionSummaryInputSchema>;

const TrackSessionSummaryOutputSchema = z.object({
  summary: z.string().describe('A short friendly recap of the session.'),
});
export type TrackSessionSummaryOutput = z.infer<typeof TrackSessionSummaryOutputSchema>;

export async function trackSessionSummary(input: TrackSessionSummaryInput): Promise<TrackSessionSummaryOutput> {
  return trackSessionSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trackSessionSummaryPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The question asked during the session.'),
      answer: z.string().describe('The answer provided during the session.'),
      topic: z.string().describe('The topic of the session.'),
      date: z.string().describe('The date of the session.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A short friendly recap of the session.'),
    }),
  },
  prompt: `Summarize today’s tutoring session for the student.

Use this info:
- Question: {{question}}
- Answer: {{answer}}
- Topic: {{topic}}

Output a short friendly recap.`,
});

const trackSessionSummaryFlow = ai.defineFlow<
  typeof TrackSessionSummaryInputSchema,
  typeof TrackSessionSummaryOutputSchema
>({
  name: 'trackSessionSummaryFlow',
  inputSchema: TrackSessionSummaryInputSchema,
  outputSchema: TrackSessionSummaryOutputSchema,
}, async (input: TrackSessionSummaryInput) => {
  const {output} = await prompt(input);
  return output!;
});
