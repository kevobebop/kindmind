'use server';

/**
 * @fileOverview Defines Server Actions for testing AI models.
 * These functions can be called directly from client components.
 */

import { ai } from '@/ai/ai-instance'; // Import the configured Genkit AI instance
import { callOpenAIGPT4o } from '@/services/callOpenAIGPT4o'; // Ensure this service is also a Server Action or callable from server environment

export async function testGeminiModel(): Promise<string> {
  console.log('Testing Gemini Model (Server Action)...');
  // console.log('GOOGLE_GENAI_API_KEY in testGeminiModel:', process.env.GOOGLE_GENAI_KEY); // GOOGLE_GENAI_KEY seems like a typo, should be GOOGLE_GENAI_API_KEY
  console.log('GOOGLE_GENAI_API_KEY in testGeminiModel:', process.env.GOOGLE_GENAI_API_KEY);


  try {
    if (!ai) { // ai should always be configured if this file is reached
      return 'Gemini Test Skipped: Genkit AI instance not available.';
    }
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      return 'Gemini Test Skipped: GOOGLE_GENAI_API_KEY not set.';
    }

    // Using a specific model for the test, or rely on default if configured in `ai` instance
    const result = await ai.generate({
      model: 'gemini-1.5-flash-latest', // Or use ai.getModel() if a default is reliably set
      prompt: 'Tell me a short joke.',
    });
    
    return `Gemini Test Success: ${result.text}`;
  } catch (error: any) {
    console.error('Gemini Test Error (Server Action):', error.message);
    let errorMessage = 'Gemini Test Failed: An unexpected error occurred.';
    if (error.message) {
      errorMessage = `Gemini Test Failed: ${error.message}`;
    }
    if (error.cause?.message) {
      errorMessage += ` Cause: ${error.cause.message}`;
    }
    const modelNameInUse = ai.getModel()?.name || 'gemini-1.5-flash-latest';
     if (error.message?.includes('NOT_FOUND') || error.message?.includes('Model not found')) {
      errorMessage += ` (Is the model name '${modelNameInUse}' correct and available in your region/project?)`;
    }
    return errorMessage;
  }
}

export async function testOpenAIModel(): Promise<string> {
  console.log('Testing OpenAI Model (Server Action)...');
  console.log('OPENAI_API_KEY in testOpenAIModel:', process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    return 'OpenAI Test Skipped: OPENAI_API_KEY not set.';
  }

  try {
    // callOpenAIGPT4o should itself be a server action or a server-side utility
    const response = await callOpenAIGPT4o('Tell me a short joke about AI.');
    if (response && !response.startsWith("I'm having trouble connecting") && !response.startsWith("OpenAI service is not available")) {
      return `OpenAI Test Success: ${response}`;
    } else {
      return `OpenAI Test Failed: ${response || 'No response or connection issue.'}`;
    }
  } catch (error: any)
 {
    console.error('OpenAI Test Error (Server Action):', error);
    return `OpenAI Test Failed: ${error.message || 'An unexpected error occurred.'}`;
  }
}