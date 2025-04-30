import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

console.log('Starting KindMind AI Instance...');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('GOOGLE_GENAI_API_KEY is not set. Some features might not work.');
}
if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not set. Some features might not work.');
}

// Log the keys to verify they are loaded (Optional: remove in production)
// console.log('GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY ? 'Loaded' : 'Not Loaded');
// console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Not Loaded');


// Define the ai instance. Handle cases where keys might be missing.
// We create the instance regardless, but flows might fail if keys are needed and missing.
export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    // Conditionally add googleAI plugin only if the key exists
    ...(process.env.GOOGLE_GENAI_API_KEY ? [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })] : []),
  ],
  // Set a default model that is likely available
  // Flows can override this if needed
  model: 'gemini-pro',
  logLevel: 'debug', // Enable debug logging for more detailed output
  enableTracing: true, // Enable tracing for better debugging in Genkit UI
});

console.log('KindMind AI Instance Initialized.');
