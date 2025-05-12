/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 * This file should primarily focus on the AI configuration.
 */

// IMPORTANT: This file should NOT have 'use server' or 'use client' at the top.
// It is a module for configuring and exporting the Genkit instance.

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Configure Genkit
const configureGenkitInstance = () => {
  const plugins = [];
  // Ensure API keys are loaded (add console logs for debugging if needed)
  // console.log('Preview GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY); // Moved inside or to specific actions

  if (process.env.GOOGLE_GENAI_API_KEY) {
    plugins.push(googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }));
    console.log('Google AI plugin configured.');
  } else {
    console.warn(
      'GOOGLE_GENAI_API_KEY is not set. Google AI features will be unavailable.',
    );
  }

  try {
    const instance = genkit({
      plugins: plugins,
      logLevel: 'debug',
      enableTracingAndMetrics: true,
    });
    if (!instance) {
      console.error("Genkit instance failed to initialize!");
      // Return a placeholder or throw to prevent undefined behavior
      // For now, let's throw so it's obvious if initialization fails.
      throw new Error("Failed to initialize Genkit instance.");
    }
    console.log("Genkit instance configured successfully.");
    return instance;
  } catch (error) {
    console.error("Error during Genkit initialization:", error);
    // Depending on how you want to handle this, you could return a non-functional
    // placeholder or re-throw the error. Re-throwing makes the problem visible.
    throw error;
  }
};

export const ai = configureGenkitInstance();

// testGeminiModel and testOpenAIModel were moved to src/ai/testActions.ts
// which should have 'use server'; at its top.
