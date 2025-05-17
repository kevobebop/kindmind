import { Flow } from '@genkit-ai/flow';
import { z } from 'zod';
import axios from 'axios';
export const orbiiSpeak = new Flow(
  {
    name: 'orbii-speak',
    inputSchema: z.object({ text: z.string().min(1) }),
    outputSchema: z.string(),
    invoker: async () => ({ name: 'orbii-speak', done: true }),
    scheduler: async () => {},
    experimentalDurable: false,
  },
  async ({ text }: { text: string }) => {
    try {
      const response = await axios({
        method: 'post',
        url: 'https://api.openai.com/v1/audio/speech',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        data: {
          model: 'tts-1-hd',
          voice: 'nova', // Try 'onyx', 'fable', etc. too
          input: text,
        },
      });

      const buffer = Buffer.from(response.data);
      return buffer.toString('base64');
    } catch (error) {
      console.error('Orbii speak error:', error);
      return '';
    }
  }
);
// The Next.js Genkit plugin will auto-generate the HTTP endpoint under `/api/genkit/orbii-speak`
// The module declaration is now provided in src/types/genkit-ai__flow.d.ts