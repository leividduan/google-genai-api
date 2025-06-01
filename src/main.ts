import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { getWaveBuffer } from './utils/saveWaveFile';

dotenv.config();

const fastify = Fastify({ logger: false });
const ai = new GoogleGenAI({ apiKey: process.env.APP_KEY });

// Text generation endpoint
fastify.post('/generate-text', async (request, reply) => {
  const { prompt } = request.body as { prompt?: string };

  if (!prompt) return reply.status(400).send({ error: 'Prompt is required' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });
    const text = response.text;
    console.log(text);
    return { text };
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Text generation failed' });
  }
});

// Audio generation endpoint
fastify.post('/generate-audio', async (request, reply) => {
  const { text } = request.body as { text?: string };

  if (!text) return reply.status(400).send({ error: 'Text is required' });

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          languageCode: 'pt-br',
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return reply.status(500).send({ error: 'No audio data received' });

    const audioBuffer = Buffer.from(base64Audio, 'base64');
    const fileName = 'out.wav';

    const buffer = await getWaveBuffer(audioBuffer);

    reply
      .header('Content-Type', 'audio/wav')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .send(buffer);
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Audio generation failed' });
  }
});

// Start server
fastify.listen({ port: 4444 }, err => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Server running on http://localhost:4444');
});
