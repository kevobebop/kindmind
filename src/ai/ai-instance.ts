
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure API keys are loaded (add console logs for debugging if needed)
console.log('GOOGLE_GENAI_API_KEY loaded:', !!process.env.GOOGLE_GENAI_API_KEY);
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
  try {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      return 'Gemini Test Skipped: GOOGLE_GENAI_API_KEY not set.';
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
     const modelName = ai.getModel()?.name ?? 'default';
    if (error.message?.includes('NOT_FOUND') || error.message?.includes('Model not found')) {
      errorMessage += ` (Is the model name '${modelName}' correct and available in your region/project?)`;
    }
    return errorMessage;
  }
}
