/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 * This file should primarily focus on the AI configuration.
 * It should NOT contain 'use server' if its main export is the 'ai' object.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

console.log('Configuring Genkit AI instance in ai-instance.ts...');
const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn(
    'GOOGLE_GENAI_API_KEY is not set in ai-instance.ts. Google AI features will be unavailable. Genkit might initialize with no plugins.'
  );
}

// Initialize plugins array
const plugins = [];
if (apiKey) {
  plugins.push(googleAI({ apiKey }));
  console.log('Google AI plugin configured for Genkit in ai-instance.ts.');
}

let genkitInstance;
try {
  genkitInstance = genkit({
    plugins: plugins,
    logLevel: 'debug', // Or 'info'
    enableTracingAndMetrics: true,
  });
} catch (e: any) {
  console.error("CRITICAL: Error during genkit({ ... }) call in ai-instance.ts:", e);
  // In case of a catastrophic failure during genkit init, re-throw or handle
  throw new Error(`Genkit initialization failed: ${e.message}`);
}


if (genkitInstance) {
  console.log('Genkit AI instance configured successfully in ai-instance.ts.');
} else {
  // This block should ideally not be reached if genkit() throws on failure.
  console.error('CRITICAL: Genkit AI instance is null or undefined after configuration in ai-instance.ts.');
  // Fallback to a dummy object to prevent crashes if absolutely necessary,
  // though this indicates a fundamental problem with Genkit initialization.
  genkitInstance = { 
    generate: async () => ({ text: () => "ERROR: AI not initialized properly" }),
    definePrompt: () => async () => ({ output: undefined, text: () => "ERROR: AI not initialized properly" }),
    defineFlow: (config: any, func: any) => func, // Simple pass-through for flows
    // Add other methods if they are called and cause crashes
  } as any; // Cast to any to assign a dummy object
}

export const ai = genkitInstance;
