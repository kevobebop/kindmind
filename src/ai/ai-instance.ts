/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 * This file should primarily focus on the AI configuration.
 * Server Actions callable from client components should be in separate files.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Ensure to import specific models if needed by default configurations, e.g.
// import { geminiPro, gemini15Flash } from '@genkit-ai/googleai';

// Ensure API keys are loaded (add console logs for debugging if needed)
// console.log('Preview GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY);
// console.log('OPENAI_API_KEY loaded:', !!process.env.OPENAI_API_KEY);


// Configure Genkit
const configureGenkit = () => {
  const plugins = [];
  if (process.env.GOOGLE_GENAI_API_KEY) {
    plugins.push(googleAI({apiKey: process.env.GOOGLE_GENAI_API_KEY}));
  } else {
    console.warn(
      'GOOGLE_GENAI_API_KEY is not set. Google AI features will be unavailable.',
    );
  }

  // Add other plugins like OpenAI if needed and configured
  // Example: if (process.env.OPENAI_API_KEY) { plugins.push(openai({apiKey: process.env.OPENAI_API_KEY})); }

  return genkit({
    plugins: plugins,
    // model: 'gemini-1.5-flash-latest', // Example: Set a default model. Gemini Pro is 'gemini-pro'
    logLevel: 'debug', // Enable debug logging
    enableTracingAndMetrics: true, // Useful for development
    });
};

export const ai = configureGenkit();

// testGeminiModel and testOpenAIModel have been moved to src/ai/testActions.ts
// to be proper Server Actions callable from client components.
