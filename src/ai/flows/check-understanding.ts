'use server';

/**
 * @fileOverview Checks the student's understanding and provides follow-up questions.
 *
 * - checkUnderstanding - A function that checks the student's understanding.
 * - CheckUnderstandingInput - The input type for the checkUnderstanding function.
 * - CheckUnderstandingOutput - The return type for the checkUnderstanding function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const CheckUnderstandingInputSchema = z.object({
  answer: z.string().describe('The answer provided to the student.'),
  userMood: z.string().optional().describe('The user\'s mood (e.g., frustrated).'),
});
export type CheckUnderstandingInput = z.infer<typeof CheckUnderstandingInputSchema>;

const CheckUnderstandingOutputSchema = z.object({
  followUpQuestion: z.string().describe('A follow-up question to check understanding.'),
});
export type CheckUnderstandingOutput = z.infer<typeof CheckUnderstandingOutputSchema>;

export async function checkUnderstanding(input: CheckUnderstandingInput): Promise<CheckUnderstandingOutput> {
  return checkUnderstandingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkUnderstandingPrompt',
  input: {
    schema: z.object({
      answer: z.string().describe('The answer provided to the student.'),
      userMood: z.string().optional().describe('The user\'s mood (e.g., frustrated).'),
    }),
  },
  output: {
    schema: z.object({
      followUpQuestion: z.string().describe('A follow-up question to check understanding.'),
    }),
  },
  prompt: `The student just received this answer from you:

{{answer}}

{{#if userMood}}
{{#eq userMood "frustrated"}}
Totally okay to feel stuck! Want to take a break or try it a new way?
{{else}}
Ask a friendly follow-up question to check if they understood.
Be supportive and offer next steps.
{{/eq}}
{{else}}
Ask a friendly follow-up question to check if they understood.
Be supportive and offer next steps.
{{/if}}

Examples:
- "Did that make sense?"
- "Want to try a similar one together?"
- "Would it help if I explained that in a simpler way?"
`,
});

const checkUnderstandingFlow = ai.defineFlow<
  typeof CheckUnderstandingInputSchema,
  typeof CheckUnderstandingOutputSchema
>({
  name: 'checkUnderstandingFlow',
  inputSchema: CheckUnderstandingInputSchema,
  outputSchema: CheckUnderstandingOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
