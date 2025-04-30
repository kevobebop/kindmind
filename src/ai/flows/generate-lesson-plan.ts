'use server';

/**
 * @fileOverview Generates tailored lesson plans based on student's needs.
 *
 * - generateLessonPlan - A function that generates a lesson plan.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateLessonPlanInputSchema = z.object({
  topic: z.string().describe('The topic for the lesson plan.'),
  studentLevel: z.string().describe('The student\'s current level of understanding.'),
  learningStyle: z.string().describe('The student\'s preferred learning style.'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan.'),
});
export type GenerateLessonPlanOutput = z.infer<typeof GenerateLessonPlanOutputSchema>;

export async function generateLessonPlan(input: GenerateLessonPlanInput): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonPlanPrompt',
  input: {
    schema: z.object({
      topic: z.string().describe('The topic for the lesson plan.'),
      studentLevel: z.string().describe('The student\'s current level of understanding.'),
      learningStyle: z.string().describe('The student\'s preferred learning style.'),
    }),
  },
  output: {
    schema: z.object({
      lessonPlan: z.string().describe('The generated lesson plan.'),
    }),
  },
  prompt: `You are an AI assistant specializing in creating tailored lesson plans for students.

  Based on the topic, student's level, and learning style, generate a comprehensive and engaging lesson plan.

  Topic: {{{topic}}}
  Student Level: {{{studentLevel}}}
  Learning Style: {{{learningStyle}}}
  `
});

const generateLessonPlanFlow = ai.defineFlow<
  typeof GenerateLessonPlanInputSchema,
  typeof GenerateLessonPlanOutputSchema
>({
  name: 'generateLessonPlanFlow',
  inputSchema: GenerateLessonPlanInputSchema,
  outputSchema: GenerateLessonPlanOutputSchema,
}, async (input: GenerateLessonPlanInput) => {
  const {output} = await prompt(input);
  return output!;
});
