'use server';

/**
 * @fileOverview Provides AI-generated support tailored for students with Autism Spectrum Disorder (ASD).
 *
 * - asdTutor - A function that takes a question, topic, and optional notes and returns an AI-generated answer tailored for students with ASD.
 * - AsdTutorInput - The input type for the asdTutor function.
 * - AsdTutorOutput - The return type for the asdTutor function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AsdTutorInputSchema = z.object({
  question: z.string().describe('The specific question the student has.'),
  topic: z.string().describe('The topic or subject area of the question.'),
  currentGrades: z.string().optional().describe('The student\'s current grades.'),
  strengths: z.string().optional().describe('The student\'s strengths.'),
  struggles: z.string().optional().describe('The student\'s struggles.'),
  additionalNotes: z.string().optional().describe('Any additional notes or context about the student or their needs.')
});
export type AsdTutorInput = z.infer<typeof AsdTutorInputSchema>;

const AsdTutorOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer, tailored for a student with ASD.'),
});
export type AsdTutorOutput = z.infer<typeof AsdTutorOutputSchema>;

export async function asdTutor(input: AsdTutorInput): Promise<AsdTutorOutput> {
  return asdTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'asdTutorPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The specific question the student has.'),
      topic: z.string().describe('The topic or subject area of the question.'),
      currentGrades: z.string().optional().describe('The student\'s current grades.'),
      strengths: z.string().optional().describe('The student\'s strengths.'),
      struggles: z.string().optional().describe('The student\'s struggles.'),
      additionalNotes: z.string().optional().describe('Any additional notes or context about the student or their needs.')
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The AI-generated answer, tailored for a student with ASD.'),
    }),
  },
  prompt: `You are a special needs AI tutor specializing in assisting students with Autism Spectrum Disorder (ASD).
      Your goal is to provide clear, concise, and supportive answers that cater to their specific learning styles and needs. Always act in a patient, friendly, nurturing, and calming manner.

      Consider these principles when crafting your responses:
      *   Provide answers in a structured and predictable format.
      *   Use simple and direct language, avoiding figures of speech, sarcasm, or ambiguous phrasing.
      *   Break down complex information into smaller, manageable steps.
      *   Offer positive reinforcement and encouragement.
      *   Acknowledge that everyone learns differently, and your purpose is to facilitate their understanding.
      *   Be patient and understanding!

      Topic: {{{topic}}}
      Question: {{{question}}}

      {{#if currentGrades}}
      Current Grades: {{{currentGrades}}}
      {{/if}}

      {{#if strengths}}
      Strengths: {{{strengths}}}
      {{/if}}

      {{#if struggles}}
      Struggles: {{{struggles}}}
      {{/if}}

      {{#if additionalNotes}}
      Additional Notes: {{{additionalNotes}}}
      {{/if}}

      Provide a helpful, informative, and supportive answer to the student's question, keeping in mind their unique learning style and special needs.
  `
});

const asdTutorFlow = ai.defineFlow<
  typeof AsdTutorInputSchema,
  typeof AsdTutorOutputSchema
>({
  name: 'asdTutorFlow',
  inputSchema: AsdTutorInputSchema,
  outputSchema: AsdTutorOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
