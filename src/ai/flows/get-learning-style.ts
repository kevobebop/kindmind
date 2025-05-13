'use server';

/**
 * @fileOverview Helps the student choose their preferred learning style.
 *
 * - getLearningStyle - A function that helps the student choose their preferred learning style.
 * - GetLearningStyleInput - The input type for the getLearningStyle function.
 * - GetLearningStyleOutput - The return type for the getLearningStyle function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GetLearningStyleInputSchema = z.object({
  options: z.array(z.string()).describe('An array of learning style options.'),
});
export type GetLearningStyleInput = z.infer<typeof GetLearningStyleInputSchema>;

const GetLearningStyleOutputSchema = z.object({
  selectedStyle: z.string().describe('The selected learning style.'),
});
export type GetLearningStyleOutput = z.infer<typeof GetLearningStyleOutputSchema>;

export async function getLearningStyle(input: GetLearningStyleInput): Promise<GetLearningStyleOutput> {
  return getLearningStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getLearningStylePrompt',
  input: {
    schema: z.object({
      options: z.array(z.string()).describe('An array of learning style options.'),
    }),
  },
  output: {
    schema: z.object({
      selectedStyle: z.string().describe('The selected learning style.'),
    }),
  },
  prompt: `You're an AI tutor. Help the student choose how they like to learn.

Ask: "How do you like to learn best?"

Offer these choices:
{{#each options}}
- "{{this}}"
{{/each}}
`,
});

const getLearningStyleFlow = ai.defineFlow<
  typeof GetLearningStyleInputSchema,
  typeof GetLearningStyleOutputSchema
>({
  name: 'getLearningStyleFlow',
  inputSchema: GetLearningStyleInputSchema,
  outputSchema: GetLearningStyleOutputSchema,
}, async (input: GetLearningStyleInput) => {
  const {output} = await prompt(input);
  return output!;
});
