'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

console.log('Starting KindMind AI Instance...');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error('GOOGLE_GENAI_API_KEY is not set. The app cannot function correctly without it.');
}

export const ai = process.env.GOOGLE_GENAI_API_KEY ? genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'gemini-pro',
}) : undefined;



