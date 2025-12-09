'use server';
/**
 * @fileOverview Analyzes an audio file and suggests a new title and artist for it.
 *
 * - suggestSongTitleFromAudio - A function that handles suggesting a song title and artist from audio data.
 * - SuggestSongTitleFromAudioInput - The input type for the suggestSongTitleFromAudio function.
 * - SuggestSongTitleFromAudioOutput - The return type for the suggestSongTitleFromAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSongTitleFromAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestSongTitleFromAudioInput = z.infer<typeof SuggestSongTitleFromAudioInputSchema>;

const SuggestSongTitleFromAudioOutputSchema = z.object({
  title: z.string().describe('The suggested new song title.'),
  artist: z.string().describe('The suggested new artist name.'),
});
export type SuggestSongTitleFromAudioOutput = z.infer<typeof SuggestSongTitleFromAudioOutputSchema>;

export async function suggestSongTitleFromAudio(input: SuggestSongTitleFromAudioInput): Promise<SuggestSongTitleFromAudioOutput> {
  return suggestSongTitleFromAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSongTitleFromAudioPrompt',
  input: {schema: SuggestSongTitleFromAudioInputSchema},
  output: {schema: SuggestSongTitleFromAudioOutputSchema},
  prompt: `You are a creative music expert. You will be given an audio file.
  
  Your task is to listen to the audio and come up with a completely new, creative, and plausible-sounding song title and artist name for it.

  Audio file: {{media url=audioDataUri}}

  Generate a new title and artist based on the feeling and genre of the music.`,
});

const suggestSongTitleFromAudioFlow = ai.defineFlow(
  {
    name: 'suggestSongTitleFromAudioFlow',
    inputSchema: SuggestSongTitleFromAudioInputSchema,
    outputSchema: SuggestSongTitleFromAudioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
