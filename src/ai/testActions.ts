'use server'; // This directive MUST be at the top of the file

/**
 * @fileOverview Defines Server Actions for testing AI models.
 * These functions can be called directly from client components.
 */
import { ai } from '@/ai/ai-instance'; // Import the configured Genkit AI instance
import { callOpenAIGPT4o } from '@/services/callOpenAIGPT4o';

export async function testGeminiModel(): Promise<string> {
  console.log('Executing testGeminiModel (Server Action)...');
  console.log('GOOGLE_GENAI_API_KEY in testGeminiModel (Server Action context):', process.env.GOOGLE_GENAI_API_KEY);
  
  if (!ai || typeof ai.generate !== 'function') { 
    console.error('Genkit AI instance or ai.generate is not available for Gemini test in testActions.ts. AI object:', ai);
    return 'Gemini Test Skipped: Genkit AI instance not properly initialized or ai.generate is not a function.';
  }
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.warn('GOOGLE_GENAI_API_KEY not set for Gemini test in testActions.ts.');
    return 'Gemini Test Skipped: GOOGLE_GENAI_API_KEY not set at the time of call.';
  }

  try {
    const result = await ai.generate({
      model: 'gemini-1.5-flash-latest', // Ensure this model is available and key is valid
      prompt: 'Tell me a short joke about learning.',
    });
    const textResult = result.text; 
    console.log('Gemini Test Success in testActions.ts:', textResult);
    return `Gemini Test Success: ${textResult}`;
  } catch (error: any) {
    console.error('Gemini Test Error (Server Action) in testActions.ts:', error);
    let errorMessage = `Gemini Test Failed: ${error.message || 'An unexpected error occurred.'}`;
    if (error.cause) {
      errorMessage += ` Cause: ${error.cause.message || JSON.stringify(error.cause)}`;
    }
    if (error.details) {
      errorMessage += ` Details: ${JSON.stringify(error.details)}`;
    }
    const modelNameInUse = 'gemini-1.5-flash-latest';
    if (error.message?.includes('NOT_FOUND') || error.message?.includes('Model not found')) {
      errorMessage += ` (Is the model name '${modelNameInUse}' correct and available for your API key?)`;
    }
    if (error.message?.includes('API key not valid')) {
        errorMessage += ` (Please check your GOOGLE_GENAI_API_KEY.)`;
    }
    return errorMessage;
  }
}

export async function testOpenAIModel(): Promise<string> {
  console.log('Executing testOpenAIModel (Server Action)...');
  console.log('OPENAI_API_KEY in testOpenAIModel (Server Action context):', process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set for OpenAI test in testActions.ts.');
    return 'OpenAI Test Skipped: OPENAI_API_KEY not set at the time of call.';
  }

  try {
    const response = await callOpenAIGPT4o('Tell me a short joke about a robot tutor.');
    
    if (typeof response === 'string') {
      console.error('OpenAI Test Failed (callOpenAIGPT4o returned error string in testActions.ts):', response);
      return `OpenAI Test Failed: ${response}`;
    }
    
    if (response && response.text) {
      console.log('OpenAI Test Success in testActions.ts:', response.text);
      return `OpenAI Test Success: ${response.text}`;
    } else {
      const errorDetail = response?.text === undefined ? 'No text in response object' : `Text was: "${response.text}" (empty or falsy)`;
      console.error('OpenAI Test Failed (unexpected response structure or error message in testActions.ts):', errorDetail, 'Full response:', response);
      return `OpenAI Test Failed: ${response?.text || 'No text field in response or connection issue.'}`;
    }
  } catch (error: any) {
    console.error('OpenAI Test Error (Server Action) in testActions.ts:', error);
    let errorMessage = `OpenAI Test Failed: ${error.message || 'An unexpected error occurred.'}`;
     if (error.cause) {
      errorMessage += ` Cause: ${error.cause.message || JSON.stringify(error.cause)}`;
    }
    if (error.message?.includes('API key not valid') || error.status === 401) {
        errorMessage += ` (Please check your OPENAI_API_KEY.)`;
    }
    return errorMessage;
  }
}
