'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

console.log('Starting KindMind AI Instance...');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('GOOGLE_GENAI_API_KEY is not set.  The app may not work correctly.');
} else {
  console.log('GOOGLE_GENAI_API_KEY is set.');
}

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'gemini-pro',
});

console.log('KindMind AI Instance initialized.');
