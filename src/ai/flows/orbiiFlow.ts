
'use server';

/**
 * @fileOverview This file defines the main Genkit flow for Orbii, the AI tutor.
 *
 * - orbiiFlow - The main function to process user input and return AI-generated responses.
 * - OrbiiInput - The input type for the orbiiFlow function.
 * - OrbiiOutput - The output type for the orbiiFlow function.
 */

import { ai } from '@/ai/ai-instance';
import { callOpenAIGPT4o } from '@/services/callOpenAIGPT4o';
import { z } from 'genkit';

const OrbiiInputSchema = z.object({
  type: z.enum(['text', 'image']).describe('Type of input (text or image).'),
  data: z.string().describe('The text or image data of the input.'),
  intent: z.enum(['homework_help', 'lesson_plan', 'progress_check', 'deep_help', 'emotional_support']).optional().describe('The user\'s intent.'),
  gradeLevel: z.string().optional().describe('The student\'s current grade level.'),
  learningStrengths: z.string().optional().describe('The student\'s learning strengths.'),
  learningStruggles: z.string().optional().describe('The student\'s learning struggles.'),
  userMood: z.string().optional().describe('The user\'s current mood.'),
  topic: z.string().optional().describe('Topic to be answered or generated'),
});

export type OrbiiInput = z.infer<typeof OrbiiInputSchema>;

const OrbiiOutputSchema = z.object({
  response: z.string().describe('The AI-generated response from Orbii.'),
});

export type OrbiiOutput = z.infer<typeof OrbiiOutputSchema>;

export async function orbiiFlow(input: OrbiiInput): Promise<OrbiiOutput> {
  return orbiiFlowInternal(input);
}

const orbiiPrompt = ai.definePrompt({
  name: 'orbiiPrompt',
  input: {
    schema: OrbiiInputSchema,
  },
  output: {
    schema: OrbiiOutputSchema,
  },
  prompt: `You are Orbii, a kind, calming, and highly intelligent AI tutor built to support all learners, especially neurodiverse students like those with autism.

You speak in a friendly, patient, emotionally supportive tone. You adapt your communication to match the student’s level and needs.

Your job is to:
1. Greet students and build trust.
2. Ask for their grade, strengths, and struggles.
3. Use this information to personalize lessons and feedback.
4. Speak and listen using voice (audio input/output).
5. Teach using whiteboard tools when needed.
6. Encourage breaks, self-confidence, and progress checks.

If the student uploads a photo of homework or asks a complex question, pass the request to GPT-4o using the \`callOpenAIGPT4o()\` function. Then explain the response back to the student in your own calm and helpful tone.

You can also respond to buttons or cards pressed in the app:
- “Ask Orbii a Question”
- “Start a Lesson”
- “Upload Homework”
- “Check My Progress”
- “Take a Break”
… and so on.

Do not try to solve complex math or academic problems yourself — always pass those to GPT-4o and wait for the answer.

Always respond warmly, like a friendly mentor or learning companion.

Here is the student's input: {{{input.data}}}
`,
});

const orbiiFlowInternal = ai.defineFlow<
  typeof OrbiiInputSchema,
  typeof OrbiiOutputSchema
>({
  name: 'orbiiFlow',
  inputSchema: OrbiiInputSchema,
  outputSchema: OrbiiOutputSchema,
}, async (input) => {
    if (input.type === 'image' || input.intent === 'deep_help') {
      const solution = await callOpenAIGPT4o(input.data); // send to OpenAI
      return {response: `Here’s what I found:\n\n${solution}\n\nWould you like me to explain it differently or try another one with you?`};
    } else {
        const { output } = await orbiiPrompt({input});
        return output!;
    }
});
