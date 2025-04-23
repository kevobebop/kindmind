'use server';

/**
 * @fileOverview Generates a mini-quiz based on a given topic.
 *
 * - generateMiniQuiz - A function that generates a mini-quiz.
 * - GenerateMiniQuizInput - The input type for the generateMiniQuiz function.
 * - GenerateMiniQuizOutput - The return type for the generateMiniQuiz function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateMiniQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the quiz.'),
});
export type GenerateMiniQuizInput = z.infer<typeof GenerateMiniQuizInputSchema>;

const GenerateMiniQuizOutputSchema = z.object({
  quiz: z.array(z.string()).describe('An array of quiz questions and answers.'),
});
export type GenerateMiniQuizOutput = z.infer<typeof GenerateMiniQuizOutputSchema>;

export async function generateMiniQuiz(input: GenerateMiniQuizInput): Promise<GenerateMiniQuizOutput> {
  return generateMiniQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMiniQuizPrompt',
  model: 'gemini-1.5-pro',
  input: {
    schema: z.object({
      topic: z.string().describe('The topic for the quiz.'),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the quiz.'),
    }),
  },
  output: {
    schema: z.object({
      quiz: z.array(z.string()).describe('An array of quiz questions and answers.'),
    }),
  },
  prompt: `Create a short quiz on this topic: {{topic}}

The quiz should have three questions.
Keep the language simple and friendly.

Difficulty: {{difficulty}}

Output as a numbered list, like this:
1. Question 1?
Answer:
2. Question 2?
Answer:
3. Question 3?
Answer:
`,
});

const generateMiniQuizFlow = ai.defineFlow<
  typeof GenerateMiniQuizInputSchema,
  typeof GenerateMiniQuizOutputSchema
>({
  name: 'generateMiniQuizFlow',
  inputSchema: GenerateMiniQuizInputSchema,
  outputSchema: GenerateMiniQuizOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
