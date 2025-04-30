'use server';

import { OpenAI } from "openai";

console.log('Initializing OpenAI...');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. The service may not function correctly.');
} else {
  console.log('OPENAI_API_KEY is set.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '', // fallback for TS safety
});

export async function callOpenAIGPT4o(input: string): Promise<string | undefined> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: input }],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? undefined;

    return content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "I'm having trouble connecting to the AI brain right now. Please try again in a few minutes!";
  }
}
