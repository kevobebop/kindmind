 'use server';

/**
 * @fileOverview This file defines the main Genkit flow for Orbii, the AI tutor.
 * It handles different types of user input (text, image) and intents,
 * providing personalized and context-aware responses.
 * Orbii is designed to be kind, patient, and supportive, especially for neurodiverse learners.
 */

import { ai } from '@/ai/ai-instance';
import { callOpenAIGPT4o } from '@/services/callOpenAIGPT4o';
import { z } from 'genkit';

// Updated Input Schema to include more context for personalization
const OrbiiInputSchema = z.object({
  type: z.enum(['text', 'image']).describe('Type of input (text or image).'),
  data: z.string().optional().describe('The text content or image data URI. Can be empty for initial greeting or mood-based interactions.'),
  intent: z.enum([
    'initial_greeting',
    'homework_help',
    'lesson_plan_request', // More specific intent
    'progress_check_request', // More specific intent
    'deep_dive_explanation', // For complex questions needing GPT-4o
    'emotional_support_needed', // When user indicates distress
    'general_chat', // For casual conversation or exploring topics
    'ask_orbii_question', // Generic question
    'start_lesson', // User wants to start a lesson
    'upload_homework', // User is uploading homework
    'check_my_progress', // User wants to see progress
    'take_a_break' // User indicates they want a break
  ]).optional().describe("The user's primary intent or the action they triggered."),
  isNewUser: z.boolean().optional().describe('True if this is the student\'s first interaction.'),
  lastSessionContext: z.string().optional().describe('Summary or topic of the last session for returning users.'),
  gradeLevel: z.string().optional().describe("The student's current grade level (e.g., '5th Grade', 'High School Freshman')."),
  learningStrengths: z.string().optional().describe("The student's self-reported or observed learning strengths (e.g., 'Visuals', 'Hands-on activities', 'Storytelling')."),
  learningStruggles: z.string().optional().describe("The student's self-reported or observed learning struggles (e.g., 'Long texts', 'Abstract math concepts', 'Staying focused')."),
  userMood: z.enum(["happy", "neutral", "frustrated", "sad", "confused"]).optional().describe("The student's current reported mood."),
  topic: z.string().optional().describe('Current subject or topic of conversation or study.'),
  textContextForImage: z.string().optional().describe('Optional text description or question related to an uploaded image.')
});

export type OrbiiInput = z.infer<typeof OrbiiInputSchema>;

const OrbiiOutputSchema = z.object({
  response: z.string().describe('The AI-generated response from Orbii, tailored to the user and context.'),
  // Potentially add suggested actions or next steps Orbii might recommend
  // suggestedActions: z.array(z.object({ label: z.string(), intent: OrbiiInputSchema.shape.intent })).optional(),
});

export type OrbiiOutput = z.infer<typeof OrbiiOutputSchema>;


export async function orbiiFlow(input: OrbiiInput): Promise<OrbiiOutput> {
  // Ensure that even if data is undefined (e.g. for initial greeting), it's passed as an empty string or handled.
  const flowInput = {
    ...input,
    data: input.data || "", // Ensure data is at least an empty string if not provided
  };
  return orbiiFlowInternal(flowInput);
}

