/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 * This file should primarily focus on the AI configuration.
 * It should NOT contain 'use server' if its main export is the 'ai' object.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

console.log('Attempting to configure Genkit AI instance in ai-instance.ts...');

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error(
    'CRITICAL: GOOGLE_GENAI_API_KEY is not set or not accessible in ai-instance.ts. Genkit Google AI plugin will not be configured. AI features relying on Google AI will fail.'
  );
} else {
  console.log('GOOGLE_GENAI_API_KEY is found in ai-instance.ts.');
}

const plugins = [];
if (apiKey) {
  try {
    plugins.push(googleAI({ apiKey }));
    console.log('Google AI plugin prepared for Genkit in ai-instance.ts.');
  } catch (e: any) {
    console.error('Error while trying to initialize googleAI plugin in ai-instance.ts:', e);
    // Potentially push a dummy plugin or handle error to prevent full crash if needed
  }
} else {
  console.warn('Google AI plugin will not be added to Genkit as GOOGLE_GENAI_API_KEY is missing in ai-instance.ts.');
}

let genkitInstance;

try {
  genkitInstance = genkit({
    plugins: plugins, // plugins array might be empty if API key was missing
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });
  if (plugins.length > 0) {
    console.log('Genkit AI instance configured successfully with Google AI plugin in ai-instance.ts.');
  } else {
    console.warn('Genkit AI instance configured, but WITHOUT the Google AI plugin due to missing API key in ai-instance.ts. Some functionalities may be limited.');
  }
} catch (e: any) {
  console.error("CRITICAL: Error during genkit({ ... }) initialization call in ai-instance.ts:", e);
  // Fallback to a dummy object to prevent crashes if genkit() itself throws catastrophically
  // This helps in isolating whether the issue is Genkit init or subsequent usage.
  genkitInstance = {
    generate: async (options: any) => {
      console.error("Dummy ai.generate called: Genkit failed to initialize properly. Input:", options?.prompt);
      return { text: () => "ERROR: AI not initialized properly due to Genkit initialization failure." };
    },
    definePrompt: (config: any) => {
      console.error("Dummy ai.definePrompt called: Genkit failed to initialize properly. Config name:", config?.name);
      return async (input: any) => {
        console.error("Dummy prompt function called. Input:", input);
        return { output: undefined, text: () => "ERROR: AI not initialized properly (prompt definition failed)." };
      };
    },
    defineFlow: (config: any, func: any) => {
      console.error("Dummy ai.defineFlow called: Genkit failed to initialize properly. Config name:", config?.name);
      // Return the function itself, but it might fail if it depends on a correctly initialized 'ai' object.
      return func;
    },
    // Add other methods that might be called to prevent 'undefined' errors
    // These are illustrative and might need to be expanded based on actual usage.
    isConfigured: () => false, 
  } as any; // Cast to any to assign this dummy object
  console.error("Genkit AI instance has been set to a DUMMY fallback object in ai-instance.ts due to initialization failure.");
}

export const ai = genkitInstance;
