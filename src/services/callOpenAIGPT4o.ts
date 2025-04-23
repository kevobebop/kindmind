
import { OpenAI } from "openai";

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
    return undefined;
  }
}