const orbiiPrompt = ai.definePrompt({
  name: "orbiiPrompt",
  // model: 'gemini-1.5-flash-latest', // Or your preferred Gemini model for general interaction
  input: {
    schema: OrbiiInputSchema // Using the updated, more detailed schema
  },
  output: {
    schema: OrbiiOutputSchema,
  },
  // Updated prompt reflecting Orbii's enhanced persona and capabilities
  prompt: `You are Orbii, a kind, calming, patient, and highly intelligent AI tutor from the KindMind Learning app. Your primary purpose is to help students of all abilities, especially neurodiverse learners (including those with autism or ADHD), to understand, explore, and master academic subjects. You build trust and rapport, encourage curiosity without judgment, and simplify complex topics.

Your persona: Friendly, encouraging, teacher-like, soft-spoken, warm, and intellectually curious. Adapt your communication to match the student’s level and needs. Use clear, step-by-step explanations. You are running under project ID proj_NPhXiCRwlekfp5bACWNP0r43.

Student Information (use this to personalize your responses):
- Grade Level: {{{gradeLevel}}} (If available, adapt complexity)
- Learning Strengths: {{{learningStrengths}}} (If available, lean into these styles)
- Learning Struggles: {{{learningStruggles}}} (If available, be mindful and offer support here)
- Current Mood: {{{userMood}}} (IMPORTANT: Adjust your tone and approach based on this. If 'frustrated', 'sad', or 'confused', be extra gentle, patient, and offer encouragement or a break. If 'happy', share their enthusiasm!)
- Topic of current interaction: {{{topic}}}

Interaction Context & Student's Current Action/Input:
{{#if intent}}
The student's current intent is: {{{intent}}}.
{{/if}}

{{#if isNewUser}}
This is the student's first interaction. Your first question to the student should be: "Hi there! I’m Orbii, your friendly tutor. It's wonderful to meet you! Can you tell me what you’re working on today—or perhaps what’s been a bit tricky in school lately?"
Please also ask for their grade level, and what they enjoy or find hard in learning, so you can help them best.
{{else}}
This is a returning student.
  {{#if lastSessionContext}}
  Welcome them back warmly: "Welcome back to KindMind Learning, it's great to see you again! Last time we were looking into {{{lastSessionContext}}}. Would you like to pick up where we left off, or is there a new learning adventure you'd like to start today?"
  {{else}}
  Offer a warm welcome back: "Welcome back to KindMind Learning! I'm Orbii, and I'm excited to help you learn. What topic are you curious about today?"
  {{/if}}
{{/if}}

{{#if data}}
  {{#if (eq type "image")}}
The student has uploaded an image. {{#if textContextForImage}}Their question about it is: "{{{textContextForImage}}}"{{else}}They haven't added specific text for this image.{{/if}}
    (If this image contains complex homework, remember it will be processed by GPT-4o. Your role is to introduce this or explain the results if this prompt is for post-processing.)
  {{else}}
The student's current message/question is: "{{{data}}}".
  {{/if}}
Please respond to this, keeping all their context in mind.
{{else}}
  {{#unless isNewUser}}
    If they haven't provided a specific question yet (i.e., 'data' is empty), and this is a returning user, you can gently prompt them based on the greeting you've already formulated (e.g., asking if they want to continue with lastSessionContext or choose a new topic).
  {{/unless}}
  {{#if isNewUser}}
    If 'data' is empty and it's a new user, your primary goal is to deliver the initial friendly greeting and questions as instructed above.
  {{/if}}
{{/if}}

Core Abilities to Weave into Conversation:
- Homework Help (Image-Based): If an image is uploaded, or intent is 'upload_homework', acknowledge it. Complex problems are solved by GPT-4o; your role is to explain the solution. Always ask follow-up questions to check understanding: "Did that make sense?" or "Want to try another one together?"
- Personalized Tutoring: Based on grade, strengths, and struggles, offer to create custom lesson plans or suggest practice.
- Whiteboard Interaction: You can say things like, "Let me draw that out for you on the whiteboard," or "Can you show me on the whiteboard?" (The app UI handles the actual whiteboard).
- Progress Tracking & Feedback: If intent is 'check_my_progress', offer to show their progress report. Periodically summarize learning.
- Emotional Check-ins: If mood is low, or after a tough problem, you can ask: "How are you feeling about this?" or "Would you like to take a quick break, maybe try a calming exercise?"
- Respond to UI Interactions: If the intent suggests a button press (e.g., 'start_lesson', 'take_a_break'), respond appropriately to that action.

Tone and Language Guidelines:
- ALWAYS be kind, patient, calm, and encouraging.
- Use simple, clear language, especially if 'gradeLevel' is young or 'learningStruggles' indicate difficulty with text.
- Break down complex information into smaller, manageable steps.
- If 'userMood' is 'frustrated' or 'sad': Respond with extra empathy. Example: "It's totally okay to feel stuck! Sometimes learning new things can be tricky. We can take a break, or try looking at this in a different way. What would feel best for you right now?"
- If 'userMood' is 'confused': "No worries at all if that's a bit confusing! I can explain it again, maybe with an example. Where did it start to feel a bit fuzzy?"

IMPORTANT: If the student asks a complex academic question (math, science, detailed analysis) or uploads homework requiring deep understanding (intent 'deep_dive_explanation' or 'homework_help' with an image), YOUR ROLE IS TO ACKNOWLEDGE THE QUESTION AND STATE THAT YOU'LL USE YOUR "SPECIAL THINKING CAP" (GPT-4o) TO GET THE BEST ANSWER. Then, the callOpenAIGPT4o function will be invoked by the system. AFTER that function provides a solution, THIS PROMPT MIGHT BE CALLED AGAIN with that solution to help you explain it to the student in your own calm, step-by-step Orbii way. DO NOT try to solve complex problems yourself in this initial response.

Now, formulate your helpful and supportive response as Orbii.
`
});

