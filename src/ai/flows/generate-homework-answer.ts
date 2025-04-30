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
  // Explicitly set the model here to ensure it's used, overriding the default if necessary.
  // Use a model known to be available (e.g., flash, or the specific pro version like 'gemini-1.5-pro-latest').
  model: 'gemini-1.5-flash-latest', // Explicitly set model
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
  // Add explicit error handling around the prompt call
  try {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI did not return a valid output.');
    }
    return output;
  } catch (error: any) {
    console.error(`Error in generateHomeworkAnswerFlow for question "${input.question}":`, error);
     // Rethrow a more specific error or return a structured error response
    throw new Error(`Failed to generate homework answer. ${error.message || 'Unknown error'}`);
    // Alternatively, return a user-friendly error in the output schema if preferred:
    // return { answer: `Sorry, I encountered an error trying to answer that: ${error.message}` };
  }
});
