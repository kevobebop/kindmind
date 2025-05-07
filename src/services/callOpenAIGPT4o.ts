'use server';

import { OpenAI } from "openai";
console.log('Starting KindMind AI Instance...');
console.log('Initializing OpenAI...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Preview OPENAI_API_KEY:', process.env.OPENAI_API_KEY);


if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. The service may not function correctly.');
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '', // fallback for TS safety
});

export async function callOpenAIGPT4o(input: string): Promise<string | undefined> {
  console.log("callOpenAIGPT4o called with input:", input);
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API Key is not configured for callOpenAIGPT4o.");
    return "OpenAI service is not available due to missing API key."
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: input }],
      temperature: 0.7,
    });
    const content = completion.choices[0]?.message?.content ?? undefined;
    console.log("OpenAI response:", content);
    return content;
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    let errorMessage = "I'm having trouble connecting to the AI brain right now. Please try again in a few minutes!";
    if (error.status === 401) {
        errorMessage = "OpenAI API key is invalid or has insufficient permissions. Please check your key."
    } else if (error.status === 429) {
        errorMessage = "OpenAI API rate limit exceeded. Please try again later."
    } else if (error.message) {
        errorMessage = `OpenAI error: ${error.message}`;
    }
    return errorMessage;
  }
}
