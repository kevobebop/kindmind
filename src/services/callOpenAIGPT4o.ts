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

export async function callOpenAIGPT4o(input: string, includeAudio: boolean = false): Promise<{ text?: string, audio?: ArrayBuffer } | string> {
  console.log("callOpenAIGPT4o called with input:", input, "includeAudio:", includeAudio);
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
    const text = completion.choices[0]?.message?.content ?? undefined;
    console.log("OpenAI text response:", text);

    let audio;
    if (includeAudio && text) {
      try {
        const speechResponse = await openai.audio.speech.create({
          model: "tts-1", // or "tts-1-hd"
          voice: "alloy", // Choose a voice
          input: text,
          response_format: "mp3", // Specify the audio format
        });
        audio = await speechResponse.arrayBuffer(); // Get audio data as ArrayBuffer
        console.log("OpenAI audio response generated.");
      } catch (audioError) {
        console.error("Error generating audio:", audioError);
      }
    }    return { text, audio };
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