const orbiiFlowInternal = ai.defineFlow({
  name: 'orbiiFlowInternal',
  inputSchema: OrbiiInputSchema,
  outputSchema: OrbiiOutputSchema,
  run: async (input: OrbiiInput): Promise<OrbiiOutput> => {
    // If the intent is for deep help or an image is provided, it's a cue for GPT-4o.
    // The main orbiiPrompt will set the stage, and the actual GPT-4o call happens outside this specific flow
    // for complex problem solving, then this flow might be re-invoked to explain GPT-4o's output.
    // This flow's primary job is to be Orbii's "voice" and conversational logic.

    if (input.type === 'image' && !input.data) {
      return { response: "It looks like you wanted to send an image, but I didn't receive it. Could you please try uploading it again?" };
    }
    
    if ((input.intent === 'deep_dive_explanation' || (input.intent === 'homework_help' && input.type === 'text'))) {
       if (!input.data) {
        return { response: "I'm ready to help with a deeper explanation! What's the specific question or topic you'd like me to focus on?" };
       }
      // Logic for handling complex questions that should go to GPT-4o
      // The prompt itself guides Orbii to say it's using its "thinking cap".
      // The actual callOpenAIGPT4o would happen in the frontend or a managing flow.
      // This flow just generates Orbii's conversational part.
      // If we assume callOpenAIGPT4o was already called and its result is passed
      // back in input.data (e.g. as part of the 'textContextForImage' or a modified 'data' field if it's explaining a solution)
      // then the main prompt already handles how Orbii should explain it.
      // For now, let's ensure it doesn't try to solve it directly but relies on the prompt guidance.
      console.log("OrbiiFlow: Complex question or image detected, deferring to GPT-4o logic (managed externally or via prompt guidance). Input data:", input.data);
    }
    
    if (input.type === 'image' && input.data) {
        // This is the case where an image is provided.
        // The prompt will guide Orbii. If callOpenAIGPT4o is to be called,
        // it should be done externally and its output fed back if Orbii needs to explain it.
        console.log("OrbiiFlow: Image input received. Relying on prompt to guide response or defer to GPT-4o.");
    }


    const { output } = await orbiiPrompt(input);
    if (!output || typeof output.response !== 'string') {
      console.error("Orbii prompt did not return a valid response object or string:", output);
      // A more user-friendly error for Orbii to say
      return { response: "I'm having a little trouble finding my words right now. Could you try asking me again in a moment, perhaps in a different way?" };
    }
    return {
      response: output.response,
    };
  },
});

// Wrapper function to get initial greeting
export async function getOrbiiGreeting(input: { isNewUser?: boolean; lastSessionContext?: string }): Promise<OrbiiOutput> {
  return orbiiFlowInternal({
    type: 'text',
    data: '', // No specific data for greeting
    intent: 'initial_greeting',
    isNewUser: input.isNewUser,
    lastSessionContext: input.lastSessionContext,
  });
}

// Example of how a more complex interaction involving GPT-4o might be handled (conceptual)
// This would typically be in the frontend calling `orbiiFlow` then `callOpenAIGPT4o` then `orbiiFlow` again.
/*
async function handleComplexQuestion(userInput: OrbiiInput): Promise<OrbiiOutput> {
  // 1. Orbii acknowledges and says it will use its thinking cap
  const initialOrbiiResponse = await orbiiFlow(userInput);
  // displayInitialOrbiiResponse(initialOrbiiResponse.response);

  // 2. Frontend calls GPT-4o
  let gpt4oSolution: string | undefined;
  if (userInput.data) { // Ensure data exists before calling
    const gpt4oResponse = await callOpenAIGPT4o(userInput.data);
    if (typeof gpt4oResponse === 'string') { // Error case from callOpenAIGPT4o
        gpt4oSolution = gpt4oResponse; // This will be an error message
    } else {
        gpt4oSolution = gpt4oResponse?.text;
    }
  } else {
    gpt4oSolution = "It seems like there wasn't a specific question for my thinking cap!";
  }


  // 3. Orbii explains GPT-4o's solution
  const explanationInput: OrbiiInput = {
    ...userInput,
    intent: 'deep_dive_explanation', // or a new intent like 'explain_solution'
    data: `My special thinking cap (GPT-4o) came up with this: "${gpt4oSolution}". Now, let's break it down together.`, // Pass solution for Orbii to explain
  };
  const finalOrbiiExplanation = await orbiiFlow(explanationInput);
  return finalOrbiiExplanation;
}
*/

