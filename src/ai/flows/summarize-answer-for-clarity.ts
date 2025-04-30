// Summarize the answer for clarity, highlighting key points.
'use server';

/**
 * @fileOverview Summarizes an AI-generated answer for clarity.
 *
 * - summarizeAnswer - A function that summarizes the answer for clarity.
 * - SummarizeAnswerInput - The input type for the summarizeAnswer function.
 * - SummarizeAnswerOutput - The return type for the summarizeAnswer function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeAnswerInputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to summarize.'),
});
export type SummarizeAnswerInput = z.infer<typeof SummarizeAnswerInputSchema>;

const SummarizeAnswerOutputSchema = z.object({
  summary: z.string().describe('The summarized answer with key points highlighted.'),
});
export type SummarizeAnswerOutput = z.infer<typeof SummarizeAnswerOutputSchema>;

export async function summarizeAnswer(input: SummarizeAnswerInput): Promise<SummarizeAnswerOutput> {
  return summarizeAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAnswerPrompt',
  input: {
    schema: z.object({
      answer: z.string().describe('The AI-generated answer to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('The summarized answer with key points highlighted.'),
    }),
  },
  prompt: `Summarize the following answer for clarity, highlighting key points. The summary should be concise and easy to understand.\n\nAnswer: {{{answer}}}`,
});

const summarizeAnswerFlow = ai.defineFlow<
  typeof SummarizeAnswerInputSchema,
  typeof SummarizeAnswerOutputSchema
>({
  name: 'summarizeAnswerFlow',
  inputSchema: SummarizeAnswerInputSchema,
  outputSchema: SummarizeAnswerOutputSchema,
}, async (input: SummarizeAnswerInput) => {
  const {output} = await prompt(input);
  return output!;
});
