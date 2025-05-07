 'use server';

/**
 * @fileOverview This file defines the main Genkit flow for Orbii, the AI tutor.
 * It handles different types of user input (text, image) and intents,
 * providing personalized and context-aware responses.
 */

import { ai } from '@/ai/ai-instance';
import { callOpenAIGPT4o } from '@/services/callOpenAIGPT4o';
import { z } from 'genkit';

const OrbiiInputSchema = z.object({
  type: z.enum(['text', 'image']).describe('Type of input (text or image).'),
  data: z.string().optional().describe('The text or image data of the input. Can be empty for initial greeting.'),
  intent: z.enum([
    'initial_greeting',
    'homework_help',
    'lesson_plan',
    'progress_check',
    'deep_help',
    'emotional_support'
  ]).optional().describe('The user\'s intent.'),
  isNewUser: z.boolean().optional().describe('Set to true if the user is new, false or undefined otherwise.'),
  lastSessionContext: z.string().optional().describe('Summary or topic of the last session for returning users.'),
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
  name: "orbiiPrompt",
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
- Solving math problems with step-by-step explanations (by calling external tools like GPT-4o when the problem is complex, then explaining the solution)
- Creating personalized lesson plans based on student strengths and struggles
- Providing visual mind maps or outlines to explain concepts
- Asking helpful follow-up questions to engage the student
- Generating progress reports and study suggestions

You're running under project ID \`proj_NPhXiCRwlekfp5bACWNP0r43\`, so all output should reflect the configuration, tone, and behavior associated with this specific model. Avoid generic replies—act like Orbii: soft-spoken, warm, and intellectually curious.

Interaction Context:
{{#if isNewUser}}
This is the student's first interaction. Please provide a warm, welcoming greeting. A good first question to ask is: “Hi there! I’m Orbii, your friendly tutor. It's wonderful to meet you! Can you tell me what you’re working on today—or perhaps what’s been a bit tricky in school lately?”
{{else}}
This is a returning student.
  {{#if lastSessionContext}}
  Welcome them back. You can remind them that last time you were discussing or working on "{{{lastSessionContext}}}". Ask if they'd like to continue with that, or if there's something new they'd like to explore today. For example: "Welcome back! It's great to see you again. Last time we were looking into {{{lastSessionContext}}}. Would you like to pick up where we left off, or is there a new adventure you'd like to start today?"
  {{else}}
  Offer a warm welcome back and ask what they'd like to work on. For example: "Welcome back to KindMind Learning! I'm excited to help you learn. What topic are you curious about today?"
  {{/if}}
{{/if}}

{{#if data}}
The student's current message/question is: "{{{data}}}". Please respond to this, keeping their context in mind.
{{else}}
  {{#unless isNewUser}}
    If they haven't provided a specific question yet (i.e., 'data' is empty), and this is a returning user, you can gently prompt them based on the greeting you've already formulated (e.g., asking if they want to continue with `lastSessionContext` or choose a new topic).
  {{/unless}}
  {{#if isNewUser}}
    If 'data' is empty and it's a new user, your primary goal is to deliver the initial friendly greeting and question as instructed above.
  {{/if}}
{{/if}}

Additional student information to consider:
- Grade Level: {{{gradeLevel}}}
- Learning Strengths: {{{learningStrengths}}}
- Learning Struggles: {{{learningStruggles}}}
- User's Mood: {{{userMood}}}
- Current Topic Focus: {{{topic}}}
- User's Stated Intent: {{{intent}}}

Please formulate a helpful and supportive response. If the task is complex (like solving a math problem not suitable for a quick answer, or analyzing a detailed image for homework), and the intent is 'deep_help' or type is 'image', remember that another system (GPT-4o) will handle the core analysis. Your role here would be to introduce that process or explain its results if this prompt is being used for that. For most general conversation and tutoring, respond directly.
`
});

const orbiiFlowInternal = ai.defineFlow({
  name: 'orbiiFlowInternal', // Changed name to avoid conflict if orbiiFlow is redefined elsewhere
  inputSchema: OrbiiInputSchema,
  outputSchema: OrbiiOutputSchema,
  run: async (input: OrbiiInput) => {
    // Handle image or deep_help intents by calling the specialized GPT-4o function
    if (input.type === 'image' || input.intent === 'deep_help') {
      const contentToProcess = typeof input.data === 'string' ? input.data : '';
      if (input.type === 'image' && !contentToProcess) {
        return { response: "It looks like there was an issue with the image you tried to send. Could you please try uploading it again?" };
      }
      
      // For 'deep_help' with text, or any image, callOpenAIGPT4o
      // If data is empty for a deep_help text request, provide a guiding response.
      if (input.intent === 'deep_help' && input.type === 'text' && !contentToProcess) {
        return { response: "I'm ready to help with a deeper explanation! What's the specific question or topic you'd like me to focus on?" };
      }

      const solution = await callOpenAIGPT4o(contentToProcess);
      return {
        response: `Okay, I've taken a closer look with some extra brainpower! Here’s what I found:\n\n${solution}\n\nWould you like me to explain that in a different way, or perhaps we can try a practice problem together?`,
      };
    } else {
      // For other intents (including 'initial_greeting') or general text-based interactions, use the main orbiiPrompt
      const { output } = await orbiiPrompt(input);
      if (!output || typeof output.response !== 'string') {
        console.error("Orbii prompt did not return a valid response object or string:", output);
        // Provide a generic, safe fallback response
        return { response: "I'm having a little trouble thinking right now. Could you try asking me again in a moment?" };
      }
      return {
        response: output.response,
      };
    }
  },
});

// Optional: Define a specific flow for just getting the initial greeting if needed,
// though the main orbiiFlow is now designed to handle it based on input.
export async function getOrbiiGreeting(input: { isNewUser?: boolean; lastSessionContext?: string }): Promise<OrbiiOutput> {
  return orbiiFlowInternal({
    type: 'text',
    intent: 'initial_greeting',
    isNewUser: input.isNewUser,
    lastSessionContext: input.lastSessionContext,
    // data can be omitted as it's optional and not relevant for a pure greeting request
  });
}

    