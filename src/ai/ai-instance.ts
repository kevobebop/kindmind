'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure API keys are loaded (add console logs for debugging if needed)
console.log('Preview GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY);
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
  return genkit({
    plugins: plugins,
    model: 'gemini-1.5-flash-latest', // Default model for the app
    logLevel: 'debug', // Enable debug logging
    });
};

export const ai = configureGenkit();


// Test function for Gemini
export async function testGeminiModel() {
  console.log('Testing Gemini Model...');
  console.log('GOOGLE_GENAI_API_KEY in testGeminiModel:', process.env.GOOGLE_GENAI_KEY);
  try {
    if (!ai || !process.env.GOOGLE_GENAI_API_KEY) { // Check if ai is initialized
      return 'Gemini Test Skipped: Genkit AI not initialized or GOOGLE_GENAI_API_KEY not set.';
    }
    const llm = ai.getModel();
    if (!llm) {
      return 'Gemini Test Failed: Default model not configured or found.';
    }
    const result = await llm.generate({
      prompt: 'Tell me a short joke.',
    });
    // Use .text accessor for Genkit v1.x
    return `Gemini Test Success: ${result.text}`;
  } catch (error: any) {
    console.error('Gemini Test Error:', error.message);
     // Provide more detailed error info if possible
    let errorMessage = 'Gemini Test Failed: An unexpected error occurred.';
    if (error.message) {
      errorMessage = `Gemini Test Failed: ${error.message}`;
    }
    if (error.cause?.message) { // Genkit errors often have a cause
      errorMessage += ` Cause: ${error.cause.message}`;
    }
    // Check for common model not found errors specifically
    const modelName = ai?.getModel()?.name ?? 'default'; // Add null check for ai
    if (error.message?.includes('NOT_FOUND') || error.message?.includes('Model not found')) {
      errorMessage += ` (Is the model name '${modelName}' correct and available in your region/project?)`;
    }
    return errorMessage;
  }
}

export async function testOpenAIModel() {
  console.log('Testing OpenAI Model...');
  console.log('OPENAI_API_KEY in testOpenAIModel:', process.env.OPENAI_API_KEY);
   if (!process.env.OPENAI_API_KEY) {
    return 'OpenAI Test Skipped: OPENAI_API_KEY not set.';
  }
  try {
    // This function now directly uses callOpenAIGPT4o which has its own OpenAI client instance
    // No need to get a model from Genkit's `ai` instance for this specific test.
    const { callOpenAIGPT4o } = await import('@/services/callOpenAIGPT4o');
    const response = await callOpenAIGPT4o('Tell me a short joke about AI.');
    if (response && !response.startsWith("I'm having trouble connecting")) {
      return `OpenAI Test Success: ${response}`;
    } else {
      return `OpenAI Test Failed: ${response || 'No response or connection issue.'}`;
    }
  } catch (error: any) {
    console.error('OpenAI Test Error:', error);
    return `OpenAI Test Failed: ${error.message || 'An unexpected error occurred.'}`;
  }
}
