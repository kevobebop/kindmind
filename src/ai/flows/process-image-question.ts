'use server';
/**
 * @fileOverview This file defines the Genkit flow for processing image-based homework questions.
 *
 * - processImageQuestion - The main function to process image questions and return AI-generated answers.
 * - ProcessImageQuestionInput - The input type for the processImageQuestion function.
 * - ProcessImageQuestionOutput - The output type for the processImageQuestion function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ProcessImageQuestionInputSchema = z.object({
  imageURL: z.string().describe('URL of the image containing the homework question.'),
  questionText: z.string().optional().describe('Optional text to further describe the question.'),
});
export type ProcessImageQuestionInput = z.infer<typeof ProcessImageQuestionInputSchema>;

const ProcessImageQuestionOutputSchema = z.object({
  answerText: z.string().optional().describe('AI-generated text answer to the question.'),
  answerImageURL: z.string().optional().describe('URL of the AI-generated image answer, if applicable.'),
});
export type ProcessImageQuestionOutput = z.infer<typeof ProcessImageQuestionOutputSchema>;

export async function processImageQuestion(input: ProcessImageQuestionInput): Promise<ProcessImageQuestionOutput> {
  return processImageQuestionFlow(input);
}

const processImageQuestionPrompt = ai.definePrompt({
  name: 'processImageQuestionPrompt',
  input: {
    schema: z.object({
      imageURL: z.string().describe('URL of the image containing the homework question.'),
      questionText: z.string().optional().describe('Optional text to further describe the question.'),
    }),
  },
  output: {
    schema: z.object({
      answerText: z.string().optional().describe('AI-generated text answer to the question.'),
      answerImageURL: z.string().optional().describe('URL of the AI-generated image answer, if applicable.'),
    }),
  },
  prompt: `You are an AI homework helper. A student will provide you with an image of a homework question, and optionally some additional text clarifying the question.  Your job is to provide an answer to the question.  The answer can be in text, or if the question requires it, you can generate an image as the answer, or you can provide both.

Question Image: {{media url=imageURL}}

{{#if questionText}}
Question Text: {{{questionText}}}
{{/if}}

If the question requires an image as an answer, provide a URL to the image in the answerImageURL field.  Otherwise, leave answerImageURL blank.

Regardless, always provide a text answer in the answerText field.  Even if the answer is primarily an image, provide a text explanation of the image.
`,
});

const processImageQuestionFlow = ai.defineFlow<
  typeof ProcessImageQuestionInputSchema,
  typeof ProcessImageQuestionOutputSchema
>({
  name: 'processImageQuestionFlow',
  inputSchema: ProcessImageQuestionInputSchema,
  outputSchema: ProcessImageQuestionOutputSchema,
},
async input => {
  const {output} = await processImageQuestionPrompt(input);
  return output!;
});
