import fs from 'fs';
import 'dotenv/config';
import OpenAI from 'openai';

async function testVoice() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const openai = new OpenAI({ apiKey: key });

  // Generate speech using OpenAI voice API
  const response = await openai.audio.speech.create({
    model: 'tts-1',    // or your preferred TTS model
    voice: 'alloy',    // choose a voice like 'alloy', 'yoha', etc.
    input: 'Hello from GPT-4o voice test!'
  });

  // Write the resulting audio to a file
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync('testVoice.wav', buffer);
  console.log('✅ Audio saved to testVoice.wav');
}

testVoice().catch(err => {
  console.error('❌ Voice test failed:', err);
  process.exit(1);
});
