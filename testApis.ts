import 'dotenv/config'
import fetch from 'node-fetch'
import OpenAI from 'openai'

async function testOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')
  const openai = new OpenAI({ apiKey: key })
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello, world!' }],
  })
  console.log('OpenAI response:', res.choices[0]?.message?.content?.trim())
}

async function testGoogleGenAI() {
  const key = process.env.GOOGLE_GENAI_API_KEY
  if (!key) throw new Error('GOOGLE_GENAI_API_KEY missing')
  const url = [
    'https://us-central1-aiplatform.googleapis.com/v1beta2/',
    'projects/balmy-flash-444204-n8/locations/us-central1/publishers/google/models/text-bison-001:predict',
    `?key=${key}`,
  ].join('')
  const body = {
    instances: [{ prompt: 'Say hello!' }],
    parameters: { temperature: 0.7, maxOutputTokens: 32 },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json() as any
  console.log('Google GenAI response:', data.predictions?.[0]?.candidates?.[0]?.content)
}

async function main() {
  try {
    await testOpenAI()
    await testGoogleGenAI()
    console.log('✅ All tests completed.')
  } catch (err) {
    console.error('❌ Test failed:', err)
    process.exit(1)
  }
}

main()