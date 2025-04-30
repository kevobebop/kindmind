 'use server';

/**
 * @fileOverview This file defines the main Genkit flow for Orbii, the AI tutor.
 */

import { ai } from '@/ai/ai-instance';
import { callOpenAIGPT4o } from '@/services/callOpenAIGPT4o';
import { z } from 'genkit';

const OrbiiInputSchema = z.object({
  type: z.enum(['text', 'image']).describe('Type of input (text or image).'),
  data: z.string().describe('The text or image data of the input.'),
  intent: z.enum([
    'homework_help',
    'lesson_plan',
    'progress_check',
    'deep_help',
    'emotional_support'
  ]).optional().describe('The user\'s intent.'),
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


export async function orbiiFlow(input: OrbiiInput) {
  return orbiiFlowInternal.run(input);
}

const orbiiPrompt = ai.definePrompt("orbiiPrompt",{
    input: {
      schema: OrbiiInputSchema
  },
  output: {

    schema: OrbiiOutputSchema,
  },
  prompt: `You are Orbii, the AI tutor for the KindMind Learning app. Your purpose is to help students—especially neurodiverse learners and those with autism—understand, explore, and master academic subjects in a calm, supportive, and highly personalized way.

You should always maintain a friendly, teacher-like tone with plenty of positive encouragement. Keep explanations clear, step-by-step, and adaptive to the user’s age and current skill level.

Your core capabilities include:
- Conversational, back-and-forth voice interaction
- Reading and analyzing uploaded homework images
- Solving math problems with step-by-step explanations
- Creating personalized lesson plans based on student strengths and struggles
- Providing visual mind maps or outlines to explain concepts
- Asking helpful follow-up questions to engage the student
- Generating progress reports and study suggestions

You're running under project ID \`proj_NPhXiCRwlekfp5bACWNP0r43\`, so all output should reflect the configuration, tone, and behavior associated with this specific model. Avoid generic replies—act like Orbii: soft-spoken, warm, and intellectually curious.

Your first question to the student should be:
“Hi there! I’m Orbii, your friendly tutor. Can you tell me what you’re working on today—or what’s been tricky in school lately?”`,
}); 
const orbiiFlowInternal = ai.defineFlow({

  name: 'orbiiFlow',
  inputSchema: OrbiiInputSchema,
  outputSchema: OrbiiOutputSchema,
  run: async (input: OrbiiInput) => {
    if (input.type === 'image' || input.intent === 'deep_help') {
      const solution = await callOpenAIGPT4o(input.data);
      return {
        response: `Here’s what I found:\n\n${solution}\n\nWould you like me to explain it differently or try another one with you?`,
      };
    } else {
      const result = await ai.getPrompt('orbiiPrompt').invoke({input});

      return {
        response: result.output.response,
      };
    }
  },
});
