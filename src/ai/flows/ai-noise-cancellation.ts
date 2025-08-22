
'use server';

/**
 * @fileOverview An AI-powered noise cancellation flow for video calls.
 *
 * - aiNoiseCancellation - A function that processes audio data to reduce background noise.
 * - AINoiseCancellationInput - The input type for the aiNoiseCancellation function.
 * - AINoiseCancellationOutput - The return type for the aiNoiseCancellation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {googleAI} from '@genkit-ai/googleai';

const AINoiseCancellationInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AINoiseCancellationInput = z.infer<typeof AINoiseCancellationInputSchema>;

const AINoiseCancellationOutputSchema = z.object({
  processedAudioDataUri: z
    .string()
    .describe(
      'The processed audio data URI with reduced background noise, in the same format as the input.'
    ),
});
export type AINoiseCancellationOutput = z.infer<typeof AINoiseCancellationOutputSchema>;

export async function aiNoiseCancellation(input: AINoiseCancellationInput): Promise<AINoiseCancellationOutput> {
  return aiNoiseCancellationFlow(input);
}

const noiseCancellationPrompt = ai.definePrompt({
  name: 'noiseCancellationPrompt',
  input: {schema: z.object({
    audio: z.any(),
  })},
  output: {schema: AINoiseCancellationOutputSchema},
  prompt: `You are an audio processing expert specializing in noise cancellation.
  
  Please remove the background noise from this audio file.

  Input Audio: {{media url=audio}}
`,
config: {
    model: googleAI.model('gemini-2.5-flash-preview-tts'),
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Algenib' },
      },
    },
  },
});


const aiNoiseCancellationFlow = ai.defineFlow(
  {
    name: 'aiNoiseCancellationFlow',
    inputSchema: AINoiseCancellationInputSchema,
    outputSchema: AINoiseCancellationOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
        },
        prompt: [
            { text: "Process this audio to remove background noise and improve speech clarity." },
            { media: { url: input.audioDataUri } }
        ]
    });
    
    if (!media) {
      throw new Error('No media returned from the AI.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const processedWav = await toWav(audioBuffer);
    
    return {
      processedAudioDataUri: 'data:audio/wav;base64,' + processedWav,
    };
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
