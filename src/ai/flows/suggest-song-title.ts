'use server';
/**
 * @fileOverview Analyzes an audio file and suggests a new title for it.
 *
 * - suggestSongTitle - A function that handles suggesting a song title.
 * - SuggestSongTitleInput - The input type for the suggestSongTitle function.
 * - SuggestSongTitleOutput - The return type for the suggestSongTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSongTitleInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestSongTitleInput = z.infer<typeof SuggestSongTitleInputSchema>;

const SuggestSongTitleOutputSchema = z.object({
  title: z.string().describe('The suggested song title.'),
  artist: z.string().describe('The suggested artist name.'),
});
export type SuggestSongTitleOutput = z.infer<typeof SuggestSongTitleOutputSchema>;

export async function suggestSongTitle(input: SuggestSongTitleInput): Promise<SuggestSongTitleOutput> {
  return suggestSongTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSongTitlePrompt',
  input: {schema: SuggestSongTitleInputSchema},
  output: {schema: SuggestSongTitleOutputSchema},
  prompt: `You are a creative music expert. Analyze the following audio file and generate a creative, plausible-sounding song title and artist name for it.

  Audio: {{media url=audioDataUri}}`,
});

const suggestSongTitleFlow = ai.defineFlow(
  {
    name: 'suggestSongTitleFlow',
    inputSchema: SuggestSongTitleInputSchema,
    outputSchema: SuggestSongTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
