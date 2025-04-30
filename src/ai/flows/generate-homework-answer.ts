'use server';
/**
 * @fileOverview Provides AI-generated answers to homework questions.
 *
 * - generateHomeworkAnswer - A function that takes a homework question and returns an AI-generated answer.
 * - GenerateHomeworkAnswerInput - The input type for the generateHomeworkAnswer function.
 * - GenerateHomeworkAnswerOutput - The return type for the generateHomeworkAnswer function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateHomeworkAnswerInputSchema = z.object({
  question: z.string().describe('The homework question to be answered.'),
  imageURL: z.string().optional().describe('Optional image URL related to the homework question.')
});
export type GenerateHomeworkAnswerInput = z.infer<typeof GenerateHomeworkAnswerInputSchema>;

const GenerateHomeworkAnswerOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the homework question.'),
});
export type GenerateHomeworkAnswerOutput = z.infer<typeof GenerateHomeworkAnswerOutputSchema>;

export async function generateHomeworkAnswer(input: GenerateHomeworkAnswerInput): Promise<GenerateHomeworkAnswerOutput> {
  return generateHomeworkAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHomeworkAnswerPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The homework question to be answered.'),
      imageURL: z.string().optional().describe('Optional image URL related to the homework question.')
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The AI-generated answer to the homework question.'),
    }),
  },
  prompt: `You are an AI assistant helping students with their homework.

  Provide a helpful and informative answer to the following question. Include relevant facts and information to help the student understand the topic better.

  Question: {{{question}}}
  {{#if imageURL}}
  Image: {{media url=imageURL}}
  {{/if}}
  `
});

const generateHomeworkAnswerFlow = ai.defineFlow<
  typeof GenerateHomeworkAnswerInputSchema,
  typeof GenerateHomeworkAnswerOutputSchema
>({
  name: 'generateHomeworkAnswerFlow',
  inputSchema: GenerateHomeworkAnswerInputSchema,
  outputSchema: GenerateHomeworkAnswerOutputSchema,
}, async (input: GenerateHomeworkAnswerInput) => {
  const {output} = await prompt(input);
  return output!;
});
