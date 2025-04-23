import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'models/gemini-1.5-pro-latest', // ✅ Use this format
});

